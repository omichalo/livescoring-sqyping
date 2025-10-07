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
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Encounter, Team } from "../types";
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

  useEffect(() => {
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

  const handleSetCurrent = async (encounter: Encounter) => {
    try {
      if (encounter.isCurrent) {
        // Si la rencontre est déjà active, la désactiver
        await updateDoc(doc(db, "encounters", encounter.id), {
          isCurrent: false,
          updatedAt: Date.now(),
        });
        console.log(`✅ Rencontre ${encounter.name} désactivée`);
      } else {
        // D'abord, retirer le statut "current" de toutes les autres rencontres
        const encountersQuery = query(
          collection(db, "encounters"),
          where("isCurrent", "==", true)
        );
        const currentEncountersSnapshot = await getDocs(encountersQuery);

        if (currentEncountersSnapshot.docs.length > 0) {
          console.log(
            `🔄 Désactivation de ${currentEncountersSnapshot.docs.length} rencontre(s) active(s)`
          );
        }

        const batch = [];
        currentEncountersSnapshot.forEach((doc) => {
          batch.push(updateDoc(doc.ref, { isCurrent: false }));
        });

        // Ensuite, marquer la rencontre sélectionnée comme actuelle
        batch.push(
          updateDoc(doc(db, "encounters", encounter.id), {
            isCurrent: true,
            updatedAt: Date.now(),
          })
        );

        await Promise.all(batch);
        console.log(
          `✅ Rencontre ${encounter.name} activée (${batch.length} opération(s) effectuée(s))`
        );
      }

      setSetCurrentDialogOpen(false);
      setSelectedEncounter(null);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la modification de la rencontre actuelle:",
        error
      );
      setError("Erreur lors de la modification de la rencontre actuelle");
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
                backgroundColor: encounter.isCurrent
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
                  {encounter.isCurrent && (
                    <Chip
                      icon={<StarIcon />}
                      label="En cours"
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
                      encounter.isCurrent
                        ? "désactiver la rencontre"
                        : "définir comme rencontre actuelle"
                    }
                    onClick={() => handleOpenSetCurrentDialog(encounter)}
                  >
                    {encounter.isCurrent ? (
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

      {/* Dialog pour confirmer la définition de la rencontre actuelle */}
      <Dialog
        open={setCurrentDialogOpen}
        onClose={() => setSetCurrentDialogOpen(false)}
      >
        <DialogTitle>
          {selectedEncounter?.isCurrent
            ? "Désactiver la rencontre"
            : "Définir comme rencontre actuelle"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {selectedEncounter?.isCurrent ? (
              <>
                Êtes-vous sûr de vouloir désactiver la rencontre "
                {selectedEncounter?.name}" ?
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir définir "{selectedEncounter?.name}"
                comme la rencontre actuelle ?
              </>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedEncounter?.isCurrent ? (
              <>
                Aucune rencontre ne sera active. Les nouvelles fonctionnalités
                nécessiteront une rencontre active.
              </>
            ) : (
              <>
                Cela remplacera la rencontre actuellement active. Les nouveaux
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
            {selectedEncounter?.isCurrent ? "Désactiver" : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
