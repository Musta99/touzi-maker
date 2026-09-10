"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { Gift, Loader2, CheckCircle2, Building2, ChevronRight, ArrowLeft, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getTobrukList, markTobrukDistributed } from "@/app/actions/tobruk";
import BanglaInput from "@/components/BanglaInput";

type TobrukItem = {
  id: string;
  headName: string;
  buildingId: string;
  buildingNameEn: string;
  buildingNameBn: string;
  floorNameEn: string;
  floorNameBn: string;
  flatName: string;
  hasPaid: boolean;
  isDistributed: boolean;
  totalAmount: number;
  tobrukBreakdown: { amount: number; qty: number }[] | null;
};

type BuildingGroup = {
  id: string;
  nameBn: string;
  nameEn: string;
  totalFamilies: number;
  distributedCount: number;
  items: TobrukItem[];
};

export default function TobrukPage() {
  const { t } = useT();
  const [list, setList] = useState<TobrukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    try {
      const data = await getTobrukList();
      setList(data as TobrukItem[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkDistributed = async (id: string) => {
    setActionLoading(id);
    try {
      await markTobrukDistributed(id);
      setList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isDistributed: true } : item
        )
      );
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  // Group tobruk list by building
  const buildingGroupsMap = new Map<string, BuildingGroup>();
  for (const item of list) {
    const key = item.buildingId || item.buildingNameEn;
    if (!buildingGroupsMap.has(key)) {
      buildingGroupsMap.set(key, {
        id: item.buildingId,
        nameBn: item.buildingNameBn || item.buildingNameEn,
        nameEn: item.buildingNameEn,
        totalFamilies: 0,
        distributedCount: 0,
        items: [],
      });
    }
    const group = buildingGroupsMap.get(key)!;
    group.items.push(item);
    group.totalFamilies += 1;
    if (item.isDistributed) group.distributedCount += 1;
  }

  const buildingGroups = Array.from(buildingGroupsMap.values());
  const filteredBuildings = buildingGroups.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      (b.nameBn && b.nameBn.toLowerCase().includes(q)) ||
      (b.nameEn && b.nameEn.toLowerCase().includes(q))
    );
  });

  const selectedBuilding = selectedBuildingId
    ? buildingGroups.find((b) => b.id === selectedBuildingId)
    : null;

  const filteredFamilies = selectedBuilding
    ? selectedBuilding.items.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
          (item.headName && item.headName.toLowerCase().includes(q)) ||
          (item.flatName && item.flatName.toLowerCase().includes(q))
        );
      })
    : [];

  const overallDistributed = list.filter((l) => l.isDistributed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary" />
          {t("Common.tobruk")}
        </h1>
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg font-semibold border border-blue-200 dark:border-blue-800">
          Total Delivered: {overallDistributed} / {list.length}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          Loading Tobruk distribution list...
        </div>
      ) : !selectedBuilding ? (
        /* ── STEP 1: SELECT BUILDING VIEW ── */
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              বিল্ডিং খুঁজুন (Search Building)
            </label>
            <BanglaInput
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder="Search building name (e.g. 'al mostafa' / 'আল মোস্তফা' or English)..."
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Select a Building
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {buildingGroups.length} Buildings
              </span>
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredBuildings.length === 0 ? (
                <li className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No buildings match "{searchTerm}".
                </li>
              ) : (
                filteredBuildings.map((b, i) => (
                  <li key={b.id}>
                    <button
                      onClick={() => {
                        setSelectedBuildingId(b.id);
                        setSearchTerm("");
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm">
                            {i + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-base group-hover:text-primary transition-colors">
                            {b.nameBn}{" "}
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                              ({b.nameEn})
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {b.totalFamilies} Families inside
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            b.distributedCount === b.totalFamilies
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {b.distributedCount} / {b.totalFamilies} Delivered
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : (
        /* ── STEP 2: FAMILIES UNDER SELECTED BUILDING VIEW ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedBuildingId(null);
                setSearchTerm("");
              }}
              className="flex items-center text-primary hover:underline text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Buildings list
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Building Title Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedBuilding.nameBn}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ({selectedBuilding.nameEn})
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Families under this building ({selectedBuilding.distributedCount} / {selectedBuilding.totalFamilies} Delivered)
                </p>
              </div>

              {/* Family Search with BanglaInput Switcher */}
              <div className="w-full sm:w-72">
                <BanglaInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Search family name or flat..."
                />
              </div>
            </div>

            {/* Families Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Family Head
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Floor &amp; Flat Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      🎁 Packages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Distribution
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFamilies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
                      >
                        No families match "{searchTerm}" in this building.
                      </td>
                    </tr>
                  ) : (
                    filteredFamilies.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {item.headName || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {item.floorNameBn || item.floorNameEn}{" "}
                          <span className="text-gray-400 text-xs">
                            ({item.flatName})
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.hasPaid ? (
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Paid (৳{item.totalAmount})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                          {item.tobrukBreakdown &&
                          item.tobrukBreakdown.length > 0 ? (
                            <div className="space-y-0.5">
                              {item.tobrukBreakdown.map(
                                (row: { amount: number; qty: number }, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium text-xs"
                                  >
                                    <span>৳{row.amount}</span>
                                    <span className="text-gray-400">×</span>
                                    <span>{row.qty} pcs</span>
                                  </div>
                                )
                              )}
                            </div>
                          ) : item.hasPaid ? (
                            <span className="text-gray-400 text-xs italic">
                              auto (৳{item.totalAmount})
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.isDistributed ? (
                            <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-xs">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Delivered
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              Not Delivered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {!item.isDistributed && (
                            <button
                              onClick={() => handleMarkDistributed(item.id)}
                              disabled={actionLoading === item.id}
                              className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 inline-flex items-center"
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : null}
                              Mark Delivered
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

