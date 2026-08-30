/**
 * Page de gestion des encounters
 */

"use client";

import { useState, useEffect } from "react";
import { useChampionship, useCurrentEncounter } from "@/hooks";
import type { ChampionshipId } from "@/lib/ittf/types";
import {
  getEncountersByChampionship,
  getEncounterSummary,
  deleteEncounter,
} from "@/services/encounterService";
import { deleteMatchesByEncounter } from "@/services/liveScoringService";
import type { FirestoreEncounter, EncounterSummary } from "@/types/firestore";
import { LoadingSpinner } from "@/components";

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<FirestoreEncounter[]>([]);
  const [summaries, setSummaries] = useState<Record<string, EncounterSummary>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Utiliser l'encounter actif au lieu du championnat depuis Remote Config
  const { currentEncounter, isLoading: loadingEncounter } =
    useCurrentEncounter();
  const champId = currentEncounter?.championshipId || null;

  const { championship } = useChampionship(champId as ChampionshipId);

  // Charger les encounters
  useEffect(() => {
    async function loadEncounters() {
      if (!champId) return;

      setIsLoading(true);
      try {
        const encountersList = await getEncountersByChampionship(champId);
        setEncounters(encountersList);

        // Charger les résumés pour chaque encounter
        const summariesData: Record<string, EncounterSummary> = {};
        for (const encounter of encountersList) {
          if (encounter.id) {
            const summary = await getEncounterSummary(encounter.id);
            if (summary) {
              summariesData[encounter.id] = summary;
            }
          }
        }
        setSummaries(summariesData);
      } catch (error) {
        console.error("Erreur lors du chargement des encounters:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEncounters();
  }, [champId]);

  const handleDeleteMatches = async (encounterId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer tous les matchs de cet encounter ?"
      )
    ) {
      return;
    }

    setDeleteLoading(encounterId);
    try {
      const deletedCount = await deleteMatchesByEncounter(encounterId);
      alert(`${deletedCount} matchs supprimés avec succès`);

      // Recharger les encounters
      const encountersList = await getEncountersByChampionship(champId!);
      setEncounters(encountersList);

      // Mettre à jour le résumé
      const summary = await getEncounterSummary(encounterId);
      if (summary) {
        setSummaries((prev) => ({ ...prev, [encounterId]: summary }));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression des matchs");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteEncounter = async (encounterId: string) => {
    const summary = summaries[encounterId];
    if (summary && summary.totalMatches > 0) {
      if (
        !confirm(
          `Cet encounter contient ${summary.totalMatches} matchs. Voulez-vous les supprimer d'abord ?`
        )
      ) {
        return;
      }
      await handleDeleteMatches(encounterId);
    }

    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet encounter définitivement ?"
      )
    ) {
      return;
    }

    setDeleteLoading(encounterId);
    try {
      await deleteEncounter(encounterId);
      alert("Encounter supprimé avec succès");

      // Recharger les encounters
      const encountersList = await getEncountersByChampionship(champId!);
      setEncounters(encountersList);
      setSummaries((prev) => {
        const newSummaries = { ...prev };
        delete newSummaries[encounterId];
        return newSummaries;
      });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression de l'encounter");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status: FirestoreEncounter["status"]) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      archived: "bg-gray-100 text-gray-800",
    };

    const labels = {
      active: "Actif",
      completed: "Terminé",
      archived: "Archivé",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  if (loadingEncounter || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Chargement des encounters..." />
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
            Aucun encounter n&apos;est actuellement en cours. Créez et activez
            un encounter via la page d&apos;administration.
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
                Gestion des Encounters
              </h1>
              {championship && (
                <p className="mt-2 text-gray-600">{championship.champDesc}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <a
                href="/load-matches"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                📥 Charger des matchs
              </a>
              <a
                href="/live-scoring"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                🎯 Live Scoring
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {encounters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Aucun encounter trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par charger des matchs pour créer un encounter.
            </p>
            <a
              href="/load-matches"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <span>📥</span>
              <span className="ml-2">Charger des matchs</span>
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {encounters.map((encounter) => {
              const summary = summaries[encounter.id!];
              const isExpanded = expandedId === encounter.id;
              const isDeleting = deleteLoading === encounter.id;

              return (
                <div
                  key={encounter.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {encounter.name}
                          </h3>
                          {getStatusBadge(encounter.status)}
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span>📅 {encounter.date}</span>
                          <span>🏓 {encounter.numberOfTables} tables</span>
                          {summary && (
                            <>
                              <span>📊 {summary.totalMatches} matchs</span>
                              {summary.completedMatches > 0 && (
                                <span className="text-green-600">
                                  ✅ {summary.completedMatches} terminés
                                </span>
                              )}
                              {summary.inProgressMatches > 0 && (
                                <span className="text-blue-600">
                                  🔄 {summary.inProgressMatches} en cours
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {encounter.description && (
                          <p className="mt-2 text-gray-500 text-sm">
                            {encounter.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : encounter.id!)
                          }
                          className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Détails expandables */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Informations */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Informations
                          </h4>
                          <dl className="space-y-2">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                ID
                              </dt>
                              <dd className="text-sm text-gray-900 font-mono">
                                {encounter.id}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Championnat
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {encounter.championshipId}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Date de création
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {new Date(encounter.createdAt).toLocaleString()}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        {/* Statistiques des matchs */}
                        {summary && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Statistiques des matchs
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <span className="text-sm font-medium text-gray-700">
                                  Total
                                </span>
                                <span className="text-lg font-bold text-gray-900">
                                  {summary.totalMatches}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <span className="text-sm font-medium text-yellow-700">
                                  En attente
                                </span>
                                <span className="text-lg font-bold text-yellow-900">
                                  {summary.waitingMatches}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-blue-700">
                                  En cours
                                </span>
                                <span className="text-lg font-bold text-blue-900">
                                  {summary.inProgressMatches}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-sm font-medium text-green-700">
                                  Terminés
                                </span>
                                <span className="text-lg font-bold text-green-900">
                                  {summary.completedMatches}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions dangereuses */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-lg font-semibold text-red-900 mb-4">
                          Actions dangereuses
                        </h4>
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleDeleteMatches(encounter.id!)}
                            disabled={
                              isDeleting ||
                              !summary ||
                              summary.totalMatches === 0
                            }
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                          >
                            {isDeleting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Suppression...</span>
                              </>
                            ) : (
                              <>
                                <span>🗑️</span>
                                <span>Supprimer les matchs</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteEncounter(encounter.id!)}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                          >
                            {isDeleting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Suppression...</span>
                              </>
                            ) : (
                              <>
                                <span>❌</span>
                                <span>Supprimer l'encounter</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-red-600">
                          ⚠️ Ces actions sont irréversibles
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
