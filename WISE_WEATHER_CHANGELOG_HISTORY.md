# 📜 WISE WEATHER - HISTORIQUE DES CHANGEMENTS ET RATIONALE

Ce fichier est le journal de bord de l'application. **IL EST OBLIGATOIRE DE LE LIRE AVANT TOUTE MODIFICATION DE CODE** pour comprendre pourquoi certaines décisions (souvent subtiles) ont été prises.

---

## 🏗️ ARCHITECTURE & LOGIQUES CRITIQUES (RÉFÉRENCE)

### 1. 🛡️ Proxy Météo & Sécurité (Backend vs Frontend)
- **Logique** : Le backend interroge **9 modèles météo simultanément** (Météo-France, ECMWF, GFS, etc.) alors que le frontend n'en utilise qu'un seul (Standard).
- **Rationale** : Cette déconnexion est **INTENTIONNELLE**. Le backend est réglé sur une sensibilité maximale pour la sécurité.
- **Surcharge (Override)** : Si le backend détecte un danger (Orage/Pluie) à moins de 30 min que le modèle standard ne voit pas, le Proxy **écrase** les données envoyées au frontend pour que l'icône de l'app corresponde à l'alerte reçue.

### 2. 🔔 Algorithme Intelligent des Alertes
Pour éviter de fatiguer l'utilisateur (Notification Fatigue), les alertes suivent des règles strictes :
- **Changement Significatif** : Une notification peut être envoyée toutes les **30 minutes** SI et seulement SI il y a un changement majeur (Ex: Sec -> Pluie, Pluie -> Neige, ou Intensification forte).
- **Condition Stable** : Si la pluie continue sans changer d'intensité, le système bloque les alertes pendant **120 minutes** (2h).
- **Cooldown Standard** : Pour les rappels météo classiques, le délai est de **4 heures**.

### 3. 📅 Système de Citations (7 AM Rule)
- **Heure fixe** : Les citations sont envoyées uniquement entre **7:00 et 7:12** heure locale de l'utilisateur.
- **Slot Unique** : Toutes les citations d'une journée partagent la même clé (`YYYY-MM-DD-all-day-v6`). Cela garantit que tous les utilisateurs voient la même inspiration et limite les appels à l'IA.

### 4. 🧪 Cache des Pollens (Optimisation Coûts)
- **3 Slots par jour** : Les données sont rafraîchies à **6h, 11h et 17h**. 
- **Rationale** : L'API Google Pollen est coûteuse. Entre ces créneaux, l'application utilise une clé de cache locale incluant le `timeSlot` pour éviter tout appel inutile.

### 5. 🎖️ Mode Contributeur (Accès Mérité)
- **Logique** : Faire un signalement météo valide accorde **+1 heure** d'accès aux fonctionnalités "Ultimate" (Carte mondiale).
- **Strikes** : Un système de "Strikes" (3 max) est en place. Si la communauté invalide trop souvent un utilisateur, son accès est bloqué.

### 6. 🛠️ Correction du Bug "NaN" (lastWeatherNotif)
- **Historique** : Un crash critique empêchait l'envoi des alertes car la date en base de données était parfois un String, parfois un Timestamp, ce qui créait des erreurs `Invalid Date`.
- **Solution** : Une fonction de parsing robuste est intégrée dans le backend pour normaliser tous les formats de date avant calcul.

---

## 🗓️ 30 Janvier 2026 - Optimisations Appliquées

### 1. 🤖 IA : Le "Signal" Roosevelt & Timeout 5s [APPLIQUÉ]
- **Changement** : Fallback unique sur Eleanor Roosevelt.
- **Pourquoi ?** : Balise de diagnostic. Si Roosevelt apparaît = Gemini a crashé ou timeout.
- **Prompt** : Ultra-court (Max 20 mots) pour garantir une réponse < 5s.

### 2. ⚡ Performance : Parallélisation [APPLIQUÉ]
- **Changement** : `Promise.all` dans `fetchWeather` (Proxy + WAQI + Pollen en simultané).
- **Résultat** : Chargement divisé par 3 (env. 8s vs 25s).

### 3. 🖼️ UI : Affichage Instantané du Cache [APPLIQUÉ]
- **Changement** : Suppression du blocage `loadingWeather` sur le Dashboard.
- **Rationale** : L'utilisateur voit le cache immédiatement, la mise à jour se fait en tâche de fond.

---

## 🗓️ 1er Février 2026 - Corrections Critiques : GPS & Gemini

### 1. 📍 Localisation : GPS Prioritaire [APPLIQUÉ]
- **Problème** : L'app restait bloquée sur Da Nang malgré les redémarrages car elle privilégiait le cache GPS sur la recherche réelle.
- **Changement** : Inversion de la logique dans `AppContext.tsx`. L'app lance désormais une recherche GPS **SYSTÉMATIQUE** à chaque démarrage. Le cache n'est utilisé que si le GPS échoue.
- **Pourquoi ?** : Une application météo doit refléter la position réelle de l'utilisateur, pas son dernier voyage mémorisé.

### 2. 🤖 IA : Robustesse Gemini 1.5 [APPLIQUÉ]
- **Problème** : Fallback Roosevelt systématique.
- **Changement** : 
    - Timeout augmenté à **30 secondes** (pour absorber les lenteurs de Gemini 1.5).
    - Mode `responseMimeType: "application/json"` activé dans le SDK Gemini.
    - Ajout d'une **Regex d'extraction JSON** robuste pour ignorer les bavardages de l'IA.
- **Pourquoi ?** : Stabiliser la génération bilingue qui échouait à cause de délais trop courts ou de formats de réponse mal gérés.

---

## 🗓️ 2 Février 2026 - Correction Synchronisation Europe

### 1. 📍 UI : Sortie forcée du "Mode Nuit" [APPLIQUÉ]
- **Problème** : En Europe à 8h, le modal affichait le format nuit (pas de bouton Soleil) car il restait bloqué sur le cache de Da Nang (Vietnam).
- **Cause** : Le trigger de rafraîchissement météo était manquant après l'acquisition du GPS.
- **Changement** : Ajout d'un `useEffect` sur `location` dans `AppContext.tsx` et forçage du `fetchWeather` immédiat après succès GPS. 
- **Résultat** : L'app bascule instantanément sur la météo locale réelle dès que le GPS répond, sortant du mode nuit fantôme.

### 2. 🔔 Notifications : Alignement Géographique [APPLIQUÉ]
- **Problème** : Pas d'alertes pluie en Europe car le backend surveillait toujours Da Nang.
- **Correction** : Fiabilisation de la mise à jour du token et des coordonnées dans Firestore dès que `location` change.

### 3. 🤖 IA : v10 et Robustesse [APPLIQUÉ]
- **Changement** : Slot de citation passé en `v10` et suppression du hack `utcPlus14`.
- **Pourquoi ?** : Nettoyer les caches corrompus et stabiliser l'IA avec le nouveau timeout de 30s.
---

## 🗓️ 3 Février 2026 - Moteur Météo v20 & Notifications Push

### 1. 🤖 IA : Résurrection Gemini (Double Sécurité) [APPLIQUÉ]
- **Problème** : "403 Forbidden" bloquant l'accès aux citations.
- **Correction** : 
    - Activation de la "Generative Language API" sur le projet Google Cloud correct.
    - Levée des restrictions sur la clé API.
    - Implémentation du **Dual Model Fallback** : Tentative avec `gemini-2.0-flash-001` d'abord, puis repli automatique sur `gemini-1.5-flash` en cas d'erreur.
- **Pourquoi ?** : Garantir la réception de la citation à 7h même en cas d'instabilité d'un modèle ou de quota atteint.

### 2. 🌧️ Moteur Météo : Logique de Durée (v20) [APPLIQUÉ]
- **Problème** : Silence radio quand la pluie s'installe toute la journée (cooldown de 2h trop rigide).
- **Changement** : Détection de l'extension de durée. Si la pluie continue mais que l'heure de fin prévue décale de **plus de 45 minutes**, le système renvoie une notification ("La pluie continue").
- **Pourquoi ?** : Informer l'utilisateur que l'épisode pluvieux va durer plus longtemps que prévu initialement.

### 3. 🔔 UI : Notifications "Foreground" (Toast) [APPLIQUÉ]
- **Problème** : Les notifications sont reçues en arrière-plan (historique) mais ne s'affichent pas systématiquement en bannière push (bloquées par l'OS ou app ouverte).
- **Changement** : Ajout d'un composant `NotificationToast` dans l'application. Dès qu'un message arrive (app ouverte ou reprise), une bannière élégante s'affiche en haut de l'écran.
- **Pourquoi ?** : Contourner les restrictions arbitraires d'iOS/Android sur les bannières système et assurer une visibilité immédiate des alertes critiques.

### 4. 🔀 Cache : v20 Slot Suffix [APPLIQUÉ]
- **Action** : Passage des clés de cache Citation et Météo en `v20`.
- **Pourquoi ?** : Forcer la mise à jour de tous les clients mondiaux vers la nouvelle logique IA et Moteur.

---

## 🗓️ 4 Février 2026 - Récupération d'Urgence (Leak & Fallback)

### 1. 🛡️ Sécurité : Nettoyage du Leak [APPLIQUÉ]
- **Problème** : Une clé API OpenRouter a été fuitée dans un dossier de backup (`backups/freemium_...`), provoquant la révocation automatique des clés du projet par Google.
- **Action** : 
    - Suppression du dossier de backup compromis.
    - Mise à jour du `.gitignore` pour bloquer récursivement tous les fichiers `.env` (`**/.env`).
- **Rationale** : Sécuriser le dépôt et stopper la détection de fuite par les scanners Google.

### 2. 🤖 IA : Stratégie "Triple Fallback" (v21) [APPLIQUÉ]
- **Problème** : Clé Gemini principale marquée comme "leaked" et désactivée.
- **Correction** : 
    - Implémentation d'un **Triple Fallback** dans `fetchQuoteData`.
    - Si la clé Gemini échoue (403/Leaked), le système tente automatiquement d'utiliser la **GOOGLE_POLLEN_API_KEY** comme clé de secours pour appeler Gemini.
    - Correction du nom du modèle de repli pour éviter les erreurs 404.
- **Slot** : Passage en **v21** pour forcer un nouvel essai immédiat et ignorer les erreurs de cache de la veille.
- **Pourquoi ?** : Assurer la continuité du service même si la clé principale est temporairement grillée, en exploitant les autres clés valides du projet.

---

## 🗓️ 4 Février 2026 - Migration Daylight v22 & Correction "Mode Nuit"

### 1. ☀️ UI : Correction du Calcul Jour/Nuit [APPLIQUÉ]
- **Problème** : L'interface restait bloquée en "Mode Nuit" (pas de bouton Sunny, icône Lune) même après le lever du soleil (ex: 8h20 en Europe).
- **Cause** : L'API Open-Meteo renvoie des données sur 3 jours (Hier, Aujourd'hui, Demain). Le code utilisait l'index `[0]` (Yesterday) au lieu de l'index dynamique correspondant à Aujourd'hui. Il comparait donc l'heure actuelle avec le coucher du soleil d'hier.
- **Correction** : 
    - Implémentation d'une recherche d'index dynamique via `daily.time.findIndex()` pour cibler précisément la donnée du jour.
    - Utilisation massive de `Date.now()` (Heure du téléphone) au lieu de l'heure de l'API pour garantir une réactivité immédiate sans latence de cache.
- **Pourquoi ?** : Garantir que l'utilisateur puisse signaler du soleil dès la première lumière du jour, sans être bloqué par des résidus de données de la veille.

### 2. 🔔 Cron : Fenêtre de Citation assouplie
- **Modification** : Retrait de la restriction `minutes < 12` pour l'envoi de la citation de 7h.
- **Rationale** : Permettre au cron de rattraper un envoi si une exécution de 7h15 ou 7h30 est la première à réussir, évitant les matins sans citation.

---

## 🗓️ 4 Février 2026 - Feature : Rain Trend & Contribution

### 1. 📈 UI : Graphique de Pluie Dynamique (24h) [APPLIQUÉ]
- **Problème** : Le graphique de tendance (Rain Trend) était un SVG statique de développement.
- **Correction** : 
    - Connexion à l'API Open-Meteo pour récupérer les probabilités de précipitations horaires.
    - Rendu dynamique d'une courbe SVG basée sur les vraies données.
    - Gestion intelligente du "lock" pour les utilisateurs Freemium (voir ci-dessous).
- **Pourquoi ?** : Offrir une visualisation réelle et utile de l'évolution de la pluie, et non un placeholder.

### 2. 🔐 Freemium : Alignement des Limites [APPLIQUÉ]
- **Logique** : Le graphique "Rain Trend" s'aligne désormais sur les limites de l'abonnement :
    - **GRATUIT** : Affiche uniquement les **3 prochaines heures** (comme le carrousel horaire), le reste est flouté avec un cadenas "+20h".
    - **PREMIUM** : Affiche la courbe complète sur 24h.
- **Rationale** : Cohérence totale de l'offre. Il n'est pas logique de montrer 24h de tendance pluie à un utilisateur qui n'a droit qu'à 3h de prévisions.

### 3. 🌧️ UI : Volume de Pluie Précis [APPLIQUÉ]
- **Ajout** : L'en-tête du graphique affiche désormais le volume total de pluie attendu sur la période visible (ex: `Rain (3h) • 1.2mm` ou `Rain (24h) • 8.4mm`).
- **Pourquoi ?** : Donner une information quantitative immédiate en plus de la courbe visuelle.

### 4. 🌦️ Contribution : Options Étendues en Prod [APPLIQUÉ]
- **Changement** : Déblocage des conditions "Showers" (Averses), "Fog" (Brouillard) et "Mist" (Brume) pour tous les utilisateurs en production.
- **UI** : Ajout d'un indicateur "More Options..." sous le bouton Pluie pour guider vers ces nouvelles options.

---

## 🗓️ 5 Février 2026 - Hotfix : Citation & Rain Trend

### 1. 🚨 Backend : Correction Crash Citation [APPLIQUÉ]
- **Problème** : L'envoi de la citation de 7h échouait silencieusement.
- **Cause** : Utilisation illégale de `defineSecret` à l'intérieur d'une fonction, provoquant une *Runtime Error*.
- **Correction** : Nettoyage du code et utilisation correcte des variables globales. Passage du slot en `v23` pour forcer le rafraîchissement.

### 2. 📉 UI : Extension du Graphique Pluie (Fix 22h) [APPLIQUÉ]
- **Problème** : Le graphique "Rain Trend" s'arrêtait avant la fin des 24h en fin de soirée (ex: à 18h quand il est 22h).
- **Cause** : L'API ne fournissait que 2 jours de prévisions, insuffisant pour couvrir "Maintenant + 24h" en fin de journée.
- **Correction** : Augmentation de la requête API (`forecast_days=4`) pour garantir un buffer de données suffisant en permanence. Le graphique est maintenant stable et complet 24h/24.

## 🗓️ 7 Février 2026 - Stabilisation Push & Performance

### 1. 🔔 Notifications : Fix Push Silencieux iOS [APPLIQUÉ]
- **Problème** : Les notifications de pluie et citations arrivaient dans l'historique mais ne s'affichaient pas par-dessus l'écran de verrouillage ou les autres apps (mode silencieux/invisible).
- **Cause** : Configuration APNS incorrecte. L'ajout de `content-available: 1` pour le background fetch masquait involontairement le dictionnaire `alert` nécessaire pour l'affichage visuel.
- **Correction** : Ajout explicite du bloc `alert: { title, body }` dans le payload APNS, en plus du `content-available`.
- **Résultat** : Les notifications réveillent l'app en arrière-plan ET s'affichent visuellement à l'utilisateur.

### 2. ⚡ Performance : Démarrage Instantané (Split Fetch) [APPLIQUÉ]
- **Problème** : L'écran d'accueil mettait jusqu'à 30 secondes à s'afficher (Contribution Modal bloqué).
- **Cause** : La fonction `fetchWeather` attendait la réponse de TOUTES les APIs (Météo + Qualité Air + Pollen + Pluie) avant de rendre la main. Si une API (ex: Pollen) était lente, tout l'écran gelait.
- **Correction** : Refactoring en 2 temps :
    1. **Phase 1 (Immédiate)** : Chargement bloquant uniquement pour la Météo de base (Proxy). L'UI s'affiche en < 2s.
    2. **Phase 2 (Background)** : Chargement différé des données secondaires (Air, Pollen, Pluie) qui viennent enrichir l'interface quelques secondes plus tard sans bloquer l'interaction.

### 3. 📉 Correction Graphique "Rain Trend" Disparu [APPLIQUÉ]
- **Problème** : Le graphique de pluie disparaissait aléatoirement ou nécessitait un redémarrage.
- **Cause** : Désynchronisation Timezone. L'app calculait l'index de départ en UTC alors que l'API renvoyait des heures locales, causant un index `-1` (données introuvables).
- **Correction** : Utilisation stricte de la propriété `current.time` renvoyée par l'API (Heure Locale) pour aligner parfaitement les données du graphique avec l'heure affichée.

## 🗓️ 7 Février 2026 - Tweak UI Météo [v2.2.56]

### 1. ☁️ Iconographie : Brouillard & Brume [APPLIQUÉ]
- **Modification** : Les conditions `Fog` (Brouillard) et `Mist` (Brume) utilisent désormais l'icône **Nuageux** (Cloud) au lieu de l'icône Brume spécifique (souvent confuse ou manquante).
- **Couleur** : Assignation d'un gris clair (`#94A3B8` et `#CBD5E1`) pour différencier du nuage blanc classique.

### 2. 🌧️ Iconographie : Averses [CONFIRMÉ]
- **Confirmation** : La condition `Showers` (Averse) reste mappée sur l'icône **Pluie** (Rain), comme demandé ("laisser Averse avec Pluie").

## 🗓️ 7 Février 2026 - UX Contribution (More Options) [v2.2.57]

### 1. 📂 UI : Sous-menus Unifiés [APPLIQUÉ]
- **Modification** : Le comportement "More Options..." (Sous-menu) n'est plus exclusif à la Pluie.
- **Nuageux** : Cliquer sur **Nuageux** ouvre désormais un sous-menu contenant **Nuageux**, **Brouillard** (Fog) et **Brume** (Mist).
- **Consistance** : L'interface affiche clairement "More Options..." sous les deux boutons principaux (Cloudy & Rain) pour indiquer à l'utilisateur que des précisions sont disponibles.

### 2. 🎯 Sélection Hiérarchique
- **Logique** : Si l'utilisateur sélectionne une sous-option (ex: Fog), le bouton parent (Cloudy) reste allumé pour montrer la catégorie active.
