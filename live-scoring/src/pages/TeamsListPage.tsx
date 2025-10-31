import React, { useEffect, useState } from "react";
import {
  Typography,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fab,
  Stack,
  Chip,
  Box,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Team } from "../types";

export const TeamsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    // Récupérer toutes les équipes en temps réel
    const unsubscribe = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsData);
      // Autoriser la suppression seulement s'il y a plus de 2 équipes
      setCanDelete(teamsData.length > 2);
    });

    return () => unsubscribe();
  }, []);

  const getVictoriesChip = (victories: number) => {
    const color = victories > 0 ? "success" : "default";
    return (
      <Chip
        label={`${victories} victoire${victories > 1 ? "s" : ""}`}
        color={color}
        size="small"
        variant={victories > 0 ? "filled" : "outlined"}
      />
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1">
            Gestion des équipes
          </Typography>
          <Fab
            color="primary"
            aria-label="ajouter une équipe"
            component={Link}
            to="/teams/new"
            size="medium"
            disabled={teams.length >= 2}
            title={
              teams.length >= 2
                ? "Maximum 2 équipes autorisées"
                : "Ajouter une équipe"
            }
          >
            <AddIcon />
          </Fab>
        </Stack>

        {teams.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune équipe trouvée
            </Typography>
            <Typography color="text.secondary">
              Cliquez sur le bouton + pour créer votre première équipe
            </Typography>
          </Box>
        ) : (
          <List>
            {teams.map((team) => (
              <ListItem
                key={team.id}
                divider
                sx={{
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="h6" component="span">
                        {team.name}
                      </Typography>
                      {getVictoriesChip(team.matchesWon || 0)}
                    </Stack>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      ID: {team.id}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="modifier l'équipe"
                    onClick={() =>
                      navigate(`/teams/${team.id}`, { state: { canDelete } })
                    }
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Conseil :</strong> Les équipes sont automatiquement
            créées lors de la création des joueurs. Vous pouvez modifier leur
            nom et consulter leurs statistiques ici.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ⚠️ <strong>Important :</strong> L'application nécessite exactement 2
            équipes minimum.
            {teams.length <= 2 &&
              " La suppression est désactivée pour maintenir ce minimum."}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
