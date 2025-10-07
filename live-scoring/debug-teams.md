# Debug des victoires d'équipes

## Problème identifié et corrigé

### 🔴 **Problème principal**

La fonction `updateTeamVictories` utilisait une requête incorrecte :

```typescript
// ❌ INCORRECT
const teamDoc = await getDocs(
  query(collection(db, "teams"), where("__name__", "==", teamId))
);
```

### ✅ **Solution appliquée**

Utilisation de `getDoc` pour récupérer directement le document par son ID :

```typescript
// ✅ CORRECT
const teamRef = doc(db, "teams", teamId);
const teamDoc = await getDoc(teamRef);
```

### 🔧 **Améliorations ajoutées**

1. **Import manquant** : Ajout de `getDoc` dans les imports
2. **Status du match** : Le match est maintenant marqué comme "finished"
3. **Logs de debug** : Ajout de logs détaillés pour tracer le problème

### 🧪 **Comment tester**

1. **Ouvrir la console** du navigateur (F12)
2. **Créer un match** via `/create-match`
3. **Lancer le match** sur une table via `/matches`
4. **Marquer des points** jusqu'à la victoire (3 sets)
5. **Vérifier les logs** dans la console :
   - `🎯 Match terminé !` avec les sets gagnés
   - `🏆 Équipe gagnante:` avec l'ID de l'équipe
   - `Équipe {teamId}: victoires mises à jour de X à Y`

### 🔍 **Logs attendus**

```
🎯 Match terminé ! {updatedSetsWon: {player1: 3, player2: 1}, isFinished: true}
🏆 Équipe gagnante: {winnerTeamId: "team1", player1: {...}, player2: {...}}
Équipe team1: victoires mises à jour de 3 à 4
```

### 📊 **Vérification finale**

- Aller sur `/overlay/tv/1` pour voir les victoires mises à jour
- Ou utiliser le bouton "🔍 Vérifier cohérence" pour un contrôle automatique

### 🚨 **Si le problème persiste**

Vérifier que :

1. Les équipes existent bien dans Firestore avec les IDs corrects
2. Les joueurs ont bien un `teamId` valide
3. Les permissions Firestore permettent l'écriture sur la collection `teams`
