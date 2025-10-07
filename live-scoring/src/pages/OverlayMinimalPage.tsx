import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

export const OverlayMinimalPage: React.FC = () => {
  const { table } = useParams<{ table: string }>();
  const theme = useTheme();
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!table) return;

    const matchRef = doc(db, "matches", table);
    const unsubscribe = onSnapshot(matchRef, (doc) => {
      if (doc.exists()) {
        setMatch(doc.data() as Match);
      }
    });

    return () => unsubscribe();
  }, [table]);

  if (!match) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        bgcolor="transparent"
        sx={{ zIndex: 9999 }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          sx={{
            background: "rgba(0,0,0,0.8)",
            color: "white",
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography>Chargement du match pour la table {table}...</Typography>
        </Box>
      </Box>
    );
  }

  const setsWon = match.setsWon ?? { player1: 0, player2: 0 };
  const currentSet = match.score?.[match.score.length - 1] ?? {
    player1: 0,
    player2: 0,
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      bgcolor="transparent"
      sx={{ zIndex: 9999 }}
      display="flex"
      alignItems="flex-end"
      justifyContent="flex-start"
      p={2}
    >
      {/* Design 3 - Style Minimaliste */}
      <Box
        sx={{
          background: theme.palette.background.paper,
          borderRadius: 1,
          boxShadow: theme.shadows[2],
          overflow: "hidden",
          width: { xs: 280, md: 320 },
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header minimal */}
        <Box
          sx={{
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            px: 2,
            py: 0.5,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            SQY PING
          </Typography>
        </Box>

        {/* Contenu minimal */}
        <Box sx={{ p: 1.5 }}>
          {/* Joueur 1 - Ligne simple */}
          <Box
            sx={{
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="body1"
              fontWeight={500}
              sx={{ color: theme.palette.text.primary }}
            >
              {match.player1.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                {setsWon.player1}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: theme.palette.primary.main }}
              >
                {currentSet.player1}
              </Typography>
            </Box>
          </Box>

          {/* Joueur 2 - Ligne simple */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1,
            }}
          >
            <Typography
              variant="body1"
              fontWeight={500}
              sx={{ color: theme.palette.text.primary }}
            >
              {match.player2.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                {setsWon.player2}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: theme.palette.secondary.main }}
              >
                {currentSet.player2}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
