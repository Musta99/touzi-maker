"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { useState } from "react";
import { ArrowLeft, Plus, Building2, Home } from "lucide-react";
import Link from "next/link";
import { addFloor, addFlat } from "@/app/actions/floors";

type Flat = { id: string; name: string; sequenceOrder: number };
type Floor = { id: string; nameEn: string; nameBn: string; sequenceOrder: number; flats: Flat[] };
type Building = { id: string; nameEn: string; nameBn: string; floorCount: number | null; flatCount: number | null };

export default function BuildingDetailClient({ building, floors }: { building: Building; floors: Floor[] }) {
  const { t } = useT();

  const handleAddFloor = async () => {
    const nameEn = prompt("Enter floor name (English):");
    const nameBn = prompt("Enter floor name (Bengali):");
    if (nameEn && nameBn) {
      await addFloor({ buildingId: building.id, nameEn, nameBn, sequenceOrder: floors.length + 1 });
    }
  };

  const handleAddFlat = async (floorId: string, currentFlatsCount: number) => {
    const name = prompt("Enter flat name (e.g. 1A, Ground-1):");
    if (name) {
      await addFlat({ buildingId: building.id, floorId, name, sequenceOrder: currentFlatsCount + 1 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="../buildings" className="text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {building.nameBn}
            <span className="text-base text-gray-500 font-normal ml-2">({building.nameEn})</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {building.floorCount ?? 0} Floors · {building.flatCount ?? 0} Flats
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white">
          <Building2 className="mr-2 h-5 w-5 text-primary" /> Floors & Flats
        </h2>
        <button onClick={handleAddFloor} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
          <Plus className="mr-2 h-4 w-4" /> Add Floor
        </button>
      </div>

      <div className="space-y-6">
        {floors.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No floors yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Floor" to get started</p>
          </div>
        ) : (
          floors.map((floor) => (
            <div key={floor.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {floor.nameBn} <span className="text-sm text-gray-500 font-normal">({floor.nameEn})</span>
                  <span className="ml-2 text-xs font-normal text-gray-400">{floor.flats.length} flats</span>
                </h3>
                <button onClick={() => handleAddFlat(floor.id, floor.flats.length)} className="text-sm text-primary hover:text-green-700 font-medium flex items-center">
                  <Plus className="h-4 w-4 mr-1" /> Add Flat
                </button>
              </div>
              <div className="p-6">
                {floor.flats.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No flats. Add a flat to assign families.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {floor.flats.map(flat => (
                      <div key={flat.id} className="flex flex-col p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-green-50 dark:hover:bg-green-900/10 transition-all cursor-pointer group">
                        <div className="flex items-center mb-1">
                          <Home className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary" />
                          <span className="font-bold text-gray-900 dark:text-white group-hover:text-primary">{flat.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">No family</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
