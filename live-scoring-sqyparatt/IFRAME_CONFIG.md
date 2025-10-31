# Configuration de l'iframe FFTT

## Vue d'ensemble

L'URL et la hauteur de l'iframe FFTT en mode ITTF sont configurable via Firebase Remote Config, permettant de les ajuster sans redéployer l'application.

## Configuration Firebase

### 1. Accéder à Firebase Console

1. Ouvrez la [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Remote Config** dans le menu de gauche

### 2. Ajouter les clés de configuration

Créez les clés suivantes :

#### URL de l'iframe :

```
Clé: ittf_iframe_url
Valeur: https://www.fftt.com/sportif/iframe/iframe.php?table={TABLE}
Type: String
Description: URL de base pour l'iframe ITTF (placeholder {TABLE} sera remplacé)
```

#### Hauteur de l'iframe :

```
Clé: iframe_height
Valeur: 450px
Type: String
Description: Hauteur de l'iframe FFTT en mode ITTF
```

### 3. Valeurs recommandées

#### Hauteurs d'iframe :

- **Petit écran** : `500px`
- **Écran standard** : `450px` (valeur par défaut)
- **Grand écran** : `700px` ou `800px`
- **Écran TV** : `900px` ou `1000px`

#### URLs d'iframe :

- **ITTF standard** : `https://www.fftt.com/sportif/iframe/iframe.php?table={TABLE}`
- **Avec thème** : `https://www.fftt.com/sportif/iframe/iframe.php?table={TABLE}&theme=dark`
- **Service personnalisé** : `https://mon-service.com/table/{TABLE}`

### 4. Publier la configuration

1. Cliquez sur **Publier les modifications**
2. Confirmez la publication

## Comportement de l'application

- **Hauteur de l'iframe** : Utilise la valeur de `iframe_height`
- **Hauteur du conteneur** : Automatiquement ajustée (hauteur iframe + ~50px pour le header)
- **Fallback** : Si la configuration n'est pas disponible, utilise `600px` par défaut

## Exemples de configuration

### Pour un écran 1920x1080

```
iframe_height: 700px
```

### Pour un écran 4K

```
iframe_height: 1000px
```

### Pour un écran mobile/tablette

```
iframe_height: 400px
```

## Logs de débogage

L'application affiche dans la console :

- `📏 Hauteur iframe depuis Remote Config: [valeur]` - Configuration chargée
- `⚠️ Utilisation de la hauteur iframe par défaut` - Fallback utilisé

## Notes techniques

- La hauteur est récupérée au chargement du composant `FFTTIframe`
- Le conteneur `Card` s'ajuste automatiquement (+50px pour le header)
- La configuration est mise en cache pendant 1 heure en production
- En développement, la configuration est récupérée à chaque rechargement
