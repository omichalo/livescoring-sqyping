# Correction du problème de permissions Firestore

## 🔴 **Problème identifié**

```
FirebaseError: Missing or insufficient permissions.
```

## 🔍 **Cause racine**

Les règles Firestore pour la collection `teams` n'autorisaient que la **lecture** mais pas l'**écriture** :

```javascript
// ❌ AVANT - Seulement lecture
match /teams/{teamId} {
  allow read: if true;
}
```

## ✅ **Solution appliquée**

### 1. **Correction des règles Firestore**

```javascript
// ✅ APRÈS - Lecture et écriture
match /teams/{teamId} {
  allow read, write: if request.auth != null;
}
```

### 2. **Déploiement des nouvelles règles**

```bash
firebase deploy --only firestore:rules
```

### 3. **Corrections techniques précédentes**

- ✅ Fonction `updateTeamVictories` corrigée (requête Firestore)
- ✅ Import `getDoc` ajouté
- ✅ Status "finished" ajouté au match
- ✅ Logs de debug ajoutés

## 🧪 **Test maintenant possible**

1. **Se connecter** à l'application (authentification requise)
2. **Créer un match** via `/create-match`
3. **Lancer le match** sur une table
4. **Marquer des points** jusqu'à la victoire (3 sets)
5. **Vérifier** que les victoires d'équipes se mettent à jour

## 📊 **Logs attendus**

```
🎯 Match terminé ! {updatedSetsWon: {player1: 3, player2: 1}}
🏆 Équipe gagnante: {winnerTeamId: "team1", ...}
Équipe team1: victoires mises à jour de 3 à 4
```

## 🎯 **Résultat**

Les victoires d'équipes devraient maintenant se mettre à jour **automatiquement** dès qu'un match se termine ! 🚀
