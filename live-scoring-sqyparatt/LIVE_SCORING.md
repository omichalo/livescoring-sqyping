# Live Scoring - Documentation

## Vue d'ensemble

La fonctionnalité de Live Scoring permet de gérer le scoring en temps réel sur plusieurs tables simultanément. Elle propose deux modes :

### Mode Local

- Liste des matchs en cours ou à venir pour chaque table
- Interface de scoring intégrée
- Synchronisation temps réel avec Firestore
- Hauteur fixe avec scroll (max 3 matchs visibles)

### Mode FFTT

- Affichage d'une iframe externe
- URL configurable via Firebase Remote Config
- Injection du numéro de table dans l'URL

## Architecture

### Types et Interfaces

#### `LiveScoringSettings` (`src/lib/ittf/types.ts`)

```typescript
{
  mode: "fftt" | "local",
  selectedTables: number[],
  championshipId: string
}
```

#### `LiveScoringMatch` (`src/lib/ittf/types.ts`)

Match ITTF étendu avec référence Firestore optionnelle.

#### `FirestoreMatch` (`src/types/firestore-match.ts`)

Format compatible avec le composant MatchScoreCard du projet livescoring-sqyping.

### Services

#### `liveScoringService.ts`

- `createOrUpdateMatch()` : Crée ou met à jour un match
- `getMatchById()` : Récupère un match par ID
- `getMatchesByTable()` : Récupère les matchs d'une table
- `updateMatchScore()` : Met à jour le score
- `listenToMatch()` : Écoute les changements en temps réel
- `listenToTableMatches()` : Écoute tous les matchs d'une table

#### `firebase-remote-config.ts`

- `getFFTTIframeUrl()` : Récupère l'URL depuis Remote Config
- `buildFFTTUrl()` : Construit l'URL avec le numéro de table

#### `ittf-to-firestore.ts`

- `extractTableNumber()` : Extrait le numéro depuis "T11", "Table 5", etc.
- `mapITTFMatchToFirestore()` : Convertit un match ITTF en format Firestore
- `generateFirestoreMatchId()` : Génère un ID compatible Firestore

#### `localStorage.ts`

- `saveLiveScoringSettings()` : Sauvegarde les préférences
- `loadLiveScoringSettings()` : Charge les préférences
- `clearLiveScoringSettings()` : Réinitialise les préférences

### Hooks

#### `useLiveScoringMatches(champId, table, date)`

Hook personnalisé qui :

1. Récupère les matchs ITTF du jour via `useMatchDay`
2. Filtre par numéro de table
3. Écoute les matchs Firestore de la table
4. Merge les deux sources de données

Retourne :

- `ittfMatches` : Matchs depuis l'API ITTF
- `firestoreMatches` : Matchs depuis Firestore
- `matches` : Matchs mergés (ITTF + Firestore)
- `isLoading`, `error`

### Composants

#### `ModeSelector`

Radio buttons pour basculer entre mode FFTT et Local. Sauvegarde automatique dans localStorage.

#### `TableSelector`

Input numérique + boutons pour gérer la liste des tables. Maximum 10 tables. Sauvegarde automatique.

#### `TableBlock`

Composant principal pour une table. Deux états :

- **Liste** : Affiche les matchs avec scroll
- **Scoring** : Affiche le composant de scoring

#### `MatchListItem`

Card de match dans la liste avec :

- Statut (badge coloré)
- Heure planifiée
- Noms des joueurs + drapeaux
- Score actuel
- Description du match
- Bouton "Scorer ce match"
- Indicateur si déjà dans Firestore

#### `FFTTIframe`

Iframe responsive pour le mode FFTT. Charge l'URL depuis Remote Config au montage.

#### `MatchScoringWrapper`

Wrapper pour le composant de scoring. Gère :

1. Vérification si le match existe dans Firestore
2. Création automatique si inexistant
3. Écoute des changements en temps réel
4. Affichage du composant de scoring (TODO: intégrer MatchScoreCard)

### Page Principale

`/live-scoring` - Route principale avec :

1. **Sélecteur de championnat** : Dropdown des championnats disponibles
2. **Sélecteur de mode** : FFTT ou Local
3. **Sélecteur de tables** : Input + liste
4. **Grille de TableBlock** : 1-3 colonnes selon l'écran

## Configuration Firebase

### Remote Config

Créer la clé dans la console Firebase :

```
Clé: fftt_iframe_url
Valeur: https://www.fftt.com/sportif/iframe/iframe.php?table={TABLE}
Type: String
```

Le placeholder `{TABLE}` sera remplacé par le numéro de table.

### Firestore Rules

```javascript
match /matches/{matchId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## Utilisation

1. Aller sur `/live-scoring`
2. Sélectionner un championnat
3. Choisir le mode (Local ou FFTT)
4. Ajouter des tables (1-10)
5. Pour chaque table :
   - **Mode FFTT** : Iframe s'affiche automatiquement
   - **Mode Local** : Liste des matchs → Cliquer sur "Scorer ce match" → Interface de scoring

## Persistance

- **localStorage** : Mode, tables sélectionnées, championnat
- **Firestore** : Matchs en cours de scoring, scores, statuts

## TODO / Améliorations futures

1. **Intégration MatchScoreCard** : Remplacer le placeholder dans `MatchScoringWrapper` par le vrai composant du projet `livescoring-sqyping`
2. **Authentification** : Protéger la page avec `RequireAuth`
3. **Liste dynamique des championnats** : Récupérer depuis Firestore ou API
4. **Filtres avancés** : Filtrer les matchs par statut, événement, etc.
5. **Notifications** : Alertes pour nouveaux matchs sur les tables suivies
6. **Export** : Exporter les résultats des matchs
7. **Multi-utilisateurs** : Gestion des conflits si plusieurs scoreurs sur la même table
8. **Historique** : Voir l'historique des matchs scorés

## Troubleshooting

### "Aucun match pour cette table"

- Vérifier que la date est correcte (aujourd'hui)
- Vérifier que le championnat a des matchs ce jour-là
- Vérifier l'extraction du numéro de table (logs dans `extractTableNumber`)

### Iframe FFTT ne charge pas

- Vérifier la configuration Remote Config
- Vérifier l'URL de base (attribut `sandbox` de l'iframe)
- Vérifier les CORS si problème de chargement

### Match ne se crée pas dans Firestore

- Vérifier les permissions Firestore
- Vérifier les logs dans `createOrUpdateMatch`
- Vérifier le format des données ITTF


