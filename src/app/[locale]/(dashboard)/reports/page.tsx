"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { FileText, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getCollectionSummaryReport, getBuildingDetailReport, getBuildingRangeReport } from "@/app/actions/reports";
import { getBuildingsWithProgress } from "@/app/actions/collections";
import { ReportGenerator } from "@/lib/pdf/generator";

export default function ReportsPage() {
  const { t } = useT();
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingBuilding, setLoadingBuilding] = useState<string | null>(null);
  
  // Range report state
  const [loadingRange, setLoadingRange] = useState(false);
  const [startBuildingId, setStartBuildingId] = useState("");
  const [endBuildingId, setEndBuildingId] = useState("");
  const [allBuildings, setAllBuildings] = useState<any[]>([]);

  useEffect(() => {
    import("@/app/actions/collections").then(async ({ getActiveProject, getBuildingsWithProgress }) => {
      try {
        const project = await getActiveProject();
        if (project) {
          const b = await getBuildingsWithProgress(project.id);
          setAllBuildings(b);
          if (b.length > 0) {
            setStartBuildingId(b[0].id);
            setEndBuildingId(b[b.length - 1].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
  }, []);
  // Actually, to get building lists, we need the active project id
  // Let's just fetch them dynamically when clicking or have a small UI
  
  const handleDownloadSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await getCollectionSummaryReport();
      const generator = new ReportGenerator();
      generator.generateCollectionSummary(data.projectNameEn, data.data, data.grandTotal);
    } catch (e: any) {
      alert(e.message || "Failed to generate report");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDownloadBuildingReport = async (buildingId: string) => {
    setLoadingBuilding(buildingId);
    try {
      const data = await getBuildingDetailReport(buildingId);
      const generator = new ReportGenerator();
      const buildingTitle = data.buildingNameBn ? `${data.buildingNameBn} (${data.buildingNameEn})` : data.buildingNameEn;
      generator.generateBuildingReport(data.projectNameEn, buildingTitle, data.data);
    } catch (e: any) {
      alert(e.message || "Failed to generate report");
    } finally {
      setLoadingBuilding(null);
    }
  };

  const handleDownloadRangeReport = async () => {
    if (!startBuildingId || !endBuildingId) return;
    setLoadingRange(true);
    try {
      const data = await getBuildingRangeReport(startBuildingId, endBuildingId);
      const generator = new ReportGenerator();
      await generator.generateBuildingRangeReport(data.projectNameEn, data.rangeName, data.data);
    } catch (e: any) {
      alert(e.message || "Failed to generate report. Make sure the start building is before the end building.");
    } finally {
      setLoadingRange(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        {t("Common.reports")}
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="font-semibold text-gray-900 dark:text-white">Collection Summary</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total collected per building and overall</p>
        </div>
        <div className="p-6">
          <button 
            onClick={handleDownloadSummary}
            disabled={loadingSummary}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loadingSummary ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="font-semibold text-gray-900 dark:text-white">Building Range Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Download a combined report for a range of buildings</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Building</label>
              <select 
                value={startBuildingId} 
                onChange={e => setStartBuildingId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {allBuildings.map(b => (
                  <option key={b.id} value={b.id}>{b.nameEn} ({b.nameBn})</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Building</label>
              <select 
                value={endBuildingId} 
                onChange={e => setEndBuildingId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {allBuildings.map(b => (
                  <option key={b.id} value={b.id}>{b.nameEn} ({b.nameBn})</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleDownloadRangeReport}
              disabled={loadingRange || allBuildings.length === 0}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loadingRange ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
              Download Range
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="font-semibold text-gray-900 dark:text-white">Building Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Flat-by-flat status per building. Click on a building to download its report.</p>
        </div>
        <BuildingReportList onDownload={handleDownloadBuildingReport} loadingId={loadingBuilding} />
      </div>
    </div>
  );
}

// A small sub-component to fetch and list buildings for the Building Reports
function BuildingReportList({ onDownload, loadingId }: { onDownload: (id: string) => void, loadingId: string | null }) {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We import getActiveProject from collections action to get the active project
    import("@/app/actions/collections").then(async ({ getActiveProject, getBuildingsWithProgress }) => {
      try {
        const project = await getActiveProject();
        if (project) {
          const b = await getBuildingsWithProgress(project.id);
          setBuildings(b);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading buildings...</div>;
  if (buildings.length === 0) return <div className="p-6 text-gray-500">No buildings available.</div>;

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {buildings.map((b) => (
        <li
          key={b.id}
          className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {b.nameBn}{" "}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({b.nameEn})
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {b.floors?.reduce((acc: number, f: any) => acc + f.flats.length, 0) || 0} flats
            </p>
          </div>
          <button
            onClick={() => onDownload(b.id)}
            disabled={loadingId === b.id}
            className="flex items-center text-primary text-sm font-medium hover:text-green-700 disabled:opacity-50"
          >
            {loadingId === b.id ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Download PDF
          </button>
        </li>
      ))}
    </ul>
  );
}

