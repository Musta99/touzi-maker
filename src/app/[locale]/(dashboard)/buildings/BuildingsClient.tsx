"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useState } from "react";
import { Plus, Eye, X, Pencil, Trash2, Loader2, Search, Building2 } from "lucide-react";
import Link from "next/link";
import {
  addBuilding,
  getBuildings,
  updateBuilding,
  deleteBuilding,
} from "@/app/actions/buildings";
import BanglaInput from "@/components/BanglaInput";
import { addArea, getAreas } from "@/app/actions/areas";

type Area = {
  id: string;
  nameBn: string;
  nameEn: string;
};

type Building = {
  id: string;
  sequenceOrder: number;
  nameEn: string;
  nameBn: string;
  areaId: string | null;
  area: Area | null;
  isActive: boolean;
  floorCount: number | null;
  flatCount: number | null;
};

export default function BuildingsClient({
  initialBuildings,
  initialAreas,
}: {
  initialBuildings: Building[];
  initialAreas: Area[];
}) {
  const { t } = useT();
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [areasList, setAreasList] = useState<Area[]>(initialAreas);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Add modal ────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameBn, setNameBn] = useState("");
  const [areaId, setAreaId] = useState<string>("");
  const [insertAfter, setInsertAfter] = useState("end");
  const [saving, setSaving] = useState(false);

  // ── Edit modal ───────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Building | null>(null);
  const [editNameBn, setEditNameBn] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editAreaId, setEditAreaId] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Add Area modal ──────────────────────────────────────────────
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newAreaNameBn, setNewAreaNameBn] = useState("");
  const [newAreaNameEn, setNewAreaNameEn] = useState("");
  const [addingArea, setAddingArea] = useState(false);

  // ── Delete modal ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Refresh helper ───────────────────────────────────────────────
  const refreshBuildings = async () => {
    const fresh = await getBuildings();
    setBuildings(fresh as Building[]);
  };

  const refreshAreas = async () => {
    const freshAreas = await getAreas();
    setAreasList(freshAreas);
    return freshAreas;
  };

  const handleAddNewArea = async () => {
    const trimmed = newAreaNameBn.trim();
    if (!trimmed) return;
    setAddingArea(true);
    try {
      const created = await addArea({
        nameBn: trimmed,
        nameEn: newAreaNameEn.trim(),
      });
      await refreshAreas();
      if (editTarget) {
        setEditAreaId(created.id);
      } else {
        setAreaId(created.id);
      }
      setShowAddAreaModal(false);
      setNewAreaNameBn("");
      setNewAreaNameEn("");
    } catch (e) {
      console.error(e);
      alert("Failed to add area option");
    } finally {
      setAddingArea(false);
    }
  };

  const filteredBuildings = buildings.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      (b.nameBn && b.nameBn.toLowerCase().includes(q)) ||
      (b.nameEn && b.nameEn.toLowerCase().includes(q)) ||
      (b.area?.nameBn && b.area.nameBn.toLowerCase().includes(q)) ||
      (b.area?.nameEn && b.area.nameEn.toLowerCase().includes(q))
    );
  });


  // ── Add ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const trimmed = nameBn.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (insertAfter === "end") {
        const nextSeq =
          buildings.length > 0
            ? Math.max(...buildings.map((b) => b.sequenceOrder)) + 1
            : 1;
        await addBuilding({
          nameEn: `Building ${nextSeq}`,
          nameBn: trimmed,
          areaId: areaId || null,
          sequenceOrder: nextSeq,
        });
      } else {
        const afterOrder = parseInt(insertAfter, 10);
        await addBuilding({
          nameEn: "",
          nameBn: trimmed,
          areaId: areaId || null,
          sequenceOrder: 0,
          insertAfterOrder: afterOrder,
        });
      }
      setNameBn("");
      setAreaId("");
      setInsertAfter("end");
      setShowAddModal(false);
      await refreshBuildings();
    } catch (e) {
      console.error(e);
      alert("Failed to add building");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editTarget || !editNameBn.trim()) return;
    setEditSaving(true);
    try {
      await updateBuilding(editTarget.id, { 
        nameBn: editNameBn.trim(),
        nameEn: editNameEn.trim(),
        areaId: editAreaId || null,
      });
      setEditTarget(null);
      setEditNameBn("");
      setEditNameEn("");
      setEditAreaId("");
      await refreshBuildings();
    } catch (e: any) {
      alert(e.message || "Failed to update building");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBuilding(deleteTarget.id);
      setDeleteTarget(null);
      await refreshBuildings();
    } catch (e: any) {
      alert(e.message || "Failed to delete building");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t("Buildings.title")}
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-green-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          বিল্ডিং যোগ করুন
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <BanglaInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="বিল্ডিং এর নাম বা এলাকা অনুসন্ধান করুন... (foj monsion)"
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          মোট বিল্ডিং: {buildings.length}
        </div>
      </div>

      {/* Buildings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  বিল্ডিং এর নাম (বাংলা)
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Name (English)
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  অবস্থান / এলাকা
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Flats
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBuildings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    কোন বিল্ডিং পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredBuildings.map((b, i) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-gray-400 dark:text-gray-500">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <Link
                        href={`./buildings/${b.id}`}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {b.nameBn}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                      <Link
                        href={`./buildings/${b.id}`}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {b.nameEn}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {b.area ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {b.area.nameBn}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell font-medium">
                      {b.flatCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          b.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditTarget(b);
                            setEditNameBn(b.nameBn);
                            setEditNameEn(b.nameEn || "");
                            setEditAreaId(b.areaId || "");
                          }}
                          title="Rename building"
                          className="p-1.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(b)}
                          title="Delete building"
                          className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Modal ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                নতুন বিল্ডিং যোগ করুন
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNameBn("");
                  setAreaId("");
                  setInsertAfter("end");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  বিল্ডিং এর নাম (বাংলায়){" "}
                  <span className="text-red-500">*</span>
                </label>
                <BanglaInput
                  value={nameBn}
                  onChange={setNameBn}
                  placeholder="যেমন: ফয়েজ ম্যানশন বা foj monsion"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  autoFocus
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    বিল্ডিং এর অবস্থান / এলাকা
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddAreaModal(true)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                  >
                    + নতুন এলাকা যোগ করুন
                  </button>
                </div>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                >
                  <option value="">-- এলাকা নির্বাচন করুন --</option>
                  {areasList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nameBn} {a.nameEn && a.nameEn !== a.nameBn ? `(${a.nameEn})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  বিল্ডিং এর অবস্থান (কোথায় যোগ হবে)
                </label>
                <select
                  value={insertAfter}
                  onChange={(e) => setInsertAfter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                >
                  <option value="end">
                    শেষে যোগ করুন (Building{" "}
                    {buildings.length > 0
                      ? Math.max(...buildings.map((b) => b.sequenceOrder)) + 1
                      : 1}
                    )
                  </option>
                  {buildings.map((b) => (
                    <option key={b.id} value={String(b.sequenceOrder)}>
                      {b.nameEn} - {b.nameBn} এর পরে
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNameBn("");
                  setAreaId("");
                  setInsertAfter("end");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleAdd}
                disabled={!nameBn.trim() || saving}
                className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {saving ? "যোগ হচ্ছে..." : "যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-500" />
                বিল্ডিং সম্পাদনা
              </h2>
              <button
                onClick={() => setEditTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  বিল্ডিং এর নাম (বাংলায়){" "}
                  <span className="text-red-500">*</span>
                </label>
                <BanglaInput
                  value={editNameBn}
                  onChange={setEditNameBn}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit();
                  }}
                  autoFocus
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Building Name (English)
                </label>
                <input
                  type="text"
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  placeholder="e.g. Building 1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit();
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    বিল্ডিং এর অবস্থান / এলাকা
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddAreaModal(true)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                  >
                    + নতুন এলাকা যোগ করুন
                  </button>
                </div>
                <select
                  value={editAreaId}
                  onChange={(e) => setEditAreaId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                >
                  <option value="">-- এলাকা নির্বাচন করুন --</option>
                  {areasList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nameBn} {a.nameEn && a.nameEn !== a.nameBn ? `(${a.nameEn})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleEdit}
                disabled={!editNameBn.trim() || editSaving}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {editSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                {editSaving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    বিল্ডিং মুছুন
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    আপনি কি{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {deleteTarget.nameBn}
                    </strong>{" "}
                    মুছতে চান? এটি করলে সমস্ত ফ্লোর ও ফ্ল্যাট তথ্যও মুছে যাবে।
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? "মুছছে..." : "হ্যাঁ, মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Area Modal ──────────────────────────────────────────── */}
      {showAddAreaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/20">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                নতুন এলাকা যোগ করুন
              </h2>
              <button
                onClick={() => setShowAddAreaModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  এলাকার নাম (বাংলা) <span className="text-red-500">*</span>
                </label>
                <BanglaInput
                  value={newAreaNameBn}
                  onChange={setNewAreaNameBn}
                  placeholder="যেমন: মৌসুমী আ/এ বা mousumi r/a"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area Name (English - optional)
                </label>
                <input
                  type="text"
                  value={newAreaNameEn}
                  onChange={(e) => setNewAreaNameEn(e.target.value)}
                  placeholder="e.g. Mousumi R/A"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => setShowAddAreaModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
              >
                বাতিল
              </button>
              <button
                onClick={handleAddNewArea}
                disabled={!newAreaNameBn.trim() || addingArea}
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {addingArea ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
