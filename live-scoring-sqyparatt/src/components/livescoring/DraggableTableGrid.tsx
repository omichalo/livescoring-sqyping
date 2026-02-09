"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Typography, Paper } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import type { ChampionshipId, LiveScoringMatch } from "@/lib/ittf/types";
import { TableBlock } from "./TableBlock";
import { loadTableOrder, saveTableOrder } from "@/lib/localStorage";

interface DraggableTableGridProps {
  champId: ChampionshipId;
  enabledTables: Record<number, boolean>;
  date: string;
  mode: "tv" | "ittf";
}

interface TableItem {
  id: string;
  tableNumber: number;
}

function SortableTableItem({
  item,
  champId,
  date,
  mode,
  activeId,
}: {
  item: TableItem;
  champId: ChampionshipId;
  date: string;
  mode: "tv" | "ittf";
  activeId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const isActive = activeId === item.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? 1 : 1,
    boxShadow: isDragging ? "none" : "none",
    zIndex: isDragging ? 1 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Box
        sx={{
          position: "relative",
          height: "100%",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            transform: "translateY(-2px)",
          },
          // Effet fantôme quand la carte est en cours de drag
          ...(isActive && {
            border: "2px dashed",
            borderColor: "primary.main",
            backgroundColor: "primary.50",
            opacity: 0.5,
            borderRadius: "8px",
          }),
        }}
      >
        {/* Handle de drag */}
        <Box
          {...attributes}
          {...listeners}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            cursor: "grab",
            opacity: 0.7,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "4px",
            padding: "4px",
            transition: "all 0.2s ease-in-out",
            transform: "scale(1)",
            "&:hover": {
              opacity: 1,
              backgroundColor: "rgba(255, 255, 255, 1)",
              transform: "scale(1.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            },
            "&:active": {
              cursor: "grabbing",
              transform: "scale(0.95)",
            },
          }}
        >
          <DragIndicator color="primary" />
        </Box>

        {/* Composant TableBlock */}
        <TableBlock
          champId={champId}
          table={item.tableNumber}
          date={date}
          mode={mode}
        />
      </Box>
    </div>
  );
}

export function DraggableTableGrid({
  champId,
  enabledTables,
  date,
  mode,
}: DraggableTableGridProps) {
  const [tableOrder, setTableOrder] = useState<TableItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setTableOrder((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tableOrder.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr",
              md: "repeat(2, 1fr)",
            },
            gap: 2,
            minHeight: "200px",
            transition: "all 0.3s ease",
          }}
        >
          {tableOrder.map((item) => (
            <SortableTableItem
              key={item.id}
              item={item}
              champId={champId}
              date={date}
              mode={mode}
              activeId={activeId}
            />
          ))}
        </Box>
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          <Box
            sx={{
              transform: "rotate(5deg)",
              opacity: 0.9,
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            }}
          >
            <TableBlock
              champId={champId}
              table={
                tableOrder.find((item) => item.id === activeId)?.tableNumber ||
                0
              }
              date={date}
              mode={mode}
            />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
