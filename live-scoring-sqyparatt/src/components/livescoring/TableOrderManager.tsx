"use client";

import { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import type { ChampionshipId } from "@/lib/ittf/types";
import { TableBlock } from "./TableBlock";
import { loadTableOrder, saveTableOrder } from "@/lib/localStorage";

interface TableOrderManagerProps {
  champId: ChampionshipId;
  enabledTables: Record<number, boolean>;
  date: string;
  mode: "tv" | "ittf";
}

interface TableItem {
  id: string;
  tableNumber: number;
}

function TableItemWithControls({
  item,
  champId,
  date,
  mode,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  animationDirection,
  cardHeight,
}: {
  item: TableItem;
  champId: ChampionshipId;
  date: string;
  mode: "tv" | "ittf";
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  animationDirection?: "up" | "down";
  cardHeight: { xs: string; sm: string; md: string; lg: string };
}) {
  return (
    <Box
      sx={{
        position: "relative",
        // Animation conditionnelle pour cette table spécifique
        ...(animationDirection && {
          filter: "brightness(1.2) saturate(1.3)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          animation:
            animationDirection === "up"
              ? "moveUp 0.8s ease-in-out"
              : "moveDown 0.8s ease-in-out",
          zIndex: 10,
        }),
      }}
    >
      {/* Contrôles de réorganisation */}
      <Box
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "6px",
          padding: "2px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <IconButton
          onClick={onMoveUp}
          disabled={!canMoveUp}
          size="small"
          sx={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            backgroundColor: canMoveUp ? "primary.main" : "grey.300",
            color: canMoveUp ? "white" : "grey.500",
            opacity: canMoveUp ? 1 : 0.4,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            minWidth: "24px",
            "&:hover": {
              backgroundColor: canMoveUp ? "primary.dark" : "grey.300",
              transform: canMoveUp ? "scale(1.15)" : "none",
              boxShadow: canMoveUp ? "0 6px 16px rgba(0,0,0,0.3)" : "none",
            },
            "&:active": {
              transform: canMoveUp ? "scale(0.9)" : "none",
              animation: canMoveUp ? "buttonPulse 0.3s ease-in-out" : "none",
            },
          }}
        >
          <ArrowUpward sx={{ fontSize: "14px" }} />
        </IconButton>
        <IconButton
          onClick={onMoveDown}
          disabled={!canMoveDown}
          size="small"
          sx={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            backgroundColor: canMoveDown ? "primary.main" : "grey.300",
            color: canMoveDown ? "white" : "grey.500",
            opacity: canMoveDown ? 1 : 0.4,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            minWidth: "24px",
            "&:hover": {
              backgroundColor: canMoveDown ? "primary.dark" : "grey.300",
              transform: canMoveDown ? "scale(1.15)" : "none",
              boxShadow: canMoveDown ? "0 6px 16px rgba(0,0,0,0.3)" : "none",
            },
            "&:active": {
              transform: canMoveDown ? "scale(0.9)" : "none",
              animation: canMoveDown ? "buttonPulse 0.3s ease-in-out" : "none",
            },
          }}
        >
          <ArrowDownward sx={{ fontSize: "14px" }} />
        </IconButton>
      </Box>

      {/* Composant TableBlock */}
      <TableBlock
        champId={champId}
        table={item.tableNumber}
        date={date}
        mode={mode}
        height={cardHeight}
      />
    </Box>
  );
}

export function TableOrderManager({
  champId,
  enabledTables,
  date,
  mode,
}: TableOrderManagerProps) {
  const [tableOrder, setTableOrder] = useState<TableItem[]>([]);
  const [animatingTables, setAnimatingTables] = useState<
    Map<string, "up" | "down">
  >(new Map());

  // Initialiser l'ordre des tables
  useEffect(() => {
    const enabledTableNumbers = Object.keys(enabledTables)
      .map(Number)
      .filter((table) => enabledTables[table]);

    // Charger l'ordre sauvegardé ou utiliser l'ordre par défaut (numérique)
    const savedOrder = loadTableOrder();
    const defaultOrder = enabledTableNumbers
      .sort((a, b) => a - b)
      .map((tableNumber) => ({
        id: `table-${tableNumber}`,
        tableNumber,
      }));

    // Si on a un ordre sauvegardé, l'utiliser en filtrant les tables actives
    if (savedOrder && savedOrder.length > 0) {
      const filteredSavedOrder = savedOrder.filter((item) =>
        enabledTableNumbers.includes(item.tableNumber)
      );

      // Ajouter les nouvelles tables à la fin si elles ne sont pas dans l'ordre sauvegardé
      const savedTableNumbers = filteredSavedOrder.map(
        (item) => item.tableNumber
      );
      const newTables = enabledTableNumbers.filter(
        (tableNumber) => !savedTableNumbers.includes(tableNumber)
      );

      const newTableItems = newTables.map((tableNumber) => ({
        id: `table-${tableNumber}`,
        tableNumber,
      }));

      setTableOrder([...filteredSavedOrder, ...newTableItems]);
    } else {
      setTableOrder(defaultOrder);
    }
  }, [enabledTables]);

  // Sauvegarder l'ordre quand il change
  useEffect(() => {
    if (tableOrder.length > 0) {
      saveTableOrder(tableOrder);
    }
  }, [tableOrder]);

  // Fonctions pour déplacer les tables
  const moveTableUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...tableOrder];
      const currentTable = newOrder[index];
      const previousTable = newOrder[index - 1];

      // Marquer les deux tables avec leur direction de mouvement
      setAnimatingTables(
        new Map([
          [currentTable.id, "up"], // La table actuelle monte
          [previousTable.id, "down"], // La table précédente descend
        ])
      );

      [newOrder[index], newOrder[index - 1]] = [
        newOrder[index - 1],
        newOrder[index],
      ];
      setTableOrder(newOrder);

      setTimeout(() => setAnimatingTables(new Map()), 800);
    }
  };

  const moveTableDown = (index: number) => {
    if (index < tableOrder.length - 1) {
      const newOrder = [...tableOrder];
      const currentTable = newOrder[index];
      const nextTable = newOrder[index + 1];

      // Marquer les deux tables avec leur direction de mouvement
      setAnimatingTables(
        new Map([
          [currentTable.id, "down"], // La table actuelle descend
          [nextTable.id, "up"], // La table suivante monte
        ])
      );

      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      setTableOrder(newOrder);

      setTimeout(() => setAnimatingTables(new Map()), 800);
    }
  };

  if (tableOrder.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          Aucune table sélectionnée
        </Typography>
      </Box>
    );
  }

  // Hauteur fixe des cartes (augmentée pour accommoder les noms longs en double et les boutons)
  const getCardHeight = () => {
    return {
      xs: "550px", // Mobile : hauteur fixe
      sm: "550px", // Tablette : hauteur fixe
      md: "550px", // Tablette : hauteur fixe
      lg: "550px", // Desktop : hauteur fixe
    };
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr",
          md: "1fr",
          lg: "repeat(2, 1fr)",
        },
        gap: 2,
        transition: "all 0.3s ease",
        gridAutoRows: "min-content",
        padding: "4px",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowY: "auto", // Permet le scroll vertical
        maxHeight: "calc(100vh - 120px)", // Hauteur maximale pour permettre le scroll
        "& > *": {
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: "translateZ(0)", // Force l'accélération matérielle
        },
        // Définition de l'animation moveUp (table qui monte)
        "@keyframes moveUp": {
          "0%": {
            transform: "translateZ(0) translateY(100%)",
            filter: "brightness(1.2) saturate(1.3)",
            opacity: 0.8,
          },
          "50%": {
            transform: "translateZ(0) translateY(-50%)",
            filter: "brightness(1.4) saturate(1.5)",
            opacity: 1,
          },
          "100%": {
            transform: "translateZ(0) translateY(0%)",
            filter: "brightness(1.2) saturate(1.3)",
            opacity: 1,
          },
        },
        // Définition de l'animation moveDown (table qui descend)
        "@keyframes moveDown": {
          "0%": {
            transform: "translateZ(0) translateY(-100%)",
            filter: "brightness(1.2) saturate(1.3)",
            opacity: 0.8,
          },
          "50%": {
            transform: "translateZ(0) translateY(50%)",
            filter: "brightness(1.4) saturate(1.5)",
            opacity: 1,
          },
          "100%": {
            transform: "translateZ(0) translateY(0%)",
            filter: "brightness(1.2) saturate(1.3)",
            opacity: 1,
          },
        },
        // Définition de l'animation buttonPulse
        "@keyframes buttonPulse": {
          "0%": {
            transform: "scale(0.9)",
            boxShadow: "0 0 0 0 rgba(25, 118, 210, 0.7)",
          },
          "50%": {
            transform: "scale(1.1)",
            boxShadow: "0 0 0 8px rgba(25, 118, 210, 0.3)",
          },
          "100%": {
            transform: "scale(0.9)",
            boxShadow: "0 0 0 0 rgba(25, 118, 210, 0)",
          },
        },
      }}
    >
      {tableOrder.map((item, index) => (
        <TableItemWithControls
          key={item.id}
          item={item}
          champId={champId}
          date={date}
          mode={mode}
          canMoveUp={index > 0}
          canMoveDown={index < tableOrder.length - 1}
          onMoveUp={() => moveTableUp(index)}
          onMoveDown={() => moveTableDown(index)}
          animationDirection={animatingTables.get(item.id)}
          cardHeight={getCardHeight()}
        />
      ))}
    </Box>
  );
}
