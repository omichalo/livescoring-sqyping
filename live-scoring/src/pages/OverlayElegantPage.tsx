import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

export const OverlayElegantPage: React.FC = () => {
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
      {/* Design 5 - Style Élégant */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          borderRadius: 6,
          boxShadow: theme.shadows[12],
          overflow: "hidden",
          width: { xs: 360, md: 450 },
          border: `1px solid ${theme.palette.divider}`,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.primary.main} 100%)`,
          },
        }}
      >
        {/* Header élégant */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.primary.contrastText,
            px: 3,
            py: 2,
            textAlign: "center",
            position: "relative",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: theme.palette.background.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              mx: "auto",
              mb: 1,
            }}
          >
            <img
              src="/sqyping.png"
              alt="Logo SQY Ping"
              style={{ width: "80%", height: "80%", objectFit: "contain" }}
            />
          </Box>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ letterSpacing: 0.5, opacity: 0.95 }}
          >
            SQY PING
          </Typography>
        </Box>

        {/* Contenu élégant */}
        <Box sx={{ p: 3 }}>
          {/* Joueur 1 - Style élégant */}
          <Box
            sx={{
              mb: 2,
              p: 2.5,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
              color: theme.palette.primary.contrastText,
              position: "relative",
              overflow: "hidden",
              boxShadow: theme.shadows[4],
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: `radial-gradient(circle, ${theme.palette.primary.dark} 0%, transparent 70%)`,
                opacity: 0.1,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ flexGrow: 1, fontSize: "1.2rem" }}
              >
                {match.player1.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    px: 2,
                    py: 1,
                    borderRadius: 3,
                    minWidth: 45,
                    textAlign: "center",
                    boxShadow: theme.shadows[2],
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ fontSize: "0.7rem", opacity: 0.8 }}
                  >
                    SETS
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {setsWon.player1}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.primary.main,
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 3,
                    minWidth: 55,
                    textAlign: "center",
                    border: `2px solid ${theme.palette.primary.dark}`,
                    boxShadow: theme.shadows[3],
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ fontSize: "0.7rem", opacity: 0.8 }}
                  >
                    POINTS
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {currentSet.player1}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* VS Separator élégant */}
          <Box sx={{ textAlign: "center", my: 2 }}>
            <Typography
              variant="h4"
              fontWeight={300}
              sx={{
                color: theme.palette.text.secondary,
                textShadow: `1px 1px 2px ${theme.palette.grey[200]}`,
                letterSpacing: 4,
                opacity: 0.7,
              }}
            >
              VS
            </Typography>
          </Box>

          {/* Joueur 2 - Style élégant */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
              color: theme.palette.secondary.contrastText,
              position: "relative",
              overflow: "hidden",
              boxShadow: theme.shadows[4],
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: `radial-gradient(circle, ${theme.palette.secondary.dark} 0%, transparent 70%)`,
                opacity: 0.1,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ flexGrow: 1, fontSize: "1.2rem" }}
              >
                {match.player2.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    px: 2,
                    py: 1,
                    borderRadius: 3,
                    minWidth: 45,
                    textAlign: "center",
                    boxShadow: theme.shadows[2],
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ fontSize: "0.7rem", opacity: 0.8 }}
                  >
                    SETS
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {setsWon.player2}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.secondary.main,
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 3,
                    minWidth: 55,
                    textAlign: "center",
                    border: `2px solid ${theme.palette.secondary.dark}`,
                    boxShadow: theme.shadows[3],
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ fontSize: "0.7rem", opacity: 0.8 }}
                  >
                    POINTS
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {currentSet.player2}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
