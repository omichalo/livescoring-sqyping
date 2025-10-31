/**
 * Page des matchs en direct (tous championnats)
 */

"use client";

import { useMultipleChampionships } from "@/hooks";
import { useLiveMatches } from "@/hooks";
import { LoadingSpinner, MatchCard } from "@/components";
import type { ChampionshipId } from "@/lib/ittf";

const CHAMPIONSHIP_IDS: ChampionshipId[] = ["TTE5677", "TTE5679"];

export default function LivePage() {
  const championships = useMultipleChampionships(CHAMPIONSHIP_IDS);

  // Récupérer les matchs live de chaque championnat
  const liveData = championships.map((champ) => {
    const today = new Date().toISOString().split("T")[0];
    const { liveMatches, isLoading } = useLiveMatches(champ.champId, today);

    return {
      championship: champ.championship,
      liveMatches,
      isLoading,
    };
  });

  const allLiveMatches = liveData.flatMap((data) =>
    data.liveMatches.map((match) => ({
      match,
      championship: data.championship,
    }))
  );

  const isLoading = liveData.some((data) => data.isLoading);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-4">
          <span className="relative flex h-4 w-4 mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
          <h1 className="text-4xl font-bold text-gray-900">Matchs en Direct</h1>
        </div>
        <p className="text-xl text-gray-600">
          Suivez les compétitions en temps réel
        </p>
      </div>

      {/* Chargement */}
      {isLoading && allLiveMatches.length === 0 && (
        <LoadingSpinner size="lg" message="Recherche des matchs en direct..." />
      )}

      {/* Matchs en direct */}
      {allLiveMatches.length > 0 ? (
        <div className="space-y-8">
          {liveData
            .filter((data) => data.liveMatches.length > 0)
            .map((data) => (
              <section key={data.championship?.champ}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {data.championship?.champDesc}
                    </h2>
                    <p className="text-gray-600">
                      {data.championship?.location} - {data.liveMatches.length}{" "}
                      match{data.liveMatches.length > 1 ? "s" : ""} en cours
                    </p>
                  </div>
                  <a
                    href={`/championship/${data.championship?.champ}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Voir le championnat →
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.liveMatches.map((match) => (
                    <MatchCard key={match.matchId} match={match} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Aucun match en direct
            </h3>
            <p className="text-gray-500">
              Il n'y a actuellement aucun match en cours. Revenez plus tard !
            </p>
          </div>
        )
      )}
    </div>
  );
}


