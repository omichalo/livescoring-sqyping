/**
 * Bloc de gestion d'une table (liste de matchs ou scoring)
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import type { ChampionshipId, LiveScoringMatch } from "@/lib/ittf/types";
import { useLiveScoringMatches } from "@/hooks";
import { MatchListItem } from "./MatchListItem";
import { MatchScoringWrapper } from "./MatchScoringWrapper";
import { FFTTIframe } from "./FFTTIframe";

interface TableBlockProps {
  champId: ChampionshipId;
  table: number;
  date: string;
  mode: "tv" | "ittf";
}

export function TableBlock({ champId, table, date, mode }: TableBlockProps) {
  const [selectedMatch, setSelectedMatch] = useState<LiveScoringMatch | null>(
    null
  );
  const { matches, isLoading } = useLiveScoringMatches(table, date);

  // Tous les matchs ITTF sont considérés comme disponibles pour le live scoring
  // Le cycle de vie réel est géré par notre système de scoring
  const relevantMatches = matches;

  // Mode ITTF : afficher uniquement l'iframe
  if (mode === "ittf") {
    return (
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
              : `${relevantMatches.length} match(s)`}
          </Typography>
        }
      />

      {/* Contenu */}
      <CardContent sx={{ flex: 1, p: 2 }}>
        {selectedMatch ? (
          // Mode scoring
          <MatchScoringWrapper
            liveScoringMatch={selectedMatch}
            onClose={() => setSelectedMatch(null)}
          />
        ) : (
          // Mode liste de matchs
          <Box>
            {isLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={200}
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
                  maxHeight: "calc(3 * 200px + 2 * 12px)", // 3 matchs + espacement
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                {relevantMatches.map((match) => (
                  <Box key={match.matchId} sx={{ mb: 1.5 }}>
                    <MatchListItem match={match} onSelect={setSelectedMatch} />
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={6}>
                <Typography color="text.secondary">
                  Aucun match en cours ou à venir pour cette table
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
