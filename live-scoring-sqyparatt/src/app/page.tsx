/**
 * Page d'accueil - Liste des championnats
 */

"use client";

import { useMultipleChampionships } from "@/hooks";
import { ChampionshipCard, LoadingSpinner, ErrorMessage } from "@/components";
import type { ChampionshipId } from "@/lib/ittf";

// Liste des championnats à afficher
// TODO: Remplacer par une liste dynamique depuis Firestore
const CHAMPIONSHIP_IDS: ChampionshipId[] = ["TTE5677", "TTE5679"];

export default function HomePage() {
  const championships = useMultipleChampionships(CHAMPIONSHIP_IDS);

  // Séparer les championnats actifs et terminés
  const activeChampionships = championships.filter(
    (c) => c.championship && !c.championship.isFinished
  );
  const finishedChampionships = championships.filter(
    (c) => c.championship && c.championship.isFinished
  );

  const isLoading = championships.some((c) => c.isLoading);
  const hasErrors = championships.some((c) => c.error);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Championnats ITTF Para
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Suivez en direct les compétitions internationales de tennis de table
          para-élite
        </p>
      </div>

      {/* Chargement initial */}
      {isLoading && championships.every((c) => c.isLoading) && (
        <LoadingSpinner size="lg" message="Chargement des championnats..." />
      )}

      {/* Erreurs */}
      {hasErrors && (
        <div className="mb-6">
          {championships
            .filter((c) => c.error)
            .map((c) => (
              <ErrorMessage
                key={c.champId}
                error={c.error as Error}
                retry={c.refresh}
              />
            ))}
        </div>
      )}

      {/* Championnats en cours */}
      {activeChampionships.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">En cours</h2>
            <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {activeChampionships.length} actif
              {activeChampionships.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeChampionships.map(({ championship, champId }) =>
              championship ? (
                <ChampionshipCard key={champId} championship={championship} />
              ) : null
            )}
          </div>
        </section>
      )}

      {/* Championnats terminés */}
      {finishedChampionships.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Championnats terminés
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finishedChampionships.map(({ championship, champId }) =>
              championship ? (
                <ChampionshipCard key={champId} championship={championship} />
              ) : null
            )}
          </div>
        </section>
      )}

      {/* Aucun championnat */}
      {!isLoading &&
        activeChampionships.length === 0 &&
        finishedChampionships.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucun championnat disponible
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Les championnats apparaîtront ici dès qu'ils seront disponibles.
            </p>
          </div>
        )}
    </div>
  );
}
