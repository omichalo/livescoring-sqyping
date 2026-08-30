import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Refresh, FilterList, Clear } from "@mui/icons-material";
import { milestoneService, type Milestone } from "@/services/milestoneService";

const MilestonesPage: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState({
    tableNumber: "",
    date: "",
    startDate: "",
    endDate: "",
  });

  // Charger les tables disponibles
  const loadAvailableTables = async () => {
    try {
      // Essayer d'abord depuis les milestones
      let tables = await milestoneService.getAvailableTables();

      // Si aucune table trouvée dans les milestones, essayer depuis les encounters
      if (tables.length === 0) {
        tables = await milestoneService.getTablesFromEncounters();
      }

      setAvailableTables(tables);
    } catch (err) {
      console.error("Erreur lors du chargement des tables:", err);
      // En cas d'erreur, essayer depuis les encounters
      try {
        const tables = await milestoneService.getTablesFromEncounters();
        setAvailableTables(tables);
      } catch (err2) {
        console.error(
          "Erreur lors du chargement des tables depuis encounters:",
          err2
        );
      }
    }
  };

  // Charger les points marquants
  const loadMilestones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await milestoneService.getAllMilestones();
      setMilestones(data);
    } catch (err) {
      setError("Erreur lors du chargement des points marquants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres
  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: any = {};

      if (filters.tableNumber) {
        filterParams.tableNumber = parseInt(filters.tableNumber);
      }
      if (filters.date) {
        filterParams.date = filters.date;
      }
      if (filters.startDate) {
        filterParams.startDate = filters.startDate;
      }
      if (filters.endDate) {
        filterParams.endDate = filters.endDate;
      }

      const data = await milestoneService.getMilestonesWithFilters(
        filterParams
      );
      setMilestones(data);
    } catch (err) {
      setError("Erreur lors de l'application des filtres");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      tableNumber: "",
      date: "",
      startDate: "",
      endDate: "",
    });
    loadMilestones();
  };

  // Charger au montage
  useEffect(() => {
    loadAvailableTables();
    loadMilestones();
  }, []);

  // Appliquer les filtres automatiquement quand ils changent
  useEffect(() => {
    const hasFilters = Object.values(filters).some((value) => value !== "");
    if (hasFilters) {
      applyFilters();
    }
  }, [filters]);

  // Formater la date et l'heure
  const formatDateTime = (milestone: Milestone) => {
    const date = milestone.timestamp.toDate();
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Utiliser les tables disponibles (depuis Firestore) ou les tables des milestones
  const uniqueTables =
    availableTables.length > 0
      ? availableTables
      : Array.from(new Set(milestones.map((m) => m.tableNumber))).sort();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Points Marquants
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gestion des événements marquants par table et date
      </Typography>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filtres</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Table</InputLabel>
                <Select
                  value={filters.tableNumber}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      tableNumber: e.target.value,
                    }))
                  }
                  label="Table"
                >
                  <MenuItem value="">Toutes les tables</MenuItem>
                  {uniqueTables.map((table) => (
                    <MenuItem key={table} value={table.toString()}>
                      Table {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date exacte"
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, date: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date de début"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date de fin"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={resetFilters}
            >
              Réinitialiser
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadMilestones}
            >
              Actualiser
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table des points marquants */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Liste des Points Marquants ({milestones.length})
            </Typography>
            <Tooltip title="Actualiser">
              <IconButton onClick={loadMilestones} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : milestones.length === 0 ? (
            <Alert severity="info">
              Aucun point marquant trouvé avec les filtres appliqués.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Heure</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Match Info</TableCell>
                    <TableCell>Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {milestones.map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(milestone)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`Table ${milestone.tableNumber}`}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {milestone.matchInfo ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {milestone.matchInfo.player1Name} vs{" "}
                              {milestone.matchInfo.player2Name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {milestone.matchInfo.matchDesc || "Match"}
                            </Typography>
                            <br />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Temps:{" "}
                              {Math.floor(
                                milestone.matchInfo.timeSinceStart / 60
                              )}
                              :
                              {(milestone.matchInfo.timeSinceStart % 60)
                                .toString()
                                .padStart(2, "0")}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Pas de match en cours
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {milestone.matchInfo ? (
                          <Box>
                            <Typography variant="body2">
                              Sets: {milestone.matchInfo.setsWon.player1}-
                              {milestone.matchInfo.setsWon.player2}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Set actuel:{" "}
                              {milestone.matchInfo.currentScore.player1}-
                              {milestone.matchInfo.currentScore.player2}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MilestonesPage;
