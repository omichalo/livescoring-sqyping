import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";
import { Box, Typography, useTheme } from "@mui/material";

export const LiveOverlayPage: React.FC = () => {
  const { table } = useParams();
  const theme = useTheme();
  const [match, setMatch] = useState<Match | null>(null);
  const [nextMatches, setNextMatches] = useState<Match[]>([]);

  useEffect(() => {
    const unsubLive = onSnapshot(
      query(
        collection(db, "matches"),
        where("table", "==", Number(table)),
        where("status", "==", "inProgress")
      ),
      (snap) => {
        const live = snap.docs.map((doc) => ({
          ...(doc.data() as Match),
          id: doc.id,
        }));
        setMatch(live[0] ?? null);
      }
    );

    const unsubNext = onSnapshot(
      query(collection(db, "matches"), where("status", "==", "waiting")),
      (snap) => {
        const upcoming = snap.docs.map((doc) => {
          const data = doc.data() as Omit<Match, "id">;
          return { ...data, id: doc.id };
        });
        const sorted = upcoming.sort((a, b) => {
          const aTime = "startTime" in a ? (a as Match).startTime : 0;
          const bTime = "startTime" in b ? (b as Match).startTime : 0;
          return aTime - bTime;
        });
        setNextMatches(sorted.slice(0, 2));
      }
    );

    return () => {
      unsubLive();
      unsubNext();
    };
  }, [table]);

  if (!match) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        // px={1.5}
        // py={1}
        bgcolor="transparent"
        sx={{ zIndex: 9999, borderRadius: 2 }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          bgcolor={theme.palette.background.paper}
          width={660}
          minHeight={140}
          sx={{ transition: "width 0.3s ease", borderRadius: 4, height: 140 }}
          borderRadius={4}
          boxShadow={theme.shadows[8]}
          overflow="hidden"
          px={3}
          py={2}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            color={theme.palette.primary.main}
            mb={1}
          >
            Prochains matchs à lancer
          </Typography>
          {nextMatches.length > 0 ? (
            nextMatches.map((m) => (
              <Typography
                key={m.id}
                variant="h5"
                fontWeight={700}
                color={theme.palette.text.primary}
                sx={{ lineHeight: 1.3, width: "100%", textAlign: "center" }}
              >
                {m.player1.name} vs {m.player2.name}
              </Typography>
            ))
          ) : (
            <Typography variant="h5" color="text.secondary">
              Aucun match programmé
            </Typography>
          )}
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
      {/* Container compact pour incrustation */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          borderRadius: 3,
          boxShadow: theme.shadows[8],
          overflow: "hidden",
          width: { xs: 320, md: 400 },
          border: `2px solid ${theme.palette.primary.main}`,
          position: "relative",
        }}
      >
        {/* Header compact - Logo uniquement */}
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

        {/* Contenu compact */}
        <Box sx={{ p: 2 }}>
          {/* Joueur 1 - Ligne compacte */}
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
                  sx={{
                    fontSize: "1.2rem",
                    animation: "pulseScore 0.4s ease",
                  }}
                >
                  {currentSet.player1}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Joueur 2 - Ligne compacte */}
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

      <style>
        {`
        @keyframes pulseScore {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}
      </style>
    </Box>
  );
};
