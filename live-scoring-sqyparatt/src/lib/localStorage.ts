/**
 * Utilitaires pour gérer le localStorage du live scoring
 */

import type { LiveScoringSettings } from "./ittf/types";

const SETTINGS_KEY = "sqyparatt-livescoring-settings";
const TABLE_ORDER_KEY = "sqyparatt-table-order";

export interface TableOrderItem {
  id: string;
  tableNumber: number;
}

/**
 * Sauvegarde les paramètres de live scoring dans le localStorage
 */
export function saveLiveScoringSettings(settings: LiveScoringSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des paramètres:", error);
  }
}

/**
 * Charge les paramètres de live scoring depuis le localStorage
 */
export function loadLiveScoringSettings(): LiveScoringSettings | null {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LiveScoringSettings;
  } catch (error) {
    console.error("Erreur lors du chargement des paramètres:", error);
    return null;
  }
}

/**
 * Réinitialise les paramètres de live scoring
 */
export function clearLiveScoringSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("Erreur lors de la suppression des paramètres:", error);
  }
}

/**
 * Sauvegarde l'ordre des tables dans le localStorage
 */
export function saveTableOrder(tableOrder: TableOrderItem[]): void {
  try {
    localStorage.setItem(TABLE_ORDER_KEY, JSON.stringify(tableOrder));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'ordre des tables:", error);
  }
}

/**
 * Charge l'ordre des tables depuis le localStorage
 */
export function loadTableOrder(): TableOrderItem[] | null {
  try {
    const stored = localStorage.getItem(TABLE_ORDER_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as TableOrderItem[];
  } catch (error) {
    console.error("Erreur lors du chargement de l'ordre des tables:", error);
    return null;
  }
}

/**
 * Réinitialise l'ordre des tables
 */
export function clearTableOrder(): void {
  try {
    localStorage.removeItem(TABLE_ORDER_KEY);
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de l'ordre des tables:",
      error
    );
  }
}
