import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Container,
  Chip,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Match } from "../types";
import { OverlayDesign } from "../components/OverlayDesign";

const designs = [
  {
    id: "sobre",
    name: "Sobre",
    description: "Design classique et épuré",
    color: "primary",
  },
  {
    id: "moderne",
    name: "Moderne",
    description: "Gradients et effets visuels",
    color: "secondary",
  },
  {
    id: "minimaliste",
    name: "Minimaliste",
    description: "Simplicité et clarté",
    color: "info",
  },
  {
    id: "sportif",
    name: "Sportif",
    description: "Énergique et dynamique",
    color: "warning",
  },
  {
    id: "elegant",
    name: "Élégant",
    description: "Raffiné avec logo intégré",
    color: "success",
  },
  {
    id: "neon",
    name: "Néon",
    description: "Effets lumineux et animations",
    color: "error",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Effet de verre et transparence",
    color: "info",
  },
  {
    id: "retro",
    name: "Rétro",
    description: "Style vintage années 80",
    color: "warning",
  },
  {
    id: "futuriste",
    name: "Futuriste",
    description: "Design high-tech et animations",
    color: "secondary",
  },
  {
    id: "original",
    name: "Original",
    description: "Le plus créatif et unique",
    color: "primary",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Professionnel et institutionnel",
    color: "primary",
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Style esport et compétition",
    color: "error",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Charme rétro et nostalgique",
    color: "warning",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futur dystopique et néon",
    color: "secondary",
  },
  {
    id: "nature",
    name: "Nature",
    description: "Inspiration organique et verte",
    color: "success",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Prestige et sophistication",
    color: "primary",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra épuré et fonctionnel",
    color: "info",
  },
  {
    id: "neon-glow",
    name: "Néon Glow",
    description: "Effet de lueur intense",
    color: "error",
  },
  {
    id: "geometric",
    name: "Géométrique",
    description: "Formes et patterns géométriques",
    color: "secondary",
  },
  {
    id: "dark-mode",
    name: "Dark Mode",
    description: "Thème sombre et moderne",
    color: "primary",
  },
  {
    id: "gradient",
    name: "Gradient",
    description: "Dégradés colorés vibrants",
    color: "info",
  },
  {
    id: "metallic",
    name: "Métallique",
    description: "Finitions métal et chrome",
    color: "warning",
  },
  {
    id: "holographic",
    name: "Holographique",
    description: "Effet hologramme futuriste",
    color: "secondary",
  },
  {
    id: "paper",
    name: "Papier",
    description: "Texture papier et craft",
    color: "info",
  },
  {
    id: "neon-grid",
    name: "Néon Grid",
    description: "Grille lumineuse cyber",
    color: "error",
  },
];

export const OverlayDesignsDemoPage: React.FC = () => {
  const theme = useTheme();
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    const matchRef = doc(db, "matches", "1");
    const unsubscribe = onSnapshot(matchRef, (doc) => {
      if (doc.exists()) {
        setMatch(doc.data() as Match);
      }
    });

    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          25 Designs d'Overlay
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Choisissez le design qui correspond le mieux à votre diffusion
        </Typography>

        {match && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Match en cours : <strong>{match.player1.name}</strong> vs{" "}
              <strong>{match.player2.name}</strong>
            </Typography>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {designs.map((design, index) => (
          <Grid item xs={12} md={6} lg={4} key={design.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                position: "relative",
                zIndex: 1,
                overflow: "visible",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                  zIndex: 2,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Chip
                    label={`#${index + 1}`}
                    color={
                      design.color as
                        | "primary"
                        | "secondary"
                        | "success"
                        | "error"
                        | "info"
                        | "warning"
                    }
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="h6" component="h2">
                    {design.name}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {design.description}
                </Typography>

                {/* Aperçu du design complet */}
                <Box
                  sx={{
                    width: "100%",
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                    position: "relative",
                    overflow: "visible",
                    zIndex: 1,
                    "&:hover": {
                      zIndex: 1000,
                    },
                  }}
                >
                  <Box
                    sx={{
                      transition: "transform 0.3s ease-in-out",
                      "&:hover": {
                        transform: "scale(2)", // Zoom vers la taille cible 660x140
                        zIndex: 1001,
                      },
                    }}
                  >
                    <OverlayDesign
                      designId={design.id}
                      match={match}
                      scale={0.5}
                    />
                  </Box>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color={
                      design.color as
                        | "primary"
                        | "secondary"
                        | "success"
                        | "error"
                        | "info"
                        | "warning"
                    }
                    size="small"
                    onClick={() =>
                      window.open(`/overlay/designs/${design.id}/1`, "_blank")
                    }
                    sx={{ flex: 1 }}
                  >
                    Tester
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/overlay/designs/${design.id}/1`
                      )
                    }
                    sx={{ flex: 1 }}
                  >
                    URL
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{ mt: 6, p: 3, bgcolor: theme.palette.grey[50], borderRadius: 2 }}
      >
        <Typography variant="h6" gutterBottom>
          Instructions pour OBS
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. Ouvrez l'URL de votre design préféré dans un navigateur
          <br />
          2. Dans OBS, ajoutez une source "Navigateur" (Browser Source)
          <br />
          3. Collez l'URL dans le champ URL
          <br />
          4. Définissez la largeur et hauteur selon vos besoins
          <br />
          5. Cochez "Interagir" si vous voulez pouvoir cliquer
          <br />
          6. Le fond est transparent, parfait pour l'incrustation
        </Typography>
      </Box>
    </Container>
  );
};
