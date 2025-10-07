import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

export const OverlayClassicPage: React.FC = () => {
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
      {/* Design 1 - Style Classique */}
      <Box
        sx={{
          background: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[4],
          overflow: "hidden",
          width: { xs: 500, md: 600 },
          height: { xs: 120, md: 140 },
          border: `3px solid ${theme.palette.primary.main}`,
        }}
      >
        {/* Header horizontal */}
        <Box
          sx={{
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            px: 3,
            py: 1,
            textAlign: "center",
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            SQY PING
          </Typography>
        </Box>

        {/* Contenu horizontal */}
        <Box
          sx={{ p: 2, height: "calc(100% - 40px)", display: "flex", gap: 2 }}
        >
          {/* Joueur 1 */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              background: theme.palette.primary.light,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h5"
              fontWeight={600}
              sx={{ color: theme.palette.primary.contrastText }}
            >
              {match.player1.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    opacity: 0.8,
                  }}
                >
                  SETS
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: theme.palette.primary.contrastText }}
                >
                  {setsWon.player1}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    opacity: 0.8,
                  }}
                >
                  POINTS
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ color: theme.palette.primary.contrastText }}
                >
                  {currentSet.player1}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* VS Separator */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 60,
            }}
          >
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                color: theme.palette.text.secondary,
                textShadow: `2px 2px 4px ${theme.palette.grey[300]}`,
                letterSpacing: 2,
              }}
            >
              VS
            </Typography>
          </Box>

          {/* Joueur 2 */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              background: theme.palette.secondary.light,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: theme.palette.secondary.contrastText,
                    opacity: 0.8,
                  }}
                >
                  SETS
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{ color: theme.palette.secondary.contrastText }}
                >
                  {setsWon.player2}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: theme.palette.secondary.contrastText,
                    opacity: 0.8,
                  }}
                >
                  POINTS
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ color: theme.palette.secondary.contrastText }}
                >
                  {currentSet.player2}
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="h5"
              fontWeight={600}
              sx={{ color: theme.palette.secondary.contrastText }}
            >
              {match.player2.name}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
