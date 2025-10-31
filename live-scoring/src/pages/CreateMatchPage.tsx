import { useEffect, useState } from "react";
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Team } from "../types";

interface Player {
  id: string;
  name: string;
  team: string;
}

export const CreateMatchPage = () => {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les équipes
        const teamsSnapshot = await getDocs(collection(db, "teams"));
        const teamsData = teamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];
        setTeams(teamsData);

        // Récupérer les joueurs
        const playersSnapshot = await getDocs(collection(db, "players"));
        const playersData = playersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            team: data.team,
          };
        });
        setPlayers(playersData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        setError("Erreur lors du chargement des données");
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!player1 || !player2) {
      setError("Veuillez sélectionner deux joueurs");
      return;
    }

    if (player1 === player2) {
      setError("Les deux joueurs doivent être différents");
      return;
    }

    const p1 = players.find((p) => p.id === player1);
    const p2 = players.find((p) => p.id === player2);

    if (!p1 || !p2) {
      setError("Joueurs non trouvés");
      return;
    }

    if (p1.team === p2.team) {
      setError("Les joueurs doivent être de différentes équipes");
      return;
    }

    setLoading(true);

    try {
      // Récupérer le nombre de matchs déjà créés
      const snap = await getDocs(collection(db, "matches"));
      const matchCount = snap.size;
      const matchNumber = matchCount + 1;

      await addDoc(collection(db, "matches"), {
        player1: { id: p1.id, name: p1.name, teamId: p1.team },
        player2: { id: p2.id, name: p2.name, teamId: p2.team },
        matchNumber,
        score: [],
        setsWon: { player1: 0, player2: 0 },
        status: "waiting",
        startTime: Date.now(),
      });

      setLoading(false);
      setSuccess(true);
      setPlayer1("");
      setPlayer2("");
    } catch (error) {
      console.error("Erreur lors de la création du match:", error);
      setError("Erreur lors de la création du match");
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Créer un match
      </Typography>

      {teams.length === 0 && (
        <Alert severity="warning">
          Aucune équipe trouvée. Veuillez créer des équipes et des joueurs
          d'abord.
        </Alert>
      )}

      {teams.length > 0 && players.length === 0 && (
        <Alert severity="warning">
          Aucun joueur trouvé. Veuillez créer des joueurs d'abord.
        </Alert>
      )}
      <Stack spacing={3}>
        <TextField
          select
          label={`Joueur 1 - ${teams[0]?.name || "Équipe 1"}`}
          value={player1}
          onChange={(e) => setPlayer1(e.target.value)}
          fullWidth
          helperText="Sélectionnez un joueur de la première équipe"
        >
          {players
            .filter((player) => {
              const team = teams.find((t) => t.id === player.team);
              return team && team.id === teams[0]?.id;
            })
            .map((player) => {
              const team = teams.find((t) => t.id === player.team);
              return (
                <MenuItem
                  key={player.id}
                  value={player.id}
                  disabled={player.id === player2}
                >
                  {player.name} ({team?.name})
                </MenuItem>
              );
            })}
        </TextField>

        <TextField
          select
          label={`Joueur 2 - ${teams[1]?.name || "Équipe 2"}`}
          value={player2}
          onChange={(e) => setPlayer2(e.target.value)}
          fullWidth
          helperText="Sélectionnez un joueur de la deuxième équipe"
        >
          {players
            .filter((player) => {
              const team = teams.find((t) => t.id === player.team);
              return team && team.id === teams[1]?.id;
            })
            .map((player) => {
              const team = teams.find((t) => t.id === player.team);
              return (
                <MenuItem
                  key={player.id}
                  value={player.id}
                  disabled={player.id === player1}
                >
                  {player.name} ({team?.name})
                </MenuItem>
              );
            })}
        </TextField>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || !player1 || !player2 || player1 === player2}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          fullWidth
        >
          {loading ? "Création..." : "Créer le match"}
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {success && <Alert severity="success">Match créé avec succès !</Alert>}
      </Stack>
    </Paper>
  );
};
