"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { Settings, Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllProjects, startNewProject } from "@/app/actions/projects";

export default function SettingsPage() {
  const { t } = useT();
  const [projectList, setProjectList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Project Form State
  const [isCreating, setIsCreating] = useState(false);
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [importProjectId, setImportProjectId] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await getAllProjects();
      setProjectList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const activeProject = projectList.find(p => p.status === 'active');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await startNewProject(nameEn, nameBn, year, importProjectId);
      alert("New project created successfully! Families imported.");
      await loadProjects();
      setNameEn("");
      setNameBn("");
    } catch (e) {
      alert("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        {t("Common.settings")}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Active Project</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Current Tobruk collection project</p>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : activeProject ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{activeProject.nameBn}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeProject.nameEn} · Year {activeProject.year}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full uppercase">Active</span>
            </div>
          ) : (
            <div className="text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
              No active project found. Create one below.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Start New Project (Yearly Import)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create a new project year and migrate existing families</p>
        </div>
        <form onSubmit={handleCreateProject} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name (English)</label>
              <input required value={nameEn} onChange={e => setNameEn(e.target.value)} type="text" placeholder="e.g. Milad-un-Nabi 2027" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name (Bengali)</label>
              <input required value={nameBn} onChange={e => setNameBn(e.target.value)} type="text" placeholder="e.g. মিলাদুন্নবী ২০২৭" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <input required type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Import Families From</label>
              <select value={importProjectId} onChange={e => setImportProjectId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="">Do not import (Start fresh)</option>
                {projectList.map(p => (
                  <option key={p.id} value={p.id}>{p.nameEn} ({p.year})</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={isCreating} className="mt-4 flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50">
            {isCreating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
            Create & Import
          </button>
        </form>
      </div>
    </div>
  );
}
