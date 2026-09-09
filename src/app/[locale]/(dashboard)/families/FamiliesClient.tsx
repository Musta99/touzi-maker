"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useState, useEffect } from "react";
import { Plus, Users, Search, Loader2, Trash2, Pencil } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { getBuildings, getFloorsByBuilding } from "@/app/actions/buildings";
import { registerFamilyAndCollect, updateFamily } from "@/app/actions/families";
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
};

export default function FamiliesClient({ initialFamilies }: { initialFamilies: Family[] }) {
  const { t } = useT();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Shared building/floor list (reused for add and edit)
  const [allBuildings, setAllBuildings] = useState<any[]>([]);

  // ── ADD form state ──────────────────────────────────────────────
  const [headName, setHeadName] = useState("");
  const [mobile, setMobile] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floors, setFloors] = useState<any[]>([]);
  const [floorId, setFloorId] = useState("");
  const [sideLocation, setSideLocation] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [tobrukBreakdown, setTobrukBreakdown] = useState<{ amount: number | ""; qty: number | "" }[]>([]);
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
  const [editBreakdown, setEditBreakdown] = useState<{ amount: number | ""; qty: number | "" }[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Breakdown helpers ───────────────────────────────────────────
  const addBreakdownRow = () => setTobrukBreakdown(prev => [...prev, { amount: "", qty: "" }]);
  const removeBreakdownRow = (i: number) => setTobrukBreakdown(prev => prev.filter((_, idx) => idx !== i));
  const updateBreakdownRow = (i: number, field: 'amount' | 'qty', val: string) =>
    setTobrukBreakdown(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val === '' ? '' : Number(val) } : row));

  const addEditBreakdownRow = () => setEditBreakdown(prev => [...prev, { amount: "", qty: "" }]);
  const removeEditBreakdownRow = (i: number) => setEditBreakdown(prev => prev.filter((_, idx) => idx !== i));
  const updateEditBreakdownRow = (i: number, field: 'amount' | 'qty', val: string) =>
    setEditBreakdown(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val === '' ? '' : Number(val) } : row));

  // ── Load buildings on dialog open ───────────────────────────────
  useEffect(() => {
    if ((isDialogOpen || !!editFamily) && allBuildings.length === 0) {
      getBuildings().then(setAllBuildings);
    }
  }, [isDialogOpen, editFamily, allBuildings.length]);

  // ── Add form: load floors on building change ────────────────────
  useEffect(() => {
    if (buildingId) {
      getFloorsByBuilding(buildingId).then(setFloors);
      setFloorId("");
    }
  }, [buildingId]);

  // ── Edit form: load floors on building change ───────────────────
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
    setEditBreakdown(family.tobrukPackages.map(p => ({ amount: p.amount, qty: p.qty })));
    // Pre-load floors for this building
    if (family.buildingId) getFloorsByBuilding(family.buildingId).then(setEditFloors);
  };

  // ── Totals & validation ─────────────────────────────────────────
  const breakdownTotal = tobrukBreakdown.reduce((sum, row) => {
    if (row.amount !== '' && row.qty !== '') return sum + Number(row.amount) * Number(row.qty);
    return sum;
  }, 0);
  const hasBreakdown = tobrukBreakdown.filter(r => r.amount !== '' && r.qty !== '').length > 0;
  const breakdownMismatch = hasBreakdown && Number(amount) > 0 && breakdownTotal !== Number(amount);

  const editBreakdownTotal = editBreakdown.reduce((sum, row) => {
    if (row.amount !== '' && row.qty !== '') return sum + Number(row.amount) * Number(row.qty);
    return sum;
  }, 0);
  const editHasBreakdown = editBreakdown.filter(r => r.amount !== '' && r.qty !== '').length > 0;
  const editBreakdownMismatch = editHasBreakdown && Number(editAmount) > 0 && editBreakdownTotal !== Number(editAmount);

  // ── Submit: Add ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headName || !buildingId || !floorId || !sideLocation || !amount) {
      alert("Please fill all required fields.");
      return;
    }
    if (breakdownMismatch) {
      alert(`Tobruk breakdown total (৳${breakdownTotal}) must equal the amount paid (৳${Number(amount)}). Please fix the breakdown.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const validBreakdown = tobrukBreakdown.filter(r => r.amount !== '' && r.qty !== '');
      await registerFamilyAndCollect({
        headName, mobile, buildingId, floorId, sideLocation,
        amount: Number(amount),
        tobrukPackageBreakdown: validBreakdown.length > 0
          ? validBreakdown.map(r => ({ amount: Number(r.amount), qty: Number(r.qty) }))
          : undefined,
      });
      alert("Family added and collection recorded successfully!");
      setIsDialogOpen(false);
      setHeadName(""); setMobile(""); setBuildingId(""); setFloorId(""); setSideLocation(""); setAmount(""); setTobrukBreakdown([]);
    } catch (e: any) {
      alert(e.message || "Failed to add family");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit: Edit ────────────────────────────────────────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFamily || !editHeadName.trim() || !editBuildingId || !editFloorId || !editSideLocation || !editAmount) {
      alert("Please fill all required fields.");
      return;
    }
    if (editBreakdownMismatch) {
      alert(`Tobruk breakdown total (৳${editBreakdownTotal}) must equal the amount paid (৳${Number(editAmount)}). Please fix the breakdown.`);
      return;
    }
    setEditSubmitting(true);
    try {
      const validBreakdown = editBreakdown.filter(r => r.amount !== '' && r.qty !== '');
      await updateFamily({
        id: editFamily.id,
        projectFamilyId: editFamily.projectFamilyId,
        collectionId: editFamily.collectionId,
        headName: editHeadName.trim(),
        mobile: editMobile,
        buildingId: editBuildingId,
        floorId: editFloorId,
        sideLocation: editSideLocation,
        amount: Number(editAmount),
        tobrukPackageBreakdown: validBreakdown.length > 0
          ? validBreakdown.map(r => ({ amount: Number(r.amount), qty: Number(r.qty) }))
          : undefined,
      });
      setEditFamily(null);
    } catch (err: any) {
      alert(err.message || "Failed to update family");
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredFamilies = initialFamilies.filter(f =>
    f.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.mobile && f.mobile.includes(searchTerm))
  );

  // ── Shared breakdown section renderer ───────────────────────────
  const BreakdownSection = ({
    breakdown, mismatch, total, amountVal,
    onAdd, onRemove, onUpdate,
  }: {
    breakdown: { amount: number | ""; qty: number | "" }[];
    mismatch: boolean; total: number; amountVal: number | "";
    onAdd: () => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, field: 'amount' | 'qty', val: string) => void;
  }) => (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-amber-800 dark:text-amber-300">
          🎁 Tobruk Package Breakdown <span className="font-normal text-amber-600 dark:text-amber-400">(Optional)</span>
        </label>
        <button type="button" onClick={onAdd} className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-300 dark:hover:bg-amber-700">
          + Add Row
        </button>
      </div>
      {breakdown.length === 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 italic">
          Leave empty to auto-derive from amount. Click "+ Add Row" to specify e.g. 500×1 pcs, 200×2 pcs.
        </p>
      ) : (
        <div className="space-y-2">
          {breakdown.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-amber-700 dark:text-amber-400 w-6">৳</span>
              <input type="number" min="1" placeholder="Amount (e.g. 500)" value={row.amount}
                onChange={e => onUpdate(i, 'amount', e.target.value)}
                className="flex-1 px-2 py-1.5 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white" />
              <span className="text-xs text-amber-700 dark:text-amber-400">×</span>
              <input type="number" min="1" placeholder="Qty" value={row.qty}
                onChange={e => onUpdate(i, 'qty', e.target.value)}
                className="w-20 px-2 py-1.5 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white" />
              <span className="text-xs text-amber-600">pcs</span>
              <button type="button" onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className={`mt-2 flex items-center justify-between text-xs font-medium rounded px-3 py-2 ${
            mismatch
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
          }`}>
            <span>Breakdown Total: ৳{total}</span>
            {mismatch
              ? <span className="text-red-600 dark:text-red-400">⚠ Must equal ৳{Number(amountVal)} paid</span>
              : <span>✓ Matches amount paid</span>}
          </div>
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
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Family & Record Collection</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Family Head Name *</label>
                  <BanglaInput required value={headName} onChange={setHeadName} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="যেমন: al mostafa বা আল মোস্তফা" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number (Optional)</label>
                  <input value={mobile} onChange={e => setMobile(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. 017XXXXXXXX" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Building *</label>
                    <select required value={buildingId} onChange={e => setBuildingId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                      <option value="">Select Building</option>
                      {allBuildings.map(b => <option key={b.id} value={b.id}>{b.nameEn} - {b.nameBn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor *</label>
                    <select required value={floorId} onChange={e => setFloorId(e.target.value)} disabled={!buildingId} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50">
                      <option value="">Select Floor</option>
                      {floors.map(f => <option key={f.id} value={f.id}>{f.nameEn} - {f.nameBn}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Side of Floor *</label>
                  <input required value={sideLocation} onChange={e => setSideLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. North Side, 2A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Given (৳) *</label>
                  <input required type="number" min="1" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. 500" />
                </div>
                <BreakdownSection breakdown={tobrukBreakdown} mismatch={breakdownMismatch} total={breakdownTotal} amountVal={amount}
                  onAdd={addBreakdownRow} onRemove={removeBreakdownRow} onUpdate={updateBreakdownRow} />
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Dialog.Close asChild>
                    <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                  </Dialog.Close>
                  <button type="submit" disabled={isSubmitting || breakdownMismatch} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save & Collect
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* ── Search & Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative max-w-md mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white"
            placeholder={t("Common.search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Head of Family</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Building / Floor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFamilies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    No families found. Add families by assigning them to flats inside a building.
                  </td>
                </tr>
              ) : (
                filteredFamilies.map((family) => (
                  <tr key={family.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{family.headName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{family.mobile || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                      {family.buildingNameBn || family.buildingNameEn || "—"} / {family.floorNameBn || family.floorNameEn || "—"}
                      {family.sideLocation ? <span className="ml-1 text-gray-400">({family.sideLocation})</span> : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                      {family.amount > 0 ? `৳${family.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(family)} className="inline-flex items-center gap-1 text-primary hover:text-green-700 dark:hover:text-green-400 text-sm font-medium">
                        <Pencil className="w-3.5 h-3.5" /> {t("Common.edit")}
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
      <Dialog.Root open={!!editFamily} onOpenChange={(open) => { if (!open) setEditFamily(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" /> পরিবার সম্পাদনা করুন
            </Dialog.Title>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">পরিবার প্রধানের নাম *</label>
                <BanglaInput required value={editHeadName} onChange={setEditHeadName} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="যেমন: al mostafa বা আল মোস্তফা" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">মোবাইল নম্বর (Optional)</label>
                <input value={editMobile} onChange={e => setEditMobile(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. 017XXXXXXXX" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">বিল্ডিং *</label>
                  <select required value={editBuildingId} onChange={e => { setEditBuildingId(e.target.value); setEditFloorId(""); }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    <option value="">Select Building</option>
                    {allBuildings.map(b => <option key={b.id} value={b.id}>{b.nameEn} - {b.nameBn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">তলা *</label>
                  <select required value={editFloorId} onChange={e => setEditFloorId(e.target.value)} disabled={!editBuildingId}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50">
                    <option value="">Select Floor</option>
                    {editFloors.map(f => <option key={f.id} value={f.id}>{f.nameEn} - {f.nameBn}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ফ্ল্যাটের অবস্থান *</label>
                <input required value={editSideLocation} onChange={e => setEditSideLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. North Side, 2A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">পরিমাণ (৳) *</label>
                <input required type="number" min="1" value={editAmount} onChange={e => setEditAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="e.g. 500" />
              </div>
              <BreakdownSection breakdown={editBreakdown} mismatch={editBreakdownMismatch} total={editBreakdownTotal} amountVal={editAmount}
                onAdd={addEditBreakdownRow} onRemove={removeEditBreakdownRow} onUpdate={updateEditBreakdownRow} />
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">বাতিল</button>
                </Dialog.Close>
                <button type="submit" disabled={editSubmitting || editBreakdownMismatch} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {editSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
