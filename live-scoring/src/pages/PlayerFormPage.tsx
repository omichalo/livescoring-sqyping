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
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export const PlayerFormPage = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [team, setTeam] = useState<string>("");
  const [team1Name, setTeam1Name] = useState("Équipe 1");
  const [team2Name, setTeam2Name] = useState("Équipe 2");
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (playerId) {
        const ref = doc(db, "players", playerId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setTeam(data.team || "");
        }
      }

      // Récupérer les équipes depuis la collection "teams"
      try {
        const teamsSnapshot = await getDocs(collection(db, "teams"));
        const teams = teamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (teams.length >= 2) {
          setTeam1Name((teams[0] as any).name || "Équipe 1");
          setTeam2Name((teams[1] as any).name || "Équipe 2");
          setTeam1Id(teams[0].id);
          setTeam2Id(teams[1].id);
          // Définir l'équipe par défaut si aucune n'est sélectionnée
          if (!team) {
            setTeam(teams[0].id);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des équipes:", error);
      }
    };
    console.log("Fetching data...");
    fetchData();
  }, [playerId, team]);

  const handleSubmit = async () => {
    console.log("handleSubmit called with:", { name, team });
    setError("");

    if (!name.trim()) {
      setError("Nom requis");
      return;
    }

    if (!team) {
      setError("Équipe requise");
      return;
    }

    setLoading(true);

    try {
      const playerData = {
        name: name.trim(),
        team,
      };

      console.log("Données du joueur:", playerData);

      if (playerId) {
        await setDoc(doc(db, "players", playerId), playerData);
        console.log("Joueur mis à jour");
      } else {
        const docRef = await addDoc(collection(db, "players"), playerData);
        console.log("Joueur créé avec ID:", docRef.id);
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
    if (!playerId) return;

    setLoading(true);
    setError("");

    try {
      await deleteDoc(doc(db, "players", playerId));
      setDeleteDialogOpen(false);
      navigate("/players");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression: " + (error as Error).message);
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate("/players");
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {playerId ? "Modifier le joueur" : "Ajouter un joueur"}
      </Typography>
      <Stack spacing={3}>
        <TextField
          label="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />

        <TextField
          select
          label="Équipe"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          fullWidth
          SelectProps={{ native: true }}
        >
          <option value={team1Id}>{team1Name}</option>
          <option value={team2Id}>{team2Name}</option>
        </TextField>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            variant="outlined"
            onClick={handleBackToList}
            disabled={loading}
          >
            ← Retour à la liste
          </Button>

          <Stack direction="row" spacing={2}>
            {playerId && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                🗑️ Supprimer
              </Button>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !team}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading
                ? "Sauvegarde..."
                : playerId
                ? "Mettre à jour"
                : "Ajouter"}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {success && (
          <Alert severity="success">
            Joueur {playerId ? "mis à jour" : "ajouté"} avec succès !
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
            Êtes-vous sûr de vouloir supprimer le joueur <strong>{name}</strong>{" "}
            ?
          </Typography>
          <Typography sx={{ mt: 1, color: "error.main" }}>
            ⚠️ Cette action est irréversible.
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
