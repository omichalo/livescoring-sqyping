# Contrainte : Toujours avoir exactement 2 équipes

## 🎯 **Problème identifié**

L'application nécessite exactement 2 équipes pour fonctionner correctement. Il fallait empêcher :

- ❌ La suppression d'équipes quand il n'y en a que 2
- ❌ La création d'une 3ème équipe

## ✅ **Solutions implémentées**

### **1. Protection contre la suppression**

#### **TeamsListPage.tsx**

```typescript
// Détection du nombre d'équipes
const [canDelete, setCanDelete] = useState(false);

const unsubscribe = onSnapshot(collection(db, "teams"), (snapshot) => {
  const teamsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Team[];
  setTeams(teamsData);
  // Autoriser la suppression seulement s'il y a plus de 2 équipes
  setCanDelete(teamsData.length > 2);
});

// Passage de l'information via navigation
onClick={() => navigate(`/teams/${team.id}`, { state: { canDelete } })}
```

#### **TeamFormPage.tsx**

```typescript
// Récupération de l'information
const canDelete = (location.state as any)?.canDelete ?? false;

// Bouton de suppression conditionnel
<Button
  disabled={loading || !canDelete}
  title={
    !canDelete
      ? "Impossible de supprimer : minimum 2 équipes requis"
      : "Supprimer l'équipe"
  }
>
  🗑️ Supprimer
</Button>;

// Message d'information
{
  teamId && !canDelete && (
    <Alert severity="info">
      ℹ️ La suppression est désactivée car l'application nécessite un minimum de
      2 équipes.
    </Alert>
  );
}
```

### **2. Protection contre la création excessive**

#### **TeamsListPage.tsx**

```typescript
// Bouton d'ajout désactivé quand 2 équipes
<Fab
  disabled={teams.length >= 2}
  title={
    teams.length >= 2 ? "Maximum 2 équipes autorisées" : "Ajouter une équipe"
  }
>
  <AddIcon />
</Fab>
```

#### **TeamFormPage.tsx**

```typescript
// Validation dans handleSubmit
if (!teamId && teamsCount >= 2) {
  setError(
    "Impossible de créer plus de 2 équipes. L'application nécessite exactement 2 équipes."
  );
  return;
}
```

### **3. Messages informatifs**

#### **TeamsListPage.tsx**

```typescript
<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
  ⚠️ <strong>Important :</strong> L'application nécessite exactement 2 équipes
  minimum.
  {teams.length <= 2 &&
    " La suppression est désactivée pour maintenir ce minimum."}
</Typography>
```

## 🎯 **Comportements par nombre d'équipes**

### **0 équipe**

- ✅ **Bouton [+] actif** : Permet de créer la première équipe
- ❌ **Boutons suppression** : N/A (pas d'équipe à supprimer)
- 📝 **Message** : "Aucune équipe trouvée"

### **1 équipe**

- ✅ **Bouton [+] actif** : Permet de créer la deuxième équipe
- ❌ **Boutons suppression** : Désactivés (minimum requis)
- 📝 **Message** : "La suppression est désactivée pour maintenir ce minimum"

### **2 équipes (optimal)**

- ❌ **Bouton [+] désactivé** : Maximum atteint
- ❌ **Boutons suppression** : Désactivés (minimum requis)
- 📝 **Message** : "Maximum 2 équipes autorisées"

### **3+ équipes (si créées avant la contrainte)**

- ❌ **Bouton [+] désactivé** : Maximum atteint
- ✅ **Boutons suppression** : Actifs (on peut supprimer jusqu'à 2)
- 📝 **Message** : "Maximum 2 équipes autorisées"

## 🔒 **Sécurité et UX**

### **Protection côté interface**

- ✅ **Boutons désactivés** avec tooltips explicatifs
- ✅ **Messages d'erreur** clairs lors des tentatives
- ✅ **Alertes informatives** pour expliquer les restrictions

### **Protection côté logique**

- ✅ **Validation avant soumission** du formulaire
- ✅ **Comptage en temps réel** du nombre d'équipes
- ✅ **État partagé** entre les pages via navigation

### **Messages utilisateur**

- ✅ **Tooltips** sur les boutons désactivés
- ✅ **Alertes** dans les formulaires
- ✅ **Messages informatifs** dans la liste

## 🧪 **Scénarios de test**

### **Test de contrainte de suppression**

1. Aller sur `/teams` avec exactement 2 équipes
2. Cliquer sur ✏️ d'une équipe
3. Vérifier que le bouton "🗑️ Supprimer" est **désactivé**
4. Vérifier l'alerte informative

### **Test de contrainte de création**

1. Aller sur `/teams` avec exactement 2 équipes
2. Vérifier que le bouton [+] est **désactivé**
3. Essayer d'aller sur `/teams/new` directement
4. Vérifier le message d'erreur

### **Test avec 3+ équipes (cas edge)**

1. Avoir 3 équipes (si créées avant la contrainte)
2. Vérifier que la suppression est **autorisée**
3. Supprimer une équipe pour revenir à 2
4. Vérifier que la suppression redevient **interdite**

## 🎯 **Résultat**

L'application garantit maintenant qu'il y aura **toujours exactement 2 équipes minimum** avec une interface claire et des protections robustes ! 🚀
