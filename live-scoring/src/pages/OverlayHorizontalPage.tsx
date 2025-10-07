import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";

export const OverlayHorizontalPage: React.FC = () => {
  const { table, design } = useParams<{ table: string; design: string }>();
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

  const renderClassic = () => (
    <Box
      sx={{
        background: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[4],
        overflow: "hidden",
        width: { xs: 700, md: 800 },
        height: { xs: 160, md: 180 },
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

      {/* Contenu horizontal - Layout vertical pour les noms */}
      <Box
        sx={{
          p: 2,
          height: "calc(100% - 40px)",
          display: "flex",
          gap: 2,
          alignItems: "stretch",
        }}
      >
        {/* Joueur 1 */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            background: theme.palette.primary.light,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Nom du joueur 1 */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={600}
              sx={{
                color: theme.palette.primary.contrastText,
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player1.name}
            </Typography>
          </Box>

          {/* Scores du joueur 1 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
                variant="h2"
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
            minWidth: 80,
          }}
        >
          <Typography
            variant="h2"
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
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Nom du joueur 2 */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={600}
              sx={{
                color: theme.palette.secondary.contrastText,
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player2.name}
            </Typography>
          </Box>

          {/* Scores du joueur 2 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
                variant="h2"
                fontWeight={700}
                sx={{ color: theme.palette.secondary.contrastText }}
              >
                {currentSet.player2}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderModern = () => (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        borderRadius: 3,
        boxShadow: theme.shadows[8],
        overflow: "hidden",
        width: { xs: 750, md: 850 },
        height: { xs: 160, md: 180 },
        border: `2px solid ${theme.palette.primary.main}`,
        position: "relative",
      }}
    >
      {/* Header horizontal avec logo */}
      <Box
        sx={{
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.primary.contrastText,
          px: 3,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 50,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: theme.palette.background.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            mr: 2,
          }}
        >
          <img
            src="/sqyping.png"
            alt="Logo SQY Ping"
            style={{ width: "80%", height: "80%", objectFit: "contain" }}
          />
        </Box>
        <Typography variant="h5" fontWeight={700}>
          SQY PING
        </Typography>
      </Box>

      {/* Contenu horizontal moderne - Layout vertical pour les noms */}
      <Box
        sx={{
          p: 3,
          height: "calc(100% - 50px)",
          display: "flex",
          gap: 3,
          alignItems: "stretch",
        }}
      >
        {/* Joueur 1 */}
        <Box
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.primary.contrastText,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
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
          {/* Nom du joueur 1 */}
          <Box sx={{ position: "relative", zIndex: 1, mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={600}
              sx={{
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player1.name}
            </Typography>
          </Box>

          {/* Scores du joueur 1 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                px: 2,
                py: 1,
                borderRadius: 2,
                minWidth: 60,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ fontSize: "0.8rem", opacity: 0.8 }}
              >
                SETS
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {setsWon.player1}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                minWidth: 70,
                textAlign: "center",
                border: `2px solid ${theme.palette.primary.dark}`,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ fontSize: "0.8rem", opacity: 0.8 }}
              >
                POINTS
              </Typography>
              <Typography variant="h2" fontWeight={700}>
                {currentSet.player1}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* VS Separator moderne */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 100,
          }}
        >
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              color: theme.palette.text.secondary,
              textShadow: `2px 2px 4px ${theme.palette.grey[300]}`,
              letterSpacing: 3,
            }}
          >
            VS
          </Typography>
        </Box>

        {/* Joueur 2 */}
        <Box
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            color: theme.palette.secondary.contrastText,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
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
          {/* Nom du joueur 2 */}
          <Box sx={{ position: "relative", zIndex: 1, mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={600}
              sx={{
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player2.name}
            </Typography>
          </Box>

          {/* Scores du joueur 2 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                px: 2,
                py: 1,
                borderRadius: 2,
                minWidth: 60,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ fontSize: "0.8rem", opacity: 0.8 }}
              >
                SETS
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {setsWon.player2}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.secondary.main,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                minWidth: 70,
                textAlign: "center",
                border: `2px solid ${theme.palette.secondary.dark}`,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ fontSize: "0.8rem", opacity: 0.8 }}
              >
                POINTS
              </Typography>
              <Typography variant="h2" fontWeight={700}>
                {currentSet.player2}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderMinimal = () => (
    <Box
      sx={{
        background: theme.palette.background.paper,
        borderRadius: 1,
        boxShadow: theme.shadows[2],
        overflow: "hidden",
        width: { xs: 600, md: 700 },
        height: { xs: 140, md: 160 },
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header minimal horizontal */}
      <Box
        sx={{
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          px: 2,
          py: 0.5,
          textAlign: "center",
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          SQY PING
        </Typography>
      </Box>

      {/* Contenu minimal horizontal - Layout vertical pour les noms */}
      <Box
        sx={{
          p: 2,
          height: "calc(100% - 30px)",
          display: "flex",
          alignItems: "stretch",
          gap: 3,
        }}
      >
        {/* Joueur 1 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={500}
            sx={{
              color: theme.palette.text.primary,
              textAlign: "center",
              wordBreak: "break-word",
              lineHeight: 1.2,
            }}
          >
            {match.player1.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
            <Typography
              variant="h5"
              sx={{ color: theme.palette.text.secondary }}
            >
              {setsWon.player1}
            </Typography>
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{ color: theme.palette.primary.main }}
            >
              {currentSet.player1}
            </Typography>
          </Box>
        </Box>

        {/* VS Separator minimal */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 60,
          }}
        >
          <Typography
            variant="h2"
            fontWeight={300}
            sx={{
              color: theme.palette.text.secondary,
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
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={500}
            sx={{
              color: theme.palette.text.primary,
              textAlign: "center",
              wordBreak: "break-word",
              lineHeight: 1.2,
            }}
          >
            {match.player2.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
            <Typography
              variant="h5"
              sx={{ color: theme.palette.text.secondary }}
            >
              {setsWon.player2}
            </Typography>
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{ color: theme.palette.secondary.main }}
            >
              {currentSet.player2}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderSport = () => (
    <Box
      sx={{
        background: `linear-gradient(45deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[100]} 100%)`,
        borderRadius: 4,
        boxShadow: theme.shadows[6],
        overflow: "hidden",
        width: { xs: 800, md: 900 },
        height: { xs: 180, md: 200 },
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
      {/* Header sportif horizontal */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.primary.contrastText,
          px: 3,
          py: 1.5,
          textAlign: "center",
          position: "relative",
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 1 }}>
          SQY PING
        </Typography>
      </Box>

      {/* Contenu sportif horizontal - Layout vertical pour les noms */}
      <Box
        sx={{
          p: 3,
          height: "calc(100% - 50px)",
          display: "flex",
          gap: 4,
          alignItems: "stretch",
        }}
      >
        {/* Joueur 1 */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.primary.contrastText,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: 80,
              height: 80,
              background: `radial-gradient(circle, ${theme.palette.primary.dark} 0%, transparent 70%)`,
              opacity: 0.3,
            },
          }}
        >
          {/* Nom du joueur 1 */}
          <Box sx={{ position: "relative", zIndex: 1, mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player1.name}
            </Typography>
          </Box>

          {/* Scores du joueur 1 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                px: 2,
                py: 1,
                borderRadius: 2,
                minWidth: 60,
                textAlign: "center",
                border: `2px solid ${theme.palette.secondary.dark}`,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{ fontSize: "0.7rem" }}
              >
                SETS
              </Typography>
              <Typography variant="h4" fontWeight={900}>
                {setsWon.player1}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                minWidth: 80,
                textAlign: "center",
                border: `3px solid ${theme.palette.primary.dark}`,
                boxShadow: theme.shadows[2],
              }}
            >
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{ fontSize: "0.7rem" }}
              >
                POINTS
              </Typography>
              <Typography variant="h2" fontWeight={900}>
                {currentSet.player1}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* VS Separator sportif */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 120,
          }}
        >
          <Typography
            variant="h1"
            fontWeight={900}
            sx={{
              color: theme.palette.text.secondary,
              textShadow: `1px 1px 2px ${theme.palette.grey[300]}`,
              letterSpacing: 4,
            }}
          >
            VS
          </Typography>
        </Box>

        {/* Joueur 2 */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            color: theme.palette.secondary.contrastText,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: 80,
              height: 80,
              background: `radial-gradient(circle, ${theme.palette.secondary.dark} 0%, transparent 70%)`,
              opacity: 0.3,
            },
          }}
        >
          {/* Nom du joueur 2 */}
          <Box sx={{ position: "relative", zIndex: 1, mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player2.name}
            </Typography>
          </Box>

          {/* Scores du joueur 2 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                px: 2,
                py: 1,
                borderRadius: 2,
                minWidth: 60,
                textAlign: "center",
                border: `2px solid ${theme.palette.primary.dark}`,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{ fontSize: "0.7rem" }}
              >
                SETS
              </Typography>
              <Typography variant="h4" fontWeight={900}>
                {setsWon.player2}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.secondary.main,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                minWidth: 80,
                textAlign: "center",
                border: `3px solid ${theme.palette.secondary.dark}`,
                boxShadow: theme.shadows[2],
              }}
            >
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{ fontSize: "0.7rem" }}
              >
                POINTS
              </Typography>
              <Typography variant="h2" fontWeight={900}>
                {currentSet.player2}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderElegant = () => (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        borderRadius: 6,
        boxShadow: theme.shadows[12],
        overflow: "hidden",
        width: { xs: 900, md: 1000 },
        height: { xs: 200, md: 220 },
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
      {/* Header élégant horizontal */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.primary.contrastText,
          px: 4,
          py: 2,
          textAlign: "center",
          position: "relative",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
            mr: 2,
          }}
        >
          <img
            src="/sqyping.png"
            alt="Logo SQY Ping"
            style={{ width: "80%", height: "80%", objectFit: "contain" }}
          />
        </Box>
        <Typography
          variant="h4"
          fontWeight={600}
          sx={{ letterSpacing: 0.5, opacity: 0.95 }}
        >
          SQY PING
        </Typography>
      </Box>

      {/* Contenu élégant horizontal - Layout vertical pour les noms */}
      <Box
        sx={{
          p: 4,
          height: "calc(100% - 60px)",
          display: "flex",
          gap: 4,
          alignItems: "stretch",
        }}
      >
        {/* Joueur 1 */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.primary.contrastText,
            position: "relative",
            overflow: "hidden",
            boxShadow: theme.shadows[4],
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              background: `radial-gradient(circle, ${theme.palette.primary.dark} 0%, transparent 70%)`,
              opacity: 0.1,
            },
          }}
        >
          {/* Nom du joueur 1 */}
          <Box sx={{ position: "relative", zIndex: 1, mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={600}
              sx={{
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player1.name}
            </Typography>
          </Box>

          {/* Scores du joueur 1 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                px: 2,
                py: 1,
                borderRadius: 3,
                minWidth: 70,
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
              <Typography variant="h4" fontWeight={700}>
                {setsWon.player1}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                px: 3,
                py: 2,
                borderRadius: 3,
                minWidth: 90,
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
              <Typography variant="h1" fontWeight={700}>
                {currentSet.player1}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* VS Separator élégant */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 150,
          }}
        >
          <Typography
            variant="h1"
            fontWeight={300}
            sx={{
              color: theme.palette.text.secondary,
              textShadow: `1px 1px 2px ${theme.palette.grey[200]}`,
              letterSpacing: 6,
              opacity: 0.7,
            }}
          >
            VS
          </Typography>
        </Box>

        {/* Joueur 2 */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            color: theme.palette.secondary.contrastText,
            position: "relative",
            overflow: "hidden",
            boxShadow: theme.shadows[4],
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              background: `radial-gradient(circle, ${theme.palette.secondary.dark} 0%, transparent 70%)`,
              opacity: 0.1,
            },
          }}
        >
          {/* Nom du joueur 2 */}
          <Box sx={{ position: "relative", zIndex: 1, mb: 2 }}>
            <Typography
              variant="h4"
              fontWeight={600}
              sx={{
                textAlign: "center",
                wordBreak: "break-word",
                lineHeight: 1.2,
              }}
            >
              {match.player2.name}
            </Typography>
          </Box>

          {/* Scores du joueur 2 */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                px: 2,
                py: 1,
                borderRadius: 3,
                minWidth: 70,
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
              <Typography variant="h4" fontWeight={700}>
                {setsWon.player2}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                color: theme.palette.secondary.main,
                px: 3,
                py: 2,
                borderRadius: 3,
                minWidth: 90,
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
              <Typography variant="h1" fontWeight={700}>
                {currentSet.player2}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

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
      {design === "classic" && renderClassic()}
      {design === "modern" && renderModern()}
      {design === "minimal" && renderMinimal()}
      {design === "sport" && renderSport()}
      {design === "elegant" && renderElegant()}
    </Box>
  );
};
