import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { Match, Team } from "../types";

// Fonction pour tronquer un nom à partir de la première minuscule
const truncateAtFirstLowercase = (name: string, maxLength: number): string => {
  if (name.length <= maxLength) return name;

  // Trouver la première minuscule
  const firstLowercaseIndex = name.search(/[a-z]/);

  if (firstLowercaseIndex === -1) {
    // Pas de minuscule trouvée, tronquer normalement
    return name.substring(0, maxLength);
  }

  // Tronquer à partir de la première minuscule
  return name.substring(0, firstLowercaseIndex);
};

interface CustomLayout {
  showLogo?: boolean;
  showClubInfo?: boolean;
  showVictories?: boolean;
  showSets?: boolean;
  showCurrentPoints?: boolean;
}

interface OverlayDesignProps {
  designId: string;
  match: Match | null;
  teams?: Team[]; // Données des équipes
  upcomingMatches?: Match[]; // Prochains matchs en attente
  scale?: number; // Pour la démo (0.5) ou les pages individuelles (1)
  customLayout?: CustomLayout;
  hideLogo?: boolean; // Pour masquer le logo
}

export const OverlayDesign: React.FC<OverlayDesignProps> = ({
  designId,
  match,
  teams = [],
  upcomingMatches = [],
  scale = 1,
  customLayout,
  hideLogo = false,
}) => {
  const theme = useTheme();

  // S'assurer que les équipes sont toujours dans le même ordre (par champ 'order', puis par ID)
  const sortedTeams = [...teams].sort((a, b) => {
    const orderA = a?.order ?? 999;
    const orderB = b?.order ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const idA = a?.id || "";
    const idB = b?.id || "";
    return idA.localeCompare(idB);
  });
  const team1 = sortedTeams[0] || { name: "Équipe 1", matchesWon: 0 };
  const team2 = sortedTeams[1] || { name: "Équipe 2", matchesWon: 0 };

  // S'assurer que les joueurs sont dans le bon ordre par rapport aux équipes
  let orderedMatch = match;
  if (match && match.player1 && match.player2) {
    // Si le joueur1 n'appartient pas à la première équipe, inverser les joueurs
    if (match.player1.teamId !== team1.id) {
      orderedMatch = {
        ...match,
        player1: match.player2,
        player2: match.player1,
        setsWon: {
          player1: match.setsWon.player2,
          player2: match.setsWon.player1,
        },
        score: match.score.map((set) => ({
          player1: set.player2,
          player2: set.player1,
        })),
      };
    }
  }

  // Calculer les sets gagnés en excluant le set en cours
  const computeSetsWonForDisplay = (
    score: { player1: number; player2: number }[]
  ) => {
    const setsWon = { player1: 0, player2: 0 };

    // Compter seulement les sets terminés (exclure le dernier set s'il est en cours)
    const setsToCount = score.length > 1 ? score.slice(0, -1) : [];

    for (const { player1, player2 } of setsToCount) {
      if (player1 >= 11 || player2 >= 11) {
        if (Math.abs(player1 - player2) >= 2) {
          if (player1 > player2) setsWon.player1++;
          else if (player2 > player1) setsWon.player2++;
        }
      }
    }
    return setsWon;
  };

  const setsWon = orderedMatch?.score
    ? computeSetsWonForDisplay(orderedMatch.score)
    : { player1: 0, player2: 0 };
  const currentSet = orderedMatch?.score?.[orderedMatch.score.length - 1] ?? {
    player1: 0,
    player2: 0,
  };

  // Vérifier si le match est terminé (3 sets gagnés)
  // const isMatchFinished = setsWon.player1 >= 3 || setsWon.player2 >= 3;

  // Déterminer si on affiche un match en cours ou les prochains matchs
  const isMatchInProgress =
    orderedMatch && orderedMatch.status === "inProgress";
  const displayUpcomingMatches =
    !isMatchInProgress && upcomingMatches.length > 0;
  const displayNoMatches = !isMatchInProgress && upcomingMatches.length === 0;

  // Fonctions de style dynamiques
  const getDesignBorderRadius = (designId: string) => {
    const radiusMap: { [key: string]: number } = {
      sobre: 2,
      moderne: 3,
      minimaliste: 1,
      sportif: 4,
      elegant: 2,
      neon: 6,
      glassmorphism: 8,
      retro: 4,
      futuriste: 6,
      original: 12,
      corporate: 1,
      gaming: 6,
      vintage: 3,
      cyberpunk: 8,
      nature: 5,
      luxury: 4,
      minimal: 0,
      "neon-glow": 6,
      geometric: 2,
      "dark-mode": 3,
      gradient: 4,
      metallic: 2,
      holographic: 6,
      paper: 1,
      "neon-grid": 4,
    };
    return radiusMap[designId] || 2;
  };

  const getDesignShadow = (designId: string) => {
    const shadowMap: { [key: string]: string } = {
      sobre: theme.shadows[2],
      moderne: theme.shadows[4],
      minimaliste: theme.shadows[1],
      sportif: theme.shadows[3],
      elegant: theme.shadows[4],
      neon: theme.shadows[3],
      glassmorphism: theme.shadows[4],
      retro: theme.shadows[3],
      futuriste: theme.shadows[4],
      original: theme.shadows[6],
      corporate: theme.shadows[1],
      gaming: theme.shadows[5],
      vintage: theme.shadows[2],
      cyberpunk: theme.shadows[6],
      nature: theme.shadows[3],
      luxury: theme.shadows[8],
      minimal: theme.shadows[0],
      "neon-glow": theme.shadows[7],
      geometric: theme.shadows[2],
      "dark-mode": theme.shadows[4],
      gradient: theme.shadows[3],
      metallic: theme.shadows[5],
      holographic: theme.shadows[6],
      paper: theme.shadows[1],
      "neon-grid": theme.shadows[4],
    };
    return shadowMap[designId] || theme.shadows[2];
  };

  const getDesignBorder = (designId: string) => {
    const borderMap: { [key: string]: string } = {
      sobre: `2px solid ${theme.palette.divider}`,
      moderne: `3px solid ${theme.palette.primary.main}`,
      minimaliste: `1px solid ${theme.palette.divider}`,
      sportif: `4px solid ${theme.palette.secondary.main}`,
      elegant: `2px solid ${theme.palette.primary.dark}`,
      neon: `2px solid ${theme.palette.secondary.main}`,
      glassmorphism: `1px solid ${theme.palette.primary.main}40`,
      retro: `3px solid ${theme.palette.primary.dark}`,
      futuriste: `2px solid ${theme.palette.primary.main}`,
      original: `4px solid ${theme.palette.secondary.main}`,
      corporate: `1px solid ${theme.palette.grey[400]}`,
      gaming: `3px solid ${theme.palette.error.main}`,
      vintage: `2px solid ${theme.palette.warning.dark}`,
      cyberpunk: `2px solid ${theme.palette.secondary.main}`,
      nature: `2px solid ${theme.palette.success.main}`,
      luxury: `1px solid ${theme.palette.primary.dark}`,
      minimal: `none`,
      "neon-glow": `2px solid ${theme.palette.error.main}`,
      geometric: `2px solid ${theme.palette.secondary.main}`,
      "dark-mode": `1px solid ${theme.palette.grey[600]}`,
      gradient: `2px solid ${theme.palette.info.main}`,
      metallic: `2px solid ${theme.palette.warning.main}`,
      holographic: `1px solid ${theme.palette.secondary.main}60`,
      paper: `1px solid ${theme.palette.grey[300]}`,
      "neon-grid": `2px solid ${theme.palette.error.main}`,
    };
    return borderMap[designId] || `2px solid ${theme.palette.divider}`;
  };

  const getDesignEffects = (designId: string) => {
    const effectsMap: { [key: string]: Record<string, unknown> } = {
      neon: {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${theme.palette.secondary.main}20, transparent)`,
          borderRadius: getDesignBorderRadius(designId),
          animation: "pulse 2s ease-in-out infinite alternate",
        },
      },
      glassmorphism: {
        backdropFilter: "blur(10px)",
        background: `linear-gradient(135deg, ${theme.palette.background.paper}80 0%, ${theme.palette.grey[50]}80 100%)`,
      },
      futuriste: {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `conic-gradient(from 0deg, ${theme.palette.primary.main}20 0deg, transparent 60deg, ${theme.palette.primary.main}20 120deg, transparent 180deg, ${theme.palette.primary.main}20 240deg, transparent 300deg, ${theme.palette.primary.main}20 360deg)`,
          borderRadius: getDesignBorderRadius(designId),
          animation: "rotate 8s linear infinite",
        },
      },
      corporate: {
        background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.background.paper} 100%)`,
      },
      gaming: {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, ${theme.palette.error.main}20 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${theme.palette.error.main}20 0%, transparent 50%)`,
          animation: "gaming-pulse 2s ease-in-out infinite",
        },
        "@keyframes gaming-pulse": {
          "0%, 100%": { opacity: 0.3 },
          "50%": { opacity: 0.8 },
        },
      },
      vintage: {
        background: `linear-gradient(135deg, ${theme.palette.warning.light}20 0%, ${theme.palette.warning.main}10 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `repeating-linear-gradient(90deg, ${theme.palette.warning.dark} 0px, ${theme.palette.warning.dark} 4px, transparent 4px, transparent 8px)`,
        },
      },
      cyberpunk: {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `conic-gradient(from 0deg, ${theme.palette.secondary.main}20 0deg, transparent 60deg, ${theme.palette.secondary.main}20 120deg, transparent 180deg, ${theme.palette.secondary.main}20 240deg, transparent 300deg, ${theme.palette.secondary.main}20 360deg)`,
          animation: "cyberpunk-rotate 4s linear infinite",
        },
        "@keyframes cyberpunk-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      nature: {
        background: `linear-gradient(135deg, ${theme.palette.success.light}20 0%, ${theme.palette.success.main}10 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 50%, ${theme.palette.success.main} 100%)`,
        },
      },
      luxury: {
        background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.primary.main}08 50%, ${theme.palette.primary.light}15 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
        },
      },
      minimal: {
        background: `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 50%, ${theme.palette.grey[400]} 100%)`,
        },
      },
      "neon-glow": {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${theme.palette.error.main}30, transparent, ${theme.palette.error.main}30)`,
          animation: "neon-glow 1.5s ease-in-out infinite alternate",
        },
        "@keyframes neon-glow": {
          "0%": { opacity: 0.3 },
          "100%": { opacity: 0.8 },
        },
      },
      geometric: {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(45deg, ${theme.palette.secondary.main}10 0px, ${theme.palette.secondary.main}10 10px, transparent 10px, transparent 20px)`,
        },
      },
      "dark-mode": {
        background: `linear-gradient(135deg, ${theme.palette.grey[700]} 0%, ${theme.palette.grey[800]} 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${theme.palette.grey[500]} 0%, ${theme.palette.grey[300]} 50%, ${theme.palette.grey[500]} 100%)`,
        },
      },
      gradient: {
        background: `linear-gradient(135deg, ${theme.palette.info.main}40 0%, ${theme.palette.secondary.main}40 50%, ${theme.palette.primary.main}40 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.primary.main} 100%)`,
        },
      },
      metallic: {
        background: `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.warning.light}15 50%, ${theme.palette.grey[200]} 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 50%, ${theme.palette.warning.main} 100%)`,
        },
      },
      holographic: {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${theme.palette.secondary.main}20, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
          animation: "holographic-shift 3s ease-in-out infinite",
        },
        "@keyframes holographic-shift": {
          "0%, 100%": { opacity: 0.2 },
          "50%": { opacity: 0.6 },
        },
      },
      paper: {
        background: `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.background.paper} 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `repeating-linear-gradient(90deg, ${theme.palette.grey[300]} 0px, ${theme.palette.grey[300]} 1px, transparent 1px, transparent 2px)`,
        },
      },
      "neon-grid": {
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(0deg, ${theme.palette.error.main}20 0px, ${theme.palette.error.main}20 2px, transparent 2px, transparent 4px), repeating-linear-gradient(90deg, ${theme.palette.error.main}20 0px, ${theme.palette.error.main}20 2px, transparent 2px, transparent 4px)`,
          animation: "grid-pulse 2s ease-in-out infinite",
        },
        "@keyframes grid-pulse": {
          "0%, 100%": { opacity: 0.3 },
          "50%": { opacity: 0.7 },
        },
      },
    };
    return effectsMap[designId] || {};
  };

  // Dimensions de base (pour scale = 1)
  const baseWidth = 800; // Élargi de 660 à 800
  const baseHeight = 160; // Élargi de 140 à 160
  const baseLogoWidth = 120;
  const baseLogoContainerSize = 100;
  const baseScoreSize = 50; // Augmenté de 40 à 50
  const baseMinWidth = 120; // Augmenté de 100 à 120

  // Dimensions appliquées avec le scale
  const width = baseWidth * scale;
  const height = baseHeight * scale;
  const logoWidth = baseLogoWidth * scale;
  const logoContainerSize = baseLogoContainerSize * scale;
  const scoreSize = baseScoreSize * scale;
  const minWidth = baseMinWidth * scale;

  // Layout TV personnalisé
  if (customLayout?.showClubInfo) {
    return (
      <Box
        sx={{
          background: theme.palette.background.paper,
          borderRadius: getDesignBorderRadius(designId),
          boxShadow: getDesignShadow(designId),
          overflow: "hidden",
          width,
          height,
          border: getDesignBorder(designId),
          display: "flex",
          position: "relative",
          ...getDesignEffects(designId),
        }}
      >
        {/* Colonne Club 1 */}
        <Box
          sx={{
            width: 120 * scale,
            background: theme.palette.grey[100],
            borderRight: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 1.5 * scale,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: `${1.2 * scale}rem`,
              color: theme.palette.text.primary,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            SQY PING
          </Typography>
        </Box>

        {/* Colonne Victoires Club 1 */}
        <Box
          sx={{
            width: 80 * scale,
            background: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 1.5 * scale,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: `${1.4 * scale}rem`,
              color: theme.palette.primary.main,
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            {setsWon.player1}
          </Typography>
        </Box>

        {/* Zone Principale - Joueurs */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            p: 2 * scale,
            justifyContent: "space-between",
          }}
        >
          {/* Ligne 1 - Joueur 1 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1 * scale,
              background: theme.palette.grey[50],
              borderRadius: 1,
              marginBottom: 1 * scale,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: `${1.8 * scale}rem`,
                color: theme.palette.text.primary,
                maxWidth: "74%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {orderedMatch?.player1.name}
            </Typography>
            <Box
              sx={{ display: "flex", gap: 1.5 * scale, alignItems: "center" }}
            >
              {/* Sets gagnés */}
              <Box
                sx={{
                  width: 40 * scale,
                  height: 40 * scale,
                  backgroundColor: "#000000",
                  border: `2px solid ${theme.palette.primary.main}`,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: `${1.2 * scale}rem`,
                    color: "#ffffff",
                  }}
                >
                  {setsWon.player1}
                </Typography>
              </Box>
              {/* Points actuels */}
              <Box
                sx={{
                  width: 50 * scale,
                  height: 50 * scale,
                  backgroundColor: theme.palette.background.paper,
                  border: `2px solid ${theme.palette.primary.main}`,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 120 * scale,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontSize: `${1.6 * scale}rem`,
                    color: theme.palette.primary.main,
                  }}
                >
                  {currentSet.player1}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Ligne 2 - Joueur 2 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1 * scale,
              background: theme.palette.grey[50],
              borderRadius: 1,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: `${1.8 * scale}rem`,
                color: theme.palette.text.primary,
                maxWidth: "74%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {orderedMatch?.player2.name}
            </Typography>
            <Box
              sx={{ display: "flex", gap: 1.5 * scale, alignItems: "center" }}
            >
              {/* Sets gagnés */}
              <Box
                sx={{
                  width: 40 * scale,
                  height: 40 * scale,
                  backgroundColor: "#000000",
                  border: `2px solid ${theme.palette.primary.main}`,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: `${1.2 * scale}rem`,
                    color: "#ffffff",
                  }}
                >
                  {setsWon.player2}
                </Typography>
              </Box>
              {/* Points actuels */}
              <Box
                sx={{
                  width: 50 * scale,
                  height: 50 * scale,
                  backgroundColor: theme.palette.background.paper,
                  border: `2px solid ${theme.palette.primary.main}`,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 120 * scale,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontSize: `${1.6 * scale}rem`,
                    color: theme.palette.primary.main,
                  }}
                >
                  {currentSet.player2}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Layout standard
  return (
    <Box
      sx={{
        background: theme.palette.background.paper,
        borderRadius: getDesignBorderRadius(designId),
        boxShadow: getDesignShadow(designId),
        overflow: "hidden",
        width,
        height,
        border: getDesignBorder(designId),
        display: "flex",
        position: "relative",
        ...getDesignEffects(designId),
      }}
    >
      {/* Zone logo à gauche */}
      {!hideLogo && (
        <Box
          sx={{
            width: logoWidth,
            background: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 1.5 * scale,
            borderTopLeftRadius: getDesignBorderRadius(designId),
            borderBottomLeftRadius: getDesignBorderRadius(designId),
          }}
        >
          <Box
            sx={{
              width: logoContainerSize,
              height: logoContainerSize,
              background: theme.palette.background.paper,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1 * scale,
            }}
          >
            <img
              src="/sqyping.png"
              alt="Logo SQY Ping"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        </Box>
      )}

      {/* Zone scores à droite */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderTopRightRadius: getDesignBorderRadius(designId),
          borderBottomRightRadius: getDesignBorderRadius(designId),
          overflow: "hidden",
        }}
      >
        {/* Structure en 2 colonnes */}
        <Box
          sx={{
            display: "flex",
            height: "100%",
          }}
        >
          {/* Colonne gauche - toujours identique */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "40%",
            }}
          >
            {/* Ligne 1 - Équipe 1 */}
            <Box
              sx={{
                flex: 1,
                background: theme.palette.primary.light,
                display: "flex",
                alignItems: "center",
                px: 2 * scale,
                py: 0.5 * scale,
                borderTopRightRadius: getDesignBorderRadius(designId),
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2 * scale,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {/* Nom de l'équipe */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant={scale < 1 ? "h6" : "h4"}
                    fontWeight={800}
                    sx={{
                      color: theme.palette.primary.contrastText,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                      textAlign: "left",
                    }}
                  >
                    {truncateAtFirstLowercase(team1.name, 15)}
                  </Typography>
                </Box>
                {/* Nombre de matchs */}
                <Box
                  sx={{
                    width: scoreSize,
                    height: scoreSize,
                    background: theme.palette.background.paper,
                    color: theme.palette.primary.main,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 0.5,
                    border: `1px solid ${theme.palette.primary.main}`,
                    fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                    fontWeight: 700,
                  }}
                >
                  {team1.matchesWon}
                </Box>
              </Box>
            </Box>

            {/* Ligne 2 - Équipe 2 */}
            <Box
              sx={{
                flex: 1,
                background: theme.palette.secondary.light,
                display: "flex",
                alignItems: "center",
                px: 2 * scale,
                py: 0.5 * scale,
                borderBottomRightRadius: getDesignBorderRadius(designId),
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2 * scale,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {/* Nom de l'équipe */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant={scale < 1 ? "h6" : "h4"}
                    fontWeight={800}
                    sx={{
                      color: theme.palette.secondary.contrastText,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                      textAlign: "left",
                    }}
                  >
                    {truncateAtFirstLowercase(team2.name, 15)}
                  </Typography>
                </Box>
                {/* Nombre de matchs */}
                <Box
                  sx={{
                    width: scoreSize,
                    height: scoreSize,
                    background: theme.palette.background.paper,
                    color: theme.palette.secondary.main,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 0.5,
                    border: `1px solid ${theme.palette.secondary.main}`,
                    fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                    fontWeight: 700,
                  }}
                >
                  {team2.matchesWon}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Séparation verticale entre les colonnes */}
          <Box
            sx={{
              width: 2 * scale,
              height: "100%",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />

          {/* Colonne droite - change selon le contexte */}
          <Box
            sx={{
              width: "60%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {displayUpcomingMatches ? (
              /* Bloc unifié pour les prochains matchs */
              <Box
                sx={{
                  flex: 1,
                  background: theme.palette.primary.main,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 2 * scale,
                  py: 1 * scale,
                  borderTopRightRadius: getDesignBorderRadius(designId),
                  borderBottomRightRadius: getDesignBorderRadius(designId),
                }}
              >
                {/* Ligne 1: Titre */}
                <Typography
                  variant={scale < 1 ? "h6" : "h4"}
                  fontWeight={800}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                    mb: 0.5 * scale,
                    textAlign: "center",
                  }}
                >
                  PROCHAINS MATCHS
                </Typography>
                {/* Ligne 2: Premier match */}
                <Typography
                  variant={scale < 1 ? "h6" : "h4"}
                  fontWeight={600}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontSize: scale < 1 ? "1.0rem" : "1.5rem",
                    mb: 0.3 * scale,
                    textAlign: "center",
                  }}
                >
                  {upcomingMatches[0]?.matchNumber >= 13 && upcomingMatches[0]?.matchNumber <= 15
                    ? `Double ${upcomingMatches[0].matchNumber - 12}`
                    : `${truncateAtFirstLowercase(
                        upcomingMatches[0]?.player1.name || "Joueur 1",
                        15
                      )} vs ${truncateAtFirstLowercase(
                        upcomingMatches[0]?.player2.name || "Joueur 2",
                        15
                      )}`}
                </Typography>
                {/* Ligne 3: Deuxième match */}
                <Typography
                  variant={scale < 1 ? "h6" : "h4"}
                  fontWeight={600}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontSize: scale < 1 ? "1.0rem" : "1.5rem",
                    textAlign: "center",
                  }}
                >
                  {upcomingMatches[1]
                    ? upcomingMatches[1].matchNumber >= 13 && upcomingMatches[1].matchNumber <= 15
                      ? `Double ${upcomingMatches[1].matchNumber - 12}`
                      : `${truncateAtFirstLowercase(
                          upcomingMatches[1]?.player1.name || "Joueur 1",
                          15
                        )} vs ${truncateAtFirstLowercase(
                          upcomingMatches[1]?.player2.name || "Joueur 2",
                          15
                        )}`
                    : "Aucun autre match"}
                </Typography>
              </Box>
            ) : displayNoMatches ? (
              /* Bloc unifié pour aucun match - même style que prochains matchs */
              <Box
                sx={{
                  flex: 1,
                  background: theme.palette.primary.main,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 2 * scale,
                  py: 1 * scale,
                  borderTopRightRadius: getDesignBorderRadius(designId),
                  borderBottomRightRadius: getDesignBorderRadius(designId),
                }}
              >
                {/* Message unique centré */}
                <Typography
                  variant={scale < 1 ? "h6" : "h4"}
                  fontWeight={600}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontSize: scale < 1 ? "1.0rem" : "1.5rem",
                    textAlign: "center",
                  }}
                >
                  Aucun match programmé
                </Typography>
              </Box>
            ) : (
              /* Match en cours - 2 lignes séparées */
              <>
                {/* Ligne 1 - Joueur 1 */}
                <Box
                  sx={{
                    flex: 1,
                    background: theme.palette.primary.light,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2 * scale,
                    py: 0.5 * scale,
                    borderTopRightRadius: getDesignBorderRadius(designId),
                  }}
                >
                  {/* Nom du joueur */}
                  <Box sx={{ width: "310px", minWidth: "310px" }}>
                    <Typography
                      variant={scale < 1 ? "h6" : "h4"}
                      fontWeight={800}
                      sx={{
                        color: theme.palette.primary.contrastText,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                        textAlign: "left",
                      }}
                    >
                      {truncateAtFirstLowercase(
                        orderedMatch?.player1.name || "Joueur 1",
                        18
                      )}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2 * scale,
                      flexShrink: 0,
                      minWidth,
                      width: "auto",
                    }}
                  >
                    {/* Sets gagnés */}
                    <Box
                      sx={{
                        width: scoreSize,
                        height: scoreSize,
                        background: "#000000",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 0.5,
                        fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {setsWon.player1}
                    </Box>
                    <Box
                      sx={{
                        width: scoreSize,
                        height: scoreSize,
                        background: theme.palette.background.paper,
                        color: theme.palette.primary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 0.5,
                        border: `1px solid ${theme.palette.primary.main}`,
                        fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {currentSet.player1}
                    </Box>
                  </Box>
                </Box>

                {/* Ligne 2 - Joueur 2 */}
                <Box
                  sx={{
                    flex: 1,
                    background: theme.palette.secondary.light,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2 * scale,
                    py: 0.5 * scale,
                    borderBottomRightRadius: getDesignBorderRadius(designId),
                  }}
                >
                  {/* Nom du joueur */}
                  <Box sx={{ width: "310px", minWidth: "310px" }}>
                    <Typography
                      variant={scale < 1 ? "h6" : "h4"}
                      fontWeight={800}
                      sx={{
                        color: theme.palette.secondary.contrastText,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                        textAlign: "left",
                      }}
                    >
                      {truncateAtFirstLowercase(
                        orderedMatch?.player2.name || "Joueur 2",
                        18
                      )}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2 * scale,
                      flexShrink: 0,
                      minWidth,
                      width: "auto",
                    }}
                  >
                    {/* Sets gagnés */}
                    <Box
                      sx={{
                        width: scoreSize,
                        height: scoreSize,
                        background: "#000000",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 0.5,
                        fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {setsWon.player2}
                    </Box>
                    <Box
                      sx={{
                        width: scoreSize,
                        height: scoreSize,
                        background: theme.palette.background.paper,
                        color: theme.palette.secondary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 0.5,
                        border: `1px solid ${theme.palette.secondary.main}`,
                        fontSize: scale < 1 ? "1.1rem" : "1.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {currentSet.player2}
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
