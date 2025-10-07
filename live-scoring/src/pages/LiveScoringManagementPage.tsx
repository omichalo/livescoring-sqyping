import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Paper,
  Grid,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
} from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useCurrentEncounter } from "../hooks/useCurrentEncounter";
import type { Match, Player, Team } from "../types";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SettingsIcon from "@mui/icons-material/Settings";
import { EncounterService } from "../services/encounterService";
import { MatchScoreCard } from "../components/MatchScoreCard";

// Composant pour un match en cours draggable
interface SortableInProgressMatchProps {
  match: Match;
}

const SortableInProgressMatch: React.FC<SortableInProgressMatchProps> = ({
  match,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `match-${match.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Grid item xs={12} md={6}>
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          border: isDragging ? "2px dashed #1976d2" : "1px solid",
          borderColor: "success.main",
          borderRadius: 1,
          p: 2,
          backgroundColor: isDragging
            ? "rgba(25, 118, 210, 0.1)"
            : "success.50",
          height: "100%",
          position: "relative",
          "&:hover": {
            backgroundColor: isDragging
              ? "rgba(25, 118, 210, 0.1)"
              : "success.100",
          },
        }}
        {...attributes}
      >
        <IconButton
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
            opacity: 0.6,
            "&:hover": { opacity: 1 },
            zIndex: 1,
          }}
          {...listeners}
        >
          <DragIndicatorIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1, pr: 4 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Table {match.table} - Match {match.matchNumber}
          </Typography>
          <IconButton
            size="small"
            onClick={() => window.open(`/overlay/tv/${match.table}`, "_blank")}
            sx={{
              opacity: 0.7,
              "&:hover": { opacity: 1 },
              ml: 1,
            }}
            title="Ouvrir l'overlay TV pour cette table"
          >
            <OpenInNewIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Box
            sx={{
              position: "relative",
              ml: 1,
              "&:hover .overlay-preview": {
                opacity: 1,
                pointerEvents: "auto",
              },
            }}
          >
            <IconButton
              size="small"
              sx={{
                opacity: 0.7,
                "&:hover": { opacity: 1 },
              }}
              title="Prévisualiser l'overlay TV"
            >
              <VisibilityIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Box
              className="overlay-preview"
              sx={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                opacity: 0,
                pointerEvents: "none",
                transition: "opacity 0.2s",
                mt: 1,
              }}
            >
              <Box
                sx={{
                  width: 400,
                  height: 80, // Ratio 5:1 (400/80 = 5) pour correspondre à l'overlay 800x160
                  backgroundColor: "transparent",
                  borderRadius: 1,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <iframe
                  src={`/overlay/tv/${match.table}`}
                  style={{
                    width: "200%",
                    height: "200%",
                    border: "none",
                    borderRadius: "4px",
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                  }}
                  title={`Overlay TV Table ${match.table}`}
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <Typography variant="body2">
          {match.player1.name} vs {match.player2.name}
        </Typography>

        {/* Utilisation du composant MatchScoreCard existant */}
        <Box sx={{ mt: 2 }}>
          <MatchScoreCard match={match} />
        </Box>
      </Box>
    </Grid>
  );
};

export const LiveScoringManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentEncounter,
    loading: encounterLoading,
    error: encounterError,
  } = useCurrentEncounter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableTables, setAvailableTables] = useState<number[]>([]); // Tables disponibles
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [doubleCompositionDialogOpen, setDoubleCompositionDialogOpen] =
    useState(false);
  const [selectedDoubleMatch, setSelectedDoubleMatch] = useState<Match | null>(
    null
  );
  const [doubleComposition, setDoubleComposition] = useState({
    team1Player1: "",
    team1Player2: "",
    team2Player1: "",
    team2Player2: "",
  });
  const [confirmStartDialogOpen, setConfirmStartDialogOpen] = useState(false);
  const [pendingMatchStart, setPendingMatchStart] = useState<{
    matchId: string;
    tableNumber: number;
    matchNumber: number;
  } | null>(null);
  const [visibleTables, setVisibleTables] = useState<number[]>([]);
  const [tablesConfigDialogOpen, setTablesConfigDialogOpen] = useState(false);
  const [encounterCompleted, setEncounterCompleted] = useState(false);

  // Fonction pour charger l'ordre des tables depuis localStorage
  const loadTableOrder = (): number[] => {
    if (!currentEncounter) return [];
    const key = `tableOrder_${currentEncounter.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error(
          "Erreur lors du chargement de l'ordre des tables:",
          error
        );
      }
    }
    return [];
  };

  // Fonction pour sauvegarder l'ordre des tables dans localStorage
  const saveTableOrder = (order: number[]) => {
    if (!currentEncounter) return;
    const key = `tableOrder_${currentEncounter.id}`;
    localStorage.setItem(key, JSON.stringify(order));
  };

  // Fonction pour charger les tables visibles depuis localStorage
  const loadVisibleTables = (): number[] => {
    if (!currentEncounter) return [];
    const key = `visibleTables_${currentEncounter.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error("Erreur lors du chargement des tables visibles:", error);
      }
    }
    return []; // Retourne un tableau vide si pas de sauvegarde
  };

  // Fonction pour sauvegarder les tables visibles dans localStorage
  const saveVisibleTables = (tables: number[]) => {
    if (!currentEncounter) return;
    const key = `visibleTables_${currentEncounter.id}`;
    localStorage.setItem(key, JSON.stringify(tables));
  };

  useEffect(() => {
    if (!currentEncounter) return;

    // Générer la liste des tables disponibles basée sur numberOfTables
    const tables = Array.from(
      { length: currentEncounter.numberOfTables || 2 },
      (_, i) => i + 1
    );

    // Charger l'ordre sauvegardé ou utiliser l'ordre par défaut
    const savedOrder = loadTableOrder();
    if (savedOrder.length === tables.length) {
      setAvailableTables(savedOrder);
    } else {
      setAvailableTables(tables);
    }

    // Charger les tables visibles sauvegardées ou utiliser toutes les tables par défaut
    const savedVisibleTables = loadVisibleTables();
    if (savedVisibleTables.length > 0) {
      setVisibleTables(savedVisibleTables);
    } else {
      setVisibleTables(tables);
    }

    // Écouter les matchs de la rencontre active
    const matchesQuery = query(
      collection(db, "matches"),
      where("encounterId", "==", currentEncounter.id),
      orderBy("matchNumber")
    );

    const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];
      setMatches(matchesData);
    });

    // Écouter les joueurs de la rencontre active
    const playersQuery = query(
      collection(db, "players"),
      where("encounterId", "==", currentEncounter.id)
    );

    const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[];
      setPlayers(playersData);
    });

    // Récupérer les équipes
    const teamsQuery = query(collection(db, "teams"));
    const unsubscribeTeams = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const teamsData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Team))
          .sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.name.localeCompare(b.name);
          });
        setTeams(teamsData);
      },
      (error) => {
        console.error("Erreur lors de la récupération des équipes:", error);
      }
    );

    return () => {
      unsubscribeMatches();
      unsubscribePlayers();
      unsubscribeTeams();
    };
  }, [currentEncounter]);

  // Vérifier si la rencontre est terminée
  useEffect(() => {
    if (!currentEncounter) return;

    const checkEncounterStatus = async () => {
      try {
        const { EncounterService } = await import(
          "../services/encounterService"
        );
        const status = await EncounterService.checkEncounterCompletion(
          currentEncounter.id
        );
        setEncounterCompleted(status.isCompleted);
      } catch (error) {
        console.error(
          "Erreur lors de la vérification du statut de la rencontre:",
          error
        );
      }
    };

    checkEncounterStatus();
  }, [currentEncounter, matches]);

  const getUsedTables = () => {
    return matches
      .filter((match) => match.status === "inProgress" && match.table)
      .map((match) => match.table!);
  };

  const getAvailableTables = () => {
    const usedTables = getUsedTables();
    return availableTables.filter((table) => !usedTables.includes(table));
  };

  const getVisibleAvailableTables = () => {
    const usedTables = getUsedTables();
    return availableTables
      .filter((table) => visibleTables.includes(table))
      .filter((table) => !usedTables.includes(table));
  };

  const toggleTableVisibility = (tableNumber: number) => {
    const newVisibleTables = visibleTables.includes(tableNumber)
      ? visibleTables.filter((t) => t !== tableNumber)
      : [...visibleTables, tableNumber].sort();

    setVisibleTables(newVisibleTables);
    saveVisibleTables(newVisibleTables);
  };

  const selectAllTables = () => {
    setVisibleTables(availableTables);
    saveVisibleTables(availableTables);
  };

  const deselectAllTables = () => {
    setVisibleTables([]);
    saveVisibleTables([]);
  };

  const getNextMatchNumber = () => {
    if (waitingMatches.length === 0) return null;
    return Math.min(...waitingMatches.map((m) => m.matchNumber));
  };

  const handleStartMatchClick = (matchId: string, tableNumber: number) => {
    const match = waitingMatches.find((m) => m.id === matchId);
    if (!match) return;

    const nextMatchNumber = getNextMatchNumber();

    // Si c'est le prochain match à lancer, démarrer directement
    if (nextMatchNumber === match.matchNumber) {
      startMatch(matchId, tableNumber);
    } else {
      // Sinon, demander confirmation
      setPendingMatchStart({
        matchId,
        tableNumber,
        matchNumber: match.matchNumber,
      });
      setConfirmStartDialogOpen(true);
    }
  };

  const confirmStartMatch = async () => {
    if (!pendingMatchStart) return;

    await startMatch(pendingMatchStart.matchId, pendingMatchStart.tableNumber);
    setConfirmStartDialogOpen(false);
    setPendingMatchStart(null);
  };

  const cancelStartMatch = () => {
    setConfirmStartDialogOpen(false);
    setPendingMatchStart(null);
  };

  const startMatch = async (matchId: string, tableNumber: number) => {
    try {
      const matchRef = doc(db, "matches", matchId);
      await updateDoc(matchRef, {
        status: "inProgress",
        table: tableNumber,
        startTime: Date.now(),
      });
    } catch (error) {
      console.error("Erreur lors du démarrage du match:", error);
      setError("Erreur lors du démarrage du match");
    }
  };

  const stopMatch = async (matchId: string) => {
    try {
      const matchRef = doc(db, "matches", matchId);
      await updateDoc(matchRef, {
        status: "waiting",
        table: null,
      });
    } catch (error) {
      console.error("Erreur lors de l'arrêt du match:", error);
      setError("Erreur lors de l'arrêt du match");
    }
  };

  const updatePlayerName = async () => {
    if (!editingPlayer || !newPlayerName.trim()) return;

    setLoading(true);
    try {
      const playerRef = doc(db, "players", editingPlayer.id);
      await updateDoc(playerRef, {
        name: newPlayerName.trim(),
      });

      // Mettre à jour aussi les matchs concernés
      const batch = [];
      matches.forEach((match) => {
        if (match.player1.id === editingPlayer.id) {
          batch.push(
            updateDoc(doc(db, "matches", match.id), {
              "player1.name": newPlayerName.trim(),
            })
          );
        }
        if (match.player2.id === editingPlayer.id) {
          batch.push(
            updateDoc(doc(db, "matches", match.id), {
              "player2.name": newPlayerName.trim(),
            })
          );
        }
      });

      if (batch.length > 0) {
        await Promise.all(batch);
      }

      setEditingPlayer(null);
      setNewPlayerName("");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du joueur:", error);
      setError("Erreur lors de la mise à jour du joueur");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayerName(player.name);
  };

  const closeEditDialog = () => {
    setEditingPlayer(null);
    setNewPlayerName("");
  };

  // Fonctions pour la gestion des compositions de doubles
  const isDoubleMatch = (match: Match) => {
    return (
      match.player1.name.includes("Composition à définir") ||
      match.player1.name.includes("Double")
    );
  };

  const openDoubleCompositionDialog = (match: Match) => {
    setSelectedDoubleMatch(match);
    setDoubleComposition({
      team1Player1: "",
      team1Player2: "",
      team2Player1: "",
      team2Player2: "",
    });
    setDoubleCompositionDialogOpen(true);
  };

  const closeDoubleCompositionDialog = () => {
    setDoubleCompositionDialogOpen(false);
    setSelectedDoubleMatch(null);
    setDoubleComposition({
      team1Player1: "",
      team1Player2: "",
      team2Player1: "",
      team2Player2: "",
    });
  };

  const saveDoubleComposition = async () => {
    if (!selectedDoubleMatch) return;

    // Validation
    if (
      !doubleComposition.team1Player1 ||
      !doubleComposition.team1Player2 ||
      !doubleComposition.team2Player1 ||
      !doubleComposition.team2Player2
    ) {
      setError("Tous les joueurs doivent être sélectionnés");
      return;
    }

    setLoading(true);
    try {
      const matchRef = doc(db, "matches", selectedDoubleMatch.id);
      await updateDoc(matchRef, {
        "player1.name": `${doubleComposition.team1Player1} / ${doubleComposition.team1Player2}`,
        "player2.name": `${doubleComposition.team2Player1} / ${doubleComposition.team2Player2}`,
      });

      setSnackbarMessage("Composition du double sauvegardée avec succès");
      setSnackbarOpen(true);
      closeDoubleCompositionDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la composition:", error);
      setError("Erreur lors de la sauvegarde de la composition");
    } finally {
      setLoading(false);
    }
  };

  const getTeamPlayers = (teamId: string) => {
    return players.filter((player) => player.teamId === teamId);
  };

  // Capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fonction de drag & drop pour les matchs en cours (réorganisation des tables)
  const handleMatchDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Extraire l'ID du match depuis l'ID du sortable
    const activeMatchId = active.id.toString().replace("match-", "");
    const overMatchId = over.id.toString().replace("match-", "");

    const activeMatch = inProgressMatches.find((m) => m.id === activeMatchId);
    const overMatch = inProgressMatches.find((m) => m.id === overMatchId);

    if (!activeMatch || !overMatch) return;

    // Trouver les index des tables dans l'ordre actuel
    const oldIndex = availableTables.indexOf(activeMatch.table || 0);
    const newIndex = availableTables.indexOf(overMatch.table || 0);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(availableTables, oldIndex, newIndex);
      setAvailableTables(newOrder);
      saveTableOrder(newOrder);
    }
  };

  if (encounterLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (encounterError || !currentEncounter) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {encounterError ||
            "Aucune rencontre active. Veuillez d'abord créer une rencontre."}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/encounters/new")}
          sx={{ mt: 2 }}
        >
          Créer une rencontre
        </Button>
      </Box>
    );
  }

  const waitingMatches = matches.filter((m) => m.status === "waiting");
  const allInProgressMatches = matches.filter((m) => m.status === "inProgress");
  const inProgressMatches = allInProgressMatches
    .filter((m) => m.table && visibleTables.includes(m.table)) // Filtrer par tables visibles
    .sort((a, b) => {
      // Trier par ordre des tables (selon l'ordre sauvegardé)
      const aIndex = availableTables.indexOf(a.table || 0);
      const bIndex = availableTables.indexOf(b.table || 0);
      return aIndex - bIndex;
    });
  const finishedMatches = matches.filter((m) => m.status === "finished");

  // Vérifier s'il y a des matchs en cours sur des tables masquées
  const hiddenInProgressMatches = allInProgressMatches.filter(
    (m) => m.table && !visibleTables.includes(m.table)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleMatchDragEnd}
    >
      <Box sx={{ p: 1 }}>
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom color="primary">
            Live Scoring & Gestion des matchs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les matchs, attribuez les tables, saisissez les scores et
            modifiez les noms des joueurs
          </Typography>
        </Box>

        {/* Affichage du score de la rencontre */}
        <Paper
          sx={{
            p: 3,
            mb: 2,
            background: encounterCompleted
              ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
              : "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            color: "white",
            borderRadius: 2,
            boxShadow: encounterCompleted
              ? "0 4px 20px rgba(255, 107, 107, 0.3)"
              : "0 4px 20px rgba(25, 118, 210, 0.3)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Informations de la rencontre */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {currentEncounter.name}
              </Typography>
              {encounterCompleted && (
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#ffd700", mt: 1 }}
                >
                  🏆 RENCONTRE TERMINÉE ! 🏆
                </Typography>
              )}
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {waitingMatches.length} en attente • {inProgressMatches.length}{" "}
                en cours • {finishedMatches.length} terminés
                {encounterCompleted && " - Score acquis atteint !"}
              </Typography>
            </Box>

            {/* Score de la rencontre */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              {/* Équipe 1 */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 0.5, opacity: 0.9 }}
                >
                  {teams.find((t) => t.id === currentEncounter.team1Id)?.name ||
                    "Équipe 1"}
                </Typography>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {teams.find((t) => t.id === currentEncounter.team1Id)
                      ?.matchesWon || 0}
                  </Typography>
                </Box>
              </Box>

              {/* Séparateur */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    borderRadius: "50%",
                  }}
                />
                <Typography variant="h3" sx={{ fontWeight: 300, mx: 2 }}>
                  -
                </Typography>
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    borderRadius: "50%",
                  }}
                />
              </Box>

              {/* Équipe 2 */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 0.5, opacity: 0.9 }}
                >
                  {teams.find((t) => t.id === currentEncounter.team2Id)?.name ||
                    "Équipe 2"}
                </Typography>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {teams.find((t) => t.id === currentEncounter.team2Id)
                      ?.matchesWon || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Colonne de gauche avec ascenseur */}
          <Grid item xs={12} lg={2}>
            <Paper
              sx={{
                p: 2,
                height: "calc(100vh - 200px)",
                overflowY: "auto",
                position: "sticky",
                top: 20,
              }}
            >
              {/* Matchs en attente */}
              <Typography variant="h6" gutterBottom color="primary">
                Matchs en attente ({waitingMatches.length})
              </Typography>

              <Stack spacing={2} sx={{ mb: 3 }}>
                {waitingMatches.map((match) => (
                  <Box
                    key={match.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "grey.300",
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Typography variant="body2" gutterBottom>
                      <strong>Match {match.matchNumber}</strong>
                    </Typography>
                    <Typography variant="body2">
                      {match.player1.name} vs {match.player2.name}
                    </Typography>

                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {isDoubleMatch(match) ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() => openDoubleCompositionDialog(match)}
                          disabled={
                            match.status === "inProgress" ||
                            match.status === "finished"
                          }
                        >
                          Définir composition
                        </Button>
                      ) : (
                        getVisibleAvailableTables().map((table) => (
                          <Button
                            key={table}
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              handleStartMatchClick(match.id, table)
                            }
                            startIcon={<PlayArrowIcon />}
                          >
                            Table {table}
                          </Button>
                        ))
                      )}
                    </Box>

                    {getVisibleAvailableTables().length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Aucune table visible disponible
                      </Typography>
                    )}
                  </Box>
                ))}

                {waitingMatches.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    Aucun match en attente
                  </Typography>
                )}
              </Stack>

              {/* Matchs terminés */}
              <Typography variant="h6" gutterBottom color="success.main">
                Matchs terminés ({finishedMatches.length})
              </Typography>

              <Stack spacing={1}>
                {finishedMatches.map((match) => (
                  <Box
                    key={match.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "success.main",
                      borderRadius: 1,
                      p: 1.5,
                      backgroundColor: "success.50",
                    }}
                  >
                    <Typography variant="body2" gutterBottom>
                      <strong>Match {match.matchNumber}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                      {match.player1.name} vs {match.player2.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        color: "success.main",
                        fontSize: "0.8rem",
                      }}
                    >
                      {match.setsWon.player1} - {match.setsWon.player2}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Table {match.table}
                    </Typography>
                  </Box>
                ))}

                {finishedMatches.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    Aucun match terminé
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Matchs en cours */}
          <Grid item xs={12} lg={10}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" color="success.main">
                  Matchs en cours ({inProgressMatches.length}
                  {allInProgressMatches.length !== inProgressMatches.length &&
                    ` / ${allInProgressMatches.length} total`}
                  )
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => setTablesConfigDialogOpen(true)}
                >
                  Configurer les tables
                </Button>
              </Box>

              <SortableContext
                items={inProgressMatches.map((m) => `match-${m.id}`)}
                strategy={horizontalListSortingStrategy}
              >
                <Grid container spacing={2}>
                  {inProgressMatches.map((match) => (
                    <SortableInProgressMatch key={match.id} match={match} />
                  ))}

                  {inProgressMatches.length === 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          {hiddenInProgressMatches.length > 0
                            ? `Aucun match en cours sur les tables visibles (${hiddenInProgressMatches.length} match(s) sur des tables masquées)`
                            : "Aucun match en cours"}
                        </Typography>

                        {/* Liens vers les overlays des tables */}
                        <Typography variant="h6" gutterBottom color="primary">
                          Overlays des tables
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Cliquez sur une table pour ouvrir son overlay dans un
                          nouvel onglet
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {visibleTables.map((tableNumber) => (
                            <Button
                              key={tableNumber}
                              variant="outlined"
                              startIcon={<OpenInNewIcon />}
                              onClick={() =>
                                window.open(
                                  `/overlay/tv/${tableNumber}`,
                                  "_blank"
                                )
                              }
                              sx={{ minWidth: 120 }}
                            >
                              Table {tableNumber}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </SortableContext>
            </Paper>
          </Grid>
        </Grid>

        {/* Dialog de confirmation pour démarrer un match qui n'est pas le prochain */}
        <Dialog
          open={confirmStartDialogOpen}
          onClose={cancelStartMatch}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirmer le démarrage du match</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Vous êtes sur le point de démarrer le{" "}
              <strong>Match {pendingMatchStart?.matchNumber} </strong>
              sur la <strong>Table {pendingMatchStart?.tableNumber}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ⚠️ Ce match n'est pas le prochain dans l'ordre prévu. Voulez-vous
              vraiment le démarrer maintenant ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelStartMatch} color="inherit">
              Annuler
            </Button>
            <Button
              onClick={confirmStartMatch}
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
            >
              Démarrer le match
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de configuration des tables */}
        <Dialog
          open={tablesConfigDialogOpen}
          onClose={() => setTablesConfigDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Configuration des tables visibles</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sélectionnez les tables que vous souhaitez afficher dans
              l'interface. Les tables non sélectionnées ne seront pas visibles
              pour l'attribution des matchs.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Button size="small" onClick={selectAllTables}>
                Tout sélectionner
              </Button>
              <Button size="small" onClick={deselectAllTables}>
                Tout désélectionner
              </Button>
            </Box>

            <FormGroup>
              {availableTables.map((tableNumber) => (
                <FormControlLabel
                  key={tableNumber}
                  control={
                    <Checkbox
                      checked={visibleTables.includes(tableNumber)}
                      onChange={() => toggleTableVisibility(tableNumber)}
                    />
                  }
                  label={`Table ${tableNumber}`}
                />
              ))}
            </FormGroup>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              Tables visibles : {visibleTables.length} /{" "}
              {availableTables.length}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTablesConfigDialogOpen(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Gestion des joueurs */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Gestion des joueurs ({players.length})
          </Typography>

          <Grid container spacing={2}>
            {players.map((player) => (
              <Grid item xs={12} sm={6} md={4} key={player.id}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "grey.300",
                    borderRadius: 1,
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">{player.name}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(player)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Dialog de modification de joueur */}
        <Dialog
          open={!!editingPlayer}
          onClose={closeEditDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Modifier le nom du joueur</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Nom du joueur"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              sx={{ mt: 2 }}
              disabled={loading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog} disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={updatePlayerName}
              variant="contained"
              disabled={loading || !newPlayerName.trim()}
            >
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de composition des doubles */}
        <Dialog
          open={doubleCompositionDialogOpen}
          onClose={closeDoubleCompositionDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Définir la composition du double</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Match {selectedDoubleMatch?.matchNumber} - Sélectionnez les
              joueurs pour chaque équipe
            </Typography>

            <Grid container spacing={3}>
              {/* Équipe 1 */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary">
                  Équipe 1
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Premier joueur</InputLabel>
                  <Select
                    value={doubleComposition.team1Player1}
                    onChange={(e) =>
                      setDoubleComposition((prev) => ({
                        ...prev,
                        team1Player1: e.target.value,
                      }))
                    }
                    label="Premier joueur"
                  >
                    {getTeamPlayers(
                      selectedDoubleMatch?.player1.teamId || ""
                    ).map((player) => (
                      <MenuItem key={player.id} value={player.name}>
                        {player.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Deuxième joueur</InputLabel>
                  <Select
                    value={doubleComposition.team1Player2}
                    onChange={(e) =>
                      setDoubleComposition((prev) => ({
                        ...prev,
                        team1Player2: e.target.value,
                      }))
                    }
                    label="Deuxième joueur"
                  >
                    {getTeamPlayers(selectedDoubleMatch?.player1.teamId || "")
                      .filter(
                        (player) =>
                          player.name !== doubleComposition.team1Player1
                      )
                      .map((player) => (
                        <MenuItem key={player.id} value={player.name}>
                          {player.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Équipe 2 */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Équipe 2
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Premier joueur</InputLabel>
                  <Select
                    value={doubleComposition.team2Player1}
                    onChange={(e) =>
                      setDoubleComposition((prev) => ({
                        ...prev,
                        team2Player1: e.target.value,
                      }))
                    }
                    label="Premier joueur"
                  >
                    {getTeamPlayers(
                      selectedDoubleMatch?.player2.teamId || ""
                    ).map((player) => (
                      <MenuItem key={player.id} value={player.name}>
                        {player.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Deuxième joueur</InputLabel>
                  <Select
                    value={doubleComposition.team2Player2}
                    onChange={(e) =>
                      setDoubleComposition((prev) => ({
                        ...prev,
                        team2Player2: e.target.value,
                      }))
                    }
                    label="Deuxième joueur"
                  >
                    {getTeamPlayers(selectedDoubleMatch?.player2.teamId || "")
                      .filter(
                        (player) =>
                          player.name !== doubleComposition.team2Player1
                      )
                      .map((player) => (
                        <MenuItem key={player.id} value={player.name}>
                          {player.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Aperçu de la composition */}
            {doubleComposition.team1Player1 &&
              doubleComposition.team1Player2 &&
              doubleComposition.team2Player1 &&
              doubleComposition.team2Player2 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: "grey.50",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Aperçu de la composition :
                  </Typography>
                  <Typography variant="body2">
                    <strong>
                      {doubleComposition.team1Player1} /{" "}
                      {doubleComposition.team1Player2}
                    </strong>{" "}
                    vs{" "}
                    <strong>
                      {doubleComposition.team2Player1} /{" "}
                      {doubleComposition.team2Player2}
                    </strong>
                  </Typography>
                </Box>
              )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDoubleCompositionDialog} disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={saveDoubleComposition}
              variant="contained"
              disabled={
                loading ||
                !doubleComposition.team1Player1 ||
                !doubleComposition.team1Player2 ||
                !doubleComposition.team2Player1 ||
                !doubleComposition.team2Player2
              }
            >
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </DndContext>
  );
};
