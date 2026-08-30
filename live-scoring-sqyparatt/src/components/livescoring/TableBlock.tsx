/**
 * Bloc de gestion d'une table (liste de matchs ou scoring)
 */

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import type { ChampionshipId, LiveScoringMatch } from "@/lib/ittf/types";
import {
  useLiveScoringMatches,
  useTableStatus,
  useCurrentEncounter,
} from "@/hooks";
import { MatchListItem } from "./MatchListItem";
import { MatchScoringWrapper } from "./MatchScoringWrapper";
import { FFTTIframe } from "./FFTTIframe";
import { getIframeHeight } from "@/lib/firebase-remote-config";

interface TableBlockProps {
  champId: ChampionshipId;
  table: number;
  date: string;
  mode: "tv" | "ittf";
  height?: { xs: string; sm: string; md: string; lg: string };
}

export function TableBlock({ table, date, mode, height }: TableBlockProps) {
  const [selectedMatch, setSelectedMatch] = useState<LiveScoringMatch | null>(
    null
  );
  const [cardHeight, setCardHeight] = useState<string>("450px");
  const { currentEncounter } = useCurrentEncounter();
  const { matches, isLoading } = useLiveScoringMatches(
    table,
    date,
    currentEncounter?.id
  );
  const { hasActiveMatch } = useTableStatus(table, date, currentEncounter?.id);

  // Charger la hauteur de l'iframe pour le mode ITTF
  useEffect(() => {
    if (mode === "ittf") {
      getIframeHeight().then((height) => {
        // Ajouter ~50px pour le header du Card
        const heightValue = parseInt(height.replace("px", ""));
        const newCardHeight = `${heightValue + 50}px`;
        setCardHeight(newCardHeight);
        console.log("📏 Hauteur Card calculée:", {
          iframeHeight: height,
          cardHeight: newCardHeight,
        });
      });
    }
  }, [mode]);

  // Tous les matchs ITTF sont considérés comme disponibles pour le live scoring
  // Le cycle de vie réel est géré par notre système de scoring
  const relevantMatches = matches;

  // Fonction pour gérer la sélection d'un match avec vérification
  const handleMatchSelect = (match: LiveScoringMatch) => {
    // Si c'est le match en cours (statut "inProgress"), permettre de continuer
    if (match.firestoreStatus === "inProgress") {
      setSelectedMatch(match);
      return;
    }

    // Si un match est en cours, empêcher le lancement d'autres matchs
    if (hasActiveMatch) {
      console.warn(
        `⚠️ Impossible de lancer le match: un match est déjà en cours sur la table ${table}`
      );
      return;
    }

    setSelectedMatch(match);
  };

  // Mode ITTF : afficher uniquement l'iframe
  if (mode === "ittf") {
    return (
      <Card
        sx={{ height: cardHeight, display: "flex", flexDirection: "column" }}
      >
        <CardHeader
          sx={{ bgcolor: "primary.main", color: "white" }}
          title={
            <Typography variant="h6" fontWeight="bold">
              Table {table}
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Mode ITTF (Iframe)
            </Typography>
          }
        />
        <CardContent sx={{ flex: 1, p: 0 }}>
          <FFTTIframe tableNumber={table} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  // Mode TV : liste de matchs ou composant de scoring
  return (
    <>
      <Card
        sx={{
          height: height || "550px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* En-tête */}
        <CardHeader
          sx={{ bgcolor: "primary.main", color: "white" }}
          title={
            <Typography variant="h6" fontWeight="bold">
              Table {table}
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {selectedMatch
                ? "Scoring en cours"
                : hasActiveMatch
                ? "Match en cours (autre utilisateur)"
                : `${relevantMatches.length} match(s)`}
            </Typography>
          }
        />

        {/* Contenu */}
        <CardContent
          sx={{
            flex: 1,
            p: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            minHeight: 0, // Important pour que flex: 1 fonctionne correctement
          }}
        >
          {selectedMatch ? (
            // Mode scoring
            <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <MatchScoringWrapper
                liveScoringMatch={selectedMatch}
                onClose={() => setSelectedMatch(null)}
              />
            </Box>
          ) : (
            // Mode liste de matchs
            <Box sx={{ flex: 1 }}>
              {isLoading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ height: "calc(100% - 32px)" }}
                >
                  <Box textAlign="center">
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography color="text.secondary">
                      Chargement des matchs...
                    </Typography>
                  </Box>
                </Box>
              ) : relevantMatches.length > 0 ? (
                <Box
                  sx={{
                    height: "calc(100% - 32px)", // S'adapte à la hauteur disponible
                    overflowY: "auto",
                    minHeight: "200px", // Hauteur minimale pour assurer le scroll
                    maxHeight: "500px", // Hauteur maximale pour éviter que la carte devienne trop grande
                  }}
                >
                  {relevantMatches.map((match) => (
                    <Box key={match.matchId} sx={{ mb: 1.5 }}>
                      <MatchListItem
                        match={match}
                        onSelect={handleMatchSelect}
                        disabled={
                          hasActiveMatch &&
                          match.firestoreStatus !== "inProgress"
                        }
                        isActiveMatch={match.firestoreStatus === "inProgress"}
                        mode={mode}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box
                  textAlign="center"
                  sx={{ height: "calc(100% - 32px)" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography color="text.secondary">
                    Aucun match en cours ou à venir pour cette table
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}
