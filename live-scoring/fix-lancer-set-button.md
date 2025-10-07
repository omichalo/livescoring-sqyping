# Correction : Bouton "Lancer Set" apparaît quand le match est terminé

## 🐛 **Problème identifié**

Le bouton "⏱ Lancer Set" restait actif même quand le match était terminé (un joueur avait 3 sets gagnés).

## 🔍 **Cause du problème**

La condition de désactivation du bouton ne prenait pas en compte le statut `isFinished` :

```typescript
// ❌ AVANT - Condition incomplète
disabled={!canLaunchSet}

// La fonction canLaunchSet ne vérifie que :
const canLaunchSet = (() => {
  const last = sets[sets.length - 1];
  const finished = last && Math.max(last.player1, last.player2) >= 11 && Math.abs(last.player1 - last.player2) >= 2;
  const alreadyEmptySet = last && last.player1 === 0 && last.player2 === 0;
  return finished && !alreadyEmptySet; // ← Ne vérifie pas isFinished
})();
```

## ✅ **Solution appliquée**

### **Condition de désactivation corrigée**

```typescript
// ✅ APRÈS - Condition complète
disabled={!canLaunchSet || isFinished}

// Et l'opacité aussi
sx={{ opacity: !canLaunchSet || isFinished ? 0.4 : 1 }}
```

## 🎯 **Logique des boutons maintenant**

### **Bouton "Lancer Set" est désactivé si :**

- ❌ Le set précédent n'est pas terminé (`!canLaunchSet`)
- ❌ **OU** le match est terminé (`isFinished`)

### **Boutons de score sont désactivés si :**

- ❌ Le match est terminé (`isFinished`)
- ❌ **OU** aucun set n'est lancé (`sets.length == 0`)
- ❌ **OU** un nouveau set peut être lancé (`canLaunchSet`)

### **Bouton "Terminer" est actif si :**

- ✅ Le match est terminé (`isFinished`)

## 🧪 **Scénarios de test**

### **Match en cours (sets 1-1)**

- ✅ Bouton "Lancer Set" : **Actif** (si set précédent terminé)
- ✅ Boutons de score : **Actifs**
- ❌ Bouton "Terminer" : **Désactivé**

### **Match terminé (3-0 ou 3-1 ou 3-2)**

- ❌ Bouton "Lancer Set" : **Désactivé** ← **CORRIGÉ**
- ❌ Boutons de score : **Désactivés**
- ✅ Bouton "Terminer" : **Actif**

## 🎯 **Résultat**

Le bouton "Lancer Set" est maintenant **correctement désactivé** quand le match est terminé, évitant toute confusion utilisateur ! ✅
