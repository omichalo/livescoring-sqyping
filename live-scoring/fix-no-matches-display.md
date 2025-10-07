# Correction de l'affichage quand aucun match n'est disponible

## 🔴 **Problème identifié**

Quand il n'y a aucun match en cours sur la table ET aucun match à venir, l'overlay TV affichait un match fictif avec "joueur1" et "joueur2" au lieu d'indiquer clairement qu'il n'y a aucun match à programmer.

## 🔍 **Cause racine**

La logique d'affichage dans `OverlayDesign.tsx` ne gérait que 2 cas :

1. **Match en cours** (`isMatchInProgress = true`)
2. **Matchs à venir** (`displayUpcomingMatches = true`)

Il manquait un **3ème cas** : aucun match du tout.

## ✅ **Solution appliquée**

### 1. **Ajout d'une nouvelle condition**

```typescript
const displayNoMatches = !isMatchInProgress && upcomingMatches.length === 0;
```

### 2. **Modification de la logique d'affichage**

```typescript
// Avant : Condition ternaire simple
{displayUpcomingMatches ? ( /* prochains matchs */ ) : ( /* match en cours */ )}

// Après : Condition ternaire multiple
{displayUpcomingMatches ? (
  /* Bloc prochains matchs */
) : displayNoMatches ? (
  /* Bloc aucun match */
) : (
  /* Bloc match en cours */
)}
```

### 3. **Nouveau bloc "AUCUN MATCH"**

- **Fond** : `theme.palette.grey[300]` (gris clair)
- **Titre** : "AUCUN MATCH"
- **Sous-titre** : "À PROGRAMMER"
- **Ligne 3** : Vide (pour maintenir la structure)

## 🎨 **Apparence visuelle**

### Quand aucun match n'est disponible :

```
┌─────────────────────────────────────────┐
│ SQY PING    2  │  AUCUN MATCH           │
│ MICHALOWICZ   │  À PROGRAMMER           │
│ Olivier     1 │                         │
│              │                         │
│ PARIS 13 TT  1│                         │
│ MARTIN Pierre │                         │
│            0  │                         │
└─────────────────────────────────────────┘
```

## 🧪 **Scénarios de test**

### 1. **Match en cours**

- Condition : `orderedMatch.status === "inProgress"`
- Affichage : Scores en temps réel (comportement existant)

### 2. **Matchs à venir**

- Condition : `!isMatchInProgress && upcomingMatches.length > 0`
- Affichage : "PROCHAINS MATCHS" + liste des matchs (comportement existant)

### 3. **Aucun match** ← **NOUVEAU**

- Condition : `!isMatchInProgress && upcomingMatches.length === 0`
- Affichage : "AUCUN MATCH - À PROGRAMMER"

## 🎯 **Résultat**

L'overlay TV affiche maintenant clairement qu'il n'y a **aucun match à programmer** au lieu de montrer des données fictives ! 🚀
