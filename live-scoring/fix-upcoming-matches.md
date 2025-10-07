# Correction des matchs à venir dans l'overlay TV

## 🔴 **Problème identifié**

Les matchs à venir affichés dans l'overlay TV (`/overlay/tv/[table]`) n'étaient pas correctement filtrés et pouvaient inclure des matchs en cours ou terminés.

## 🔍 **Cause racine**

Dans `OverlayTVPage.tsx`, la requête pour récupérer les matchs à venir ne filtrait pas par statut :

```typescript
// ❌ AVANT - Récupère TOUS les matchs
const matchesQuery = query(
  collection(db, "matches"),
  orderBy("matchNumber", "asc"),
  limit(2)
);
```

## ✅ **Solution appliquée**

### 1. **Ajout du filtre par statut**

```typescript
// ✅ APRÈS - Récupère seulement les matchs "waiting"
const matchesQuery = query(
  collection(db, "matches"),
  where("status", "==", "waiting"), // ← FILTRE AJOUTÉ
  orderBy("matchNumber", "asc"),
  limit(2)
);
```

### 2. **Amélioration en temps réel**

- Remplacement de `getDocs` par `onSnapshot` pour des mises à jour automatiques
- Les matchs à venir se mettent à jour en temps réel quand leur statut change

### 3. **Gestion des erreurs améliorée**

- Ajout d'un callback d'erreur dans `onSnapshot`
- Logs plus clairs pour le debugging

### 4. **Nettoyage des listeners**

- Ajout de `unsubscribeUpcoming()` dans la fonction de nettoyage

## 🧪 **Test de la correction**

### Scénario de test :

1. **Créer plusieurs matchs** avec différents statuts :

   - Match 1 : `status: "waiting"`
   - Match 2 : `status: "waiting"`
   - Match 3 : `status: "inProgress"`
   - Match 4 : `status: "finished"`

2. **Vérifier l'overlay TV** (`/overlay/tv/1`) :

   - Doit afficher seulement les matchs 1 et 2 (statut "waiting")
   - Ne doit PAS afficher les matchs 3 et 4

3. **Tester les mises à jour en temps réel** :
   - Lancer le match 1 → Il disparaît des "matchs à venir"
   - Le match 3 apparaît automatiquement dans la liste

## 📊 **Logs attendus**

```
Prochains matchs (waiting uniquement): [
  { id: "match1", status: "waiting", matchNumber: 1, ... },
  { id: "match2", status: "waiting", matchNumber: 2, ... }
]
```

## 🎯 **Résultat**

L'overlay TV affiche maintenant **uniquement** les matchs en attente (statut "waiting") dans la section "prochains matchs", avec des mises à jour en temps réel ! 🚀
