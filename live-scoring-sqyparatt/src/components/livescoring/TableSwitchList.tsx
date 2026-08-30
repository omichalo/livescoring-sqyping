/**
 * Liste de switches pour activer/désactiver les tables
 */

"use client";

import type { TableLocation } from "@/lib/ittf/types";
import { extractTableNumber } from "@/lib/ittf-to-firestore";

interface TableSwitchListProps {
  tables: TableLocation[];
  enabledTables: Record<number, boolean>;
  onChange: (enabledTables: Record<number, boolean>) => void;
}

export function TableSwitchList({
  tables,
  enabledTables,
  onChange,
}: TableSwitchListProps) {
  const handleToggle = (tableNum: number) => {
    onChange({
      ...enabledTables,
      [tableNum]: !enabledTables[tableNum],
    });
  };

  // Extraire et trier les tables par numéro
  const tablesWithNumbers = tables
    .map((table) => ({
      ...table,
      number: extractTableNumber(table.Desc),
    }))
    .filter((t) => t.number !== null)
    .sort((a, b) => a.number! - b.number!);

  if (tablesWithNumbers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune table disponible pour ce championnat
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tablesWithNumbers.map((table) => {
        const tableNum = table.number!;
        const isEnabled = enabledTables[tableNum] || false;

        return (
          <label
            key={table.Key}
            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
              isEnabled
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{table.Desc}</div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => handleToggle(tableNum)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isEnabled ? "bg-primary-600" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={isEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        );
      })}
    </div>
  );
}
