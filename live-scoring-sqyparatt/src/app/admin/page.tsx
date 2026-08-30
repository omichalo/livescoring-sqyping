/**
 * Page d'administration des journées
 */

"use client";

import { useState, useEffect } from "react";
import type { ChampionshipId } from "@/lib/ittf/types";
import {
  createActiveEncounter,
  getEncountersByChampionship,
  activateEncounter,
} from "@/services/encounterService";
import {
  loadIttfMatchesToFirestore,
  autoMarkFinishedMatches,
} from "@/services/liveScoringService";
import { fetchChampionship } from "@/lib/ittf/api";

export default function AdminPage() {
  const [champId, setChampId] = useState<string>("");
  const [championship, setChampionship] = useState<any>(null);
  const [journees, setJournees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTournoi, setLoadingTournoi] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState<string | null>(null);
  const [activatingJournee, setActivatingJournee] = useState<string | null>(
    null
  );
  const [markingFinished, setMarkingFinished] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingDates, setMissingDates] = useState<string[]>([]);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});

  // Charger le dernier tournoi au montage du composant
  useEffect(() => {
    const savedChampId = localStorage.getItem("lastChampId");
    if (savedChampId) {
      setChampId(savedChampId);
      // Charger automatiquement le tournoi stocké
      handleLoadTournoiFromStorage(savedChampId);
    }
  }, []);

  // Charger automatiquement les journées quand un tournoi est chargé
  useEffect(() => {
    if (champId && championship) {
      loadJournees();
    }
  }, [champId, championship]);

  // Fonction pour charger un tournoi depuis le stockage
  const handleLoadTournoiFromStorage = async (champIdToLoad: string) => {
    setLoadingTournoi(true);
    setError(null);
    try {
      const champData = await fetchChampionship(
        champIdToLoad as ChampionshipId
      );
      if (champData) {
        setChampionship(champData);
      } else {
        setError(
          "Le tournoi sauvegardé n'est plus disponible. Veuillez en sélectionner un autre."
        );
        // Nettoyer le stockage si le tournoi n'existe plus
        localStorage.removeItem("lastChampId");
        setChampId("");
      }
    } catch (error) {
      console.error("Erreur lors du chargement du tournoi sauvegardé:", error);
      setError(
        "Erreur lors du chargement du tournoi sauvegardé. Veuillez en sélectionner un autre."
      );
      // Nettoyer le stockage en cas d'erreur
      localStorage.removeItem("lastChampId");
      setChampId("");
    } finally {
      setLoadingTournoi(false);
    }
  };

  // Sauvegarder le tournoi dans le local storage
  const saveChampId = (id: string) => {
    localStorage.setItem("lastChampId", id);
  };

  const loadJournees = async () => {
    if (!champId) return;
    try {
      const journeesList = await getEncountersByChampionship(champId);
      setJournees(journeesList);

      // Charger les compteurs de matchs pour chaque journée
      const counts: Record<string, number> = {};
      for (const journee of journeesList) {
        if (journee.id) {
          counts[journee.id] = await getMatchCountForJournee(journee.id);
        }
      }
      setMatchCounts(counts);

      // Calculer les dates manquantes si on a un championnat chargé
      if (championship?.dates) {
        const existingDates = journeesList.map((j) => j.date);
        const allDates = championship.dates.map((d: any) => d.raw);
        const missing = allDates.filter(
          (date: any) => !existingDates.includes(date)
        );
        setMissingDates(missing);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des journées:", error);
    }
  };

  // Fonction pour compter les matchs d'une journée
  const getMatchCountForJournee = async (encounterId: string) => {
    try {
      const { getMatchesByEncounter } = await import(
        "@/services/liveScoringService"
      );
      const matches = await getMatchesByEncounter(encounterId);
      return matches.length;
    } catch (error) {
      console.error("Erreur lors du comptage des matchs:", error);
      return 0;
    }
  };

  // Composant pour afficher une journée avec son nombre de matchs
  const JourneeCard = ({
    journee,
    matchCount,
  }: {
    journee: any;
    matchCount: number;
  }) => {
    const isActive = journee.isCurrent && journee.status === "active";
    const isCompleted = journee.status === "completed";

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {new Date(journee.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h3>
            <p className="text-sm text-gray-500">ID: {journee.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : isCompleted
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isActive
                ? "✅ Actif"
                : isCompleted
                ? "⏸️ Inactif"
                : journee.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{matchCount}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {journee.matches?.filter((m: any) => m.status === "waiting")
                .length || 0}
            </p>
            <p className="text-sm text-gray-500">En attente</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {journee.matches?.filter((m: any) => m.status === "inProgress")
                .length || 0}
            </p>
            <p className="text-sm text-gray-500">En cours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {journee.matches?.filter((m: any) => m.status === "finished")
                .length || 0}
            </p>
            <p className="text-sm text-gray-500">Terminés</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleLoadMatches(journee.id)}
            disabled={loadingMatches === journee.id}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMatches === journee.id
              ? "Chargement..."
              : "📥 Charger les matchs"}
          </button>
          <button
            onClick={() => handleActivateJournee(journee.id)}
            disabled={isActive || activatingJournee === journee.id}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {activatingJournee === journee.id ? "Activation..." : "⚡ Activer"}
          </button>
          <button
            onClick={() => handleMarkFinished(journee.id)}
            disabled={markingFinished === journee.id}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {markingFinished === journee.id
              ? "Traitement..."
              : "✅ Marquer terminés"}
          </button>
        </div>
      </div>
    );
  };

  const handleLoadTournoi = async () => {
    if (!champId.trim()) return;
    setLoadingTournoi(true);
    setError(null);
    try {
      // Charger le tournoi manuellement via l'API
      const champData = await fetchChampionship(champId as ChampionshipId);

      if (champData) {
        setChampionship(champData);
        saveChampId(champId); // Sauvegarder l'ID du tournoi
        // Ne plus charger automatiquement les journées
      } else {
        setError(
          "Aucun tournoi trouvé avec cet ID. Vérifiez que l'ID est correct."
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement du tournoi:", error);
      setError(
        "Erreur lors du chargement du tournoi. Vérifiez que l'ID est correct et que vous êtes connecté à Internet."
      );
    } finally {
      setLoadingTournoi(false);
    }
  };

  const handleCreateJournees = async () => {
    if (!championship?.dates || !champId) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const createdJournees = [];
      const totalDates = missingDates.length;

      // Créer seulement les journées manquantes
      for (let i = 0; i < missingDates.length; i++) {
        const missingDate = missingDates[i];
        try {
          setSuccess(
            `Création des journées... ${i + 1}/${totalDates} (${new Date(
              missingDate
            ).toLocaleDateString("fr-FR")})`
          );
          const encounterId = await createActiveEncounter(
            champId,
            missingDate,
            championship.locations?.length || 12
          );
          createdJournees.push({ date: missingDate, encounterId });
        } catch (error) {
          console.error(`Erreur pour la date ${missingDate}:`, error);
        }
      }

      if (createdJournees.length > 0) {
        setSuccess(
          `✅ ${createdJournees.length} journées créées avec succès !`
        );
        await loadJournees(); // Recharger pour mettre à jour l'affichage
        // Auto-fermer le message après 5 secondes
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setSuccess("ℹ️ Toutes les journées sont déjà créées !");
        await loadJournees(); // Recharger pour mettre à jour l'affichage
        // Auto-fermer le message après 3 secondes
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Erreur lors de la création des journées:", error);
      setError(
        "❌ Erreur lors de la création des journées. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMatches = async (encounterId: string) => {
    if (!champId) return;

    setLoadingMatches(encounterId);
    try {
      const journee = journees.find((e) => e.id === encounterId);
      if (!journee) return;

      // Récupérer toutes les tables disponibles
      const availableTables =
        championship?.locations
          ?.map((loc: any) => {
            const match = loc.Desc.match(/Table (\d+)/);
            return match ? parseInt(match[1]) : null;
          })
          .filter((num: any): num is number => num !== null)
          .sort((a: number, b: number) => a - b) || [];

      const result = await loadIttfMatchesToFirestore(
        champId,
        journee.date,
        availableTables,
        encounterId
      );

      setSuccess(`✅ ${result.loaded} matchs chargés avec succès !`);
      // Mettre à jour le compteur de matchs
      const newCount = await getMatchCountForJournee(encounterId);
      setMatchCounts((prev) => ({ ...prev, [encounterId]: newCount }));
      // Auto-fermer le message après 4 secondes
      setTimeout(() => setSuccess(null), 4000);
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error);
      setError("❌ Erreur lors du chargement des matchs. Veuillez réessayer.");
    } finally {
      setLoadingMatches(null);
    }
  };

  const handleActivateJournee = async (encounterId: string) => {
    setActivatingJournee(encounterId);
    try {
      // Activer la journée sélectionnée (désactive automatiquement toutes les autres)
      await activateEncounter(encounterId);

      setSuccess("✅ Journée activée avec succès !");
      await loadJournees();
      // Auto-fermer le message après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de l'activation de la journée:", error);
      setError(
        "❌ Erreur lors de l'activation de la journée. Veuillez réessayer."
      );
    } finally {
      setActivatingJournee(null);
    }
  };

  const handleMarkFinished = async (encounterId: string) => {
    setMarkingFinished(encounterId);
    try {
      const updatedCount = await autoMarkFinishedMatches(encounterId);

      if (updatedCount > 0) {
        setSuccess(`✅ ${updatedCount} match(s) marqué(s) comme terminé(s) !`);
        await loadJournees();
        // Mettre à jour le compteur de matchs
        const newCount = await getMatchCountForJournee(encounterId);
        setMatchCounts((prev) => ({ ...prev, [encounterId]: newCount }));
      } else {
        setSuccess("ℹ️ Aucun match à marquer comme terminé.");
      }
      // Auto-fermer le message après 4 secondes
      setTimeout(() => setSuccess(null), 4000);
    } catch (error) {
      console.error("Erreur lors du marquage des matchs:", error);
      setError("❌ Erreur lors du marquage des matchs. Veuillez réessayer.");
    } finally {
      setMarkingFinished(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administration des Journées
              </h1>
              <p className="mt-2 text-gray-600">
                Gestion des journées et chargement des matchs
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/live-scoring"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                🎯 Live Scoring
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Saisie de l'ID du tournoi */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🏆 Sélection du Tournoi
          </h2>

          {/* Saisie manuelle */}
          <div className="flex space-x-4">
            <input
              type="text"
              value={champId}
              onChange={(e) => {
                setChampId(e.target.value);
                if (error) setError(null); // Effacer l'erreur quand l'utilisateur tape
                if (success) setSuccess(null); // Effacer le succès quand l'utilisateur tape
              }}
              placeholder="ID du tournoi (ex: TTE5679)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={handleLoadTournoi}
              disabled={!champId.trim() || loadingTournoi}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loadingTournoi
                ? "Chargement..."
                : championship
                ? "Changer"
                : "Charger"}
            </button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Erreur</h3>
                <p className="mt-1 text-red-700">{error}</p>
                <div className="mt-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-800 hover:text-red-900 font-medium"
                  >
                    ✕ Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message de succès */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Succès</h3>
                <p className="mt-1 text-green-700 font-semibold">{success}</p>
                <div className="mt-3">
                  <button
                    onClick={() => setSuccess(null)}
                    className="text-green-800 hover:text-green-900 font-medium"
                  >
                    ✕ Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informations du tournoi */}
        {championship && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                📋 Informations du Tournoi
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("lastChampId");
                    setChampionship(null);
                    setChampId("");
                    setJournees([]);
                    setMissingDates([]);
                  }}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Changer de tournoi
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nom</p>
                <p className="text-lg text-gray-900">
                  {championship.champDesc}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID</p>
                <p className="text-lg text-gray-900 font-mono">{champId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Dates disponibles
                </p>
                <p className="text-lg text-gray-900">
                  {championship.dates?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tables</p>
                <p className="text-lg text-gray-900">
                  {championship.locations?.length || 0}
                </p>
              </div>
            </div>

            {/* Dates du tournoi */}
            {championship.dates && championship.dates.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Dates du tournoi :
                </p>
                <div className="flex flex-wrap gap-2">
                  {championship.dates.map((dateInfo: any) => (
                    <span
                      key={dateInfo.raw}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {new Date(dateInfo.raw).toLocaleDateString("fr-FR")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton de création des journées - affiché si on a un championnat avec des dates */}
            {championship.dates && championship.dates.length > 0 && (
              <div className="mt-6">
                {missingDates.length > 0 || journees.length === 0 ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-yellow-400 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <p className="text-yellow-800 font-medium">
                          {journees.length === 0
                            ? `Aucune journée créée. ${championship.dates.length} journées disponibles.`
                            : `${missingDates.length} journées manquantes sur ${championship.dates.length}`}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-yellow-700">
                        {journees.length === 0
                          ? "Dates disponibles : " +
                            championship.dates
                              .map((d: any) =>
                                new Date(d.raw).toLocaleDateString("fr-FR")
                              )
                              .join(", ")
                          : "Dates manquantes : " +
                            missingDates
                              .map((date) =>
                                new Date(date).toLocaleDateString("fr-FR")
                              )
                              .join(", ")}
                      </div>
                    </div>
                    <button
                      onClick={handleCreateJournees}
                      disabled={isLoading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading
                        ? "Création..."
                        : `Créer ${missingDates.length} journées manquantes`}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 text-green-400 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-green-800 font-medium">
                        Toutes les journées sont déjà créées (
                        {championship.dates.length}/{championship.dates.length})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Liste des journées */}
        {journees.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📅 Journées ({journees.length})
            </h2>
            <div className="space-y-4">
              {journees.map((journee) => (
                <JourneeCard
                  key={journee.id}
                  journee={journee}
                  matchCount={matchCounts[journee.id] || 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message si aucune journée */}
        {championship && journees.length === 0 && (
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
              Aucune journée créée
            </h3>
            <p className="text-gray-600 mb-6">
              Créez des journées pour chaque date du tournoi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
