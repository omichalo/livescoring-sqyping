import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";
import { OverlayPreview } from "../components/OverlayPreview";

export const OverlayDemoPage: React.FC = () => {
  const theme = useTheme();
  const [match, setMatch] = useState<Match | null>(null);

  // Récupérer le match de la table 1 depuis Firestore
  useEffect(() => {
    const matchRef = doc(db, "matches", "1");
    const unsubscribe = onSnapshot(matchRef, (doc) => {
      if (doc.exists()) {
        setMatch(doc.data() as Match);
      } else {
        // Si aucun match n'existe, créer des données de démo
        setMatch({
          id: "1",
          player1: { id: "1", name: "Alice Martin" },
          player2: { id: "2", name: "Bob Dupont" },
          setsWon: { player1: 2, player2: 1 },
          score: [{ player1: 11, player2: 9 }],
          status: "inProgress",
          matchNumber: 1,
          startTime: Date.now(),
        } as Match);
      }
    });

    return () => unsubscribe();
  }, []);

  const designs = [
    {
      id: "classic",
      name: "Classique",
      description:
        "Design simple et épuré, format horizontal optimisé pour tennis de table",
      color: theme.palette.primary.main,
      url: "/overlay/horizontal/classic/1",
    },
    {
      id: "modern",
      name: "Moderne",
      description:
        "Cartes avec gradients et ombres, design dynamique et contemporain",
      color: theme.palette.secondary.main,
      url: "/overlay/horizontal/modern/1",
    },
    {
      id: "minimal",
      name: "Minimaliste",
      description: "Ultra-simple et discret, focus sur l'essentiel",
      color: theme.palette.grey[600],
      url: "/overlay/horizontal/minimal/1",
    },
    {
      id: "sport",
      name: "Sportif",
      description: "Dynamique et énergique, idéal pour les compétitions",
      color: theme.palette.error.main,
      url: "/overlay/horizontal/sport/1",
    },
    {
      id: "elegant",
      name: "Élégant",
      description: "Raffiné et sophistiqué, pour une diffusion haut de gamme",
      color: theme.palette.warning.main,
      url: "/overlay/horizontal/elegant/1",
    },
  ];

  const renderOverlay = (designId: string) => {
    if (!match) return null;

    // Utiliser le composant OverlayPreview avec les données du match
    return (
      <OverlayPreview
        match={match}
        design={
          designId as "classic" | "modern" | "minimal" | "sport" | "elegant"
        }
      />
    );
  };

  if (!match) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h4">Chargement des données de démo...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* Header simple */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h2"
          fontWeight={700}
          sx={{ mb: 2, color: theme.palette.primary.main }}
        >
          🎥 Choix du Design d'Overlay
        </Typography>
        <Typography
          variant="h5"
          sx={{ color: theme.palette.text.secondary, mb: 3 }}
        >
          Choisissez le design qui correspond le mieux à votre style de
          diffusion
        </Typography>
      </Box>

      {/* Informations du match */}
      <Card sx={{ maxWidth: 800, mx: "auto", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
            Match de démo
          </Typography>
          <Typography variant="h4" sx={{ mb: 2, textAlign: "center" }}>
            <strong>{match?.player1.name}</strong> vs{" "}
            <strong>{match?.player2.name}</strong>
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: theme.palette.text.secondary, textAlign: "center" }}
          >
            Sets: {match?.setsWon?.player1 || 0} -{" "}
            {match?.setsWon?.player2 || 0} | Points actuels:{" "}
            {match?.score?.[match.score.length - 1]?.player1 || 0} -{" "}
            {match?.score?.[match.score.length - 1]?.player2 || 0}
          </Typography>
        </CardContent>
      </Card>

      {/* Grille de tous les designs - Layout optimisé pour présentation */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, textAlign: "center" }}>
          Designs disponibles
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {designs.map((design) => (
            <Grid item xs={12} sm={6} lg={4} key={design.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: theme.shadows[12],
                  },
                  border: `3px solid ${design.color}`,
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    sx={{ mb: 2, color: design.color, fontWeight: 700 }}
                  >
                    {design.name}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ mb: 3, color: theme.palette.text.secondary }}
                  >
                    {design.description}
                  </Typography>

                  {/* Aperçu du design */}
                  <Box
                    sx={{
                      position: "relative",
                      height: 200,
                      bgcolor: theme.palette.grey[50],
                      borderRadius: 2,
                      overflow: "hidden",
                      border: `2px solid ${theme.palette.divider}`,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        transform: "scale(0.6)",
                        transformOrigin: "center",
                      }}
                    >
                      {renderOverlay(design.id)}
                    </Box>
                  </Box>

                  {/* Boutons d'action */}
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      href={design.url}
                      target="_blank"
                      sx={{
                        width: "100%",
                        bgcolor: design.color,
                        "&:hover": {
                          bgcolor: design.color,
                          opacity: 0.9,
                        },
                      }}
                    >
                      🎬 Tester ce design
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}${design.url}`
                        );
                      }}
                      sx={{ width: "100%" }}
                    >
                      📋 Copier l'URL
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Instructions pour OBS - Version simplifiée */}
      <Card
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            📺 Instructions pour OBS
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                1. Ouvrez l'URL du design choisi
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                2. Dans OBS, ajoutez "Capture de fenêtre de navigateur"
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                3. Sélectionnez la fenêtre du navigateur
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                4. Redimensionnez et positionnez l'overlay
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>
            ✨ L'arrière-plan est transparent, parfait pour l'incrustation !
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
