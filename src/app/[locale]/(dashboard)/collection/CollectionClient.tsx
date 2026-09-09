"use client";

import { useState } from "react";
import { ChevronRight, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { getBuildingsWithProgress, recordCollection } from "@/app/actions/collections";
import BanglaInput from "@/components/BanglaInput";

type Flat = { id: string; name: string; sequenceOrder: number; families: { family: { headName: string } }[] };
type Floor = { id: string; nameEn: string; nameBn: string; sequenceOrder: number; flats: Flat[] };
type Building = { id: string; nameBn: string; nameEn: string; sequenceOrder: number; floors: Floor[] };
type Project = { id: string; nameEn: string; nameBn: string } | null;

const QUICK_AMOUNTS = [200, 300, 500, 1000, 1500, 2000];

export default function CollectionClient({
  project,
  buildings,
}: {
  project: Project;
  buildings: Building[];
}) {
  const [step, setStep] = useState<"building" | "floor" | "flat" | "amount">("building");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [headName, setHeadName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{ flat: string; name: string; amount: number } | null>(null);

  if (!project) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Project</h2>
        <p className="text-gray-500 dark:text-gray-400">Create and activate a project from Settings before starting collection.</p>
      </div>
    );
  }

  const handleAmountSubmit = async (amount: number) => {
    if (!project || !selectedFlat || !selectedFloor || !selectedBuilding) return;
    if (!headName.trim()) {
      alert("Please enter the family head's name.");
      return;
    }

    setLoading(true);
    try {
      await recordCollection({
        projectId: project.id,
        flatId: selectedFlat.id,
        headName: headName || selectedFlat.families[0]?.family.headName || "Unknown",
        amount,
        collectedById: "00000000-0000-0000-0000-000000000001", // placeholder — replace with session user id
        notes: "",
      });

      setLastReceipt({ flat: `${selectedBuilding.nameBn} › ${selectedFloor.nameBn} › ${selectedFlat.name}`, name: headName, amount });
      setSuccess(true);
    } catch (err) {
      alert("Failed to record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetToBuilding = () => {
    setStep("building");
    setSelectedBuilding(null);
    setSelectedFloor(null);
    setSelectedFlat(null);
    setCustomAmount("");
    setHeadName("");
    setSuccess(false);
    setLastReceipt(null);
  };

  const resetToFlat = () => {
    setStep("flat");
    setCustomAmount("");
    setHeadName("");
    setSuccess(false);
    setLastReceipt(null);
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (success && lastReceipt) {
    return (
      <div className="max-w-md mx-auto mt-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Collected!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{lastReceipt.flat}</p>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">{lastReceipt.name}</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-1">
              ৳{lastReceipt.amount.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={resetToFlat}
              className="py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Next Flat
            </button>
            <button
              onClick={resetToBuilding}
              className="py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              New Building
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Building Selection ───────────────────────────────────────────────────
  if (step === "building") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collection Mode</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.nameBn} — Select a building to start</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {buildings.map((b, i) => (
              <li key={b.id}>
                <button
                  onClick={() => { setSelectedBuilding(b); setStep("floor"); }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{b.nameBn}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{b.nameEn} · {b.floors.reduce((acc, f) => acc + f.flats.length, 0)} flats</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ─── Floor Selection ──────────────────────────────────────────────────────
  if (step === "floor" && selectedBuilding) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={() => setStep("building")} className="flex items-center text-primary hover:underline text-sm font-medium mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Buildings
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedBuilding.nameBn}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a floor</p>

        <div className="grid grid-cols-2 gap-3">
          {selectedBuilding.floors.map(floor => (
            <button
              key={floor.id}
              onClick={() => { setSelectedFloor(floor); setStep("flat"); }}
              className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left hover:border-primary hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
            >
              <p className="font-bold text-gray-900 dark:text-white text-lg">{floor.nameBn}</p>
              <p className="text-xs text-gray-500 mt-1">{floor.flats.length} flats</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Flat Selection ───────────────────────────────────────────────────────
  if (step === "flat" && selectedBuilding && selectedFloor) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={() => setStep("floor")} className="flex items-center text-primary hover:underline text-sm font-medium mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Floors
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedBuilding.nameBn} › {selectedFloor.nameBn}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a flat to collect from</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {selectedFloor.flats.map(flat => {
            const familyName = flat.families?.[0]?.family?.headName;
            return (
              <button
                key={flat.id}
                onClick={() => {
                  setSelectedFlat(flat);
                  setHeadName(familyName || "");
                  setStep("amount");
                }}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left hover:border-primary hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              >
                <p className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-primary">{flat.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{familyName || "No family"}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Amount Entry ─────────────────────────────────────────────────────────
  if (step === "amount" && selectedFlat) {
    const familyName = selectedFlat.families?.[0]?.family?.headName;
    return (
      <div className="max-w-md mx-auto space-y-5">
        <button onClick={() => setStep("flat")} className="flex items-center text-primary hover:underline text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Flats
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400">Flat</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {selectedBuilding?.nameBn} › {selectedFloor?.nameBn} › {selectedFlat.name}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Family Head Name</label>
          <BanglaInput
            value={headName}
            onChange={setHeadName}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg"
            placeholder={familyName || "Enter name…"}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Amount (৳)</p>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => handleAmountSubmit(amt)}
                disabled={loading}
                className="py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white text-lg hover:border-primary hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50"
              >
                ৳{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            placeholder="Custom amount"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
          />
          <button
            onClick={() => customAmount && handleAmountSubmit(Number(customAmount))}
            disabled={!customAmount || loading}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Collect"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
