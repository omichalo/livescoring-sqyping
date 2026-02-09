import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  Stack,
  Chip,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Encounter, Team } from "../types";
import {
  getSelectedEncounterId,
  setSelectedEncounterId as saveSelectedEncounterId,
  clearSelectedEncounterId,
} from "../utils/localStorage";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

export const EncountersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setCurrentDialogOpen, setSetCurrentDialogOpen] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(
    null
  );
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Charger l'encounter sélectionné depuis localStorage
    const loadSelectedEncounterId = () => {
      const id = getSelectedEncounterId();
      setSelectedEncounterId(id);
    };

    // Charger au montage
    loadSelectedEncounterId();

    // Écouter les changements de localStorage (depuis d'autres onglets)
    const handleStorageChange = () => {
      loadSelectedEncounterId();
    };

    window.addEventListener("storage", handleStorageChange);

    // Récupérer les rencontres en temps réel
    const unsubscribeEncounters = onSnapshot(
      collection(db, "encounters"),
      (snapshot) => {
        const encountersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Encounter[];

        // Trier par date de création (plus récent en premier)
        encountersData.sort((a, b) => b.createdAt - a.createdAt);

        setEncounters(encountersData);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lors de la récupération des rencontres:", error);
        setError("Erreur lors de la récupération des rencontres");
        setLoading(false);
      }
    );

    // Récupérer les équipes pour afficher les noms
    const unsubscribeTeams = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsData);
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unsubscribeEncounters();
      unsubscribeTeams();
    };
  }, []);

  const getTeamName = (teamId: string): string => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || "Équipe inconnue";
  };

  const getStatusChip = (status: Encounter["status"]) => {
    const statusConfig = {
      active: { label: "En préparation", color: "info" as const },
      completed: { label: "Terminée", color: "default" as const },
      archived: { label: "Archivée", color: "secondary" as const },
    };

    const config = statusConfig[status];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const handleSetCurrent = (encounter: Encounter) => {
    try {
      const isCurrentlySelected = selectedEncounterId === encounter.id;

      if (isCurrentlySelected) {
        // Si la rencontre est déjà sélectionnée, la désélectionner
        clearSelectedEncounterId();
        setSelectedEncounterId(null);
        // Déclencher un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new Event("encounterSelectionChanged"));
        console.log(`✅ Rencontre ${encounter.name} désélectionnée`);
      } else {
        // Sélectionner la nouvelle rencontre
        saveSelectedEncounterId(encounter.id); // Sauvegarder dans localStorage
        setSelectedEncounterId(encounter.id); // Mettre à jour l'état local
        // Déclencher un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new Event("encounterSelectionChanged"));
        console.log(`✅ Rencontre ${encounter.name} sélectionnée`);
      }

      setSetCurrentDialogOpen(false);
      setSelectedEncounter(null);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la sélection de la rencontre:",
        error
      );
      setError("Erreur lors de la sélection de la rencontre");
    }
  };

  const handleOpenSetCurrentDialog = (encounter: Encounter) => {
    setSelectedEncounter(encounter);
    setSetCurrentDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement des rencontres...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Gestion des rencontres
        </Typography>
        <Fab
          color="primary"
          aria-label="créer une rencontre"
          component={Link}
          to="/encounters/new"
          size="medium"
        >
          <AddIcon />
        </Fab>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {encounters.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune rencontre trouvée
          </Typography>
          <Typography color="text.secondary">
            Cliquez sur le bouton + pour créer votre première rencontre
          </Typography>
        </Box>
      ) : (
        <List>
          {encounters.map((encounter) => (
            <ListItem
              key={encounter.id}
              divider
              sx={{
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                backgroundColor: selectedEncounterId === encounter.id
                  ? "action.selected"
                  : "inherit",
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
                >
                  <Typography variant="h6" component="span">
                    {encounter.name}
                  </Typography>
                  {selectedEncounterId === encounter.id && (
                    <Chip
                      icon={<StarIcon />}
                      label="Sélectionnée"
                      color="primary"
                      size="small"
                      variant="filled"
                    />
                  )}
                  {getStatusChip(encounter.status)}
                </Box>

                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{getTeamName(encounter.team1Id)}</strong> vs{" "}
                    <strong>{getTeamName(encounter.team2Id)}</strong>
                  </Typography>
                  {encounter.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {encounter.description}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    Créée le {new Date(encounter.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate("/encounter-preparation")}
                    sx={{ mr: 1 }}
                  >
                    Préparer
                  </Button>
                  <IconButton
                    edge="end"
                    aria-label={
                      selectedEncounterId === encounter.id
                        ? "désélectionner la rencontre"
                        : "sélectionner cette rencontre"
                    }
                    onClick={() => handleOpenSetCurrentDialog(encounter)}
                  >
                    {selectedEncounterId === encounter.id ? (
                      <StarIcon color="primary" />
                    ) : (
                      <StarBorderIcon />
                    )}
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="modifier la rencontre"
                    onClick={() => navigate(`/encounters/${encounter.id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Dialog pour confirmer la sélection de la rencontre */}
      <Dialog
        open={setCurrentDialogOpen}
        onClose={() => setSetCurrentDialogOpen(false)}
      >
        <DialogTitle>
          {selectedEncounter && selectedEncounterId === selectedEncounter.id
            ? "Désélectionner la rencontre"
            : "Sélectionner cette rencontre"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {selectedEncounter && selectedEncounterId === selectedEncounter.id ? (
              <>
                Êtes-vous sûr de vouloir désélectionner la rencontre "
                {selectedEncounter?.name}" ?
              </>
            ) : (
              <>
                Voulez-vous sélectionner "{selectedEncounter?.name}" comme
                rencontre active pour ce navigateur ?
              </>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedEncounter && selectedEncounterId === selectedEncounter.id ? (
              <>
                Aucune rencontre ne sera sélectionnée. Les nouvelles fonctionnalités
                nécessiteront une rencontre sélectionnée.
              </>
            ) : (
              <>
                Cette sélection est locale à ce navigateur. Les autres navigateurs
                peuvent avoir une rencontre différente sélectionnée. Les nouveaux
                matchs et joueurs seront associés à cette rencontre.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetCurrentDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={() =>
              selectedEncounter && handleSetCurrent(selectedEncounter)
            }
            variant="contained"
            color="primary"
          >
            {selectedEncounter && selectedEncounterId === selectedEncounter.id
              ? "Désélectionner"
              : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
