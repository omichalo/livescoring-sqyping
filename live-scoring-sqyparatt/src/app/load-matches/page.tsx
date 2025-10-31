/**
 * Page de chargement des matchs ITTF vers Firestore
 */

"use client";

import { useState } from "react";
import { loadIttfMatchesToFirestore } from "@/services/liveScoringService";
import { createActiveEncounter } from "@/services/encounterService";
import { useChampionship, useCurrentEncounter } from "@/hooks";
import type { ChampionshipId } from "@/lib/ittf/types";
import { LoadingSpinner } from "@/components";

export default function LoadMatchesPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    loaded: number;
    errors: number;
    encounterId: string;
  } | null>(null);

  // Utiliser l'encounter actif au lieu du championnat depuis Remote Config
  const { currentEncounter, isLoading: loadingEncounter } =
    useCurrentEncounter();
  const champId = currentEncounter?.championshipId || null;

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
      // Créer un encounter actif d'abord
      const encounterId = await createActiveEncounter(
        champId,
        selectedDate,
        selectedTables.length
      );

      // Charger les matchs dans cet encounter
      const result = await loadIttfMatchesToFirestore(
        champId,
        selectedDate,
        selectedTables,
        encounterId
      );
      setResult({ ...result, encounterId });
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setResult({ loaded: 0, errors: 1, encounterId: "" });
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

  const selectAllTables = () => {
    setSelectedTables(availableTables);
  };

  const clearAllTables = () => {
    setSelectedTables([]);
  };

  if (loadingEncounter || loadingChampionship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Chargement..." />
      </div>
    );
  }

  // Si aucun encounter actif, afficher un message
  if (!currentEncounter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-md">
          <svg
            className="w-24 h-24 text-gray-300 mx-auto mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Aucun encounter actif
          </h3>
          <p className="text-gray-600 mb-6">
            Aucun encounter n'est actuellement en cours. Créez et activez un
            encounter via la page d'administration.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <span>⚙️</span>
            <span className="ml-2">Administration</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Charger les matchs
              </h1>
              <p className="mt-2 text-gray-600">
                Importez les matchs ITTF vers Firestore pour le live scoring
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Retour
              </button>
              <a
                href="/live-scoring"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Live Scoring
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Informations du championnat */}
          {championship && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                {championship.champDesc}
              </h2>
              <p className="text-blue-700">
                Championnat ID:{" "}
                <code className="bg-blue-100 px-2 py-1 rounded">{champId}</code>
              </p>
            </div>
          )}

          {/* Sélection de date */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              📅 Date des matchs
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Sélection des tables */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold text-gray-900">
                🏓 Tables à charger
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllTables}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={clearAllTables}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
              {availableTables.map((tableNumber) => (
                <label
                  key={tableNumber}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTables.includes(tableNumber)
                      ? "border-primary-500 bg-primary-50 text-primary-700 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(tableNumber)}
                    onChange={() => toggleTable(tableNumber)}
                    className="sr-only"
                  />
                  <span className="font-semibold text-sm">T{tableNumber}</span>
                </label>
              ))}
            </div>

            {selectedTables.length > 0 && (
              <p className="mt-3 text-sm text-gray-600">
                {selectedTables.length} table
                {selectedTables.length > 1 ? "s" : ""} sélectionnée
                {selectedTables.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Bouton de chargement */}
          <div className="mb-8">
            <button
              onClick={handleLoadMatches}
              disabled={isLoading || selectedTables.length === 0}
              className="w-full max-w-md px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3 text-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Chargement en cours...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>
                    Charger les matchs ({selectedTables.length} tables)
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Résultat */}
          {result && (
            <div
              className={`p-6 rounded-lg border-2 ${
                result.errors > 0
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <svg
                  className={`w-6 h-6 ${
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
                  className={`text-lg font-semibold ${
                    result.errors > 0 ? "text-red-800" : "text-green-800"
                  }`}
                >
                  Chargement terminé
                </span>
              </div>
              <p
                className={`text-base mt-2 ${
                  result.errors > 0 ? "text-red-700" : "text-green-700"
                }`}
              >
                ✅ {result.loaded} matchs chargés avec succès
                {result.errors > 0 && (
                  <span className="block mt-1">
                    ❌ {result.errors} erreur{result.errors > 1 ? "s" : ""}
                  </span>
                )}
                {result.encounterId && (
                  <span className="block mt-2 text-sm text-gray-600">
                    📅 Encounter créé:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {result.encounterId}
                    </code>
                  </span>
                )}
              </p>

              {result.loaded > 0 && (
                <div className="mt-4">
                  <a
                    href="/live-scoring"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    <span>🎯</span>
                    <span className="ml-2">Aller au Live Scoring</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
