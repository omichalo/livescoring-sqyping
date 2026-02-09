/**
 * Utilitaires pour gérer l'encounter sélectionné dans localStorage
 * Permet à chaque navigateur/PC d'avoir son propre encounter actif
 */

const SELECTED_ENCOUNTER_ID_KEY = "selectedEncounterId";

/**
 * Récupère l'ID de l'encounter sélectionné depuis localStorage
 * @returns L'ID de l'encounter sélectionné ou null si aucun n'est sélectionné
 */
export const getSelectedEncounterId = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_ENCOUNTER_ID_KEY);
  } catch (error) {
    console.error("Erreur lors de la lecture de localStorage:", error);
    return null;
  }
};

/**
 * Sauvegarde l'ID de l'encounter sélectionné dans localStorage
 * @param encounterId L'ID de l'encounter à sélectionner
 */
export const setSelectedEncounterId = (encounterId: string): void => {
  try {
    localStorage.setItem(SELECTED_ENCOUNTER_ID_KEY, encounterId);
  } catch (error) {
    console.error("Erreur lors de l'écriture dans localStorage:", error);
  }
};

/**
 * Supprime l'ID de l'encounter sélectionné de localStorage
 */
export const clearSelectedEncounterId = (): void => {
  try {
    localStorage.removeItem(SELECTED_ENCOUNTER_ID_KEY);
  } catch (error) {
    console.error("Erreur lors de la suppression de localStorage:", error);
  }
};
