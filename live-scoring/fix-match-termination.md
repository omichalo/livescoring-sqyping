# Correction du workflow de fin de match

## 🔴 **Problème identifié**

Quand un joueur atteignait 3 sets, le match passait **automatiquement** au statut "finished" et mettait à jour les victoires, retirant brutalement le score de l'overlay TV. Il manquait l'étape de validation par l'arbitre.

## 🔍 **Cause racine**

Dans `updateScore()`, dès qu'un joueur atteignait 3 sets :

1. ✅ Le match était marqué comme "finished" automatiquement
2. ✅ Les victoires étaient mises à jour automatiquement
3. ❌ **Aucune validation** par l'arbitre n'était requise

## ✅ **Solution appliquée**

### 1. **Séparation des responsabilités**

#### **Dans `updateScore()` - Marquer les points uniquement**

```typescript
// ✅ APRÈS - Seulement afficher le dialog de confirmation
if (isFinished) {
  console.log("🎯 Match prêt à être terminé !");
  const winnerName =
    updatedSetsWon.player1 === 3 ? match.player1.name : match.player2.name;
  setWinnerName(winnerName);
  setWinnerDialogOpen(true); // ← Dialog de confirmation
}
```

#### **Dans `terminateMatch()` - Terminer le match**

```typescript
// ✅ AJOUT - Gestion de la terminaison manuelle
const terminateMatch = async () => {
  // Calculer le gagnant
  const winnerTeamId =
    updatedSetsWon.player1 === 3 ? match.player1.teamId : match.player2.teamId;

  // Mettre à jour les victoires
  await updateTeamVictories(winnerTeamId, 1);

  // Marquer comme terminé
  await updateDoc(doc(db, "matches", match.id), {
    status: "finished",
  });
};
```

### 2. **Workflow corrigé**

| Étape | Action                            | Résultat                                              |
| ----- | --------------------------------- | ----------------------------------------------------- |
| **1** | Joueur atteint 3 sets             | Dialog s'ouvre : "Match terminé - Victoire de X"      |
| **2** | Arbitre clique "Terminer"         | Match → `status: "finished"` + Victoires mises à jour |
| **3** | Ou arbitre clique "Réinitialiser" | Match reste en cours                                  |

### 3. **Correction du reset**

```typescript
// ✅ CORRECT - Ne retire les victoires que si le match était terminé
if (match.status === "finished") {
  await updateTeamVictories(winnerTeamId, -1);
}
```

## 🎯 **Workflow final**

### **Scénario 1 : Match terminé normalement**

1. Joueur atteint 3 sets → Dialog s'ouvre
2. Arbitre clique "❌ Terminer" → Match terminé + Victoires +1
3. Overlay TV affiche "Aucun match programmé"

### **Scénario 2 : Match réinitialisé**

1. Joueur atteint 3 sets → Dialog s'ouvre
2. Arbitre clique "Réinitialiser le match" → Match remis à zéro
3. Overlay TV continue d'afficher le match en cours

## 🧪 **Test**

1. Marquer des points jusqu'à 3 sets pour un joueur
2. **Vérifier** : Dialog s'ouvre, match reste `status: "inProgress"`
3. **Cliquer "Terminer"** : Match passe à `status: "finished"` + victoires +1
4. **Vérifier** : Overlay TV affiche "Aucun match programmé"

## 🎯 **Résultat**

Le workflow respecte maintenant la **validation par l'arbitre** avant de terminer officiellement le match ! 🚀
