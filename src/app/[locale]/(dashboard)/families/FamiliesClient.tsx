"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useState, useEffect } from "react";
import { Plus, Users, Search, Loader2, Trash2, Pencil, Calculator } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { getBuildings, getFloorsByBuilding } from "@/app/actions/buildings";
import {
  registerFamilyAndCollect,
  updateFamily,
  getFamilies,
  deleteFamily,
} from "@/app/actions/families";
import BanglaInput from "@/components/BanglaInput";

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

export default function FamiliesClient({
  initialFamilies,
}: {
  initialFamilies: Family[];
}) {
  const { t } = useT();
  const [families, setFamilies] = useState<Family[]>(initialFamilies);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Shared building/floor list
  const [allBuildings, setAllBuildings] = useState<any[]>([]);

  // ── ADD form state ──────────────────────────────────────────────
  const [headName, setHeadName] = useState("");
  const [mobile, setMobile] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floors, setFloors] = useState<any[]>([]);
  const [floorId, setFloorId] = useState("");
  const [sideLocation, setSideLocation] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [isJomidar, setIsJomidar] = useState(false);
  const [tobrukBreakdown, setTobrukBreakdown] = useState<
    { amount: number | ""; qty: number | "" }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── EDIT form state ─────────────────────────────────────────────
  const [editFamily, setEditFamily] = useState<Family | null>(null);
  const [editHeadName, setEditHeadName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editBuildingId, setEditBuildingId] = useState("");
  const [editFloors, setEditFloors] = useState<any[]>([]);
  const [editFloorId, setEditFloorId] = useState("");
  const [editSideLocation, setEditSideLocation] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editIsJomidar, setEditIsJomidar] = useState(false);
  const [editBreakdown, setEditBreakdown] = useState<
    { amount: number | ""; qty: number | "" }[]
  >([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── DELETE state ────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Family | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteFamily(deleteTarget.id, deleteTarget.projectFamilyId);
      setDeleteTarget(null);
      await refreshFamilies();
    } catch (err: any) {
      alert(err.message || "Failed to delete family");
    } finally {
      setIsDeleting(false);
    }
  };

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

  // ── Totals & validation ─────────────────────────────────────────
  const breakdownTotal = tobrukBreakdown.reduce((sum, row) => {
    if (row.amount !== "" && row.qty !== "")
      return sum + Number(row.amount) * Number(row.qty);
    return sum;
  }, 0);
  const hasBreakdown =
    tobrukBreakdown.filter((r) => r.amount !== "" && r.qty !== "").length > 0;

  const editBreakdownTotal = editBreakdown.reduce((sum, row) => {
    if (row.amount !== "" && row.qty !== "")
      return sum + Number(row.amount) * Number(row.qty);
    return sum;
  }, 0);
  const editHasBreakdown =
    editBreakdown.filter((r) => r.amount !== "" && r.qty !== "").length > 0;

  // ── Auto-calculate amount from breakdown — ADD ──────────────────
  useEffect(() => {
    if (hasBreakdown) {
      setAmount(breakdownTotal);
    }
  }, [breakdownTotal, hasBreakdown]);

  // ── Auto-calculate amount from breakdown — EDIT ─────────────────
  useEffect(() => {
    if (editHasBreakdown) {
      setEditAmount(editBreakdownTotal);
    }
  }, [editBreakdownTotal, editHasBreakdown]);

  // ── Load buildings on dialog open ───────────────────────────────
  useEffect(() => {
    if ((isDialogOpen || !!editFamily) && allBuildings.length === 0) {
      getBuildings().then(setAllBuildings);
    }
  }, [isDialogOpen, editFamily, allBuildings.length]);

  // ── Load floors on building change — ADD ────────────────────────
  useEffect(() => {
    if (buildingId) {
      getFloorsByBuilding(buildingId).then(setFloors);
      setFloorId("");
    }
  }, [buildingId]);

  // ── Load floors on building change — EDIT ───────────────────────
  useEffect(() => {
    if (editBuildingId) {
      getFloorsByBuilding(editBuildingId).then(setEditFloors);
    }
  }, [editBuildingId]);

  // ── Open edit modal ─────────────────────────────────────────────
  const openEdit = (family: Family) => {
    setEditFamily(family);
    setEditHeadName(family.headName);
    setEditMobile(family.mobile || "");
    setEditBuildingId(family.buildingId || "");
    setEditFloorId(family.floorId || "");
    setEditSideLocation(family.sideLocation || "");
    setEditAmount(family.amount || "");
    setEditIsJomidar(family.isJomidar ?? false);
    setEditBreakdown(
      family.tobrukPackages.map((p) => ({ amount: p.amount, qty: p.qty }))
    );
    if (family.buildingId)
      getFloorsByBuilding(family.buildingId).then(setEditFloors);
  };

  // ── Refresh families from server ────────────────────────────────
  const refreshFamilies = async () => {
    const fresh = await getFamilies();
    setFamilies(fresh as Family[]);
  };

  // ── Submit: Add ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId || !floorId || !sideLocation) {
      alert("Building, Floor, and Flat Location are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const validBreakdown = tobrukBreakdown.filter(
        (r) => r.amount !== "" && r.qty !== ""
      );
      await registerFamilyAndCollect({
        headName,
        mobile,
        buildingId,
        floorId,
        sideLocation,
        amount: Number(amount || 0),
        isJomidar,
        tobrukPackageBreakdown:
          validBreakdown.length > 0
            ? validBreakdown.map((r) => ({
                amount: Number(r.amount),
                qty: Number(r.qty),
              }))
            : undefined,
      });
      setIsDialogOpen(false);
      setHeadName("");
      setMobile("");
      setBuildingId("");
      setFloorId("");
      setSideLocation("");
      setAmount("");
      setIsJomidar(false);
      setTobrukBreakdown([]);
      await refreshFamilies();
    } catch (e: any) {
      alert(e.message || "Failed to add family");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit: Edit ────────────────────────────────────────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFamily || !editBuildingId || !editFloorId || !editSideLocation) {
      alert("Building, Floor, and Flat Location are required.");
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
        buildingId: editBuildingId,
        floorId: editFloorId,
        sideLocation: editSideLocation,
        amount: Number(editAmount || 0),
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
      await refreshFamilies();
    } catch (err: any) {
      alert(err.message || "Failed to update family");
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredFamilies = families.filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      (f.headName && f.headName.toLowerCase().includes(q)) ||
      (f.mobile && f.mobile.includes(q)) ||
      (f.buildingNameEn && f.buildingNameEn.toLowerCase().includes(q)) ||
      (f.buildingNameBn && f.buildingNameBn.toLowerCase().includes(q)) ||
      (f.floorNameEn && f.floorNameEn.toLowerCase().includes(q)) ||
      (f.floorNameBn && f.floorNameBn.toLowerCase().includes(q)) ||
      (f.sideLocation && f.sideLocation.toLowerCase().includes(q))
    );
  });


  // ── Shared breakdown section ────────────────────────────────────
  const BreakdownSection = ({
    breakdown,
    total,
    hasAny,
    onAdd,
    onRemove,
    onUpdate,
  }: {
    breakdown: { amount: number | ""; qty: number | "" }[];
    total: number;
    hasAny: boolean;
    onAdd: () => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, field: "amount" | "qty", val: string) => void;
  }) => (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <Calculator className="h-3.5 w-3.5" />
          Tobruk Package Breakdown{" "}
          <span className="font-normal text-amber-600 dark:text-amber-400">
            (Optional)
          </span>
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-300 dark:hover:bg-amber-700"
        >
          + Add Row
        </button>
      </div>
      {breakdown.length === 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 italic">
          Leave empty to enter amount manually. Click "+ Add Row" to specify
          packages (e.g. ৳500×1, ৳200×2 → auto-total ৳900).
        </p>
      ) : (
        <div className="space-y-2">
          {breakdown.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-amber-700 dark:text-amber-400 w-4">
                ৳
              </span>
              <input
                type="number"
                min="1"
                placeholder="Amount (e.g. 500)"
                value={row.amount}
                onChange={(e) => onUpdate(i, "amount", e.target.value)}
                className="flex-1 px-2 py-1.5 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
              <span className="text-xs text-amber-700 dark:text-amber-400">
                ×
              </span>
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={row.qty}
                onChange={(e) => onUpdate(i, "qty", e.target.value)}
                className="w-20 px-2 py-1.5 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
              <span className="text-xs text-amber-600">pcs</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {hasAny && (
            <div className="mt-2 flex items-center justify-between text-xs font-medium rounded px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
              <span>Total: ৳{total}</span>
              <span>⚡ Amount field auto-filled</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" />
          {t("Common.families")}
        </h1>

        {/* ── ADD Dialog ─────────────────────────────────────────── */}
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-green-700 transition-colors text-sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("Common.add")} Family
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Add Family &amp; Record Collection
              </Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Head Name — optional */}
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

                {/* Mobile */}
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

                {/* Building & Floor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Building <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={buildingId}
                      onChange={(e) => setBuildingId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Select Building</option>
                      {allBuildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nameEn} - {b.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Floor <span className="text-red-500">*</span>
                      </label>
                      {buildingId && (
                        <button
                          type="button"
                          onClick={async () => {
                            const nameEn = prompt("Enter new floor name (English, e.g. Ninth Floor):");
                            const nameBn = prompt("Enter new floor name (Bengali, e.g. ৯ম তলা):");
                            if (nameEn && nameBn) {
                              const { addFloor } = await import("@/app/actions/floors");
                              await addFloor({
                                buildingId,
                                nameEn,
                                nameBn,
                                sequenceOrder: floors.length + 1,
                              });
                              const updatedFloors = await getFloorsByBuilding(buildingId);
                              setFloors(updatedFloors);
                              const newlyAdded = updatedFloors.find(f => f.nameEn === nameEn || f.nameBn === nameBn);
                              if (newlyAdded) setFloorId(newlyAdded.id);
                            }
                          }}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                        >
                          + Add Floor
                        </button>
                      )}
                    </div>
                    <select
                      required
                      value={floorId}
                      onChange={(e) => setFloorId(e.target.value)}
                      disabled={!buildingId}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50"
                    >
                      <option value="">Select Floor</option>
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nameEn} - {f.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Side of Floor — with phonetic BanglaInput */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Side of Floor <span className="text-red-500">*</span>
                  </label>
                  <BanglaInput
                    required
                    value={sideLocation}
                    onChange={setSideLocation}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="যেমন: uttar pashe বা উত্তর পাশে"
                  />
                </div>

                {/* Tobruk Breakdown */}
                <BreakdownSection
                  breakdown={tobrukBreakdown}
                  total={breakdownTotal}
                  hasAny={hasBreakdown}
                  onAdd={addBreakdownRow}
                  onRemove={removeBreakdownRow}
                  onUpdate={updateBreakdownRow}
                />

                {/* Amount — auto-calculated or manual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Given (৳){" "}
                    <span className="text-gray-400 font-normal text-xs">(Optional — can fill later)</span>
                  </label>
                  {hasBreakdown ? (
                    <div className="w-full px-3 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
                      <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                        ৳{breakdownTotal}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Calculator className="h-3 w-3" />
                        Auto-calculated from packages
                      </span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="e.g. 500 (leave blank to fill later)"
                    />
                  )}
                </div>

                {/* Jomidar checkbox */}
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

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Save &amp; Collect
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* ── Search & Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6 space-y-2">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t("Common.search")}
          </label>
          <BanglaInput
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="Search family name, mobile, building, or location..."
          />
        </div>


        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Head of Family
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Building / Floor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                    No families found. Add families by assigning them to flats
                    inside a building.
                  </td>
                </tr>
              ) : (
                filteredFamilies.map((family) => (
                  <tr
                    key={family.id}
                    className={`transition-colors ${
                      family.isJomidar
                        ? "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${
                      family.isJomidar ? "font-bold" : "font-medium"
                    }`}>
                      {family.isJomidar && <span className="mr-1">👑</span>}
                      {family.headName || (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      family.isJomidar ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-300"
                    }`}>
                      {family.mobile || "—"}
                    </td>
                    <td className={`px-6 py-4 text-sm hidden md:table-cell ${
                      family.isJomidar ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-300"
                    }`}>
                      {family.buildingNameBn ||
                        family.buildingNameEn ||
                        "—"}{" "}
                      /{" "}
                      {family.floorNameBn || family.floorNameEn || "—"}
                      {family.sideLocation ? (
                        <span className="ml-1 text-gray-400">
                          ({family.sideLocation})
                        </span>
                      ) : null}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell ${
                      family.isJomidar ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-300"
                    }`}>
                      {family.amount > 0
                        ? `৳${family.amount.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(family)}
                        className="inline-flex items-center gap-1 text-primary hover:text-green-700 dark:hover:text-green-400 text-sm font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5" /> {t("Common.edit")}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(family)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t("Common.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EDIT Dialog ─────────────────────────────────────────────── */}
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
              {/* Head Name — optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  পরিবার প্রধানের নাম{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (ঐচ্ছিক)
                  </span>
                </label>
                <BanglaInput
                  value={editHeadName}
                  onChange={setEditHeadName}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="যেমন: al mostafa বা আল মোস্তফা"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  মোবাইল নম্বর{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (Optional)
                  </span>
                </label>
                <input
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="e.g. 017XXXXXXXX"
                />
              </div>

              {/* Building & Floor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    বিল্ডিং <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editBuildingId}
                    onChange={(e) => {
                      setEditBuildingId(e.target.value);
                      setEditFloorId("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select Building</option>
                    {allBuildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameEn} - {b.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    তলা <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editFloorId}
                    onChange={(e) => setEditFloorId(e.target.value)}
                    disabled={!editBuildingId}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50"
                  >
                    <option value="">Select Floor</option>
                    {editFloors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nameEn} - {f.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side of Floor — with phonetic BanglaInput */}
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

              {/* Tobruk Breakdown */}
              <BreakdownSection
                breakdown={editBreakdown}
                total={editBreakdownTotal}
                hasAny={editHasBreakdown}
                onAdd={addEditBreakdownRow}
                onRemove={removeEditBreakdownRow}
                onUpdate={updateEditBreakdownRow}
              />

              {/* Amount — auto-calculated or manual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  পরিমাণ (৳){" "}
                  <span className="text-gray-400 font-normal text-xs">(বাদ্দিযোগ্য — পরে যোগ করা যাবে)</span>
                </label>
                {editHasBreakdown ? (
                  <div className="w-full px-3 py-2.5 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
                    <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                      ৳{editBreakdownTotal}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Calculator className="h-3 w-3" />
                      প্যাকেজ থেকে স্বয়ংক্রিয়
                    </span>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
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
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ── DELETE Confirmation Dialog ───────────────────────────────── */}
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

