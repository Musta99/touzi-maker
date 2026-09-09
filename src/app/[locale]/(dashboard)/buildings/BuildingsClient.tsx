"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useState } from "react";
import { Plus, Eye, X } from "lucide-react";
import Link from "next/link";
import { addBuilding } from "@/app/actions/buildings";
import { useRouter } from "next/navigation";
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

export default function BuildingsClient({ initialBuildings }: { initialBuildings: Building[] }) {
  const { t } = useT();
  const router = useRouter();
  const [buildings] = useState(initialBuildings);
  const [showModal, setShowModal] = useState(false);
  const [nameBn, setNameBn] = useState("");
  const [insertAfter, setInsertAfter] = useState("end"); // "end" or a sequenceOrder string
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const trimmed = nameBn.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      if (insertAfter === "end") {
        // Append at end
        const nextSeq = buildings.length > 0
          ? Math.max(...buildings.map(b => b.sequenceOrder)) + 1
          : 1;
        await addBuilding({ nameEn: `Building ${nextSeq}`, nameBn: trimmed, sequenceOrder: nextSeq });
      } else {
        // Insert after a specific building
        const afterOrder = parseInt(insertAfter, 10);
        await addBuilding({ nameEn: "", nameBn: trimmed, sequenceOrder: 0, insertAfterOrder: afterOrder });
      }
      setNameBn("");
      setInsertAfter("end");
      setShowModal(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to add building");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t("Buildings.title")}
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("Buildings.addBuilding")}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("Buildings.nameBn")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">{t("Buildings.nameEn")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Floors / Flats</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("Buildings.status")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {buildings.map((b, i) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{b.nameBn}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">{b.nameEn}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                    {b.floorCount ?? 0} / {b.flatCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${b.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`./buildings/${b.id}`} className="text-primary hover:text-green-700 dark:hover:text-green-400 inline-flex items-center text-sm font-medium">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Building Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                নতুন বিল্ডিং যোগ করুন
              </h2>
              <button
                onClick={() => { setShowModal(false); setNameBn(""); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  বিল্ডিং এর নাম (বাংলায়) <span className="text-red-500">*</span>
                </label>
                <BanglaInput
                  value={nameBn}
                  onChange={setNameBn}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
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
                  <option value="end">শেষে যোগ করুন (Building {buildings.length > 0 ? Math.max(...buildings.map(b => b.sequenceOrder)) + 1 : 1})</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={String(b.sequenceOrder)}>
                      {b.nameEn} - {b.nameBn} এর পরে
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                ৯টি স্ট্যান্ডার্ড ফ্লোর স্বয়ংক্রিয়ভাবে যোগ হবে। পরবর্তী বিল্ডিংগুলোর নম্বর স্বয়ংক্রিয়ভাবে আপডেট হবে।
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => { setShowModal(false); setNameBn(""); }}
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
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    যোগ করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

