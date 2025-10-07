import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

export const OverlaySportPage: React.FC = () => {
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
      {/* Design 4 - Style Sportif */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[100]} 100%)`,
          borderRadius: 4,
          boxShadow: theme.shadows[6],
          overflow: "hidden",
          width: { xs: 340, md: 420 },
          border: `4px solid ${theme.palette.primary.main}`,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.primary.main} 100%)`,
          },
        }}
      >
        {/* Header sportif */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.primary.contrastText,
            px: 3,
            py: 1.5,
            textAlign: "center",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -1,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: `10px solid ${theme.palette.primary.dark}`,
            },
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 1 }}>
            SQY PING
          </Typography>
        </Box>

        {/* Contenu sportif */}
        <Box sx={{ p: 2.5 }}>
          {/* Joueur 1 - Style sportif */}
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
              color: theme.palette.primary.contrastText,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 60,
                height: 60,
                background: `radial-gradient(circle, ${theme.palette.primary.dark} 0%, transparent 70%)`,
                opacity: 0.3,
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
              <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                {match.player1.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    minWidth: 40,
                    textAlign: "center",
                    border: `2px solid ${theme.palette.secondary.dark}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{ fontSize: "0.8rem" }}
                  >
                    SETS
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>
                    {setsWon.player1}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.primary.main,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    minWidth: 50,
                    textAlign: "center",
                    border: `3px solid ${theme.palette.primary.dark}`,
                    boxShadow: theme.shadows[2],
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{ fontSize: "0.8rem" }}
                  >
                    POINTS
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>
                    {currentSet.player1}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* VS Separator sportif */}
          <Box sx={{ textAlign: "center", my: 1.5 }}>
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                color: theme.palette.text.secondary,
                textShadow: `1px 1px 2px ${theme.palette.grey[300]}`,
                letterSpacing: 3,
              }}
            >
              VS
            </Typography>
          </Box>

          {/* Joueur 2 - Style sportif */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
              color: theme.palette.secondary.contrastText,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 60,
                height: 60,
                background: `radial-gradient(circle, ${theme.palette.secondary.dark} 0%, transparent 70%)`,
                opacity: 0.3,
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
              <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                {match.player2.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    minWidth: 40,
                    textAlign: "center",
                    border: `2px solid ${theme.palette.primary.dark}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{ fontSize: "0.8rem" }}
                  >
                    SETS
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>
                    {setsWon.player2}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.secondary.main,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    minWidth: 50,
                    textAlign: "center",
                    border: `3px solid ${theme.palette.secondary.dark}`,
                    boxShadow: theme.shadows[2],
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{ fontSize: "0.8rem" }}
                  >
                    POINTS
                  </Typography>
                  <Typography variant="h4" fontWeight={900}>
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
