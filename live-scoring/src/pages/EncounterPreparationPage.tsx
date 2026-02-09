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
  Divider,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useCurrentEncounter } from "../hooks/useCurrentEncounter";
import type { Player, Team, Match } from "../types";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

// Composant pour un match draggable
interface SortableMatchProps {
  match: Partial<Match>;
  index: number;
  onDelete: () => void;
  hasLaunchedMatches?: boolean;
}

const SortableMatch: React.FC<SortableMatchProps> = ({
  match,
  index,
  onDelete,
  hasLaunchedMatches = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: match.id || `temp_${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getMatchType = () => {
    if (match.player1?.name?.includes("Composition")) {
      return "Double";
    }
    if (match.player1?.name?.includes("Joueur à définir")) {
      return "À définir";
    }
    return "Simple";
  };

  const getMatchTypeColor = () => {
    const type = getMatchType();
    switch (type) {
      case "Double":
        return "secondary";
      case "À définir":
        return "warning";
      case "Simple":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        cursor: isDragging ? "grabbing" : "grab",
        border: isDragging ? "2px dashed #1976d2" : "1px solid #e0e0e0",
      }}
    >
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            {...attributes}
            {...listeners}
            size="small"
            sx={{ cursor: "grab", "&:active": { cursor: "grabbing" } }}
          >
            <DragIndicatorIcon />
          </IconButton>

          <Chip
            label={`Match ${index + 1}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ minWidth: 60 }}
          />

          <Chip
            label={getMatchType()}
            size="small"
            color={getMatchTypeColor()}
            variant="filled"
          />

          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {match.player1?.name || "Joueur 1"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              VS
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {match.player2?.name || "Joueur 2"}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={onDelete}
            color="error"
            disabled={hasLaunchedMatches}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

// Composant pour un joueur draggable
interface SortablePlayerProps {
  player: Player;
  teamName: string;
  teamId: string;
  isTeam1: boolean;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  hasLaunchedMatches?: boolean;
}

const SortablePlayer: React.FC<SortablePlayerProps> = ({
  player,
  teamName,
  teamId,
  isTeam1,
  onDelete,
  onNameChange,
  hasLaunchedMatches = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Déterminer la couleur du chip selon l'équipe
  const getTeamColor = () => {
    // Utiliser primary pour la première équipe (A, B, C, D) et secondary pour la seconde (W, X, Y, Z)
    return isTeam1 ? "primary" : "secondary";
  };

  // Déterminer la lettre selon l'équipe
  const getPlayerLetter = () => {
    return isTeam1
      ? String.fromCharCode(65 + (player.order || 0)) // A, B, C, D pour l'équipe 1
      : String.fromCharCode(87 + (player.order || 0)); // W, X, Y, Z pour l'équipe 2
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        cursor: isDragging ? "grabbing" : "grab",
        border: isDragging ? "2px dashed #1976d2" : "1px solid #e0e0e0",
      }}
    >
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            {...attributes}
            {...listeners}
            size="small"
            sx={{ cursor: "grab", "&:active": { cursor: "grabbing" } }}
          >
            <DragIndicatorIcon />
          </IconButton>

          <Chip
            label={getPlayerLetter()}
            size="small"
            color={getTeamColor()}
            sx={{ minWidth: 32, fontWeight: "bold" }}
          />

          <TextField
            fullWidth
            size="small"
            value={player.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={`Nom du joueur ${getPlayerLetter()}`}
            disabled={isDragging}
          />

          <IconButton
            size="small"
            onClick={onDelete}
            color="error"
            disabled={hasLaunchedMatches}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

// Modèles de championnats FFTT
const CHAMPIONSHIP_MODELS = [
  {
    id: "format_14_acquired",
    name: "Format 14 matchs - Score acquis",
    description: "12 simples + 2 doubles, arrêt à 8 victoires",
    formula: "14 matchs au total",
    minPlayers: 4,
    maxPlayers: 4,
    details: "Chaque joueur: 2 simples + 1 double max",
  },
  {
    id: "format_14_non_acquired",
    name: "Format 14 matchs - Score non acquis",
    description: "12 simples + 2 doubles, tous les matchs joués",
    formula: "14 matchs au total",
    minPlayers: 4,
    maxPlayers: 4,
    details: "Tous les matchs joués même après 8 victoires",
  },
  {
    id: "custom",
    name: "Personnalisé",
    description: "Créer les matchs librement",
    formula: "Nombre défini par l'utilisateur",
    minPlayers: 1,
    maxPlayers: 10,
    details: "Flexibilité totale pour définir les matchs",
  },
];

export const EncounterPreparationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentEncounter,
    loading: encounterLoading,
    error: encounterError,
  } = useCurrentEncounter();

  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [selectedModel, setSelectedModel] =
    useState<string>("format_14_acquired");
  const [customMatchCount, setCustomMatchCount] = useState<number>(16);
  const [generatedMatches, setGeneratedMatches] = useState<Partial<Match>[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingMatches, setExistingMatches] = useState<Match[]>([]);
  const [hasExistingMatches, setHasExistingMatches] = useState(false);
  const [hasLaunchedMatches, setHasLaunchedMatches] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMatches, setDeletingMatches] = useState(false);
  const [teamsSwapped, setTeamsSwapped] = useState(false);

  // Capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!currentEncounter) return;

      try {
        // Récupérer les équipes
        const teamsSnapshot = await getDocs(collection(db, "teams"));
        const teamsData = teamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];

        const team1Data = teamsData.find(
          (t) => t.id === currentEncounter.team1Id
        );
        const team2Data = teamsData.find(
          (t) => t.id === currentEncounter.team2Id
        );

        setTeam1(team1Data || null);
        setTeam2(team2Data || null);

        // Récupérer les joueurs existants pour cette rencontre
        const playersQuery = query(
          collection(db, "players"),
          where("encounterId", "==", currentEncounter.id)
        );
        const playersSnapshot = await getDocs(playersQuery);
        const playersData = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[];

        // Trier les joueurs par ordre et assigner un ordre par défaut si manquant
        const team1PlayersData = playersData
          .filter((p) => p.teamId === currentEncounter.team1Id)
          .map((player, index) => ({
            ...player,
            order: player.order !== undefined ? player.order : index,
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const team2PlayersData = playersData
          .filter((p) => p.teamId === currentEncounter.team2Id)
          .map((player, index) => ({
            ...player,
            order: player.order !== undefined ? player.order : index,
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        setTeam1Players(team1PlayersData);
        setTeam2Players(team2PlayersData);

        // Vérifier s'il existe déjà des matchs pour cette rencontre
        const matchesQuery = query(
          collection(db, "matches"),
          where("encounterId", "==", currentEncounter.id)
        );
        const matchesSnapshot = await getDocs(matchesQuery);
        const matchesData = matchesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Match[];

        setExistingMatches(matchesData);
        setHasExistingMatches(matchesData.length > 0);

        // Vérifier s'il y a des matchs lancés (inProgress ou finished)
        const hasLaunched = matchesData.some(
          (match) =>
            match.status === "inProgress" || match.status === "finished"
        );
        setHasLaunchedMatches(hasLaunched);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        setError("Erreur lors du chargement des données");
      }
    };

    fetchData();
  }, [currentEncounter]);

  const addPlayer = async (teamId: string) => {
    const isTeam1 = teamId === currentEncounter?.team1Id;
    const currentPlayers = isTeam1 ? team1Players : team2Players;

    try {
      // Créer directement le joueur dans Firestore
      const playerRef = doc(collection(db, "players"));
      const newPlayerData = {
        name: "",
        teamId,
        encounterId: currentEncounter?.id,
        order: currentPlayers.length, // Ordre automatique
      };

      await setDoc(playerRef, newPlayerData);

      // Créer l'objet joueur avec l'ID Firestore
      const newPlayer: Player = {
        id: playerRef.id,
        name: "",
        teamId,
        encounterId: currentEncounter?.id || "",
        order: currentPlayers.length,
      };

      if (isTeam1) {
        setTeam1Players([...team1Players, newPlayer]);
      } else {
        setTeam2Players([...team2Players, newPlayer]);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du joueur:", error);
      setError("Erreur lors de l'ajout du joueur");
    }
  };

  const updatePlayerName = async (
    teamId: string,
    index: number,
    name: string
  ) => {
    if (teamId === currentEncounter?.team1Id) {
      const updated = [...team1Players];
      const player = updated[index];
      updated[index] = { ...player, name };
      setTeam1Players(updated);

      // Sauvegarder immédiatement dans Firestore si le joueur existe déjà
      if (!player.id.startsWith("temp_")) {
        try {
          await updateDoc(doc(db, "players", player.id), {
            name: name.trim(),
          });
        } catch (error) {
          console.error(
            "Erreur lors de la sauvegarde du nom du joueur:",
            error
          );
        }
      }
    } else {
      const updated = [...team2Players];
      const player = updated[index];
      updated[index] = { ...player, name };
      setTeam2Players(updated);

      // Sauvegarder immédiatement dans Firestore si le joueur existe déjà
      if (!player.id.startsWith("temp_")) {
        try {
          await updateDoc(doc(db, "players", player.id), {
            name: name.trim(),
          });
        } catch (error) {
          console.error(
            "Erreur lors de la sauvegarde du nom du joueur:",
            error
          );
        }
      }
    }
  };

  const removePlayer = async (teamId: string, index: number) => {
    if (teamId === currentEncounter?.team1Id) {
      const playerToRemove = team1Players[index];
      const updatedPlayers = team1Players.filter((_, i) => i !== index);
      setTeam1Players(updatedPlayers);

      // Supprimer de Firestore si le joueur existe déjà
      if (playerToRemove && !playerToRemove.id.startsWith("temp_")) {
        try {
          await deleteDoc(doc(db, "players", playerToRemove.id));

          // Réorganiser les ordres des joueurs restants
          const reorderedPlayers = updatedPlayers.map((player, index) => ({
            ...player,
            order: index,
          }));
          setTeam1Players(reorderedPlayers);

          // Sauvegarder les nouveaux ordres
          for (const player of reorderedPlayers) {
            await savePlayerOrder(player.id, player.order || 0);
          }
        } catch (error) {
          console.error("Erreur lors de la suppression du joueur:", error);
        }
      }
    } else {
      const playerToRemove = team2Players[index];
      const updatedPlayers = team2Players.filter((_, i) => i !== index);
      setTeam2Players(updatedPlayers);

      // Supprimer de Firestore si le joueur existe déjà
      if (playerToRemove && !playerToRemove.id.startsWith("temp_")) {
        try {
          await deleteDoc(doc(db, "players", playerToRemove.id));

          // Réorganiser les ordres des joueurs restants
          const reorderedPlayers = updatedPlayers.map((player, index) => ({
            ...player,
            order: index,
          }));
          setTeam2Players(reorderedPlayers);

          // Sauvegarder les nouveaux ordres
          for (const player of reorderedPlayers) {
            await savePlayerOrder(player.id, player.order || 0);
          }
        } catch (error) {
          console.error("Erreur lors de la suppression du joueur:", error);
        }
      }
    }
  };

  // Fonction pour sauvegarder l'ordre d'un joueur dans Firestore
  const savePlayerOrder = async (playerId: string, order: number) => {
    if (!playerId.startsWith("temp_")) {
      try {
        await updateDoc(doc(db, "players", playerId), {
          order: order,
        });
      } catch (error) {
        console.error(
          "Erreur lors de la sauvegarde de l'ordre du joueur:",
          error
        );
      }
    }
  };

  // Fonctions de drag & drop pour les joueurs
  const handlePlayerDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Déterminer quelle équipe est concernée
    const activePlayer = [...team1Players, ...team2Players].find(
      (p) => p.id === active.id
    );
    if (!activePlayer) return;

    const isTeam1 = activePlayer.teamId === currentEncounter?.team1Id;

    if (isTeam1) {
      const oldIndex = team1Players.findIndex((p) => p.id === active.id);
      const newIndex = team1Players.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPlayers = arrayMove(team1Players, oldIndex, newIndex);
        // Mettre à jour les ordres
        const updatedPlayers = reorderedPlayers.map((player, index) => ({
          ...player,
          order: index,
        }));
        setTeam1Players(updatedPlayers);

        // Sauvegarder l'ordre dans Firestore pour chaque joueur
        for (const player of updatedPlayers) {
          await savePlayerOrder(player.id, player.order || 0);
        }
      }
    } else {
      const oldIndex = team2Players.findIndex((p) => p.id === active.id);
      const newIndex = team2Players.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPlayers = arrayMove(team2Players, oldIndex, newIndex);
        // Mettre à jour les ordres
        const updatedPlayers = reorderedPlayers.map((player, index) => ({
          ...player,
          order: index,
        }));
        setTeam2Players(updatedPlayers);

        // Sauvegarder l'ordre dans Firestore pour chaque joueur
        for (const player of updatedPlayers) {
          await savePlayerOrder(player.id, player.order || 0);
        }
      }
    }
  };

  // Fonctions de drag & drop pour les matchs
  const handleMatchDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = generatedMatches.findIndex(
      (m) => (m.id || `temp_${generatedMatches.indexOf(m)}`) === active.id
    );
    const newIndex = generatedMatches.findIndex(
      (m) => (m.id || `temp_${generatedMatches.indexOf(m)}`) === over.id
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedMatches = arrayMove(generatedMatches, oldIndex, newIndex);
      // Mettre à jour les ordres et les numéros de match
      const updatedMatches = reorderedMatches.map((match, index) => ({
        ...match,
        order: index,
        matchNumber: index + 1,
      }));
      setGeneratedMatches(updatedMatches);
    }
  };

  // Générer les matchs et les stocker dans l'état
  const generateMatches = () => {
    const matches = generateAllMatches();
    const matchesWithOrder = matches.map((match, index) => ({
      ...match,
      order: index,
      matchNumber: index + 1,
    }));
    setGeneratedMatches(matchesWithOrder);
  };

  // Supprimer un match
  const removeMatch = (index: number) => {
    const updatedMatches = generatedMatches
      .filter((_, i) => i !== index)
      .map((match, index) => ({
        ...match,
        order: index,
        matchNumber: index + 1,
      }));
    setGeneratedMatches(updatedMatches);
  };

  const getGeneratedMatchesCount = () => {
    switch (selectedModel) {
      case "format_14_acquired":
      case "format_14_non_acquired":
        return 14;
      case "custom":
        return customMatchCount;
      default:
        return 0;
    }
  };

  const generateAllMatches = () => {
    const allPlayers = [...team1Players, ...team2Players];
    const matches: Partial<Match>[] = [];

    const totalPlayers = team1Players.length + team2Players.length;
    const model = CHAMPIONSHIP_MODELS.find((m) => m.id === selectedModel);

    if (!model) {
      console.error("Modèle non trouvé:", selectedModel);
      return matches;
    }

    // Validation du nombre de joueurs pour le modèle sélectionné
    if (totalPlayers < model.minPlayers || totalPlayers > model.maxPlayers) {
      console.warn(
        `Modèle ${model.name} nécessite entre ${model.minPlayers} et ${model.maxPlayers} joueurs`
      );
    }

    switch (selectedModel) {
      case "format_14_acquired":
      case "format_14_non_acquired":
        // Format 14 matchs - 12 simples + 2 doubles
        if (team1Players.length === 4 && team2Players.length === 4) {
          // Ordre exact des 14 matchs selon les règles FFTT officielles
          const matchOrder = [
            // Matchs 1-4 : Première série de simples (ordre croisé FFTT)
            { team1Index: 0, team2Index: 0, type: "simple" }, // Match 1: A vs W (A vs 1er)
            { team1Index: 1, team2Index: 1, type: "simple" }, // Match 2: B vs X (B vs 2ème)
            { team1Index: 2, team2Index: 2, type: "simple" }, // Match 3: C vs Y (C vs 3ème)
            { team1Index: 3, team2Index: 3, type: "simple" }, // Match 4: D vs Z (D vs 4ème)

            // Matchs 5-8 : Deuxième série de simples
            { team1Index: 0, team2Index: 1, type: "simple" }, // Match 5: A vs X (A vs 2ème)
            { team1Index: 1, team2Index: 0, type: "simple" }, // Match 6: B vs W (B vs 1er)
            { team1Index: 3, team2Index: 2, type: "simple" }, // Match 7: D vs Y (D vs 3ème)
            { team1Index: 2, team2Index: 3, type: "simple" }, // Match 8: C vs Z (C vs 4ème)

            // Matchs 9-10 : Doubles (compositions libres)
            {
              team1Index: -1,
              team2Index: -1,
              type: "double",
              name: "Double 1",
            }, // Match 9: Double 1
            {
              team1Index: -1,
              team2Index: -1,
              type: "double",
              name: "Double 2",
            }, // Match 10: Double 2

            // Matchs 11-14 : Troisième série de simples
            { team1Index: 0, team2Index: 2, type: "simple" }, // Match 11: A vs Y (A vs 3ème)
            { team1Index: 2, team2Index: 0, type: "simple" }, // Match 12: C vs W (C vs 1er)
            { team1Index: 3, team2Index: 1, type: "simple" }, // Match 13: D vs X (D vs 2ème)
            { team1Index: 1, team2Index: 3, type: "simple" }, // Match 14: B vs Z (B vs 4ème)
          ];

          matchOrder.forEach((match, index) => {
            if (match.type === "double") {
              // Match de double - compositions à définir plus tard
              matches.push({
                player1: {
                  id: `double1_team1_${index}`,
                  name: "Composition à définir",
                  teamId: team1Players[0]?.teamId || "",
                },
                player2: {
                  id: `double1_team2_${index}`,
                  name: "Composition à définir",
                  teamId: team2Players[0]?.teamId || "",
                },
                score: [],
                setsWon: { player1: 0, player2: 0 },
                type: "double",
                status: "waiting",
                startTime: Date.now(),
                encounterId: currentEncounter?.id,
                matchNumber: matches.length + 1,
              });
            } else {
              // Match simple
              matches.push({
                player1: {
                  id: team1Players[match.team1Index].id || "",
                  name: team1Players[match.team1Index].name,
                  teamId: team1Players[match.team1Index].teamId,
                },
                player2: {
                  id: team2Players[match.team2Index].id || "",
                  name: team2Players[match.team2Index].name,
                  teamId: team2Players[match.team2Index].teamId,
                },
                score: [],
                setsWon: { player1: 0, player2: 0 },
                type: "single",
                status: "waiting",
                startTime: Date.now(),
                encounterId: currentEncounter?.id,
                matchNumber: matches.length + 1,
              });
            }
          });
        }
        break;

      case "custom":
        // Format personnalisé - créer le nombre de matchs demandé
        for (let i = 0; i < customMatchCount; i++) {
          const player1Index = i % team1Players.length;
          const player2Index = i % team2Players.length;

          matches.push({
            player1: {
              id: team1Players[player1Index].id || "",
              name: team1Players[player1Index].name,
              teamId: team1Players[player1Index].teamId,
            },
            player2: {
              id: team2Players[player2Index].id || "",
              name: team2Players[player2Index].name,
              teamId: team2Players[player2Index].teamId,
            },
            score: [],
            setsWon: { player1: 0, player2: 0 },
            status: "waiting",
            startTime: Date.now(),
            encounterId: currentEncounter?.id,
            matchNumber: matches.length + 1,
          });
        }
        break;

      default:
        console.error("Modèle non reconnu:", selectedModel);
    }

    return matches;
  };

  const handleDeleteExistingMatches = async () => {
    setDeletingMatches(true);
    setError("");
    setSuccess("");

    try {
      const batch = writeBatch(db);

      // Supprimer tous les matches existants
      for (const match of existingMatches) {
        const matchRef = doc(db, "matches", match.id);
        batch.delete(matchRef);
      }

      await batch.commit();

      // Mettre à jour l'état local
      setExistingMatches([]);
      setHasExistingMatches(false);
      setDeleteDialogOpen(false);
      setSuccess(
        `✅ ${existingMatches.length} match(s) supprimé(s) avec succès !`
      );
    } catch (error) {
      console.error("Erreur lors de la suppression des matches:", error);
      setError("Erreur lors de la suppression des matches");
    } finally {
      setDeletingMatches(false);
    }
  };

  const swapTeams = async () => {
    if (!currentEncounter) return;

    setLoading(true);
    setError("");

    try {
      const batch = writeBatch(db);

      // Inverser les teamId dans la rencontre
      const encounterRef = doc(db, "encounters", currentEncounter.id);
      batch.update(encounterRef, {
        team1Id: currentEncounter.team2Id,
        team2Id: currentEncounter.team1Id,
      });

      // Inverser les order des équipes
      const team1Ref = doc(db, "teams", currentEncounter.team1Id);
      const team2Ref = doc(db, "teams", currentEncounter.team2Id);

      batch.update(team1Ref, { order: 2 });
      batch.update(team2Ref, { order: 1 });

      await batch.commit();

      // Mettre à jour l'état local
      setTeamsSwapped(!teamsSwapped);
      setSuccess("✅ Ordre des équipes inversé avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'inversion des équipes:", error);
      setError("Erreur lors de l'inversion des équipes");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setError("");
    setSuccess("");

    // Validation
    const allPlayers = [...team1Players, ...team2Players];
    const emptyNames = allPlayers.filter((p) => !p.name.trim());

    if (emptyNames.length > 0) {
      setError("Tous les joueurs doivent avoir un nom");
      return;
    }

    if (team1Players.length === 0 || team2Players.length === 0) {
      setError("Chaque équipe doit avoir au moins un joueur");
      return;
    }

    // Vérifier s'il y a des matchs existants
    if (hasExistingMatches) {
      setError(
        "Des matchs existent déjà pour cette rencontre. Veuillez d'abord les supprimer ou utiliser une nouvelle rencontre."
      );
      return;
    }

    setLoading(true);

    try {
      const batch = writeBatch(db);

      // Sauvegarder les joueurs
      const allPlayersToSave = [...team1Players, ...team2Players];

      for (const player of allPlayersToSave) {
        if (!player.id || player.id.startsWith("temp_")) {
          // Nouveau joueur
          const playerRef = doc(collection(db, "players"));
          const playerData = {
            name: player.name.trim(),
            teamId: player.teamId,
            encounterId: player.encounterId,
            order: player.order || 0, // Sauvegarder l'ordre
          };
          batch.set(playerRef, playerData);
          player.id = playerRef.id; // Pour les matchs
        } else {
          // Joueur existant à mettre à jour
          const playerRef = doc(db, "players", player.id);
          batch.update(playerRef, {
            name: player.name.trim(),
            order: player.order || 0, // Mettre à jour l'ordre
          });
        }
      }

      // Sauvegarder tous les matchs générés
      for (const match of generatedMatches) {
        const matchRef = doc(collection(db, "matches"));
        batch.set(matchRef, match);
      }

      await batch.commit();

      setSuccess(
        `✅ ${allPlayersToSave.length} joueurs et ${generatedMatches.length} matchs créés avec succès !`
      );

      setTimeout(() => {
        navigate("/matches");
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
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

  const totalMatches = team1Players.length * team2Players.length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom color="primary">
          Étape 2 : Préparation des joueurs et matchs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ajoutez les joueurs pour chaque équipe. Tous les matchs possibles
          seront créés automatiquement.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Rencontre active :</strong> {currentEncounter.name}
        <br />
        <strong>Équipes :</strong> {team1?.name} vs {team2?.name}
      </Alert>

      {hasExistingMatches && (
        <Alert
          severity={hasLaunchedMatches ? "error" : "warning"}
          sx={{ mb: 3 }}
        >
          <strong>
            {hasLaunchedMatches
              ? "🚫 Matchs en cours ou terminés"
              : "⚠️ Attention"}
          </strong>{" "}
          Cette rencontre contient déjà {existingMatches.length} match(s).
          <br />
          {hasLaunchedMatches
            ? "Des matchs sont en cours ou terminés. Vous ne pouvez plus modifier les joueurs, générer de nouveaux matchs ou supprimer les matchs existants."
            : "Vous ne pouvez pas créer de nouveaux matchs tant que les matchs existants n'ont pas été supprimés."}
          <br />
          <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/matches")}
            >
              Voir les matchs existants
            </Button>
            {!hasLaunchedMatches && (
              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deletingMatches}
              >
                Supprimer tous les matchs
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Sélection du modèle de championnat */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🏆 Modèle de championnat
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <FormControl
              fullWidth
              disabled={hasExistingMatches || hasLaunchedMatches}
            >
              <InputLabel>Format de rencontre</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                label="Format de rencontre"
                disabled={hasExistingMatches || hasLaunchedMatches}
              >
                {CHAMPIONSHIP_MODELS.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    <Box>
                      <Typography variant="subtitle2">{model.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {model.description} - {model.formula}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            {selectedModel === "custom" && (
              <TextField
                fullWidth
                label="Nombre de matchs"
                type="number"
                value={customMatchCount}
                onChange={(e) =>
                  setCustomMatchCount(parseInt(e.target.value) || 16)
                }
                inputProps={{ min: 1, max: 100 }}
                disabled={hasExistingMatches || hasLaunchedMatches}
              />
            )}
          </Grid>
        </Grid>

        {/* Informations sur le modèle sélectionné */}
        <Box sx={{ mt: 2 }}>
          {(() => {
            const model = CHAMPIONSHIP_MODELS.find(
              (m) => m.id === selectedModel
            );
            const totalPlayers = team1Players.length + team2Players.length;
            const isValidModel =
              model &&
              totalPlayers >= model.minPlayers &&
              totalPlayers <= model.maxPlayers;

            return (
              <Alert
                severity={isValidModel ? "info" : "warning"}
                sx={{ mt: 1 }}
              >
                {model && (
                  <>
                    <strong>{model.name}:</strong> {model.description}
                    <br />
                    <strong>Formule:</strong> {model.formula}
                    <br />
                    <strong>Joueurs requis:</strong> {model.minPlayers}-
                    {model.maxPlayers} joueurs
                    <br />
                    <strong>Joueurs actuels:</strong> {totalPlayers} joueurs
                    <br />
                    <strong>Matchs générés:</strong>{" "}
                    {getGeneratedMatchesCount()} matchs
                    {(selectedModel === "format_14_acquired" ||
                      selectedModel === "format_14_non_acquired") && (
                      <>
                        <br />
                        <strong>Détail:</strong> 12 simples + 2 doubles
                        <br />
                        <strong>Ordre:</strong> 8 simples → 2 doubles (9-10) → 4
                        simples
                        {selectedModel === "format_14_acquired" && (
                          <>
                            <br />
                            <strong>Arrêt:</strong> À 8 victoires (score acquis)
                          </>
                        )}
                        {selectedModel === "format_14_non_acquired" && (
                          <>
                            <br />
                            <strong>Arrêt:</strong> Tous les matchs joués (score
                            non acquis)
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </Alert>
            );
          })()}
        </Box>
      </Paper>

      {/* Bouton pour inverser l'ordre des équipes */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Button
          variant="outlined"
          startIcon={<SwapHorizIcon />}
          onClick={swapTeams}
          disabled={loading || hasExistingMatches || hasLaunchedMatches}
          sx={{ mb: 2 }}
        >
          Inverser l'ordre des équipes
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Équipe 1 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" color="primary">
                {team1?.name} ({team1Players.length} joueurs)
              </Typography>
              <IconButton
                color="primary"
                onClick={() => addPlayer(currentEncounter.team1Id)}
                disabled={loading || hasExistingMatches || hasLaunchedMatches}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePlayerDragEnd}
            >
              <SortableContext
                items={team1Players.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <Stack spacing={2}>
                  {team1Players
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((player, index) => (
                      <SortablePlayer
                        key={player.id}
                        player={player}
                        teamName={team1?.name || ""}
                        teamId={currentEncounter.team1Id}
                        isTeam1={true}
                        hasLaunchedMatches={hasLaunchedMatches}
                        onDelete={() =>
                          removePlayer(
                            currentEncounter.team1Id,
                            team1Players.findIndex((p) => p.id === player.id)
                          )
                        }
                        onNameChange={(name) =>
                          updatePlayerName(
                            currentEncounter.team1Id,
                            team1Players.findIndex((p) => p.id === player.id),
                            name
                          )
                        }
                      />
                    ))}

                  {team1Players.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: "center", py: 2 }}
                    >
                      Aucun joueur ajouté
                    </Typography>
                  )}
                </Stack>
              </SortableContext>
            </DndContext>
          </Paper>
        </Grid>

        {/* Équipe 2 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" color="primary">
                {team2?.name} ({team2Players.length} joueurs)
              </Typography>
              <IconButton
                color="primary"
                onClick={() => addPlayer(currentEncounter.team2Id)}
                disabled={loading || hasExistingMatches || hasLaunchedMatches}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePlayerDragEnd}
            >
              <SortableContext
                items={team2Players.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <Stack spacing={2}>
                  {team2Players
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((player, index) => (
                      <SortablePlayer
                        key={player.id}
                        player={player}
                        teamName={team2?.name || ""}
                        teamId={currentEncounter.team2Id}
                        isTeam1={false}
                        hasLaunchedMatches={hasLaunchedMatches}
                        onDelete={() =>
                          removePlayer(
                            currentEncounter.team2Id,
                            team2Players.findIndex((p) => p.id === player.id)
                          )
                        }
                        onNameChange={(name) =>
                          updatePlayerName(
                            currentEncounter.team2Id,
                            team2Players.findIndex((p) => p.id === player.id),
                            name
                          )
                        }
                      />
                    ))}

                  {team2Players.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: "center", py: 2 }}
                    >
                      Aucun joueur ajouté
                    </Typography>
                  )}
                </Stack>
              </SortableContext>
            </DndContext>
          </Paper>
        </Grid>
      </Grid>

      {/* Génération et réorganisation des matchs */}
      {team1Players.length > 0 &&
        team2Players.length > 0 &&
        !hasExistingMatches && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Matchs générés</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={generateMatches}
                  disabled={loading || hasExistingMatches || hasLaunchedMatches}
                  startIcon={<PlayArrowIcon />}
                >
                  Générer les matchs
                </Button>
                {generatedMatches.length > 0 && (
                  <Chip
                    label={`${generatedMatches.length} matchs`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {generatedMatches.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleMatchDragEnd}
              >
                <SortableContext
                  items={generatedMatches.map(
                    (m, index) => m.id || `temp_${index}`
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack spacing={1}>
                    {generatedMatches
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((match, index) => (
                        <SortableMatch
                          key={match.id || `temp_${index}`}
                          match={match}
                          index={index}
                          hasLaunchedMatches={hasLaunchedMatches}
                          onDelete={() => removeMatch(index)}
                        />
                      ))}
                  </Stack>
                </SortableContext>
              </DndContext>
            )}

            {generatedMatches.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                Cliquez sur "Générer les matchs" pour créer les matchs selon le
                format sélectionné
              </Typography>
            )}
          </Paper>
        )}

      {/* Résumé et actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Résumé de la préparation</Typography>
          <Chip
            label={
              hasExistingMatches
                ? `${existingMatches.length} matchs existants`
                : `${generatedMatches.length} matchs générés`
            }
            color={hasExistingMatches ? "warning" : "primary"}
            variant="outlined"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleSaveAll}
            disabled={
              loading ||
              team1Players.length === 0 ||
              team2Players.length === 0 ||
              generatedMatches.length === 0 ||
              hasExistingMatches ||
              hasLaunchedMatches
            }
            startIcon={
              loading ? <CircularProgress size={20} /> : <PlayArrowIcon />
            }
            sx={{ minWidth: 250 }}
          >
            {loading ? "Sauvegarde..." : "Créer tous les matchs"}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/encounters")}
            disabled={loading}
          >
            Retour aux rencontres
          </Button>
        </Stack>
      </Paper>

      {/* Dialogue de confirmation pour la suppression des matches */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer tous les {existingMatches.length}{" "}
            match(s) existants ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible. Tous les scores et données des matchs
            seront perdus.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingMatches}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteExistingMatches}
            color="error"
            variant="contained"
            disabled={deletingMatches}
            startIcon={deletingMatches ? <CircularProgress size={20} /> : null}
          >
            {deletingMatches ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
