import { useEffect, useState } from "react";
import {
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Team } from "../types";

export const TeamFormPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matchesWon, setMatchesWon] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);

  // Récupérer l'information de suppression depuis la navigation
  const canDelete = (location.state as any)?.canDelete ?? false;

  useEffect(() => {
    const fetchData = async () => {
      // Compter le nombre d'équipes existantes
      try {
        const teamsSnapshot = await getDocs(collection(db, "teams"));
        setTeamsCount(teamsSnapshot.size);
      } catch (error) {
        console.error("Erreur lors du comptage des équipes:", error);
      }

      if (teamId) {
        try {
          const ref = doc(db, "teams", teamId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setName(data.name || "");
            setMatchesWon(data.matchesWon || 0);
          } else {
            setError("Équipe non trouvée");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération:", error);
          setError("Erreur lors de la récupération des données");
        }
      }
    };
    fetchData();
  }, [teamId]);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Nom de l'équipe requis");
      return;
    }

    // Empêcher la création d'une 3ème équipe si on est en mode création
    if (!teamId && teamsCount >= 2) {
      setError(
        "Impossible de créer plus de 2 équipes. L'application nécessite exactement 2 équipes."
      );
      return;
    }

    setLoading(true);

    try {
      const teamData: Partial<Team> = {
        name: name.trim(),
        matchesWon: matchesWon,
      };

      if (teamId) {
        await updateDoc(doc(db, "teams", teamId), teamData);
        console.log("Équipe mise à jour");
      } else {
        // Pour la création, on utilise un ID généré
        const newTeamRef = doc(collection(db, "teams"));
        await setDoc(newTeamRef, teamData);
        console.log("Équipe créée avec ID:", newTeamRef.id);
      }

      setLoading(false);
      setSuccess(true);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setError("Erreur lors de la sauvegarde: " + (error as Error).message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!teamId) return;

    setLoading(true);
    setError("");

    try {
      await deleteDoc(doc(db, "teams", teamId));
      setDeleteDialogOpen(false);
      navigate("/teams");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression: " + (error as Error).message);
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate("/teams");
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {teamId ? "Modifier l'équipe" : "Ajouter une équipe"}
      </Typography>

      <Stack spacing={3}>
        <TextField
          label="Nom de l'équipe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
        />

        {teamId && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Nombre de victoires
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={`${matchesWon} victoire${matchesWon > 1 ? "s" : ""}`}
                color={matchesWon > 0 ? "success" : "default"}
                variant={matchesWon > 0 ? "filled" : "outlined"}
              />
              <Button
                size="small"
                onClick={() => setMatchesWon(Math.max(0, matchesWon - 1))}
                disabled={matchesWon === 0}
              >
                -
              </Button>
              <Button
                size="small"
                onClick={() => setMatchesWon(matchesWon + 1)}
              >
                +
              </Button>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              ⚠️ Modifiez avec précaution : cela affecte les statistiques de
              l'équipe
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            variant="outlined"
            onClick={handleBackToList}
            disabled={loading}
          >
            ← Retour à la liste
          </Button>

          <Stack direction="row" spacing={2}>
            {teamId && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading || !canDelete}
                title={
                  !canDelete
                    ? "Impossible de supprimer : minimum 2 équipes requis"
                    : "Supprimer l'équipe"
                }
              >
                🗑️ Supprimer
              </Button>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? "Sauvegarde..." : teamId ? "Mettre à jour" : "Ajouter"}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {success && (
          <Alert severity="success">
            Équipe {teamId ? "mise à jour" : "ajoutée"} avec succès !
          </Alert>
        )}

        {teamId && !canDelete && (
          <Alert severity="info">
            ℹ️ La suppression est désactivée car l'application nécessite un
            minimum de 2 équipes.
          </Alert>
        )}
      </Stack>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'équipe <strong>{name}</strong>{" "}
            ?
          </Typography>
          <Typography sx={{ mt: 1, color: "error.main" }}>
            ⚠️ Cette action est irréversible et supprimera toutes les données
            associées.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
