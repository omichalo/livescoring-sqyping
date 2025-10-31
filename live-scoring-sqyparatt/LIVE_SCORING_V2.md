# Live Scoring V2 - Documentation

## Vue d'ensemble

Interface épurée de Live Scoring avec navigation par onglets. Pas de header, juste deux onglets : Live Scoring et Paramètres.

## Modes

### Mode TV

- Liste des matchs en cours/à venir par table
- Interface de scoring intégrée
- Synchronisation temps réel Firestore
- Scroll si plus de 3 matchs

### Mode ITTF

- Iframe externe par table
- URL configurable via Remote Config
- Injection automatique du numéro de table

## Interface

### Onglet 1 : Live Scoring

- Grille responsive (1-3 colonnes)
- Un bloc par table activée
- Affiche directement les matchs
- Aucun texte superflu

### Onglet 2 : Paramètres

- **Mode** : Choix TV / ITTF avec gros boutons
- **Tables** : Liste avec switches on/off
- Tables extraites de `championship.locations`
- Extraction du numéro depuis `Desc` (ex: "Table 11" → 11)

## Configuration

### Firebase Remote Config

Créer 2 clés :

```
1. championship_id
   Type: String
   Valeur: TTE5679 (ou l'ID du tournoi actif)

2. fftt_iframe_url
   Type: String
   Valeur: https://www.fftt.com/sportif/iframe/iframe.php?table={TABLE}
```

Le placeholder `{TABLE}` sera remplacé par le numéro.

### Firestore Rules

```javascript
match /matches/{matchId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## Types Modifiés

### LiveScoringSettings

```typescript
{
  mode: "tv" | "ittf",  // Renommés depuis "local" | "fftt"
  enabledTables: Record<number, boolean>  // { 1: true, 5: false, ... }
}
```

Le championshipId n'est plus dans les settings, il vient de Remote Config.

## Composants

### TableSwitchList (nouveau)

- Affiche la liste des tables du championnat
- Switch on/off pour chaque table
- Extrait les numéros avec `extractTableNumber(table.Desc)`
- Tri automatique par numéro

### ModeSelector (modifié)

- Mode TV au lieu de Local
- Mode ITTF au lieu de FFTT
- Design simplifié sans background
- Gros boutons avec icônes

### Page principale (refactorisée)

- Suppression du header interne
- Suppression du sélecteur de championnat
- Onglets en haut de page
- Contenu épuré

## Flux Utilisateur

1. **Premier chargement**

   - Remote Config charge l'ID du championnat
   - API ITTF récupère les tables disponibles
   - localStorage charge les préférences

2. **Onglet Paramètres**

   - Choisir Mode TV ou ITTF
   - Activer les tables souhaitées (switches)
   - Sauvegarde automatique

3. **Onglet Live Scoring**
   - Si aucune table : message + bouton vers Paramètres
   - Sinon : grille avec blocs par table
   - **Mode TV** : Liste → Clic → Scoring
   - **Mode ITTF** : Iframe directement

## Extraction des Tables

Les tables viennent de `championship.locations[]` :

```typescript
interface TableLocation {
  Key: string;
  Desc: string; // "Table 11", "T05", etc.
  Room?: string;
}
```

La fonction `extractTableNumber(Desc)` supporte :

- "Table 11" → 11
- "T11" → 11
- "5" → 5

## Avantages de cette Version

✅ Interface plus épurée (pas de header/footer)
✅ Navigation simple à 2 onglets
✅ Configuration Remote Config (pas de sélection manuelle)
✅ Tables auto-détectées depuis l'API
✅ Switches plus intuitifs que input + liste
✅ Noms de modes plus clairs (TV / ITTF)

## Migration depuis V1

Si vous avez des settings V1 en localStorage :

```typescript
// V1
{
  mode: "local" | "fftt",
  selectedTables: number[],
  championshipId: string
}

// V2
{
  mode: "tv" | "ittf",
  enabledTables: { 1: true, 5: true, ... }
}
```

Le code gère automatiquement les settings vides (première visite).


