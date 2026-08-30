/**
 * Page de live scoring - Interface épurée à onglets
 */

"use client";

import { useState, useEffect } from "react";
import type { LiveScoringSettings } from "@/lib/ittf/types";
import type { ChampionshipId } from "@/lib/ittf/types";
import { useChampionship, useCurrentEncounter } from "@/hooks";
import {
  saveLiveScoringSettings,
  loadLiveScoringSettings,
} from "@/lib/localStorage";
import { ModeSelector } from "@/components/livescoring/ModeSelector";
import { TableSwitchList } from "@/components/livescoring/TableSwitchList";
import { TableOrderManager } from "@/components/livescoring/TableOrderManager";
import { LoadingSpinner } from "@/components";

// Configuration pour l'export statique
export const dynamicParams = true;

type Tab = "scoring" | "settings";

export default function LiveScoringPage() {
  const [activeTab, setActiveTab] = useState<Tab>("scoring");
  const [settings, setSettings] = useState<LiveScoringSettings>({
    mode: "tv",
    enabledTables: {},
  });

  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showInitialDateModal, setShowInitialDateModal] = useState(false);

  // Utiliser l'encounter actif au lieu du championnat depuis Remote Config
  const { currentEncounter, isLoading: loadingEncounter } =
    useCurrentEncounter();
  const champId = currentEncounter?.championshipId || null;

  // Charger les données du championnat
  const {
    championship,
    isLoading: loadingChampionship,
    error: championshipError,
  } = useChampionship(champId as ChampionshipId);

  // Tables par défaut si l'API ITTF est down (10 tables de 1 à 10)
  const defaultTables: Array<{ Key: string; Desc: string }> = Array.from(
    { length: 10 },
    (_, i) => ({
      Key: `T${String(i + 1).padStart(2, "0")}`,
      Desc: `Table ${i + 1}`,
    })
  );

  // Utiliser les tables par défaut si l'API est en erreur, sinon les tables du championnat
  const tablesToUse = championshipError
    ? defaultTables
    : championship?.locations || null;

  // Charger les paramètres depuis le localStorage au montage
  useEffect(() => {
    setIsClient(true);

    // Charger la date depuis localStorage (dev uniquement)
    if (import.meta.env.DEV) {
      const savedDate = localStorage.getItem("sqyparatt-dev-date");
      if (savedDate) {
        setSelectedDate(savedDate);
      } else {
        // Première visite en dev : afficher la modal
        setShowInitialDateModal(true);
      }
    }

    const saved = loadLiveScoringSettings();
    if (saved) {
      // S'assurer que enabledTables existe
      setSettings({
        mode: saved.mode || "tv",
        enabledTables: saved.enabledTables || {},
      });
    } else {
      // Première visite : activer quelques tables par défaut
      setSettings({
        mode: "tv",
        enabledTables: { 1: true, 2: true, 3: true, 4: true },
      });
    }
  }, []);

  // Sauvegarder les paramètres à chaque changement
  useEffect(() => {
    if (isClient) {
      saveLiveScoringSettings(settings);
    }
  }, [settings, isClient]);

  const handleModeChange = (mode: "tv" | "ittf") => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  const handleTablesChange = (enabledTables: Record<number, boolean>) => {
    setSettings((prev) => ({ ...prev, enabledTables }));
  };

  // Sauvegarder la date dans localStorage quand elle change (dev uniquement)
  useEffect(() => {
    if (isClient && selectedDate && import.meta.env.DEV) {
      localStorage.setItem("sqyparatt-dev-date", selectedDate);
    }
  }, [selectedDate, isClient]);

  // Handler pour la sélection initiale de date
  const handleInitialDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowInitialDateModal(false);
  };

  // Date à utiliser (selectedDate en dev, aujourd'hui en prod)
  const dateToUse =
    isClient && import.meta.env.DEV && selectedDate
      ? selectedDate
      : new Date().toISOString().split("T")[0];

  // Tables activées
  const activeTables = settings.enabledTables
    ? Object.keys(settings.enabledTables)
        .map(Number)
        .filter((num) => settings.enabledTables[num])
    : [];

  // Afficher la modal de sélection de date en premier (dev uniquement)
  if (isClient && showInitialDateModal && import.meta.env.DEV) {
    const suggestedDates = [
      { label: "Aujourd'hui", value: new Date().toISOString().split("T")[0] },
      { label: "15 Oct 2025 (TTE5679)", value: "2025-10-15" },
      { label: "7 Oct 2025 (TTE5677)", value: "2025-10-07" },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sélectionner une date
          </h2>
          <p className="text-gray-600 mb-6">
            En mode développement, choisissez la date des matchs à afficher.
          </p>

          {/* Dates suggérées */}
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-gray-700">
              Dates suggérées :
            </p>
            {suggestedDates.map((suggestion) => (
              <button
                key={suggestion.value}
                onClick={() => handleInitialDateSelect(suggestion.value)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-900 rounded-lg text-left transition-colors"
              >
                {suggestion.label}
              </button>
            ))}
          </div>

          {/* Ou sélection manuelle */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Ou choisir une date :
            </p>
            <input
              type="date"
              value={selectedDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
            />
            <button
              onClick={() =>
                handleInitialDateSelect(
                  selectedDate || new Date().toISOString().split("T")[0]
                )
              }
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ne pas bloquer si on a une erreur API (on peut utiliser les tables par défaut)
  if (
    !isClient ||
    loadingEncounter ||
    (loadingChampionship && !championshipError)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Chargement..." />
      </div>
    );
  }

  // Vérification spécifique pour le mode développement après l'hydratation
  if (isClient && import.meta.env.DEV && !selectedDate) {
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
      {/* Sélecteur de date (dev uniquement) - Positionné en superposition absolue pour ne pas influencer le layout */}
      {isClient && import.meta.env.DEV && (
        <div className="fixed top-2 left-2 z-50 pointer-events-auto">
          {!showDatePicker ? (
            <button
              onClick={() => setShowDatePicker(true)}
              className="p-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors opacity-50 hover:opacity-100"
              title="Changer la date (dev)"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200 min-w-[280px] max-w-[320px]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Date (dev)
                </label>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-gray-400 hover:text-gray-600"
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
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedDate("2025-10-15");
                    setShowDatePicker(false);
                  }}
                  className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  15 Oct
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("sqyparatt-dev-date");
                    setShowInitialDateModal(true);
                    setShowDatePicker(false);
                    setSelectedDate("");
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                  title="Réinitialiser"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onglets */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("scoring")}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === "scoring"
                ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-lg">Live Scoring</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === "settings"
                ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-lg">Paramètres</span>
            </div>
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-2 py-1 md:px-4 md:py-2 w-full max-w-full overflow-x-hidden">
        {activeTab === "scoring" ? (
          /* Onglet Live Scoring */
          activeTables.length > 0 ? (
            <TableOrderManager
              champId={champId as ChampionshipId}
              enabledTables={settings.enabledTables}
              date={dateToUse}
              mode={settings.mode}
            />
          ) : (
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Aucune table sélectionnée
              </h3>
              <p className="text-gray-600 mb-6">
                Activez des tables dans l&apos;onglet Paramètres pour commencer
              </p>
              <button
                onClick={() => setActiveTab("settings")}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Aller aux Paramètres
              </button>
            </div>
          )
        ) : (
          /* Onglet Paramètres */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Sélecteur de mode */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <ModeSelector mode={settings.mode} onChange={handleModeChange} />
            </div>

            {/* Liste des tables */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Tables à afficher
              </h3>
              {tablesToUse ? (
                <TableSwitchList
                  tables={tablesToUse}
                  enabledTables={settings.enabledTables}
                  onChange={handleTablesChange}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chargement des tables...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
