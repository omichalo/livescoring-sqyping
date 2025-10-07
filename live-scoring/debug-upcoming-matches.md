# Debug : Matchs à venir non affichés

## 🔍 **Problème signalé**

- **4 matchs** dans la base : 2 waiting, 1 inProgress (table 2), 1 finished
- **Attendu** : Les 2 matchs "waiting" devraient s'afficher sur `/overlay/tv/1`
- **Observé** : "Aucun match programmé" s'affiche

## 🧪 **Étapes de debug**

### 1. **Vérifier les logs dans la console**

Ouvrez la console du navigateur (F12) et allez sur `/overlay/tv/1`. Vous devriez voir :

#### **Logs de récupération des matchs à venir** :

```
Prochains matchs (waiting uniquement): [
  { id: "match1", status: "waiting", matchNumber: 1, ... },
  { id: "match2", status: "waiting", matchNumber: 2, ... }
]
```

#### **Logs de debug OverlayDesign** :

```
🔍 OverlayDesign Debug: {
  orderedMatch: null,
  upcomingMatches: [
    { id: "match1", status: "waiting", matchNumber: 1 },
    { id: "match2", status: "waiting", matchNumber: 2 }
  ],
  isMatchInProgress: false,
  displayUpcomingMatches: true,
  displayNoMatches: false
}
```

### 2. **Scénarios possibles**

#### **Scénario A : Matchs non récupérés**

```
Prochains matchs (waiting uniquement): []
🔍 OverlayDesign Debug: {
  upcomingMatches: [],
  displayNoMatches: true
}
```

**Cause** : Problème avec la requête Firestore ou l'index

#### **Scénario B : Matchs récupérés mais logique incorrecte**

```
Prochains matchs (waiting uniquement): [match1, match2]
🔍 OverlayDesign Debug: {
  upcomingMatches: [match1, match2],
  displayNoMatches: true  // ← PROBLÈME
}
```

**Cause** : Problème dans la logique de `displayUpcomingMatches`

#### **Scénario C : Match en cours détecté incorrectement**

```
🔍 OverlayDesign Debug: {
  orderedMatch: { id: "match3", status: "inProgress" },
  isMatchInProgress: true,
  displayUpcomingMatches: false
}
```

**Cause** : Un match en cours est détecté pour la table 1

### 3. **Vérifications supplémentaires**

#### **A. Vérifier l'index Firestore**

La requête utilise `orderBy("matchNumber", "asc")` qui nécessite un index composite :

- Collection : `matches`
- Fields : `status` (Ascending), `matchNumber` (Ascending)

#### **B. Vérifier les permissions**

Assurez-vous que les règles Firestore permettent la lecture des matchs "waiting"

#### **C. Vérifier les données**

```javascript
// Dans la console du navigateur
db.collection("matches")
  .where("status", "==", "waiting")
  .get()
  .then((snap) => {
    snap.docs.forEach((doc) => console.log(doc.id, doc.data()));
  });
```

## 🎯 **Solutions selon le scénario**

### **Si Scénario A (matchs non récupérés)**

1. Créer l'index Firestore manquant
2. Vérifier les permissions
3. Vérifier que les matchs ont bien `status: "waiting"`

### **Si Scénario B (logique incorrecte)**

1. Vérifier la logique dans `OverlayDesign.tsx`
2. Ajouter plus de logs de debug

### **Si Scénario C (match en cours incorrect)**

1. Vérifier la logique de récupération du match en cours
2. S'assurer qu'aucun match en cours n'est associé à la table 1

## 📊 **Résultat attendu**

```
Prochains matchs (waiting uniquement): [match1, match2]
🔍 OverlayDesign Debug: {
  orderedMatch: null,
  upcomingMatches: [match1, match2],
  displayUpcomingMatches: true  // ← DOIT ÊTRE TRUE
}
```
