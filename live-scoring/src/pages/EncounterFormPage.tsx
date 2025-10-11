import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Encounter } from "../types";

export const EncounterFormPage: React.FC = () => {
  const { encounterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [numberOfTables, setNumberOfTables] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(encounterId);

  useEffect(() => {
    // Si on est en mode édition, récupérer les données de la rencontre
    if (encounterId) {
      console.log(
        `🔍 Mode édition: récupération de la rencontre ${encounterId}`
      );
      const fetchEncounterData = async () => {
        try {
          const encounterRef = doc(db, "encounters", encounterId);
          const encounterSnap = await getDoc(encounterRef);

          if (encounterSnap.exists()) {
            const encounterData = encounterSnap.data() as Encounter;
            console.log("📋 Données de la rencontre:", encounterData);
            setName(encounterData.name);
            setDescription(encounterData.description || "");
            setNumberOfTables(encounterData.numberOfTables || 2);

            // Récupérer les noms des équipes
            const team1Doc = await getDoc(
              doc(db, "teams", encounterData.team1Id)
            );
            const team2Doc = await getDoc(
              doc(db, "teams", encounterData.team2Id)
            );

            const team1Name = team1Doc.exists() ? team1Doc.data().name : "";
            const team2Name = team2Doc.exists() ? team2Doc.data().name : "";

            console.log(`🏆 Équipes: ${team1Name} vs ${team2Name}`);
            setTeam1Name(team1Name);
            setTeam2Name(team2Name);
          } else {
            console.error("❌ Rencontre non trouvée");
            setError("Rencontre non trouvée");
          }
        } catch (error) {
          console.error(
            "❌ Erreur lors de la récupération de la rencontre:",
            error
          );
          setError("Erreur lors du chargement de la rencontre");
        }
      };

      fetchEncounterData();
    } else {
      console.log("🆕 Mode création: nouvelle rencontre");
    }
  }, [encounterId]);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Nom de la rencontre requis");
      return;
    }

    if (!team1Name.trim() || !team2Name.trim()) {
      setError("Veuillez saisir les noms des deux équipes");
      return;
    }

    if (team1Name.trim() === team2Name.trim()) {
      setError("Les deux équipes doivent avoir des noms différents");
      return;
    }

    setLoading(true);

    try {
      const now = Date.now();

      if (encounterId) {
        // Mode édition - mettre à jour la rencontre et les équipes
        const encounterRef = doc(db, "encounters", encounterId);
        const encounterSnap = await getDoc(encounterRef);

        if (encounterSnap.exists()) {
          const encounterData = encounterSnap.data() as Encounter;

          // Mettre à jour les noms des équipes
          await updateDoc(doc(db, "teams", encounterData.team1Id), {
            name: team1Name.trim(),
            updatedAt: now,
          });

          await updateDoc(doc(db, "teams", encounterData.team2Id), {
            name: team2Name.trim(),
            updatedAt: now,
          });

          // Mettre à jour la rencontre
          const updateData: Record<string, unknown> = {
            name: name.trim(),
            numberOfTables: numberOfTables,
            updatedAt: now,
          };
          
          if (description.trim()) {
            updateData.description = description.trim();
          }
          
          await updateDoc(encounterRef, updateData);

          console.log("Rencontre et équipes mises à jour");
        }
      } else {
        // Mode création - créer les équipes et la rencontre
        const batch = writeBatch(db);

        // Créer les équipes
        const team1Ref = doc(collection(db, "teams"));
        const team2Ref = doc(collection(db, "teams"));

        batch.set(team1Ref, {
          name: team1Name.trim(),
          order: 1,
          matchesWon: 0,
          createdAt: now,
          updatedAt: now,
        });

        batch.set(team2Ref, {
          name: team2Name.trim(),
          order: 2,
          matchesWon: 0,
          createdAt: now,
          updatedAt: now,
        });

        // Créer la rencontre
        const encounterRef = doc(collection(db, "encounters"));
        const encounterData: Record<string, unknown> = {
          name: name.trim(),
          team1Id: team1Ref.id,
          team2Id: team2Ref.id,
          numberOfTables: numberOfTables,
          status: "active",
          isCurrent: false,
          createdAt: now,
          updatedAt: now,
        };
        
        if (description.trim()) {
          encounterData.description = description.trim();
        }
        
        batch.set(encounterRef, encounterData);

        await batch.commit();
        console.log("Rencontre et équipes créées");
      }

      // Redirection immédiate après succès
      navigate("/encounters");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setError("Erreur lors de la sauvegarde de la rencontre");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate("/encounters");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom color="primary">
          {isEditing ? "Modifier la rencontre" : "Étape 1 : Créer la rencontre"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditing
            ? "Modifiez les informations de la rencontre"
            : "Créez votre rencontre en sélectionnant les deux équipes qui s'affronteront"}
        </Typography>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 800, mx: "auto", boxShadow: 3 }}>
        <Stack spacing={4}>
          <TextField
            label="Nom de la rencontre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            placeholder="Ex: Championnat 2024 - Finale"
            size="large"
            sx={{
              "& .MuiInputBase-input": {
                fontSize: "1.1rem",
                padding: "16px",
              },
            }}
          />

          <TextField
            label="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Ajoutez une description pour cette rencontre..."
          />

          <TextField
            label="Nombre de tables"
            type="number"
            value={numberOfTables}
            onChange={(e) => setNumberOfTables(Number(e.target.value))}
            fullWidth
            required
            inputProps={{ min: 1, max: 20 }}
            helperText="Nombre de tables disponibles pour les matchs"
            sx={{
              "& .MuiInputBase-input": {
                fontSize: "1.1rem",
                padding: "16px",
              },
            }}
          />

          <Box
            sx={{
              border: "2px dashed",
              borderColor: "primary.main",
              borderRadius: 2,
              p: 3,
              backgroundColor: "primary.50",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              color="primary"
              textAlign="center"
            >
              Saisissez les noms des équipes
            </Typography>

            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Équipe 1"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="Ex: SQY PING"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: "1.1rem",
                    padding: "16px",
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 60,
                }}
              >
                <Typography variant="h5" color="primary" fontWeight="bold">
                  VS
                </Typography>
              </Box>

              <TextField
                label="Équipe 2"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="Ex: PARIS 13 TT"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: "1.1rem",
                    padding: "16px",
                  },
                }}
              />
            </Stack>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "center", mt: 2 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading || !name || !team1Name || !team2Name}
              startIcon={loading && <CircularProgress size={20} />}
              sx={{ minWidth: 200, py: 1.5 }}
            >
              {loading
                ? "Sauvegarde..."
                : isEditing
                ? "Mettre à jour"
                : "Créer la rencontre"}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={handleBackToList}
              disabled={loading}
              sx={{ minWidth: 120, py: 1.5 }}
            >
              Annuler
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
