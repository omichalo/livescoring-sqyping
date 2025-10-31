/**
 * Composant pour charger les matchs ITTF dans Firestore
 */

"use client";

import { useState } from "react";
import { loadIttfMatchesToFirestore } from "@/services/liveScoringService";
import { getChampionshipId } from "@/lib/firebase-remote-config";
import { useChampionship } from "@/hooks";
import type { ChampionshipId } from "@/lib/ittf/types";

interface FirestoreLoaderProps {
  className?: string;
}

export function FirestoreLoader({ className = "" }: FirestoreLoaderProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    loaded: number;
    errors: number;
  } | null>(null);
  const [champId, setChampId] = useState<string | null>(null);

  // Charger le championnat depuis Remote Config
  useState(() => {
    async function loadChampionship() {
      const id = await getChampionshipId();
      setChampId(id);
    }
    loadChampionship();
  });

  // Charger les données du championnat
  const { championship, isLoading: loadingChampionship } = useChampionship(
    champId as ChampionshipId
  );

  const availableTables =
    championship?.locations
      ?.map((loc) => {
        const match = loc.Desc.match(/Table (\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((num): num is number => num !== null)
      .sort((a, b) => a - b) || [];

  const handleLoadMatches = async () => {
    if (!champId || selectedTables.length === 0) return;

    setIsLoading(true);
    setResult(null);

    try {
      const result = await loadIttfMatchesToFirestore(
        champId,
        selectedDate,
        selectedTables
      );
      setResult(result);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setResult({ loaded: 0, errors: 1 });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTable = (tableNumber: number) => {
    setSelectedTables((prev) =>
      prev.includes(tableNumber)
        ? prev.filter((t) => t !== tableNumber)
        : [...prev, tableNumber]
    );
  };

  if (loadingChampionship) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du championnat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Charger les matchs dans Firestore
      </h3>

      {/* Sélection de date */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date des matchs
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Sélection des tables */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tables à charger
        </label>
        <div className="grid grid-cols-4 gap-2">
          {availableTables.map((tableNumber) => (
            <label
              key={tableNumber}
              className={`flex items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedTables.includes(tableNumber)
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedTables.includes(tableNumber)}
                onChange={() => toggleTable(tableNumber)}
                className="sr-only"
              />
              <span className="font-medium">T{tableNumber}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Bouton de chargement */}
      <button
        onClick={handleLoadMatches}
        disabled={isLoading || selectedTables.length === 0}
        className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Chargement...</span>
          </>
        ) : (
          <span>Charger les matchs ({selectedTables.length} tables)</span>
        )}
      </button>

      {/* Résultat */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.errors > 0
              ? "bg-red-50 border border-red-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg
              className={`w-5 h-5 ${
                result.errors > 0 ? "text-red-600" : "text-green-600"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span
              className={`font-medium ${
                result.errors > 0 ? "text-red-800" : "text-green-800"
              }`}
            >
              Chargement terminé
            </span>
          </div>
          <p
            className={`text-sm mt-1 ${
              result.errors > 0 ? "text-red-700" : "text-green-700"
            }`}
          >
            {result.loaded} matchs chargés, {result.errors} erreurs
          </p>
        </div>
      )}
    </div>
  );
}
