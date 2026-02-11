# 🔄 ROLLBACK LOG & VERSION HISTORY

## 📅 Historique des Versions (Dernières en haut)

### ✅ `v2.2.63` (Visibility-Display) - 11 Feb 2026
**État :** Production Stable
**Contenu :**
- **Feature :** Affichage de la visibilité (en mètres) dans le Carousel Communautaire et sur la Carte (Mode Montagne & Popup Standard).
- **Fix :** Prise en compte de la visibilité faible (< 250m) pour débloquer le style "Montagne" sur la carte.

### ✅ `v2.2.62` (Optim-CacheFirst & Safety-Fix) - 10 Feb 2026
**État :** Production Stable
**Contenu :**
- **Perf :** Chargement instantané (Cache-First).
- **Consensus :** Remplacement systématique de l'affichage par la Neige/Orage si détectés par le consensus de sécurité (supression filtre restrictif Pluie).

### ✅ `v2.2.61` (Feature-Mountain-Community) - 10 Feb 2026
**État :** Production Stable
**Contenu :**
- **Feature :** Affichage des données Montagne (Avalanche / Neige) dans le module historique "Weather Community".

### ✅ `v2.2.60` (v2.7.2-Style-Hotfix) - 10 Feb 2026
**État :** Production Stable
**Contenu :**
- **UX :** Restauration des titres d'alerte en **MAJUSCULES** suite feedback utilisateur.

### ✅ `v2.2.59` (v2.7.1-Locality-Format-Fix) - 10 Feb 2026
**État :** Production Stable (Correction Finale UI)
**Contenu :**
- **UI Localisation :** Formatage explicite en deux parties `Ville (Région)` (ex: `Combloux (Bonneville)`) pour que l'interface affiche correctement la ville en Titre Principal.
- **Météo :** Détection intelligente de la Neige (si Pluie + Temp < 2.5°C) pour corriger les erreurs de type "Pluie par 1°C".
- **UX Notifications :** Maintien des titres d'alerte en **MAJUSCULES** (ex: "❄️ NEIGE EN COURS") pour visibilité maximale.

### ✅ `v2.2.58` (v2.7.0-Locality-Fix) - 10 Feb 2026
**État :** Production Stable
**Contenu :**
- **Localisation :** Priorisation de la **Localité Précise** (ex: Combloux) sur l'Arrondissement (ex: Bonneville) pour l'affichage principal.
- **Notifications :** Ajout d'un bouton **"Activer les alertes"** dans les Paramètres pour régénérer le token FCM en cas de problème.
- **Push Fix :** Correction des permissions et logs pour le debug des notifications matinales.

### ✅ [ACTUEL] `v2.2.57` (v2.6.8-Cloud-Submenu) - 7 Feb 2026
**État :** Production Stable
**Contenu :**
- **UI Contribution :** Implémentation du sous-menu (dropdown) pour **Cloudy** qui contient désormais **Fog** (Brouillard) et **Mist** (Brume).
- **Consistance :** Ajout de l'indicateur "More Options..." sous Cloudy et Rain.

### ✅ `v2.2.56` (v2.6.7-UI-Cloud-Tweak) - 7 Feb 2026
**État :** Production Stable
# 🔄 ROLLBACK LOG & VERSION HISTORY

## 📅 Historique des Versions (Dernières en haut)

### ✅ `v2.2.56` (v2.6.7-UI-Cloud-Tweak) - 7 Feb 2026
**État :** Production Stable
**Contenu :**
- **UI :** Iconographie simplifiée pour le Brouillard (Fog) et Brume (Mist) -> Nuage (Cloud).
- **Confirmation :** Averse (Showers) reste avec Pluie (Rain).

### ✅ `v2.2.55` (v2.6.6-Push-Perf-Fix) - 7 Feb 2026
**État :** Production Stable
# 🔄 ROLLBACK LOG & VERSION HISTORY

Ce document permet de revenir rapidement à une version stable précédente sans avoir besoin de copies complètes du dossier (économise de l'espace disque).

## 🚀 Comment restaurer une version ?
Pour revenir à une version spécifique, ouvrez un terminal et tapez :
```bash
git reset --hard <TAG_OU_COMMIT_ID>
```
*Attention : Cela effacera tous les changements non sauvegardés ultérieurs.*

---

## 📅 Historique des Versions (Dernières en haut)

### ✅ `v2.2.55` (v2.6.6-Push-Perf-Fix) - 7 Feb 2026
**État :** Production Stable
**Contenu :**
- **CRITIQUE (Push) :** Fix des notifications silencieuses sur iOS via `alert` dictionary dans APNS.
- **Performance :** Refonte `fetchWeather` (Split Core/Background) pour un démarrage instantané (<2s).
- **Bug UI :** Correction du graphique "Rain Trend" qui disparaissait (Timezone Fix).

### ✅ `v2.2.54` (v2.6.5-Sound-Priority-Fix) - 6 Feb 2026
**État :** Production Stable
**Contenu :**
- **CRITIQUE (Notifications) :** Ajout des paramètres `sound: "default"` et `priority: "high"` (Android) / `sound` (iOS) pour les Citations et les Alertes Pluie.
- **Pourquoi :** Les notifications arrivaient silencieusement et étaient manquées pas l'utilisateur (fausse impression de non-réception).

### ✅ `v2.2.53` (v2.6.4-Quote-Fix) - 5 Feb 2026
**État :** Production Stable
**Contenu :**
- **CRITIQUE :** Correction du crash `defineSecret` dans le backend (Runtime Error).
- **Reset IA :** Passage en `v23` pour forcer une nouvelle génération de citation immédiatement et effacer le cache corrompu.
- **Graphique Pluie :** Extension de `forecast_days` de 2 à 4 jours pour éviter que le graphique ne se coupe en fin de soirée.

### ✅ `v2.2.52` (v2.6.3-Rain-Trend) - 4 Feb 2026
**État :** Production Stable
**Contenu :**
- **Feature :** Graphique "Rain Trend (24h)" dynamique et connecté à l'API Open-Meteo.
- **Freemium :** Limite de 3h pour le graphe en mode gratuit (lock screen), 24h pour les premiums.
- **UI :** Affichage du volume total de pluie attendu (en mm) dans l'en-tête du graphe.
- **Contribution :** Ajout des options "Showers", "Fog", "Mist" disponibles en prod.

### ✅ `v2.2.51` (v2.6.2-Daylight-Fix) - 4 Feb 2026
**État :** Production Stable
**Contenu :**
- **UI :** Correction majeure du calcul `isDay` (Jour/Nuit). 
- **Bug :** L'app restait bloquée en mode nuit à 8h00 car elle utilisait l'index `[0]` (données d'Hier) pour comparer le lever du soleil au lieu de l'index d'Aujourd'hui.
- **Robustesse :** Migration vers une comparaison basée sur `Date.now()` (Heure réelle du téléphone) vs index dynamique `Today` de l'API.

### ✅ `v2.6.1-Emergency-Recovery` - 4 Feb 2026
**État :** Stable (Version précédente)
**Contenu :**
- **Sécurité :** Suppression physique des clés fuitées et protection globale `.env` dans Git.
- **IA Triple Fallback :** Utilisation de la clé Pollen en secours si la clé Gemini est bloquée (v21).
- **Stabilité :** Correction du fallback Gemini 1.5 (modèle introuvable).

---

### 📦 `v2.6.0-Engine-v20` - 3 Feb 2026
**État :** Version Précédente
**Contenu :**
- **IA Gemini :** Stratégie Dual Model (2.0 Flash -> 1.5 Flash).
- **Moteur Météo v20 :** Nouvelle alerte "Pluie Continue" (cooldown 45m).
- **Notifications UI :** Ajout des Toasts internes.

---

### 📦 `v2.5.0-Europe-Sync` - 2 Feb 2026
**État :** Version Précédente
**Contenu :**
- **Géo-Synchronisation :** Forçage du rafraîchissement météo et utilisateur après acquisition GPS.
- **Indicateurs Pollens :** Correction de la taille du modal et ajout du scroll.
- **Robustesse Gemini :** Timeout 30s et slot v10.

---

### 📦 `v2.4.3-Systematic-Modal` - 28 Jan 2026
**État :** Version Précédente
**Contenu :**
- **Contribution Force :** Ouverture systématique de la modale à chaque retour sur l'application (Resume/Sortie de veille iOS & Android).
- **Performance :** Maintien du "Submit" instantané.

---

### 📦 `v2.4.2-Contrib-Modal-Fix` - 28 Jan 2026
**État :** Production Stable (Hotfix)
**Contenu :**
- **Contribution Modal Fixes :**
  - Correction de l'ouverture automatique au lancement (Race cond. résolue via Ref & Timer court).
  - Bouton "Soumettre" débloqué instantanément (indépendant du loading weather).

---

### 📦 `v2.4.1-Gemini-Migration` - 27 Jan 2026
**État :** Production Stable (Gemini + Fixes)
**Contenu :**
- **Migration IA :** Passage à Google Gemini Native SDK (`gemini-1.5-flash`) pour les Citations du Jour (Rapide & Stable).
- **Notifications :** 
  - Suppression de la notif "Merci de votre confirmation" (Inutile).
  - Ajout notif "Vérification en cours" pour le reporter (sans auto-validation).
- **Performance :** 
  - Cache Local (LocalStorage) pour affichage instantané au lancement.
  - Bouton contribution débloqué immédiatement (plus de délai 15s).
- **Data Repair :** Backfill automatique de la température manquante si le front envoie trop vite.

---

### 📦 `6e8d88d` - 23 Jan 2026 (08:53)
**État :** Production Stable (Optimisée)
**Contenu :**
- **Proxy Météo Unifié :** Le Frontend et le Backend utilisent la même logique (Backend Proxy).
- **Alerte Intelligente :** 
  - Déclenchement **IMMÉDIAT** pour Orages, Neige, Fortes Pluies et **Averses Passagères** (même courtes).
  - Filtrage (2x15min) pour Bruines et Pluies légères (anti-bruit).
- **Affichage Sync :** Le carrousel horaire montre la pluie si l'alerte la détecte, même si le modèle standard ne la voit pas.

---

### 📦 `freemium_new_complete_V1-0-1` (`ce87343`)
**Date :** 23 Jan 2026
**Usage :** Point de restauration post-crash.
**Contenu :**
- Version restaurée identique à la prod "Hier Matin" (22 Jan 13h39).
- Contient le dossier `freemium_new_complete_V1-0-1` (copie physique de sécurité).

---

### 🛑 `v1.0.6-backup` (`86c38b5`)
**Date :** 22 Jan 2026
**Usage :** Dernière version stable connue AVANT le crash du 22 Janvier soir.
**Contenu :**
- Code fonctionnel avant tentative d'implémentation du Proxy qui avait échoué.
- "Base saine" pour recommencer le développement.

---

### 🌟 `v2.2.50` (`dace9c5`)
**Date :** 18 Jan 2026
**Usage :** Version Freemium Majeure.
**Contenu :**
- Nouvelle UI : Prévisions horaires déplacées au-dessus de la grille Stats.
- Freemium : UV et Pollution visibles pour tous.
- Carte Communautaire : Filtrée par ville pour le plan Gratuit (Rayon 30km).

---

### 🔐 `v2.2.23` (`5e02c23` / `b2e70f8`)
**Date :** Jan 2026
**Usage :** Version Pré-Secrets
**Contenu :**
- Secrets Firebase non utilisés (clés en dur ou env).
- Version stable avant la sécurisation via Cloud Secret Manager.

---

### 🏆 Golden Masters (Archives)
Ces versions sont des jalons majeurs de stabilité validés.
- `Golden-master-v2.2.22` (`98a36a9`) : No Spam Edition.
- `Golden-master-v2.2.20` (`bed5850`) : Alert Accuracy & Stability.
