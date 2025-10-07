import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

export const OverlayModernPage: React.FC = () => {
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
      {/* Design 2 - Style Moderne */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          borderRadius: 3,
          boxShadow: theme.shadows[8],
          overflow: "hidden",
          width: { xs: 600, md: 700 },
          height: { xs: 140, md: 160 },
          border: `2px solid ${theme.palette.primary.main}`,
          position: "relative",
        }}
      >
        {/* Header avec logo */}
        <Box
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.primary.contrastText,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: theme.palette.background.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src="/sqyping.png"
              alt="Logo SQY Ping"
              style={{ width: "80%", height: "80%", objectFit: "contain" }}
            />
          </Box>
        </Box>

        {/* Contenu moderne */}
        <Box sx={{ p: 2 }}>
          {/* Joueur 1 - Style carte */}
          <Box
            sx={{
              mb: 1,
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
              color: theme.palette.primary.contrastText,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ flexGrow: 1, fontSize: "1.1rem" }}
            >
              {match.player1.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box
                sx={{
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  minWidth: 35,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ fontSize: "0.9rem" }}
                >
                  {setsWon.player1}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.primary.main,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  minWidth: 35,
                  textAlign: "center",
                  border: `2px solid ${theme.palette.primary.dark}`,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontSize: "1.2rem" }}
                >
                  {currentSet.player1}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Joueur 2 - Style carte */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
              color: theme.palette.secondary.contrastText,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ flexGrow: 1, fontSize: "1.1rem" }}
            >
              {match.player2.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  minWidth: 35,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ fontSize: "0.9rem" }}
                >
                  {setsWon.player2}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.secondary.main,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  minWidth: 35,
                  textAlign: "center",
                  border: `2px solid ${theme.palette.secondary.dark}`,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ fontSize: "1.2rem" }}
                >
                  {currentSet.player2}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
