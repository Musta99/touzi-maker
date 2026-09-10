"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Users,
  Loader2,
  Calculator,
  CheckCircle2,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { getFloorsByBuilding } from "@/app/actions/buildings";
import {
  registerFamilyAndCollect,
  updateFamily,
  deleteFamily,
  getFamiliesByBuilding,
} from "@/app/actions/families";
import BanglaInput from "@/components/BanglaInput";

type Building = {
  id: string;
  nameEn: string;
  nameBn: string;
  floorCount: number | null;
  flatCount: number | null;
};

type Family = {
  id: string;
  projectFamilyId: string;
  collectionId: string | null;
  headName: string;
  mobile: string | null;
  buildingId: string | null;
  buildingNameEn: string | null;
  buildingNameBn: string | null;
  floorId: string | null;
  floorNameEn: string | null;
  floorNameBn: string | null;
  sideLocation: string | null;
  amount: number;
  tobrukPackages: { amount: number; qty: number }[];
  isJomidar: boolean;
};

export default function BuildingDetailClient({
  building,
  floors: initialFloors,
  initialFamilies,
}: {
  building: Building;
  floors: any[];
  initialFamilies: Family[];
}) {
  const { t } = useT();
  const [floors, setFloors] = useState<any[]>(initialFloors);
  const [families, setFamilies] = useState<Family[]>(initialFamilies);
  const [searchTerm, setSearchTerm] = useState("");

  // ── ADD Family Modal state ──────────────────────────────────────
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [headName, setHeadName] = useState("");
  const [mobile, setMobile] = useState("");
  const [floorId, setFloorId] = useState("");
  const [sideLocation, setSideLocation] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [isJomidar, setIsJomidar] = useState(false);
  const [tobrukBreakdown, setTobrukBreakdown] = useState<
    { amount: number | ""; qty: number | "" }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // ── EDIT Family state ───────────────────────────────────────────
  const [editFamily, setEditFamily] = useState<Family | null>(null);
  const [editHeadName, setEditHeadName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editFloorId, setEditFloorId] = useState("");
  const [editSideLocation, setEditSideLocation] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editIsJomidar, setEditIsJomidar] = useState(false);
  const [editBreakdown, setEditBreakdown] = useState<
    { amount: number | ""; qty: number | "" }[]
  >([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── DELETE Family state ─────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Family | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Breakdown helpers — ADD ─────────────────────────────────────
  const addBreakdownRow = () =>
    setTobrukBreakdown((prev) => [...prev, { amount: "", qty: "" }]);
  const removeBreakdownRow = (i: number) =>
    setTobrukBreakdown((prev) => prev.filter((_, idx) => idx !== i));
  const updateBreakdownRow = (
    i: number,
    field: "amount" | "qty",
    val: string
  ) =>
    setTobrukBreakdown((prev) =>
      prev.map((row, idx) =>
        idx === i ? { ...row, [field]: val === "" ? "" : Number(val) } : row
      )
    );

  const breakdownTotal = tobrukBreakdown.reduce((sum, row) => {
    if (row.amount !== "" && row.qty !== "")
      return sum + Number(row.amount) * Number(row.qty);
    return sum;
  }, 0);
  const hasBreakdown =
    tobrukBreakdown.filter((r) => r.amount !== "" && r.qty !== "").length > 0;

  useEffect(() => {
    if (hasBreakdown) {
      setAmount(breakdownTotal);
    }
  }, [breakdownTotal, hasBreakdown]);

  // ── Breakdown helpers — EDIT ────────────────────────────────────
  const addEditBreakdownRow = () =>
    setEditBreakdown((prev) => [...prev, { amount: "", qty: "" }]);
  const removeEditBreakdownRow = (i: number) =>
    setEditBreakdown((prev) => prev.filter((_, idx) => idx !== i));
  const updateEditBreakdownRow = (
    i: number,
    field: "amount" | "qty",
    val: string
  ) =>
    setEditBreakdown((prev) =>
      prev.map((row, idx) =>
        idx === i ? { ...row, [field]: val === "" ? "" : Number(val) } : row
      )
    );

  const editBreakdownTotal = editBreakdown.reduce((sum, row) => {
    if (row.amount !== "" && row.qty !== "")
      return sum + Number(row.amount) * Number(row.qty);
    return sum;
  }, 0);
  const editHasBreakdown =
    editBreakdown.filter((r) => r.amount !== "" && r.qty !== "").length > 0;

  useEffect(() => {
    if (editHasBreakdown) {
      setEditAmount(editBreakdownTotal);
    }
  }, [editBreakdownTotal, editHasBreakdown]);

  // Refresh building data from server
  const refreshBuildingData = async () => {
    const freshFamilies = await getFamiliesByBuilding(building.id);
    setFamilies(freshFamilies as Family[]);

    const freshFloors = await getFloorsByBuilding(building.id);
    setFloors(freshFloors);
  };

  // Open Edit Dialog
  const openEdit = (fam: Family) => {
    setEditFamily(fam);
    setEditHeadName(fam.headName);
    setEditMobile(fam.mobile || "");
    setEditFloorId(fam.floorId || "");
    setEditSideLocation(fam.sideLocation || "");
    setEditAmount(fam.amount || "");
    setEditIsJomidar(fam.isJomidar ?? false);
    setEditBreakdown(
      fam.tobrukPackages.map((p) => ({ amount: p.amount, qty: p.qty }))
    );
  };

  // Submit: Add Family (keeps modal open with preselected building)
  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorId || !sideLocation || !amount) {
      alert("Floor, Flat Location, and Amount are required.");
      return;
    }
    setIsSubmitting(true);
    setSuccessBanner(null);

    try {
      const validBreakdown = tobrukBreakdown.filter(
        (r) => r.amount !== "" && r.qty !== ""
      );

      await registerFamilyAndCollect({
        headName,
        mobile,
        buildingId: building.id,
        floorId,
        sideLocation,
        amount: Number(amount),
        isJomidar,
        tobrukPackageBreakdown:
          validBreakdown.length > 0
            ? validBreakdown.map((r) => ({
                amount: Number(r.amount),
                qty: Number(r.qty),
              }))
            : undefined,
      });

      const addedDesc = headName
        ? `"${headName}"`
        : `Family (${sideLocation})`;
      setSuccessBanner(`✅ Added ${addedDesc} successfully! Form reset for next family.`);

      setHeadName("");
      setMobile("");
      setSideLocation("");
      setAmount("");
      setIsJomidar(false);
      setTobrukBreakdown([]);

      setTimeout(() => setSuccessBanner(null), 4000);
      await refreshBuildingData();
    } catch (err: any) {
      alert(err.message || "Failed to add family");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Edit Family
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFamily || !editFloorId || !editSideLocation || !editAmount) {
      alert("Floor, Flat Location, and Amount are required.");
      return;
    }
    setEditSubmitting(true);
    try {
      const validBreakdown = editBreakdown.filter(
        (r) => r.amount !== "" && r.qty !== ""
      );
      await updateFamily({
        id: editFamily.id,
        projectFamilyId: editFamily.projectFamilyId,
        collectionId: editFamily.collectionId,
        headName: editHeadName.trim(),
        mobile: editMobile,
        buildingId: building.id,
        floorId: editFloorId,
        sideLocation: editSideLocation,
        amount: Number(editAmount),
        isJomidar: editIsJomidar,
        tobrukPackageBreakdown:
          validBreakdown.length > 0
            ? validBreakdown.map((r) => ({
                amount: Number(r.amount),
                qty: Number(r.qty),
              }))
            : undefined,
      });
      setEditFamily(null);
      await refreshBuildingData();
    } catch (err: any) {
      alert(err.message || "Failed to update family");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Family
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteFamily(deleteTarget.id, deleteTarget.projectFamilyId);
      setDeleteTarget(null);
      await refreshBuildingData();
    } catch (err: any) {
      alert(err.message || "Failed to delete family");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFamilies = families.filter(
    (f) =>
      (f.headName && f.headName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.sideLocation && f.sideLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.mobile && f.mobile.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="../buildings"
            className="text-gray-500 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {building.nameBn}
              <span className="text-base text-gray-500 font-normal">
                ({building.nameEn})
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {families.length} Families in Building · {floors.length} Floors
            </p>
          </div>
        </div>

        {/* ── Primary "Add Families" Button ── */}
        <Dialog.Root open={isFamilyModalOpen} onOpenChange={setIsFamilyModalOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Families to Building
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Add Family to {building.nameBn}
              </Dialog.Title>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                The form stays open after saving so you can quickly add multiple families.
              </p>

              {successBanner && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{successBanner}</span>
                </div>
              )}

              <form onSubmit={handleFamilySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    Selected Building
                  </label>
                  <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm font-semibold flex items-center justify-between">
                    <span>{building.nameBn} ({building.nameEn})</span>
                    <span className="text-xs text-primary font-medium">Auto-selected</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Floor <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const nameEn = prompt("Enter new floor name (English, e.g. Ninth Floor):");
                        const nameBn = prompt("Enter new floor name (Bengali, e.g. ৯ম তলা):");
                        if (nameEn && nameBn) {
                          const { addFloor } = await import("@/app/actions/floors");
                          await addFloor({
                            buildingId: building.id,
                            nameEn,
                            nameBn,
                            sequenceOrder: floors.length + 1,
                          });
                          await refreshBuildingData();
                          const updatedFloors = await getFloorsByBuilding(building.id);
                          const newlyAdded = updatedFloors.find(f => f.nameEn === nameEn || f.nameBn === nameBn);
                          if (newlyAdded) setFloorId(newlyAdded.id);
                        }
                      }}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                    >
                      + Add Floor
                    </button>
                  </div>
                  <select
                    required
                    value={floorId}
                    onChange={(e) => setFloorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select Floor</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nameBn} - {f.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Side of Floor / Flat Location <span className="text-red-500">*</span>
                  </label>
                  <BanglaInput
                    required
                    value={sideLocation}
                    onChange={setSideLocation}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="যেমন: uttar pashe বা উত্তর পাশে"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Family Head Name{" "}
                    <span className="text-gray-400 font-normal text-xs">
                      (Optional)
                    </span>
                  </label>
                  <BanglaInput
                    value={headName}
                    onChange={setHeadName}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="যেমন: al mostafa বা আল মোস্তফা"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number{" "}
                    <span className="text-gray-400 font-normal text-xs">
                      (Optional)
                    </span>
                  </label>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="e.g. 017XXXXXXXX"
                  />
                </div>

                {/* Tobruk Package Breakdown */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5" /> Tobruk Package Breakdown (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={addBreakdownRow}
                      className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-300 dark:hover:bg-amber-700"
                    >
                      + Add Row
                    </button>
                  </div>

                  {tobrukBreakdown.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-amber-700 dark:text-amber-400">৳</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Amount (e.g. 500)"
                        value={row.amount}
                        onChange={(e) => updateBreakdownRow(i, "amount", e.target.value)}
                        className="flex-1 px-2 py-1 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                      <span className="text-xs text-amber-700 dark:text-amber-400">×</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={row.qty}
                        onChange={(e) => updateBreakdownRow(i, "qty", e.target.value)}
                        className="w-16 px-2 py-1 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeBreakdownRow(i)}
                        className="text-red-400 hover:text-red-600 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Paid (৳) <span className="text-red-500">*</span>
                  </label>
                  {hasBreakdown ? (
                    <div className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
                      <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                        ৳{breakdownTotal}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        Auto-total from packages
                      </span>
                    </div>
                  ) : (
                    <input
                      required
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="e.g. 500"
                    />
                  )}
                </div>

                {/* Jomidar checkbox — ADD */}
                <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <input
                    type="checkbox"
                    checked={isJomidar}
                    onChange={(e) => setIsJomidar(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    👑 জমিদার (বাড়ির মালিক)
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-auto">
                    রিপোর্টে গাঢ় হবে
                  </span>
                </label>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Done / Close
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1.5" />
                    )}
                    Save &amp; Add Another
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* ── Families List Section in Building ── */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-lg font-bold flex items-center text-gray-900 dark:text-white">
            <Users className="mr-2 h-5 w-5 text-primary" /> Building Families List
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search family or flat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Head of Family
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Floor &amp; Flat Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFamilies.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
                  >
                    No families registered in this building yet. Click "Add Families to Building" to record one.
                  </td>
                </tr>
              ) : (
                filteredFamilies.map((fam) => (
                  <tr
                    key={fam.id}
                    className={`transition-colors ${
                      fam.isJomidar
                        ? "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white ${
                      fam.isJomidar ? "font-bold" : "font-semibold"
                    }`}>
                      {fam.isJomidar && <span className="mr-1">👑</span>}
                      {fam.headName || <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {fam.floorNameBn || fam.floorNameEn || "—"}
                      </span>
                      {fam.sideLocation ? (
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          ({fam.sideLocation})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {fam.mobile || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {fam.amount > 0 ? `৳${fam.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(fam)}
                        className="inline-flex items-center gap-1 text-primary hover:text-green-700 dark:hover:text-green-400 text-sm font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(fam)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EDIT Dialog ── */}
      <Dialog.Root
        open={!!editFamily}
        onOpenChange={(open) => {
          if (!open) setEditFamily(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" /> পরিবার সম্পাদনা করুন
            </Dialog.Title>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  তলা <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editFloorId}
                  onChange={(e) => setEditFloorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Select Floor</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nameBn} - {f.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ফ্ল্যাটের অবস্থান <span className="text-red-500">*</span>
                </label>
                <BanglaInput
                  required
                  value={editSideLocation}
                  onChange={setEditSideLocation}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="যেমন: uttar pashe বা উত্তর পাশে"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  পরিবার প্রধানের নাম <span className="text-gray-400 font-normal text-xs">(ঐচ্ছিক)</span>
                </label>
                <BanglaInput
                  value={editHeadName}
                  onChange={setEditHeadName}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="যেমন: al mostafa বা আল মোস্তফা"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  মোবাইল নম্বর <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="e.g. 017XXXXXXXX"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5" /> Tobruk Package Breakdown (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={addEditBreakdownRow}
                    className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-300 dark:hover:bg-amber-700"
                  >
                    + Add Row
                  </button>
                </div>

                {editBreakdown.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 dark:text-amber-400">৳</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Amount (e.g. 500)"
                      value={row.amount}
                      onChange={(e) => updateEditBreakdownRow(i, "amount", e.target.value)}
                      className="flex-1 px-2 py-1 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-amber-700 dark:text-amber-400">×</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={row.qty}
                      onChange={(e) => updateEditBreakdownRow(i, "qty", e.target.value)}
                      className="w-16 px-2 py-1 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeEditBreakdownRow(i)}
                      className="text-red-400 hover:text-red-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  পরিমাণ (৳) <span className="text-red-500">*</span>
                </label>
                {editHasBreakdown ? (
                  <div className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
                    <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                      ৳{editBreakdownTotal}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      প্যাকেজ থেকে স্বয়ংক্রিয়
                    </span>
                  </div>
                ) : (
                  <input
                    required
                    type="number"
                    min="1"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="e.g. 500"
                  />
                )}
              </div>

              {/* Jomidar checkbox — EDIT */}
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <input
                  type="checkbox"
                  checked={editIsJomidar}
                  onChange={(e) => setEditIsJomidar(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  👑 জমিদার (বাড়ির মালিক)
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-auto">
                  রিপোর্টে গাঢ় হবে
                </span>
              </label>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    বাতিল
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── DELETE Confirmation Dialog ── */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> পরিবার মুছে ফেলুন
            </Dialog.Title>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              আপনি কি নিশ্চিত যে{" "}
              <strong className="text-gray-900 dark:text-white">
                {deleteTarget?.headName || "এই পরিবারটি"}
              </strong>{" "}
              মুছে ফেলতে চান? সংশ্লিষ্ট সকল আদায় তথ্যও মুছে যাবে।
            </p>
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  বাতিল
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}


