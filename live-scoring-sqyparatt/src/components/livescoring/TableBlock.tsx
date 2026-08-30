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

function IttfTableCard({ table }: { table: number }) {
  const [cardHeight, setCardHeight] = useState<string>("450px");

  useEffect(() => {
    void getIframeHeight().then((height) => {
      const heightValue = parseInt(height.replace("px", ""), 10);
      const newCardHeight = `${heightValue + 50}px`;
      setCardHeight((prev) => (prev === newCardHeight ? prev : newCardHeight));
      console.log("📏 Hauteur Card calculée:", {
        iframeHeight: height,
        cardHeight: newCardHeight,
      });
    });
  }, []);

  return (
    <Card sx={{ height: cardHeight, display: "flex", flexDirection: "column" }}>
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

function TvTableCard({
  table,
  date,
  height,
}: {
  table: number;
  date: string;
  height?: { xs: string; sm: string; md: string; lg: string };
}) {
  const [selectedMatch, setSelectedMatch] = useState<LiveScoringMatch | null>(
    null
  );
  const { currentEncounter } = useCurrentEncounter();
  const { matches, isLoading } = useLiveScoringMatches(
    table,
    date,
    currentEncounter?.id
  );
  const { hasActiveMatch } = useTableStatus(table, date, currentEncounter?.id);

  const relevantMatches = matches;

  const handleMatchSelect = (match: LiveScoringMatch) => {
    if (match.firestoreStatus === "inProgress") {
      setSelectedMatch(match);
      return;
    }

    if (hasActiveMatch) {
      console.warn(
        `⚠️ Impossible de lancer le match: un match est déjà en cours sur la table ${table}`
      );
      return;
    }

    setSelectedMatch(match);
  };

  return (
    <Card
      sx={{
        height: height || "550px",
        display: "flex",
        flexDirection: "column",
      }}
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
            {selectedMatch
              ? "Scoring en cours"
              : hasActiveMatch
                ? "Match en cours (autre utilisateur)"
                : `${relevantMatches.length} match(s)`}
          </Typography>
        }
      />

      <CardContent
        sx={{
          flex: 1,
          p: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          minHeight: 0,
        }}
      >
        {selectedMatch ? (
          <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            <MatchScoringWrapper
              liveScoringMatch={selectedMatch}
              onClose={() => setSelectedMatch(null)}
            />
          </Box>
        ) : (
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
                  height: "calc(100% - 32px)",
                  overflowY: "auto",
                  minHeight: "200px",
                  maxHeight: "500px",
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
                      mode="tv"
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
  );
}

export function TableBlock({ table, date, mode, height }: TableBlockProps) {
  if (mode === "ittf") {
    return <IttfTableCard table={table} />;
  }

  return <TvTableCard table={table} date={date} height={height} />;
}
