"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getCollectionChartData,
  getBuildingProgressData,
} from "@/app/actions/dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Building2,
  Users,
  Banknote,
  Gift,
  Activity,
  TrendingUp,
  MapPin,
} from "lucide-react";

// ── Custom chart tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
          {label}
        </p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: p.color }}
            />
            {p.name}:{" "}
            <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Skeleton card ───────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 shadow-sm animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 mb-3" />
    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

// ── Chart spinner ───────────────────────────────────────────────────
const ChartLoader = ({ color }: { color: string }) => (
  <div className="h-full flex items-center justify-center">
    <div
      className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: `${color} transparent transparent transparent` }}
    />
  </div>
);

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
          getBuildingProgressData(),
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

  const statCards = [
    {
      label: t("Dashboard.totalBuildings"),
      display: String(stats?.totalBuildings ?? 0),
      icon: Building2,
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40",
      border: "border-blue-100 dark:border-blue-800/50",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-700 dark:text-blue-300",
      accentGrad: "from-blue-400 to-indigo-500",
    },
    {
      label: t("Dashboard.totalFamilies"),
      display: String(stats?.totalFamilies ?? 0),
      icon: Users,
      bg: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40",
      border: "border-violet-100 dark:border-violet-800/50",
      iconBg: "bg-violet-100 dark:bg-violet-900/60",
      iconColor: "text-violet-600 dark:text-violet-400",
      valueColor: "text-violet-700 dark:text-violet-300",
      accentGrad: "from-violet-400 to-purple-500",
    },
    {
      label: t("Dashboard.totalCollection"),
      display: `৳${(stats?.totalCollection ?? 0).toLocaleString()}`,
      icon: Banknote,
      bg: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40",
      border: "border-emerald-100 dark:border-emerald-800/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-700 dark:text-emerald-300",
      accentGrad: "from-emerald-400 to-green-500",
    },
    {
      label: t("Dashboard.tobrukDistributed"),
      display: `${stats?.tobrukDistributed ?? 0}%`,
      icon: Gift,
      bg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
      border: "border-amber-100 dark:border-amber-800/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/60",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueColor: "text-amber-700 dark:text-amber-300",
      accentGrad: "from-amber-400 to-orange-500",
    },
  ];

  const activeBuildingData = buildingData.filter((b) => b.total > 0);

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-7 md:p-9 text-white shadow-xl">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-48 h-32 bg-teal-800/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-green-100 text-xs font-semibold tracking-widest uppercase">
              Live Overview
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            {t("Dashboard.title")}
          </h1>
          <p className="text-green-100 text-sm max-w-sm opacity-90">
            Monitor Zakat collection progress and Tobruk distribution status in
            real time.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-default ${card.bg} ${card.border}`}
                >
                  {/* Accent blob */}
                  <div
                    className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.accentGrad} opacity-15 group-hover:opacity-25 transition-opacity blur-md pointer-events-none`}
                  />
                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 shadow-sm ${card.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  {/* Label */}
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 leading-snug">
                    {card.label}
                  </p>
                  {/* Value */}
                  <p
                    className={`text-2xl md:text-3xl font-extrabold leading-tight ${card.valueColor}`}
                  >
                    {card.display}
                  </p>
                </div>
              );
            })}
      </div>

      {/* ── Area Breakdown Cards Section ───────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            এলাকা ভিত্তিক সংগ্রাহের হিসাব (Area Summary)
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            {stats?.areaBreakdown?.length || 0} টি এলাকা
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : stats?.areaBreakdown?.length === 0 ? (
            <div className="col-span-full p-6 text-center text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-xl border">
              কোন এলাকার তথ্য পাওয়া যায়নি
            </div>
          ) : (
            stats?.areaBreakdown?.map((area: any) => (
              <div
                key={area.areaId}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {area.nameBn}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {area.familiesCount} টি পরিবার
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">মোট সংগৃহীত অর্থ</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ৳{area.collectedAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection by Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-50 dark:border-gray-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                  {t("Dashboard.collectionByAmount")}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Families grouped by payment amount
                </p>
              </div>
            </div>
          </div>
          <div className="px-3 pb-5 h-[300px] pt-4">
            {loading ? (
              <ChartLoader color="#10b981" />
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
                <span className="text-5xl opacity-20">📊</span>
                <p className="text-sm">No collection data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={38}>
                  <defs>
                    <linearGradient
                      id="emeraldGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#059669"
                        stopOpacity={0.9}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0fdf4"
                    strokeOpacity={0.8}
                  />
                  <XAxis
                    dataKey="amount"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    width={28}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(16,185,129,0.06)", radius: 4 }}
                  />
                  <Bar
                    dataKey="count"
                    name="Families"
                    fill="url(#emeraldGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Building Collection Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-50 dark:border-gray-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                  {t("Dashboard.collectionProgress")}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Paid families per building
                </p>
              </div>
            </div>
          </div>
          <div className="px-3 pb-5 h-[300px] pt-4">
            {loading ? (
              <ChartLoader color="#3b82f6" />
            ) : activeBuildingData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
                <span className="text-5xl opacity-20">🏢</span>
                <p className="text-sm">No building data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeBuildingData}
                  barSize={14}
                  barGap={3}
                  barCategoryGap="35%"
                >
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor="#1d4ed8"
                        stopOpacity={0.9}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eff6ff"
                    strokeOpacity={0.8}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(59,130,246,0.06)", radius: 4 }}
                  />
                  <Legend
                    iconSize={8}
                    iconType="square"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#dbeafe"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="paid"
                    name="Paid"
                    fill="url(#blueGrad)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
