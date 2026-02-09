/**
 * Page de détails d'un championnat
 */

"use client";

import { useState, useMemo } from "react";
import { useChampionship, useMatchDay } from "@/hooks";
import { LoadingSpinner, ErrorMessage, MatchCard } from "@/components";
import {
  isToday,
  groupEventsByTypeAndFormat,
  getFullEventLabel,
  type ChampionshipId,
} from "@/lib/ittf";

interface ChampionshipPageProps {
  params: { champId: string };
}

export default function ChampionshipPage({ params }: ChampionshipPageProps) {
  const { champId } = params;
  const { championship, isLoading, error } = useChampionship(
    champId as ChampionshipId
  );

  // État pour la date sélectionnée et le filtre d'événement
  const today = new Date().toISOString().split("T")[0];
  const defaultDate =
    championship?.dates.find((d) => isToday(d.raw))?.raw ||
    championship?.dates[championship.dates.length - 1]?.raw ||
    today;

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Mettre à jour la date sélectionnée quand le championnat est chargé
  useMemo(() => {
    if (championship && !selectedDate) {
      const date =
        championship.dates.find((d) => isToday(d.raw))?.raw ||
        championship.dates[championship.dates.length - 1]?.raw;
      if (date) setSelectedDate(date);
    }
  }, [championship, selectedDate]);

  const {
    liveMatches,
    upcomingMatches,
    finishedMatches,
    isLoading: matchesLoading,
  } = useMatchDay(champId as ChampionshipId, selectedDate);

  // Filtrer les matchs par événement si un filtre est actif
  const filteredLiveMatches = useMemo(
    () =>
      selectedEvent
        ? liveMatches.filter((m) => m.event === selectedEvent)
        : liveMatches,
    [liveMatches, selectedEvent]
  );

  const filteredUpcomingMatches = useMemo(
    () =>
      selectedEvent
        ? upcomingMatches.filter((m) => m.event === selectedEvent)
        : upcomingMatches,
    [upcomingMatches, selectedEvent]
  );

  const filteredFinishedMatches = useMemo(
    () =>
      selectedEvent
        ? finishedMatches.filter((m) => m.event === selectedEvent)
        : finishedMatches,
    [finishedMatches, selectedEvent]
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Chargement du championnat..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (!championship) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Championnat introuvable
          </h2>
        </div>
      </div>
    );
  }

  const groupedEvents = groupEventsByTypeAndFormat(championship.events);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête du championnat */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {championship.champDesc}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  championship.isFinished
                    ? "bg-gray-200 text-gray-700"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {championship.isFinished ? "Terminé" : "En cours"}
              </span>
            </div>

            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{championship.location}</span>
              </div>

              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
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
                <span>{championship.datesDesc}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">
              {championship.events.length}
            </div>
            <div className="text-sm text-gray-500">Épreuves</div>
          </div>
        </div>

        {/* Navigation des dates */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {championship.dates.map((date) => (
              <button
                key={date.raw}
                onClick={() => {
                  setSelectedDate(date.raw);
                  setSelectedEvent(null); // Réinitialiser le filtre d'événement
                }}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedDate === date.raw
                    ? "bg-primary-600 text-white shadow-md scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow"
                }`}
              >
                {date.forCal}
                {isToday(date.raw) && <span className="ml-2 text-xs">📍</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale - Matchs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtre actif */}
          {selectedEvent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-blue-900 font-medium">
                  Filtre actif : {selectedEvent}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Réinitialiser
              </button>
            </div>
          )}

          {/* Matchs en direct */}
          {filteredLiveMatches.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                En Direct ({filteredLiveMatches.length})
              </h2>
              <div className="space-y-4">
                {filteredLiveMatches.map((match) => (
                  <MatchCard key={match.matchId} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* Matchs à venir */}
          {filteredUpcomingMatches.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                À venir ({filteredUpcomingMatches.length})
              </h2>
              <div className="space-y-4">
                {filteredUpcomingMatches.map((match) => (
                  <MatchCard key={match.matchId} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* Matchs terminés */}
          {filteredFinishedMatches.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Terminés ({filteredFinishedMatches.length})
              </h2>
              <div className="space-y-4">
                {filteredFinishedMatches.map((match) => (
                  <MatchCard key={match.matchId} match={match} />
                ))}
              </div>
              {filteredFinishedMatches.length > 50 && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  {filteredFinishedMatches.length} matchs affichés
                </p>
              )}
            </section>
          )}

          {/* Aucun match */}
          {!matchesLoading &&
            filteredLiveMatches.length === 0 &&
            filteredUpcomingMatches.length === 0 &&
            filteredFinishedMatches.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">
                  {selectedEvent
                    ? `Aucun match pour ${selectedEvent} à cette date`
                    : "Aucun match pour cette date"}
                </p>
              </div>
            )}
        </div>

        {/* Sidebar - Événements */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Épreuves</h3>
              {selectedEvent && (
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Tout voir
                </button>
              )}
            </div>
            <div className="space-y-4">
              {Object.entries(groupedEvents).map(([key, events]) => {
                const [type, format] = key.split(".") as [
                  "M" | "W" | "X",
                  "SINGLES" | "DOUBLES"
                ];
                return (
                  <div key={key}>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      {getFullEventLabel(type, format)}
                    </h4>
                    <div className="space-y-1">
                      {events.map((event) => {
                        const eventKey = `${type}.${format}`;
                        const isSelected = selectedEvent === eventKey;
                        return (
                          <button
                            key={event.Key}
                            onClick={() =>
                              setSelectedEvent(isSelected ? null : eventKey)
                            }
                            className={`w-full text-left text-sm pl-3 py-2 rounded border-l-2 transition-all ${
                              isSelected
                                ? "border-primary-500 bg-primary-50 text-primary-900 font-medium"
                                : "border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-gray-50"
                            }`}
                          >
                            {event.Desc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
