/**
 * Utilitaires pour Firebase Remote Config
 */

import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
} from "firebase/remote-config";
import { app } from "./firebase";

// Configuration par défaut
const DEFAULT_ITTF_URL =
  "https://www.fftt.com/sportif/iframe/iframe.php?table={TABLE}";
const DEFAULT_CHAMPIONSHIP_ID = "TTE5679";
const DEFAULT_IFRAME_HEIGHT = "450px";

let remoteConfig: ReturnType<typeof getRemoteConfig> | null = null;
let isInitialized = false;

/**
 * Initialise Remote Config (appelé automatiquement)
 */
async function initializeRemoteConfig() {
  if (isInitialized) return;

  try {
    remoteConfig = getRemoteConfig(app);

    // Configuration du cache (1 heure en production, 0 en développement)
    remoteConfig.settings = {
      minimumFetchIntervalMillis:
        process.env.NODE_ENV === "development" ? 0 : 3600000,
      fetchTimeoutMillis: 60000,
    };

    // Valeurs par défaut
    remoteConfig.defaultConfig = {
      ittf_iframe_url: DEFAULT_ITTF_URL,
      championship_id: DEFAULT_CHAMPIONSHIP_ID,
      iframe_height: DEFAULT_IFRAME_HEIGHT,
    };

    await fetchAndActivate(remoteConfig);
    isInitialized = true;
    console.log("✅ Firebase Remote Config initialisé");
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation de Remote Config:",
      error
    );
    // Continuer avec les valeurs par défaut
  }
}

/**
 * Récupère l'URL de base pour l'iframe ITTF depuis Remote Config
 * @returns URL de base avec placeholder {TABLE}
 */
export async function getITTFIframeUrl(): Promise<string> {
  try {
    await initializeRemoteConfig();

    if (remoteConfig) {
      const value = getValue(remoteConfig, "ittf_iframe_url");
      const url = value.asString();
      if (url) {
        console.log("📡 URL ITTF depuis Remote Config:", url);
        return url;
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'URL ITTF:", error);
  }

  console.log("⚠️ Utilisation de l'URL ITTF par défaut:", DEFAULT_ITTF_URL);
  return DEFAULT_ITTF_URL;
}

/**
 * Récupère l'ID du championnat depuis Remote Config
 * @returns ID du championnat
 */
export async function getChampionshipId(): Promise<string> {
  try {
    await initializeRemoteConfig();

    if (remoteConfig) {
      const value = getValue(remoteConfig, "championship_id");
      const champId = value.asString();
      if (champId) {
        console.log("📡 Championship ID depuis Remote Config:", champId);
        return champId;
      }
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération du Championship ID:",
      error
    );
  }

  console.log("⚠️ Utilisation du Championship ID par défaut");
  return DEFAULT_CHAMPIONSHIP_ID;
}

/**
 * Construit l'URL complète pour l'iframe ITTF avec le numéro de table
 * @param baseUrl URL de base avec placeholder {TABLE}
 * @param tableNumber Numéro de la table
 * @returns URL complète pour l'iframe
 */
export function buildITTFUrl(baseUrl: string, tableNumber: number): string {
  return baseUrl.replace("{TABLE}", tableNumber.toString());
}

/**
 * Récupère la hauteur de l'iframe depuis Remote Config
 * @returns Hauteur de l'iframe (ex: "600px")
 */
export async function getIframeHeight(): Promise<string> {
  try {
    await initializeRemoteConfig();

    if (remoteConfig) {
      const value = getValue(remoteConfig, "iframe_height");
      const height = value.asString();
      if (height) {
        // S'assurer que la hauteur a une unité (px par défaut)
        const normalizedHeight = height.includes("px") ? height : `${height}px`;
        console.log("📏 Hauteur iframe depuis Remote Config:", {
          original: height,
          normalized: normalizedHeight,
        });
        return normalizedHeight;
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la hauteur iframe:",
      error
    );
  }

  console.log("⚠️ Utilisation de la hauteur iframe par défaut");
  return DEFAULT_IFRAME_HEIGHT;
}
