// src/components/livescoring/MatchScoreCard.tsx
// Composant adapté du projet livescoring-sqyping

import { useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Box,
  Tooltip,
} from "@mui/material";
import { Flag } from "@mui/icons-material";
import type { Match } from "@/types/livescoring";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { milestoneService } from "@/services/milestoneService";
import { useCurrentEncounter } from "@/hooks/useCurrentEncounter";

function computeSetsWon(
  score: { player1: number; player2: number }[],
  includeCurrentSet = true
): {
  player1: number;
  player2: number;
} {
  const setsWon = { player1: 0, player2: 0 };

  // Déterminer quels sets compter
  const setsToCount = includeCurrentSet ? score : score.slice(0, -1); // Exclure le dernier set (en cours)

  // Compter les sets terminés
  for (const { player1, player2 } of setsToCount) {
    if (player1 >= 11 || player2 >= 11) {
      if (Math.abs(player1 - player2) >= 2) {
        if (player1 > player2) setsWon.player1++;
        else if (player2 > player1) setsWon.player2++;
      }
    }
  }
  return setsWon;
}

function isSetScoreFinished(set: { player1: number; player2: number }): boolean {
  return (
    Math.max(set.player1, set.player2) >= 11 &&
    Math.abs(set.player1 - set.player2) >= 2
  );
}

interface SetConfirmState {
  open: boolean;
  setNumber: number;
  winnerName: string;
  winnerKey: "player1" | "player2";
  scorePlayer1: number;
  scorePlayer2: number;
  revertOnCancel: boolean;
}

interface MatchConfirmState {
  open: boolean;
  winnerName: string;
  winnerKey: "player1" | "player2";
  setsWonPlayer1: number;
  setsWonPlayer2: number;
  lastSetPlayer1: number;
  lastSetPlayer2: number;
  revertOnCancel: boolean;
}

interface Props {
  match: Match;
  onClose?: () => void; // Callback pour fermer le composant
}

export const MatchScoreCard: React.FC<Props> = ({ match, onClose }) => {
  const sets = match.score ?? [];
  // Pour l'affichage : ne compter que les sets officiellement terminés (exclure le set en cours)
  const setsWonDisplay = computeSetsWon(sets, false);
  // Pour la logique de fin de match : inclure le set en cours s'il est terminé
  const setsWonWithCurrent = computeSetsWon(sets, true);

  // Fonction pour construire l'URL du drapeau
  const getFlagUrl = (countryCode: string) => {
    if (!countryCode) return "/placeholder-flag.svg";
    return `https://results.ittf.com/ittf-web-results/img/flags-v2/${countryCode}.png`;
  };

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [setConfirm, setSetConfirm] = useState<SetConfirmState>({
    open: false,
    setNumber: 0,
    winnerName: "",
    winnerKey: "player1",
    scorePlayer1: 0,
    scorePlayer2: 0,
    revertOnCancel: false,
  });
  const [matchConfirm, setMatchConfirm] = useState<MatchConfirmState>({
    open: false,
    winnerName: "",
    winnerKey: "player1",
    setsWonPlayer1: 0,
    setsWonPlayer2: 0,
    lastSetPlayer1: 0,
    lastSetPlayer2: 0,
    revertOnCancel: false,
  });

  const { currentEncounter } = useCurrentEncounter();

  const leftPlayerKey = flipped ? "player2" : "player1";
  const rightPlayerKey = flipped ? "player1" : "player2";
  const setsWonLeft = setsWonDisplay[leftPlayerKey];
  const setsWonRight = setsWonDisplay[rightPlayerKey];

  const shouldFlipAtFiveInFifthSet = (
    isFifthSet: boolean,
    previousScore: { player1: number; player2: number },
    currentScore: { player1: number; player2: number }
  ) => {
    if (!isFifthSet) return false;

    const previousMax = Math.max(previousScore.player1, previousScore.player2);
    const currentMax = Math.max(currentScore.player1, currentScore.player2);

    // Changement de côté quand on atteint 5 points
    // Ou quand on redescend sous 5 points (correction avec bouton -)
    return (
      (previousMax < 5 && currentMax >= 5) ||
      (previousMax >= 5 && currentMax < 5)
    );
  };

  const openSetConfirmDialog = (
    currentSets: { player1: number; player2: number }[],
    options?: { revertOnCancel?: boolean }
  ) => {
    const last = currentSets[currentSets.length - 1];
    if (!last || !isSetScoreFinished(last)) return;

    const winnerKey: "player1" | "player2" =
      last.player1 > last.player2 ? "player1" : "player2";
    const winnerName =
      winnerKey === "player1" ? match.player1.name : match.player2.name;

    setSetConfirm({
      open: true,
      setNumber: currentSets.length,
      winnerName,
      winnerKey,
      scorePlayer1: last.player1,
      scorePlayer2: last.player2,
      revertOnCancel: options?.revertOnCancel ?? false,
    });
  };

  const openMatchConfirmDialog = (
    currentSets: { player1: number; player2: number }[],
    options?: { revertOnCancel?: boolean }
  ) => {
    const setsWon = computeSetsWon(currentSets, true);
    const last = currentSets[currentSets.length - 1];
    if (!last) return;

    const winnerKey: "player1" | "player2" =
      setsWon.player1 === 3 ? "player1" : "player2";
    const winnerName =
      winnerKey === "player1" ? match.player1.name : match.player2.name;

    setMatchConfirm({
      open: true,
      winnerName,
      winnerKey,
      setsWonPlayer1: setsWon.player1,
      setsWonPlayer2: setsWon.player2,
      lastSetPlayer1: last.player1,
      lastSetPlayer2: last.player2,
      revertOnCancel: options?.revertOnCancel ?? false,
    });
  };

  const updateScore = async (
    playerKey: "player1" | "player2",
    delta: number,
    options?: { skipConfirmDialog?: boolean }
  ) => {
    const updated = [...sets];
    const currentSetIndex = updated.length - 1;
    if (!updated[currentSetIndex]) {
      updated[currentSetIndex] = { player1: 0, player2: 0 };
    }
    const currentSet = { ...updated[currentSetIndex] };
    const isFifthSet = updated.length === 5;
    const setAlreadyFinished = isSetScoreFinished(currentSet);

    if (delta > 0 && setAlreadyFinished) return;

    const previousSet = { ...currentSet };
    currentSet[playerKey] = Math.max(0, currentSet[playerKey] + delta);
    updated[currentSetIndex] = currentSet;

    // Calculer les sets gagnés avec le nouveau score
    // Ne PAS inclure le set en cours tant qu'il n'est pas officiellement terminé
    const updatedSetsWon = computeSetsWon(updated, false); // false = exclure le set en cours
    const setsWonIncludingCurrent = computeSetsWon(updated, true);
    const matchFinished =
      setsWonIncludingCurrent.player1 === 3 ||
      setsWonIncludingCurrent.player2 === 3;
    const setFinished = isSetScoreFinished(currentSet);

    const payload: Partial<Match> = {
      score: updated,
      setsWon: updatedSetsWon,
    };

    // Gestion du changement de côté à 5 points dans la 5ème manche
    if (shouldFlipAtFiveInFifthSet(isFifthSet, previousSet, currentSet)) {
      setFlipped((prev) => !prev);
      console.log("🔄 Changement de côté à 5 points dans la 5ème manche");
    }

    await updateDoc(doc(db, "matches", match.id), payload);

    if (!options?.skipConfirmDialog && delta > 0) {
      if (matchFinished) {
        openMatchConfirmDialog(updated, { revertOnCancel: true });
      } else if (setFinished) {
        openSetConfirmDialog(updated, { revertOnCancel: true });
      }
    }
  };

  const handleSetConfirmCancel = async () => {
    const { winnerKey, revertOnCancel } = setConfirm;
    setSetConfirm((prev) => ({ ...prev, open: false }));
    if (revertOnCancel) {
      await updateScore(winnerKey, -1, { skipConfirmDialog: true });
    }
  };

  const handleSetConfirmAccept = async () => {
    setSetConfirm((prev) => ({ ...prev, open: false }));
    await launchSet();
  };

  const handleMatchConfirmCancel = async () => {
    const { winnerKey, revertOnCancel } = matchConfirm;
    setMatchConfirm((prev) => ({ ...prev, open: false }));
    if (revertOnCancel) {
      await updateScore(winnerKey, -1, { skipConfirmDialog: true });
    }
  };

  const handleMatchConfirmAccept = async () => {
    setMatchConfirm((prev) => ({ ...prev, open: false }));
    await terminateMatch();
  };

  const resetMatch = async () => {
    const resetScore: Match["score"] = [{ player1: 0, player2: 0 }];
    const updatePayload: Partial<Match> = {
      score: resetScore,
      setsWon: { player1: 0, player2: 0 },
      status: "waiting", // ✅ validé par le type Match
    };
    await updateDoc(doc(db, "matches", match.id), updatePayload);

    // Afficher la notification de réinitialisation
    setSnackbarMessage("Match réinitialisé avec succès !");
    setSnackbarOpen(true);
  };

  const changeSides = () => {
    setFlipped((prev) => !prev);
  };

  const launchMatch = async () => {
    if (!sets.length) {
      const updatePayload: Partial<Match> = {
        score: [{ player1: 0, player2: 0 }],
        status: "inProgress",
        startTime: Date.now(), // Définir startTime au moment du clic sur "Lancer"
      };

      await updateDoc(doc(db, "matches", match.id), updatePayload);
      console.log(
        "🚀 Match lancé avec startTime:",
        new Date(updatePayload.startTime!).toISOString()
      );
    }
  };

  const launchSet = async () => {
    const last = sets[sets.length - 1];
    const finished = last && isSetScoreFinished(last);
    const alreadyEmptySet = last && last.player1 === 0 && last.player2 === 0;
    if (!finished || alreadyEmptySet) return;

    // Calculer les sets gagnés AVANT d'ajouter le nouveau set vide
    // On inclut le set qui vient de se terminer dans le calcul
    const updatedSetsWon = computeSetsWon(sets, true); // true = inclure le set en cours

    // Valider officiellement le set précédent en l'ajoutant aux sets terminés
    const updated = [...sets, { player1: 0, player2: 0 }];

    const updatePayload: Partial<Match> = {
      score: updated,
      setsWon: updatedSetsWon, // Sets officiellement gagnés (incluant le set qui vient de se terminer)
    };

    // Règle du tennis de table : changement automatique de côté au début de chaque nouvelle manche
    // sauf la première (donc 2ème, 3ème, 4ème, 5ème manche = changement)
    const shouldChangeSidesForNewSet = sets.length >= 1; // Toutes les manches sauf la première

    if (shouldChangeSidesForNewSet) {
      setFlipped((prev) => !prev);
      console.log(
        `🔄 Changement automatique de côté pour la ${sets.length + 1}ème manche`
      );
    }

    console.log(`✅ Set ${sets.length} officiellement terminé et validé`, {
      previousSetsWon: computeSetsWon(sets, false),
      newSetsWon: updatedSetsWon,
    });

    await updateDoc(doc(db, "matches", match.id), updatePayload);
  };

  const terminateMatch = async () => {
    // Vérifier si le match peut être terminé (un joueur a 3 sets)
    // On inclut le set en cours dans le calcul pour la vérification
    const currentSetsWon = computeSetsWon(sets, true); // true = inclure le set en cours
    const canTerminate =
      currentSetsWon.player1 === 3 || currentSetsWon.player2 === 3;

    if (!canTerminate) {
      console.log(
        "⚠️ Le match ne peut pas être terminé - aucun joueur n'a 3 sets"
      );
      return;
    }

    // Calculer les sets gagnés en incluant le set en cours
    const updatedSetsWon = computeSetsWon(sets, true); // true = inclure le set en cours

    // Déterminer le gagnant basé sur les sets gagnés
    const isPlayer1Winner = updatedSetsWon.player1 === 3;
    const winnerName = isPlayer1Winner
      ? match.player1.name
      : match.player2.name;

    console.log("🏆 Détermination du gagnant:", {
      setsWon: updatedSetsWon,
      isPlayer1Winner,
      winnerName,
    });

    const updatePayload: Partial<Match> = {
      score: sets, // Ajouter le score actuel pour persister l'état final
      setsWon: updatedSetsWon,
      status: "finished",
    };

    await updateDoc(doc(db, "matches", match.id), updatePayload);

    // Afficher la notification de succès
    setSnackbarMessage(
      `🎉 Match terminé ! Victoire de ${winnerName} (${updatedSetsWon.player1}-${updatedSetsWon.player2})`
    );
    setSnackbarOpen(true);

    // Fermer le composant après un délai pour laisser le temps de voir la notification
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 2000); // 2 secondes pour voir la notification
  };

  // Fonction pour ajouter un point marquant
  const handleAddMilestone = async () => {
    if (!currentEncounter) {
      console.error("Aucun encounter actif");
      return;
    }

    setIsAddingMilestone(true);
    try {
      const now = Date.now();

      // Debug: afficher les valeurs pour comprendre le problème
      console.log("Debug temps:", {
        now: new Date(now).toISOString(),
        matchStartTime: match.startTime
          ? new Date(match.startTime).toISOString()
          : "undefined",
        matchStartTimeRaw: match.startTime,
        difference: match.startTime ? now - match.startTime : "N/A",
      });

      // Utiliser startTime si disponible et valide, sinon utiliser un timestamp par défaut
      let matchStartTime;
      const currentYear = new Date().getFullYear();
      const startTimeYear = match.startTime
        ? new Date(match.startTime).getFullYear()
        : 0;

      if (
        match.startTime &&
        match.startTime > 0 &&
        startTimeYear === currentYear &&
        match.startTime < now
      ) {
        matchStartTime = match.startTime;
      } else {
        // Si startTime n'est pas valide (futur ou année incorrecte), utiliser un timestamp par défaut
        // Calculer un timestamp réaliste pour aujourd'hui (il y a 5 minutes)
        const realisticNow = new Date().getTime();
        matchStartTime = realisticNow - 300000; // 5 minutes en arrière par défaut
        console.log(
          "startTime invalide (futur ou année incorrecte), utilisation du fallback:",
          {
            originalStartTime: match.startTime
              ? new Date(match.startTime).toISOString()
              : "undefined",
            startTimeYear,
            currentYear,
            fallbackTime: new Date(matchStartTime).toISOString(),
          }
        );
      }

      const timeSinceStart = Math.max(
        0,
        Math.floor((now - matchStartTime) / 1000)
      ); // en secondes, minimum 0

      console.log("Calcul détaillé du temps:", {
        now,
        matchStartTime,
        differenceMs: now - matchStartTime,
        differenceSeconds: (now - matchStartTime) / 1000,
        timeSinceStart,
        minutes: Math.floor(timeSinceStart / 60),
        seconds: timeSinceStart % 60,
        hours: Math.floor(timeSinceStart / 3600),
      });

      console.log("Temps calculé:", {
        timeSinceStart,
        minutes: Math.floor(timeSinceStart / 60),
        seconds: timeSinceStart % 60,
      });

      // Calculer le score actuel
      const currentScore = match.score?.[match.score.length - 1] || {
        player1: 0,
        player2: 0,
      };
      const setsWon = match.setsWon || { player1: 0, player2: 0 };

      const matchInfo = {
        matchId: match.id,
        player1Name: match.player1?.name || "Joueur 1",
        player2Name: match.player2?.name || "Joueur 2",
        player1Country: match.player1?.teamId || "",
        player2Country: match.player2?.teamId || "",
        matchStartTime,
        timeSinceStart,
        currentScore,
        setsWon,
        matchStatus: match.status as
          | "waiting"
          | "inProgress"
          | "finished"
          | "cancelled",
        matchDesc: match.matchDesc || "",
      };

      await milestoneService.addMilestoneWithMatchInfo(
        match.table || 1, // Fallback à la table 1 si undefined
        currentEncounter.id,
        matchInfo
      );
      console.log(`Point marquant ajouté avec infos du match:`, matchInfo);

      // Afficher une notification de succès
      setSnackbarMessage(
        `✅ Point marquant ajouté pour la table ${match.table}`
      );
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Erreur lors de l'ajout du point marquant:", error);
      setSnackbarMessage("❌ Erreur lors de l'ajout du point marquant");
      setSnackbarOpen(true);
    } finally {
      setIsAddingMilestone(false);
    }
  };

  // Le match peut être terminé si un joueur a 3 sets (en incluant le set en cours s'il est fini)
  const isFinished =
    setsWonWithCurrent.player1 === 3 || setsWonWithCurrent.player2 === 3;

  const canLaunchSet = (() => {
    // Si le match est déjà terminé (3 sets gagnés), ne pas permettre de lancer un nouveau set
    if (isFinished) return false;

    const last = sets[sets.length - 1];
    const finished = last && isSetScoreFinished(last);
    const alreadyEmptySet = last && last.player1 === 0 && last.player2 === 0;
    return finished && !alreadyEmptySet;
  })();

  const leftPlayer = flipped ? match.player2 : match.player1;
  const rightPlayer = flipped ? match.player1 : match.player2;

  return (
    <>
      {/* <Paper
        sx={{
          px: 2,
          mb: 0,
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: "background.paper",
          height: "100%",
          // minHeight: "550px",
          display: "flex",
          flexDirection: "column",
        }}
      > */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ mb: 1, maxHeight: "200px", overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Joueur</TableCell>
                {[...Array(5)].map((_, i) => (
                  <TableCell key={i} align="center" sx={{ minWidth: 35 }}>
                    Set {i + 1}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[match.player1, match.player2].map((player, idx) => {
                return (
                  <TableRow key={player.id}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        bgcolor:
                          idx === 0 ? "primary.light" : "secondary.light",
                        minWidth: 200,
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {player.name}
                    </TableCell>
                    {[...Array(5)].map((_, setIdx) => {
                      const set = sets[setIdx];
                      const p1 = set?.player1 ?? 0;
                      const p2 = set?.player2 ?? 0;
                      const finished = set ? isSetScoreFinished(set) : false;
                      const score = idx === 0 ? p1 : p2;
                      const isCurrent = !finished && setIdx === sets.length - 1;
                      return (
                        <TableCell
                          key={setIdx}
                          align="center"
                          sx={{
                            bgcolor: isCurrent
                              ? "#fff59d"
                              : finished
                              ? "#e0e0e0"
                              : undefined,
                            fontWeight: finished ? "bold" : undefined,
                          }}
                        >
                          {score > 0 || (score === 0 && isCurrent) ? score : ""}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* Contrôles de scoring */}
      <Box display="flex" justifyContent="center">
        <Box display="flex" gap={3} alignItems="center">
          <Stack spacing={1} alignItems="center" sx={{ maxWidth: 200 }}>
            <Box
              component="img"
              src={getFlagUrl(leftPlayer.teamId)}
              alt={`Drapeau ${leftPlayer.teamId}`}
              sx={{
                width: 32,
                height: 20,
                borderRadius: 0.5,
                objectFit: "contain",
                imageRendering: "high-quality",
              }}
              onError={(e) => {
                e.currentTarget.src = "/placeholder-flag.svg";
              }}
            />
            <Typography
              variant="subtitle1"
              fontWeight={600}
              fontSize={16}
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                width: "100%",
                textAlign: "center",
              }}
            >
              {leftPlayer.name}
            </Typography>
            <IconButton
              onClick={() => updateScore(leftPlayerKey, 1)}
              disabled={isFinished || sets.length == 0 || canLaunchSet}
              sx={{
                width: 64,
                height: 64,
                bgcolor: "success.light",
                "&:hover": { bgcolor: "success.main" },
                "&.Mui-disabled": {
                  bgcolor: "success.light", // garde le fond vert clair
                  color: "white", // garde la couleur du texte
                  opacity: 0.6, // optionnel : donne un effet visuel "désactivé" sans devenir blanc
                },
              }}
            >
              <Typography variant="h4" color="white">
                +
              </Typography>
            </IconButton>
            <IconButton
              onClick={() => updateScore(leftPlayerKey, -1)}
              disabled={isFinished || sets.length == 0 || canLaunchSet}
              sx={{
                bgcolor: "#f8bbd0",
                "&:hover": { bgcolor: "#f48fb1" },
                "&.Mui-disabled": {
                  bgcolor: "#f8bbd0", // garde le fond rouge clair
                  color: "white", // garde la couleur du texte
                  opacity: 0.6, // optionnel : donne un effet visuel "désactivé" sans devenir blanc
                },
              }}
            >
              <Typography variant="h6">−</Typography>
            </IconButton>
          </Stack>

          <Box display="flex" flexDirection="column" alignItems="center">
            <Box display="flex" gap={4} mb={1}>
              <Box bgcolor="primary.light" px={2} py={0.5} borderRadius={1}>
                <Typography variant="h6">{setsWonLeft}</Typography>
              </Box>
              <Box bgcolor="secondary.light" px={2} py={0.5} borderRadius={1}>
                <Typography variant="h6">{setsWonRight}</Typography>
              </Box>
            </Box>
            <Box
              display="flex"
              gap={4}
              bgcolor="#fff59d"
              px={4}
              py={1.5}
              borderRadius={2}
            >
              <Typography variant="h4">
                {sets[sets.length - 1]?.[leftPlayerKey] ?? 0}
              </Typography>
              <Typography variant="h4">
                {sets[sets.length - 1]?.[rightPlayerKey] ?? 0}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={1} alignItems="center" sx={{ maxWidth: 200 }}>
            <Box
              component="img"
              src={getFlagUrl(rightPlayer.teamId)}
              alt={`Drapeau ${rightPlayer.teamId}`}
              sx={{
                width: 32,
                height: 20,
                borderRadius: 0.5,
                objectFit: "contain",
                imageRendering: "high-quality",
              }}
              onError={(e) => {
                e.currentTarget.src = "/placeholder-flag.svg";
              }}
            />
            <Typography
              variant="subtitle1"
              fontWeight={600}
              fontSize={16}
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                width: "100%",
                textAlign: "center",
              }}
            >
              {rightPlayer.name}
            </Typography>
            <IconButton
              onClick={() => updateScore(rightPlayerKey, 1)}
              disabled={isFinished || sets.length == 0 || canLaunchSet}
              sx={{
                width: 64,
                height: 64,
                bgcolor: "success.light",
                "&:hover": { bgcolor: "success.main" },
                "&.Mui-disabled": {
                  bgcolor: "success.light", // garde le fond vert clair
                  color: "white", // garde la couleur du texte
                  opacity: 0.6, // optionnel : donne un effet visuel "désactivé" sans devenir blanc
                },
              }}
            >
              <Typography variant="h4" color="white">
                +
              </Typography>
            </IconButton>
            <IconButton
              onClick={() => updateScore(rightPlayerKey, -1)}
              disabled={isFinished || sets.length == 0 || canLaunchSet}
              sx={{
                bgcolor: "#f8bbd0",
                "&:hover": { bgcolor: "#f48fb1" },
                "&.Mui-disabled": {
                  bgcolor: "#f8bbd0", // garde le fond rouge clair
                  color: "white", // garde la couleur du texte
                  opacity: 0.6, // optionnel : donne un effet visuel "désactivé" sans devenir blanc
                },
              }}
            >
              <Typography variant="h6">−</Typography>
            </IconButton>
          </Stack>
        </Box>
      </Box>

      {/* Boutons d'action */}
      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} justifyContent="center">
          {!isFinished && (
            <Button
              variant="outlined"
              onClick={changeSides}
              title="Changer manuellement les côtés des joueurs"
            >
              ↔ Changer côtés
            </Button>
          )}
          {sets.length === 0 && (
            <Button
              variant="outlined"
              onClick={launchMatch}
              title="Initialiser le premier set"
            >
              ▶ Lancer
            </Button>
          )}
          {canLaunchSet && !isFinished && (
            <Button
              variant="outlined"
              onClick={() => openSetConfirmDialog(sets)}
              title="Valider la manche et commencer la suivante"
            >
              ⏱ Valider la manche
            </Button>
          )}
          {currentEncounter &&
            !isFinished &&
            sets.length > 0 &&
            !canLaunchSet && (
              <Tooltip title="Ajouter un point marquant avec les infos du match">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleAddMilestone}
                  disabled={isAddingMilestone}
                  title="Ajouter un point marquant avec les infos du match"
                  sx={{
                    flexDirection: "column",
                    minWidth: "120px",
                    height: "60px",
                    py: 1,
                    px: 2,
                  }}
                >
                  <Flag sx={{ mb: 0.5, fontSize: "1.2rem" }} />
                  <span style={{ fontSize: "0.75rem" }}>
                    {isAddingMilestone ? "Ajout..." : "Point marquant"}
                  </span>
                </Button>
              </Tooltip>
            )}
          {isFinished && (
            <Button
              variant="contained"
              color="success"
              onClick={() => openMatchConfirmDialog(sets)}
              title="Terminer le match et revenir à la liste"
            >
              🏆 Terminer le match
            </Button>
          )}
          {onClose && (
            <Button
              variant="outlined"
              onClick={onClose}
              size="small"
              sx={{ minWidth: "auto", px: 1.5 }}
            >
              ✕
            </Button>
          )}
        </Stack>
      </Box>
      {/* </Paper> */}

      <Dialog
        open={setConfirm.open}
        onClose={() => void handleSetConfirmCancel()}
      >
        <DialogTitle>Fin de manche</DialogTitle>
        <DialogContent>
          <Typography>
            Confirmer que la manche {setConfirm.setNumber} a été remportée par{" "}
            <strong>{setConfirm.winnerName}</strong> sur le score de{" "}
            <strong>
              {setConfirm.scorePlayer1} à {setConfirm.scorePlayer2}
            </strong>{" "}
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void handleSetConfirmCancel()}>
            Non, corriger
          </Button>
          <Button
            onClick={() => void handleSetConfirmAccept()}
            variant="contained"
            color="primary"
          >
            Oui, manche validée
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={matchConfirm.open}
        onClose={() => void handleMatchConfirmCancel()}
      >
        <DialogTitle>Fin de match</DialogTitle>
        <DialogContent>
          <Typography>
            Confirmer la victoire de <strong>{matchConfirm.winnerName}</strong>{" "}
            sur le score de{" "}
            <strong>
              {matchConfirm.setsWonPlayer1} à {matchConfirm.setsWonPlayer2}
            </strong>{" "}
            en sets
            {matchConfirm.lastSetPlayer1 > 0 || matchConfirm.lastSetPlayer2 > 0
              ? ` (dernière manche : ${matchConfirm.lastSetPlayer1} à ${matchConfirm.lastSetPlayer2})`
              : ""}
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void handleMatchConfirmCancel()}>
            Non, corriger
          </Button>
          <Button
            onClick={() => void handleMatchConfirmAccept()}
            variant="contained"
            color="success"
          >
            Oui, match terminé
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
      >
        <DialogTitle>Confirmer la réinitialisation</DialogTitle>
        <DialogContent>
          <Typography>Es-tu sûr de vouloir réinitialiser ce match ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResetOpen(false)}>Annuler</Button>
          <Button
            onClick={async () => {
              await resetMatch();
              setConfirmResetOpen(false);
              setSnackbarOpen(true);
            }}
            color="error"
          >
            Oui, réinitialiser
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};
