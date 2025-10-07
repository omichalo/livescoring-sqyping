import { useState } from "react";
import {
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { collection, getDocs, addDoc, writeBatch } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const CreateEncounterPage = () => {
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [team1LogoFile, setTeam1LogoFile] = useState<File | null>(null);
  const [team2LogoFile, setTeam2LogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange =
    (setter: React.Dispatch<React.SetStateAction<File | null>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setter(e.target.files[0]);
      }
    };

  const uploadLogo = async (file: File, team: "team1" | "team2") => {
    const storageRef = ref(storage, `logos/${team}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    if (!team1Name || !team2Name || !team1LogoFile || !team2LogoFile) return;

    setLoading(true);
    setSuccess(false);

    try {
      const [logo1Url, logo2Url] = await Promise.all([
        uploadLogo(team1LogoFile, "team1"),
        uploadLogo(team2LogoFile, "team2"),
      ]);

      // Fermer toutes les autres rencontres actives
      const batch = writeBatch(db);
      const existing = await getDocs(collection(db, "encounters"));

      existing.docs.forEach((enc) => {
        batch.update(enc.ref, { active: false });
      });

      // Appliquer les mises à jour en lot
      await batch.commit();

      // Ensuite créer la nouvelle rencontre active
      await addDoc(collection(db, "encounters"), {
        team1: { name: team1Name, logo: logo1Url },
        team2: { name: team2Name, logo: logo2Url },
        team1Wins: 0,
        team2Wins: 0,
        active: true,
        createdAt: new Date(),
      });

      setTeam1Name("");
      setTeam2Name("");
      setTeam1LogoFile(null);
      setTeam2LogoFile(null);
      setSuccess(true);
    } catch (error) {
      console.error("Erreur lors de la création :", error);
    }

    setLoading(false);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Créer une rencontre entre équipes
      </Typography>

      <Stack spacing={3}>
        {/* Équipe 1 */}
        <TextField
          label="Nom équipe 1"
          value={team1Name}
          onChange={(e) => setTeam1Name(e.target.value)}
          fullWidth
        />
        <Button variant="outlined" component="label">
          Télécharger logo équipe 1
          <input
            type="file"
            hidden
            onChange={handleFileChange(setTeam1LogoFile)}
          />
        </Button>
        {team1LogoFile && (
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#fafafa",
            }}
          >
            <Box
              component="img"
              src={URL.createObjectURL(team1LogoFile)}
              alt="Logo équipe 1"
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        )}

        {/* Équipe 2 */}
        <TextField
          label="Nom équipe 2"
          value={team2Name}
          onChange={(e) => setTeam2Name(e.target.value)}
          fullWidth
        />
        <Button variant="outlined" component="label">
          Télécharger logo équipe 2
          <input
            type="file"
            hidden
            onChange={handleFileChange(setTeam2LogoFile)}
          />
        </Button>
        {team2LogoFile && (
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#fafafa",
            }}
          >
            <Box
              component="img"
              src={URL.createObjectURL(team2LogoFile)}
              alt="Logo équipe 2"
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={
            loading ||
            !team1Name ||
            !team2Name ||
            !team1LogoFile ||
            !team2LogoFile
          }
        >
          Créer la rencontre
        </Button>

        {success && (
          <Typography color="success.main">
            ✅ Rencontre créée avec succès !
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};
