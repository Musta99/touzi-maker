"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useEffect, useState } from "react";
import { getDashboardStats, getCollectionChartData, getBuildingProgressData } from "@/app/actions/dashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { t } = useT();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [buildingData, setBuildingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, c, b] = await Promise.all([
          getDashboardStats(),
          getCollectionChartData(),
          getBuildingProgressData()
        ]);
        setStats(s);
        setChartData(c);
        setBuildingData(b);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {t("Dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Dashboard.totalBuildings")}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{loading ? "..." : stats?.totalBuildings || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Dashboard.totalFamilies")}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{loading ? "..." : stats?.totalFamilies || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Dashboard.totalCollection")}</p>
          <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">৳{loading ? "..." : (stats?.totalCollection || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Dashboard.tobrukDistributed")}</p>
          <p className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">{loading ? "..." : stats?.tobrukDistributed || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-[400px] flex flex-col">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{t("Dashboard.collectionByAmount")}</h3>
          <div className="flex-1 min-h-0">
            {loading ? <div className="h-full flex items-center justify-center text-gray-500">Loading...</div> : chartData.length === 0 ? <div className="h-full flex items-center justify-center text-gray-500">No data</div> :
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="amount" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-[400px] flex flex-col">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{t("Dashboard.collectionProgress")}</h3>
          <div className="flex-1 min-h-0">
             {loading ? <div className="h-full flex items-center justify-center text-gray-500">Loading...</div> : buildingData.length === 0 ? <div className="h-full flex items-center justify-center text-gray-500">No data</div> :
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="paid" stackId="a" fill="#3b82f6" name="Paid" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="total" stackId="b" fill="#e5e7eb" name="Total Families" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
             }
          </div>
        </div>
      </div>
    </div>
  );
}
