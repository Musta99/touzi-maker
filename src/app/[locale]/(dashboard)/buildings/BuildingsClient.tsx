"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useState } from "react";
import { Plus, Eye, X, Pencil, Trash2, Loader2, Search } from "lucide-react";
import Link from "next/link";
import {
  addBuilding,
  getBuildings,
  updateBuilding,
  deleteBuilding,
} from "@/app/actions/buildings";
import BanglaInput from "@/components/BanglaInput";

type Building = {
  id: string;
  sequenceOrder: number;
  nameEn: string;
  nameBn: string;
  isActive: boolean;
  floorCount: number | null;
  flatCount: number | null;
};

export default function BuildingsClient({
  initialBuildings,
}: {
  initialBuildings: Building[];
}) {
  const { t } = useT();
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Add modal ────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameBn, setNameBn] = useState("");
  const [insertAfter, setInsertAfter] = useState("end");
  const [saving, setSaving] = useState(false);

  // ── Edit modal ───────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Building | null>(null);
  const [editNameBn, setEditNameBn] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Delete modal ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Refresh helper ───────────────────────────────────────────────
  const refreshBuildings = async () => {
    const fresh = await getBuildings();
    setBuildings(fresh as Building[]);
  };

  const filteredBuildings = buildings.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      (b.nameBn && b.nameBn.toLowerCase().includes(q)) ||
      (b.nameEn && b.nameEn.toLowerCase().includes(q))
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
          sequenceOrder: nextSeq,
        });
      } else {
        const afterOrder = parseInt(insertAfter, 10);
        await addBuilding({
          nameEn: "",
          nameBn: trimmed,
          sequenceOrder: 0,
          insertAfterOrder: afterOrder,
        });
      }
      setNameBn("");
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
      await updateBuilding(editTarget.id, { nameBn: editNameBn.trim() });
      setEditTarget(null);
      setEditNameBn("");
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
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("Buildings.addBuilding")}
        </button>
      </div>

      {/* Dual Language Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Search Building
        </label>
        <BanglaInput
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          placeholder="Search building name (e.g. 'al mostafa' / 'আল মোস্তফা' or English)..."
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Buildings.nameBn")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  {t("Buildings.nameEn")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Flats
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("Buildings.status")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBuildings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {buildings.length === 0
                      ? "No buildings yet. Add your first building."
                      : `No buildings match "${searchTerm}".`}
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
                          className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {/* View */}
                        <Link
                          href={`./buildings/${b.id}`}
                          className="ml-1 inline-flex items-center text-sm font-medium text-primary hover:text-green-700 dark:hover:text-green-400"
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Building Modal ─────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                নতুন বিল্ডিং যোগ করুন
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNameBn("");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  placeholder="যেমন: al mostafa বা আল মোস্তফা"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  কোথায় যোগ করবেন?
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
              <p className="text-xs text-gray-400 dark:text-gray-500">
                ৯টি স্ট্যান্ডার্ড ফ্লোর স্বয়ংক্রিয়ভাবে যোগ হবে।
                পরবর্তী বিল্ডিংগুলোর নম্বর স্বয়ংক্রিয়ভাবে আপডেট হবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNameBn("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleAdd}
                disabled={!nameBn.trim() || saving}
                className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {saving ? "সংরক্ষণ হচ্ছে..." : "যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Building Modal ────────────────────────────────────── */}
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

            <div className="px-6 py-5">
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
    </div>
  );
}
