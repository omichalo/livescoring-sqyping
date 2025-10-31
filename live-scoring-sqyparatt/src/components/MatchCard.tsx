/**
 * Carte d'affichage d'un match
 */

"use client";

import type { Match } from "@/lib/ittf";
import {
  getMatchStatusLabel,
  getMatchStatusColor,
  getMatchWinner,
  formatAllGameScores,
  isMatchLive,
} from "@/lib/ittf";

interface MatchCardProps {
  match: Match;
  showTable?: boolean;
  showPhase?: boolean;
  className?: string;
}

export function MatchCard({
  match,
  showTable = true,
  showPhase = true,
  className = "",
}: MatchCardProps) {
  const { team1, team2, status, table, scheduledTime } = match;

  const statusColor = getMatchStatusColor(status);
  const statusLabel = getMatchStatusLabel(status);
  const winner = getMatchWinner(team1.score, team2.score);
  const gameScores = formatAllGameScores(team1.games, team2.games);
  const isLive = isMatchLive(status);

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        isLive ? "ring-2 ring-red-500" : ""
      } ${className}`}
    >
      {/* En-tête avec statut */}
      <div
        className={`px-4 py-2 flex items-center justify-between bg-${statusColor}-100`}
      >
        <div className="flex items-center space-x-2">
          {isLive && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
          <span className={`text-sm font-semibold text-${statusColor}-800`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-sm text-gray-600">
          {showTable && table && (
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <rect
                  x="3"
                  y="4"
                  width="14"
                  height="12"
                  rx="1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {table}
            </span>
          )}
          {scheduledTime && (
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6l4 2"
                />
              </svg>
              {scheduledTime}
            </span>
          )}
        </div>
      </div>

      {/* Corps du match */}
      <div className="p-4">
        {/* Équipe 1 */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg mb-2 ${
            winner === 1 ? "bg-green-50 ring-2 ring-green-500" : "bg-gray-50"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {team1.countries?.[0] && (
                <span className="text-lg">{team1.countries[0]}</span>
              )}
              <div>
                {team1.names.map((name, idx) => (
                  <div
                    key={idx}
                    className={`font-semibold ${
                      winner === 1 ? "text-green-900" : "text-gray-900"
                    }`}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {team1.score !== undefined && (
            <div
              className={`text-3xl font-bold ${
                winner === 1 ? "text-green-600" : "text-gray-500"
              }`}
            >
              {team1.score}
            </div>
          )}
        </div>

        {/* Équipe 2 */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg ${
            winner === 2 ? "bg-green-50 ring-2 ring-green-500" : "bg-gray-50"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {team2.countries?.[0] && (
                <span className="text-lg">{team2.countries[0]}</span>
              )}
              <div>
                {team2.names.map((name, idx) => (
                  <div
                    key={idx}
                    className={`font-semibold ${
                      winner === 2 ? "text-green-900" : "text-gray-900"
                    }`}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {team2.score !== undefined && (
            <div
              className={`text-3xl font-bold ${
                winner === 2 ? "text-green-600" : "text-gray-500"
              }`}
            >
              {team2.score}
            </div>
          )}
        </div>

        {/* Scores des sets */}
        {gameScores.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <span className="font-semibold">Sets:</span>
              {gameScores.map((score, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 rounded font-mono"
                >
                  {score}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Phase (optionnel) */}
        {showPhase && match.phase && (
          <div className="mt-3 text-center text-xs text-gray-500">
            {match.phase}
          </div>
        )}
      </div>
    </div>
  );
}


