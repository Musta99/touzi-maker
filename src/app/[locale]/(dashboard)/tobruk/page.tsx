"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { Gift, Loader2, CheckCircle2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { getTobrukList, markTobrukDistributed } from "@/app/actions/tobruk";

export default function TobrukPage() {
  const { t } = useT();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    try {
      const data = await getTobrukList();
      setList(data);
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
      // Optimistic update
      setList(prev => prev.map(item => item.id === id ? { ...item, isDistributed: true } : item));
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredList = list.filter(item => 
    item.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.buildingNameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDistributed = list.filter(l => l.isDistributed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Gift className="h-8 w-8 text-primary" />
          {t("Common.tobruk")}
        </h1>
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg font-semibold border border-blue-200 dark:border-blue-800">
          Progress: {totalDistributed} / {list.length}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-white"
              placeholder="Search family or building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            Loading distribution list...
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No families found in the active project.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Family Head</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Building & Flat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">🎁 Packages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distribution</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.headName || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.buildingNameEn} <br/>
                      <span className="text-xs">{item.floorNameEn} - {item.flatName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.hasPaid ? (
                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Paid (৳{item.totalAmount})</span>
                      ) : (
                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                      {item.tobrukBreakdown && item.tobrukBreakdown.length > 0 ? (
                        <div className="space-y-0.5">
                          {item.tobrukBreakdown.map((row: {amount: number; qty: number}, i: number) => (
                            <div key={i} className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                              <span>৳{row.amount}</span>
                              <span className="text-gray-400">×</span>
                              <span>{row.qty} pcs</span>
                            </div>
                          ))}
                        </div>
                      ) : item.hasPaid ? (
                        <span className="text-gray-400 text-xs italic">auto (৳{item.totalAmount})</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.isDistributed ? (
                        <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Delivered
                        </span>
                      ) : (
                        <span className="text-gray-400">Not Delivered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {!item.isDistributed && (
                        <button 
                          onClick={() => handleMarkDistributed(item.id)}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 inline-flex items-center"
                        >
                          {actionLoading === item.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
