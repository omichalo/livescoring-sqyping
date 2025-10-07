import { useEffect } from "react";
import { Box, Button, Typography, Paper, Alert } from "@mui/material";
import { useCurrentEncounter } from "../hooks/useCurrentEncounter";
import { useNavigate } from "react-router-dom";

export const MatchesListPage = () => {
  const navigate = useNavigate();
  const {
    currentEncounter,
    loading: encounterLoading,
    error: encounterError,
  } = useCurrentEncounter();

  // Redirection automatique vers la page de gestion live scoring
  useEffect(() => {
    if (currentEncounter) {
      navigate("/live-scoring-management", { replace: true });
    }
  }, [currentEncounter, navigate]);

  if (encounterLoading) {
    return (
      <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4 }}>
        <Alert severity="info">Chargement de la rencontre active...</Alert>
      </Paper>
    );
  }

  if (encounterError) {
    return (
      <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4 }}>
        <Alert severity="error">{encounterError}</Alert>
      </Paper>
    );
  }

  if (!currentEncounter) {
    return (
      <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Aucune rencontre active. Veuillez créer et sélectionner une rencontre.
        </Alert>
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/encounters/new")}
            sx={{ mr: 2 }}
          >
            Créer une rencontre
          </Button>
          <Button variant="outlined" onClick={() => navigate("/encounters")}>
            Voir les rencontres
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Redirection en cours...
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Vous allez être redirigé vers la page de gestion des matchs.
      </Alert>
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          onClick={() => navigate("/live-scoring-management")}
        >
          Aller à la gestion des matchs
        </Button>
      </Box>
    </Paper>
  );
};
