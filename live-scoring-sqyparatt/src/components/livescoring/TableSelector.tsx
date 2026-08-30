/**
 * Sélecteur de tables pour le live scoring
 */

"use client";

import { useState } from "react";

interface TableSelectorProps {
  selectedTables: number[];
  onChange: (tables: number[]) => void;
  maxTables?: number;
  className?: string;
}

export function TableSelector({
  selectedTables,
  onChange,
  maxTables = 20,
  className = "",
}: TableSelectorProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTable = () => {
    const tableNum = parseInt(inputValue, 10);
    if (
      !isNaN(tableNum) &&
      tableNum > 0 &&
      tableNum <= maxTables &&
      !selectedTables.includes(tableNum)
    ) {
      onChange([...selectedTables, tableNum].sort((a, b) => a - b));
      setInputValue("");
    }
  };

  const handleRemoveTable = (table: number) => {
    onChange(selectedTables.filter((t) => t !== table));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTable();
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Tables sélectionnées
      </h3>

      {/* Input pour ajouter une table */}
      <div className="flex space-x-2 mb-4">
        <input
          type="number"
          min="1"
          max={maxTables}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Numéro de table"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          onClick={handleAddTable}
          disabled={!inputValue || selectedTables.length >= 10}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Ajouter
        </button>
      </div>

      {/* Liste des tables sélectionnées */}
      {selectedTables.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedTables.map((table) => (
            <div
              key={table}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-900 rounded-lg font-medium"
            >
              <span>Table {table}</span>
              <button
                onClick={() => handleRemoveTable(table)}
                className="text-primary-600 hover:text-primary-800 transition-colors"
                aria-label={`Retirer la table ${table}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">
          Aucune table sélectionnée. Ajoutez des tables pour commencer.
        </p>
      )}

      {selectedTables.length >= 10 && (
        <p className="text-orange-600 text-sm mt-3">
          Maximum de 10 tables atteint
        </p>
      )}
    </div>
  );
}


