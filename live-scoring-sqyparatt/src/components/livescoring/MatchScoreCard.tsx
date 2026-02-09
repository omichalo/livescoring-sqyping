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
  Paper,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Box,
} from "@mui/material";
import type { Match } from "@/types/livescoring";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [flipped, setFlipped] = useState(false);

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

  const updateScore = async (
    playerKey: "player1" | "player2",
    delta: number
  ) => {
    const updated = [...sets];
    const currentSetIndex = updated.length - 1;
    if (!updated[currentSetIndex]) {
      updated[currentSetIndex] = { player1: 0, player2: 0 };
    }
    const currentSet = { ...updated[currentSetIndex] };
    const isFifthSet = updated.length === 5;
    const p1 = currentSet.player1;
    const p2 = currentSet.player2;
    const setAlreadyFinished = Math.max(p1, p2) >= 11 && Math.abs(p1 - p2) >= 2;

    if (delta > 0 && setAlreadyFinished) return;

    const previousSet = { ...currentSet };
    currentSet[playerKey] = Math.max(0, currentSet[playerKey] + delta);
    updated[currentSetIndex] = currentSet;

    // Calculer les sets gagnés avec le nouveau score
    const updatedSetsWon = computeSetsWon(updated);
    const isFinished =
      updatedSetsWon.player1 === 3 || updatedSetsWon.player2 === 3;

    const payload: Partial<Match> = {
      score: updated,
      setsWon: updatedSetsWon,
    };

    // Si le match peut être terminé, afficher le dialog de confirmation
    // Le match est terminé (un joueur a 3 sets) - prêt pour le bouton "Terminer"
    if (isFinished) {
      console.log("🎯 Match prêt à être terminé !", {
        updatedSetsWon,
        isFinished,
      });
    }

    // Gestion du changement de côté à 5 points dans la 5ème manche
    if (shouldFlipAtFiveInFifthSet(isFifthSet, previousSet, currentSet)) {
      setFlipped((prev) => !prev);
      console.log("🔄 Changement de côté à 5 points dans la 5ème manche");
    }

    await updateDoc(doc(db, "matches", match.id), payload);
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
      };

      await updateDoc(doc(db, "matches", match.id), updatePayload);
    }
  };

  const launchSet = async () => {
    const last = sets[sets.length - 1];
    const finished =
      last &&
      Math.max(last.player1, last.player2) >= 11 &&
      Math.abs(last.player1 - last.player2) >= 2;
    const alreadyEmptySet = last && last.player1 === 0 && last.player2 === 0;
    if (!finished || alreadyEmptySet) return;

    // Valider officiellement le set précédent en l'ajoutant aux sets terminés
    const updated = [...sets, { player1: 0, player2: 0 }];

    // Calcul des sets gagnés sur tous les sets SAUF le dernier (vide)
    const updatedSetsWon = computeSetsWon(updated);

    const updatePayload: Partial<Match> = {
      score: updated,
      setsWon: updatedSetsWon, // Sets officiellement gagnés
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

    console.log(`✅ Set ${sets.length} officiellement terminé et validé`);

    await updateDoc(doc(db, "matches", match.id), updatePayload);
  };

  const terminateMatch = async () => {
    // Vérifier si le match peut être terminé (un joueur a 3 sets)
    const currentSetsWon = computeSetsWon(sets);
    const canTerminate =
      currentSetsWon.player1 === 3 || currentSetsWon.player2 === 3;

    if (!canTerminate) {
      console.log(
        "⚠️ Le match ne peut pas être terminé - aucun joueur n'a 3 sets"
      );
      return;
    }

    // Calculer les sets gagnés en incluant le set en cours
    const updatedSetsWon = computeSetsWon(sets);

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

  // Le match peut être terminé si un joueur a 3 sets (en incluant le set en cours s'il est fini)
  const isFinished =
    setsWonWithCurrent.player1 === 3 || setsWonWithCurrent.player2 === 3;

  const canLaunchSet = (() => {
    // Si le match est déjà terminé (3 sets gagnés), ne pas permettre de lancer un nouveau set
    if (isFinished) return false;

    const last = sets[sets.length - 1];
    const finished =
      last &&
      Math.max(last.player1, last.player2) >= 11 &&
      Math.abs(last.player1 - last.player2) >= 2;
    const alreadyEmptySet = last && last.player1 === 0 && last.player2 === 0;
    return finished && !alreadyEmptySet;
  })();

  const leftPlayer = flipped ? match.player2 : match.player1;
  const rightPlayer = flipped ? match.player1 : match.player2;

  return (
    <>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: "background.paper",
        }}
      >
        {/* Bouton de fermeture */}
        {onClose && (
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="outlined"
              onClick={onClose}
              size="small"
              sx={{ minWidth: "auto", px: 2 }}
            >
              ✕ Fermer
            </Button>
          </Box>
        )}

        <Typography variant="h5" align="center" fontWeight={600} gutterBottom>
          🏓 Table {match.table}
        </Typography>

        <Box mt={2}>
          <Table>
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
                      }}
                    >
                      {player.name}
                    </TableCell>
                    {[...Array(5)].map((_, setIdx) => {
                      const set = sets[setIdx];
                      const p1 = set?.player1 ?? 0;
                      const p2 = set?.player2 ?? 0;
                      const finished =
                        Math.max(p1, p2) >= 11 && Math.abs(p1 - p2) >= 2;
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

        <Box mt={4} display="flex" justifyContent="center">
          <Box display="flex" gap={3} alignItems="center">
            <Stack spacing={1} alignItems="center">
              <Typography
                variant="subtitle1"
                fontWeight={600}
                fontSize={16}
                color="text.secondary"
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

            <Stack spacing={1} alignItems="center">
              <Typography
                variant="subtitle1"
                fontWeight={600}
                fontSize={16}
                color="text.secondary"
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

        <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
          <Button
            variant="outlined"
            onClick={changeSides}
            disabled={isFinished}
            title="Changer manuellement les côtés des joueurs (désactivé si le match est terminé)"
            sx={{ opacity: isFinished ? 0.4 : 1 }}
          >
            ↔ Changer côtés
          </Button>
          <Button
            variant="outlined"
            onClick={launchMatch}
            disabled={sets.length > 0}
            title="Initialiser le premier set (actif uniquement au début du match)"
            sx={{ opacity: sets.length > 0 ? 0.4 : 1 }}
          >
            ▶ Lancer
          </Button>
          <Button
            variant="outlined"
            onClick={launchSet}
            disabled={!canLaunchSet || isFinished}
            title="Commencer un nouveau set (si le précédent est terminé)"
            sx={{ opacity: !canLaunchSet || isFinished ? 0.4 : 1 }}
          >
            ⏱ Lancer Set
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={terminateMatch}
            disabled={!isFinished}
            title="Terminer le match et revenir à la liste (uniquement si un joueur a gagné 3 sets)"
            sx={{ opacity: !isFinished ? 0.4 : 1 }}
          >
            🏆 Terminer & Retour
          </Button>
        </Stack>
      </Paper>

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
