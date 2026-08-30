/**
 * Composant pour afficher un match dans la liste avec le design demandé
 */

"use client";

import type { LiveScoringMatch } from "@/lib/ittf/types";

interface MatchListItemProps {
  match: LiveScoringMatch;
  onSelect: (match: LiveScoringMatch) => void;
  disabled?: boolean; // Nouvelle prop pour désactiver le bouton
  isActiveMatch?: boolean; // Indique si c'est le match en cours
  mode?: "tv" | "ittf"; // Mode pour déterminer l'affichage des boutons
}

export function MatchListItem({
  match,
  onSelect,
  disabled = false,
  isActiveMatch = false,
  mode = "tv",
}: MatchListItemProps) {
  // Fonction pour construire l'URL du drapeau
  const getFlagUrl = (countryCode: string) => {
    if (!countryCode) return "/placeholder-flag.svg";
    return `https://results.ittf.com/ittf-web-results/img/flags-v2/${countryCode}.png`;
  };

  // Fonction pour formater l'heure
  const formatTime = (time: string) => {
    if (!time) return "TBD";
    // Si l'heure est déjà au format HH:MM, la retourner
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }
    // Sinon, essayer d'extraire l'heure
    const timeMatch = time.match(/(\d{2}:\d{2})/);
    if (timeMatch) {
      return timeMatch[1];
    }
    return time;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Barre supérieure avec gradient bleu */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-3 relative">
        <div className="flex items-center justify-between">
          {/* Joueur 1 - Plus d'espace avec marge réduite */}
          <div className="flex items-center space-x-2 flex-1 min-w-0 pr-4">
            <img
              src={getFlagUrl(match.team1.countries[0])}
              alt={`Drapeau ${match.team1.countries[0]}`}
              className="w-8 h-5 rounded-sm object-contain flex-shrink-0"
              style={{ imageRendering: "high-quality" as any }}
              onError={(e) => {
                // Fallback si le drapeau n'existe pas
                e.currentTarget.src = "/placeholder-flag.svg";
              }}
            />
            <span className="text-white font-medium text-sm truncate">
              {match.team1.names[0]}
            </span>
          </div>

          {/* Heure au centre - positionnement absolu avec centrage optimal */}
          <div className="absolute left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full z-10">
            <span className="text-blue-600 font-semibold text-sm whitespace-nowrap">
              {formatTime(match.scheduledTime || "")}
            </span>
          </div>

          {/* Joueur 2 - Plus d'espace avec marge réduite */}
          <div className="flex items-center space-x-2 flex-1 min-w-0 pl-4 justify-end">
            <span className="text-white font-medium text-sm truncate">
              {match.team2.names[0]}
            </span>
            <img
              src={getFlagUrl(match.team2.countries[0])}
              alt={`Drapeau ${match.team2.countries[0]}`}
              className="w-8 h-5 rounded-sm object-contain flex-shrink-0"
              style={{ imageRendering: "high-quality" as any }}
              onError={(e) => {
                // Fallback si le drapeau n'existe pas
                e.currentTarget.src = "/placeholder-flag.svg";
              }}
            />
          </div>
        </div>
      </div>

      {/* Barre inférieure avec description et bouton */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-2 py-3">
        <div className="flex items-center justify-between">
          {/* Description du match */}
          <div className="flex-1">
            <span className="text-blue-800 font-medium text-sm">
              {match.matchDesc || match.Desc || match.phase || "Match"}
            </span>
          </div>

          {/* Bouton Aller - caché en mode TV si désactivé */}
          {!(mode === "tv" && disabled) && (
            <button
              onClick={() => !disabled && onSelect(match)}
              disabled={disabled}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                disabled
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : isActiveMatch
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {disabled
                ? "Indisponible"
                : isActiveMatch
                ? "Continuer"
                : "Aller"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
