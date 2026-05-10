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

## 🗓️ 10 Février 2026 - UX : Notification & Localisation [v2.2.58]

### 1. 🔔 Notifications : Debug & Reactivation [CONFIRMÉ]
- **Problème** : Les notifications de 7h ne partaient pas pour certains comptes (ex: erreur 'NotRegistered' FCM).
- **Solution** : Ajout d'une section "Notifications" dans le Modal Paramètres avec un bouton **Activer les alertes**.
- **Rationale** : Permet à l'utilisateur de force-flush son token FCM (désinscription/réinscription) sans réinstaller l'app.
- **Ajout** : Logs '[QUOTE-DEBUG]' activés pour tracer spécifiquement la fenêtre d'envoi (7h-8h) pour le compte '1TON5...'.

### 2. 📍 UI : Localisation Précise [v2.7.0]
- **Problème** : L'app affichait "Bonneville" (Arrondissement) comme titre principal alors que l'utilisateur était à "Combloux" (Village).
- **Cause** : La logique priorisait 'mainCity' (Admin Level 2) au lieu de 'subArea' (Admin Level 3/4) pour éviter les doublons type "Paris (Paris)".
- **Correction** : Formatage en **deux parties** `Ville (Région)` (ex: `Combloux (Bonneville)`). L'interface détecte les parenthèses et affiche automatiquement la partie gauche (Ville) en gros titre et la partie droite (Région) en sous-titre.
- **Résultat** : L'utilisateur voit maintenant **"Combloux"** comme titre.

### 3. ❄️ Backend : Détection Neige Précise [v2.2.59]
- **Problème** : L'alerte annonçait "Pluie" alors qu'il faisait 1°C, contrairement à d'autres apps (Rain Viewer) qui annonçaient "Neige".
- **Cause** : Le modèle analysait uniquement le code météo (ex: 61=Pluie faible) sans croiser avec la température locale.
- **Correction** : Si une condition de Pluie est détectée ET que la température est inférieure à **2.5°C**, le backend force le type d'événement à "Neige".
- **UX** : Maintien du style standard en **MAJUSCULES** (ex: "NEIGE EN COURS") pour une lisibilité maximale.

### 4. ↩️ UX : Hotfix Style Alertes [v2.2.60]
- **Modification** : Rétablissement immédiat des titres en MAJUSCULES (ex: "NEIGE EN COURS") suite au feedback utilisateur, annulant la proposition de minuscules testée en v2.2.59.

# Wise Weather Changelog History

## [PROD] v2.3.2 - 2026-02-20
### 🛡️ Hotfix: Map Stability & Error Handling
- **FIX**: Correction du crash "White Screen of Death" (WSOD) sur l'onglet Carte.
- **DÉTAIL**: Implémentation de guards d'intégrité sur la création de chaque marqueur Leaflet. Si une donnée (Ville ou Rapport) arrive avec des coordonnées invalides (`undefined`/`NaN`), elle est désormais ignorée au lieu de faire planter tout l'arbre React.
- **SÉCURITÉ**: Blindage des appels `L.marker` et `setView` contre les données `location` incomplètes.

## [PROD] v2.3.1 - 2026-02-18
### 🏔️ Module Weather Community [v2.2.61]
- **Problème** : Les rapports spécifiques Montagne (Avalanche, Neige) n'apparaissaient pas dans la frise chronologique comparative.
- **Ajout** : Intégration des badges **Risque Avalanche** et **Niveau de Neige** dans les cartes horaires si des données sont disponibles.

### 6. ⚡️ UX & Safety Fix [v2.2.62]
- **UX** : Affichage immédiat (Cache-First).
- **Sécurité** : Le Backend impose désormais la NEIGE ou l'ORAGE sur l'affichage principal et horaire dès que le consensus des 9 modèles le détecte, même si le modèle standard prévoyait de la pluie.

## 🗓️ 11 Février 2026 - Visibilité & Montagne [v2.2.63]

### 1. 👁️ UI : Affichage Visibilité [APPLIQUÉ]
- **Problème** : La donnée de visibilité ("Brouillard", "50m") était saisie par l'utilisateur mais nulle part affichée.
- **Ajout** : Intégration d'un badge **"👁️ 50m"** (Visibilité Min) à trois endroits clés :
    1. **Carrousel Communautaire** (Historique horaire).
    2. **Carte (Popup Standard)**.
    3. **Carte (Marqueur Montagne)**.

### 2. 🏔️ Logique : Déclenchement Smart Montagne [APPLIQUÉ]
- **Changement** : Une visibilité faible (< 250m) est désormais considérée comme une "Condition Montagne" critique.
- **Conséquence** : Cela force l'affichage du marqueur étendu "Montagne" sur la carte au lieu du point standard, garantissant que l'alerte brouillard est immédiatement visible sans avoir à cliquer.

---

## 🗓️ 7-9 Mai 2026 — V1 LAUNCH SPRINT [v2.4.0 / iOS Build 26→36]

Sprint complet de préparation au lancement App Store (iOS) + propagation web. Décision stratégique : **lancer une V1 sans abonnements** pour passer la review Apple, puis réintroduire les paid plans en V2.

### 1. 🆕 Wind Graph 24h dépliable [v2.4.0]
- **Ajout** : Nouvelle section dépliable cyan sous le Rain Graph, sur le Dashboard.
- **Données** : `hourly.wind_speed_10m` pour la courbe + `hourly.wind_direction_10m` pour la boussole.
- **UI** : Petites flèches `ArrowDown` rotées de `${dir}deg` (0° = vent venant du Nord) avec abréviation cardinale traduite (N/NE/E/SE/S/SO/O/NO en FR, N/NE/E/SE/S/SW/W/NW en EN), affichées tous les 3 slots.
- **Header** : `Vent (24h) • XX km/h` avec la vitesse actuelle mise en évidence.

### 2. 🆕 7-Day Forecast standalone [v2.4.0]
- **Ajout** : Nouveau composant `SevenDayForecastSection`, carte dédiée placée **entre WeatherDashboard et CommunityCarousel** (pas dans le dashboard).
- **Données** : `daily.weather_code` (consensus 10 modèles côté backend), min/max température, dayName traduit.
- **UI** : "Aujourd'hui" mis en évidence en bleu/bold ; les 6 jours suivants listés ligne par ligne avec icône météo + min° / max°.

### 3. 🛡️ Backend : Consensus 10 modèles 7 jours [v2.4.0]
- **Endpoint** : `getWeatherForecast` (Cloud Function) — déployé en prod.
- **Logique** : Vote pondéré par sévérité (0=Clear → 5=Storm) sur 9 safety models + UI model avec bonus de stabilité (UI = 2 votes). En cas d'égalité, sévérité plus haute gagne (priorité sécurité). Au sein de la sévérité gagnante, code météo le plus fréquent. Températures min/max moyennées.
- **URLs Open-Meteo étendues** : `forecast_days=8`, `wind_direction_10m`, `precipitation_probability` horaire, `weather_code` daily multi-modèles.

### 4. ⏰ Time markers absolus (Rain & Wind Graph) [v2.4.0]
- **Avant** : "Now / 6h / 12h / 18h / 24h" (relatifs).
- **Après** : Heures absolues `(currentHour + offset) % 24 + "h"` (ex: 14h → `14h, 20h, 2h, 8h, 14h`).

### 5. 🏷️ Inversion ordre titre ville [v2.4.0]
- **Format** : `MainCity (gros titre) / SubArea (sous-titre)` (ex: `Genève / Coulouvrenière`).
- **Inverse** la décision v2.2.59 suite au feedback utilisateur.
- **CSS** : `flex-1 min-w-0 break-words` côté titre + `flex-shrink-0` côté température, pour responsive sur les longs noms.

### 6. 🗑️ Stats Grid sans Wind [v2.4.0]
- Cellule Wind retirée du Stats Grid (information déplacée dans le header du Wind Graph).
- Le grid affiche maintenant : Lever/Coucher soleil, Humidité, Visibilité, UV, Air, Pollen.
- Ajout de `border-t border-gray-100 pt-6` comme séparateur visuel.

### 7. 💡 Hint chip "Partagez votre météo" [v2.4.0]
- Petite chip flottante persistante au-dessus du bouton orange contribution (FAB).
- Animation `bounce-slow` (2.4s, ±3px vertical) — visible sans être agressive.
- `pointer-events: none` → ne bloque jamais aucun clic.
- Bilingue FR/EN.

### 8. 🚫 Auto-popup contribution supprimée [v2.4.0]
- Avant : Modal "Quel temps fait-il ?" forcée à chaque ouverture + chaque retour de background.
- Après : Suppression complète. Le hint chip remplace fonctionnellement le tuto.

### 9. 🚫 Tuto multi-step désactivé [v2.4.0]
- Bug architectural : éléments highlightés (z-70) au-dessus du dark overlay (z-60). Tap déclenchait l'action de l'élément, pas l'avancement du tuto. Boucle.
- `localStorage.setItem('has_seen_tuto_v2', 'true')` posé proactivement à chaque boot → débloque tout utilisateur encore coincé sur une vieille build.

### 10. 🎁 V1 launch : Tout le monde sur ULTIMATE [v2.4.0]
- `userTier` initial forcé à `UserTier.ULTIMATE` (web + iOS).
- Override Firestore tier sync : peu importe ce que dit Firestore, la valeur résultante est `ULTIMATE`.
- **Aucun paywall, aucun lock, aucun "+20h" overlay.**
- `showAds = false` partout — la pub était l'incitation au premium.
- Bouton Crown header retiré, bloc Subscription Settings retiré, badge ULTIMATE/FREE retiré, Cancel Subscription retiré.

### 11. 📱 iOS-only : Capacitor + safe-area + IAP gated [Build 26→36]
- **`viewport-fit=cover`** dans `<meta viewport>` → débloque `env(safe-area-inset-*)` sur iOS.
- Utilities `.pt-safe / .mt-safe / .pb-safe` dans index.css.
- 2 références `Capacitor.isNativePlatform()` non guardées corrigées (`typeof Capacitor !== 'undefined'`) pour éviter le crash dev preview.
- Feature flag `IAP_ENABLED = false` gate Subscription section, PremiumModal, StoreKit init.
- **3 subscriptions ASC supprimées** (standard_plan, ultimate_plan, traveler_plan + group "Wise Weather Plans") après rejet Apple Guideline 2.1(b). **Backup complet : [`IAP_BACKUP.md`](IAP_BACKUP.md)** — restoration playbook + métadonnées + localizations FR/EN.

### 12. 🐛 Fix "soleil + pluie en même temps" [v2.4.0]
- **Cause** : Open-Meteo `weather_code` peut être 0 (clair) pour une heure dont `precipitation_probability` est 70%. UI inconsistante (icône soleil + courbe pluie élevée).
- **Helper** `overrideCodeForRain(code, precipProb, temp)` : ≥60% → force pluie 61 (ou neige 71 si temp ≤ 2°C), ≥40% → partiellement nuageux 2.

### 13. 🐛 Fix icône courante incohérente Map vs Hourly [v2.4.0]
- **Helper unifié `getEffectiveCurrentCode(weather)`** :
  1. Précipitation réelle ≥0.1mm tombe maintenant → force rain/snow.
  2. Sinon, applique `overrideCodeForRain` sur la prob horaire courante.
- Source unique pour : Dashboard top icon, Hourly first slot, Map "Prévisions Officielles" current marker.

### 14. 🔔 Notifications : feedback + désactivation [v2.4.0]
- **Activation** : Affichage explicite du résultat (API absente → "Ajouter à l'écran d'accueil", denied → "Réglages navigateur", granted → "✓").
- **Désactivation** : Nouveau bouton **rouge** "Désactiver les alertes" (visible quand activées). Confirme dialog avec avertissement explicite ("L'app ne pourra plus prévenir pluie/neige/orage ni envoyer la citation matinale, vous perdez une partie des fonctionnalités principales").
- **Backend** : `disableNotifications()` dans AppContext supprime le token FCM (Firestore + localStorage).

### 15. 🚀 Soumissions Apple successives
- **Build 30** soumise le 7 mai 2026 → **REJECTED** Guideline 2.1(b) (IAPs configurés en ASC mais pas accessibles dans l'app).
- **Action correctrice** : 3 subscriptions + group supprimés de App Store Connect (cohérence : pas d'IAP en ASC = Apple ne cherche plus dans l'app).
- **Build 30 ré-soumise** après suppression ASC, état `WAITING_FOR_REVIEW`.
- **Builds 31-36** uploadées via fastlane sur App Store Connect, liées automatiquement à 2 groupes TestFlight Internal (`Dev Build 26+` et `Internal Testers`) pour itération rapide pendant la review.

### 16. 🧷 Sauvegardes
- **Web** : branche `backup/with-subscriptions-2026-05-09` (commit `d032bb4`) — snapshot de la version avec abonnements Stripe actifs avant les modifs V1.
- **iOS** : tout le code IAP (PremiumModal, StoreKit init, marketing copy bilingue) reste dans `index.tsx`, simplement gated par `IAP_ENABLED = false`. Aucun code à réécrire pour la V2.
- **IAP V2 restoration** : ~30 min code (déjà codé) + ~1h ASC manuel (recréation des 3 subscriptions). Voir [IAP_BACKUP.md](IAP_BACKUP.md).

---

## 🗓️ 9-10 Mai 2026 — V1 POLISH SPRINT [v2.4.1 / iOS Build 39]

Sprint follow-up post-V1 launch : amélioration de la fiabilité météo et bouton refresh manuel, après retour utilisateur "hier l'app prédisait pluie toute la journée alors qu'il a fait beau".

### 1. 🤖 Migration Quote : Gemini → Mistral [v2.4.1]
- **Problème** : la clé Gemini API expirait régulièrement sans warning, faisant retomber la citation quotidienne sur Eleanor Roosevelt (placeholder fallback) pendant des heures voire des jours.
- **Solution** : bascule sur **Mistral La Plateforme** (`mistral-small-latest`) — clé `MISTRAL_API_KEY` déjà configurée dans Firebase Secrets depuis décembre 2025.
- **Pourquoi Mistral** : projet français, GDPR-compliant, hébergé Paris (pas de Cloud Act US), free tier généreux, excellent FR, API stable.
- **Implémentation** : appel REST direct (pas de SDK) — `fetch` sur `https://api.mistral.ai/v1/chat/completions` avec `response_format: { type: "json_object" }`. Suppression des fallbacks triple-Gemini (1 seul appel suffit, Mistral est stable).
- **Cleanup** : `@google/generative-ai` retiré de `functions/package.json`. Slot quote bumped `v23 → v24` pour invalider le cache Roosevelt.

### 2. 🔬 Backend : Consensus hourly precipitation_probability (10 modèles)
- **Problème** : `precipitation_probability` venait du SEUL modèle "best_match" Open-Meteo. Si lui hallucinait 70% de pluie pour une heure, on l'affichait, même si les 9 autres safety models disaient 5%.
- **Solution** : moyenne arithmétique des 10 modèles. `safetyUrl` étendue avec `&hourly=precipitation_probability,weather_code` pour récupérer toutes les variantes par modèle.
- **Log** : `[PROXY] Smoothed precipitation_probability across 10 models for X hourly slots.`

### 3. 🔬 Backend : Consensus hourly weather_code (10 modèles) — CASE B-ter
- **Problème complémentaire** : même après le smooth de la probabilité de pluie, l'icône horaire restait pluie car `weather.hourly.weather_code` venait toujours du best_match. `overrideCodeForRain` côté frontend ne peut qu'ESCALADER (clear → rain), jamais REDESCENDRE.
- **Solution** : vote pondéré par sévérité sur le `weather_code` horaire (mêmes règles que la consensus 7-jours daily) :
    - UI = 2 votes pour stabilité
    - Sur égalité, sévérité supérieure gagne (biais sécurité)
    - Au sein de la sévérité gagnante, code météo le plus fréquent
- **Effet** : si best_match dit "code 61 (pluie)" mais 8/9 autres modèles disent "code 2 (nuageux)", le code est **DOWNGRADÉ** vers 2.
- **Log** : `[PROXY] Hourly consensus DOWNGRADED X slots (best_match was over-forecasting precipitation/severity).`

### 4. 🔄 Frontend : Bouton Update manuel dans le header global
- **Position** : header en haut à droite, à GAUCHE des boutons °C / FR. Visible depuis toutes les pages (Accueil, Carte, Settings).
- **Comportement** : click → spin pendant fetch → cooldown **5 minutes** (anti-spam, protège le free tier).
- **Coût** : 1 fetch quand l'utilisateur le décide. Avec cooldown 5min : ~1.5M req/mois pour 10k users → reste sous le seuil free Firebase (2M/mois).
- **Tooltip dynamique** : "Mettre à jour la météo" / "Patientez 5 min avant le prochain rafraîchissement".
- **AppContext** : nouvelle méthode `refreshWeather(): Promise<void>` exposée — wrapper autour de `fetchWeather(currentLocation)`.

### 5. 🏘️ Carte Communauté remplace HIER (toujours visible)
- **Avant** : module statique "HIER" (Matin/Midi/Soir) sous la température, montrait la météo de la veille.
- **Après** : carte temps réel avec dernière contribution communautaire à la position de l'utilisateur (rayon ~5km, dernières 6h) :
    - Label horizontal "COMMUNAUTÉ" centré au-dessus
    - 3 colonnes : icône+condition / température / temps écoulé
    - Séparateurs verticaux `w-px h-8 bg-gray-100`
- **Toujours visible** (même quand aucun signalement à proximité) avec placeholder italique : *"Aucun signalement à proximité — soyez le premier !"*
- **Position** : sous le bloc titre/température, pleine largeur — ne compresse jamais le titre ville.

### 6. 🔄 Auto-poll pour link TestFlight
- Script Ruby `/tmp/link_XX.rb` (one per build) : poll API App Store Connect toutes les 60s jusqu'à ce que la build soit `VALID`, puis link automatique aux 2 groupes TestFlight Internal (`Dev Build 26+` + `Internal Testers`).
- Gain de temps : plus besoin d'attendre manuellement le processing Apple.

### 7. 🛑 Nouvelle règle : pas de fastlane release sans accord utilisateur explicite
- Apprentissage du sprint : ne plus pousser de build iOS automatiquement après chaque modif. Attendre validation formelle de l'utilisateur (tests/screenshots) avant `fastlane release`.
- Code commit local toujours fait → traçabilité git intacte sans pollution App Store Connect.

### 8. 🎨 Itérations design carte Communauté (3 versions)
- **v1** : 3 colonnes + label vertical "COMMUNAUTÉ" sur le côté gauche.
- **v2** (rejetée) : pill horizontal compact `rounded-full` — écrasait le titre ville quand `whitespace-nowrap` forçait la colonne droite à expandir.
- **v3 (validée)** : retour aux 3 colonnes d'origine, label horizontal centré au-dessus. Position : sous le bloc titre/température (full-width sibling), donc n'interfère plus avec le layout du titre.

### 9. 📦 Soumissions Apple
- Build 30 → re-soumis après suppression IAPs ASC, état `WAITING_FOR_REVIEW`.
- Builds 31-39 → uploadées pour TestFlight Internal, **non attachées** à la version 1.0 (review reste sur 30 jusqu'à approbation/rejet).
- Build 39 = version finale validée par l'utilisateur incluant tous les fixes du sprint v2.4.1.

---

## 🗓️ 10 Mai 2026 — V1 USER-FEEDBACK FIXES [v2.4.2]

Suite directe du v2.4.1 — corrections issues du test utilisateur en conditions réelles l'après-midi du 10 mai.

### 1. 🌐 i18n : traduction du label communauté (Showers → Averse)
- **Bug** : la carte Communauté affichait `conditions[0]` brut (anglais : "Showers", "Cloudy"…) même en mode FR.
- **Fix** : utilisation de `t('condition.' + label)` qui pioche dans `constants.ts` (les traductions y existent déjà : Showers→Averse, Whiteout→Jour blanc, etc.). Fallback sur le label brut si la clé manque.
- **Fichier** : `index.tsx` (carte Communauté).

### 2. 💾 Persistance carte Communauté (localStorage cache)
- **Bug** : à chaque réouverture/retour de background, Firestore réattache son `onSnapshot` (~1-2s). Pendant ce délai, `communityReports` est vide → la carte affiche le placeholder "Aucun signalement à proximité — soyez le premier !" puis flash le report quand Firestore répond.
- **Fix** : dual-source
    - `liveCommunityReport` : temps réel (Firestore)
    - `cachedCommunityReport` : seedé depuis localStorage à l'init, mis à jour à chaque live value valide
    - Affichage = live ‖ cache (le plus à jour)
- **TTL 6h** (= filtre live) — un cache plus vieux est ignoré.
- **Clé** : `wise_last_community_report`.

### 3. 📍 Alignement rayon carte/carousel à 10 km
- **Bug** : la carte Communauté utilisait un rayon `0.05` (~5km), alors que le carrousel "Communauté Météo" en bas utilisait `0.1` (~10km). Pour des contributions entre 5-10km, le carrousel les affichait mais pas la carte → impression de "pas de signalement".
- **Fix** : carte alignée sur 10km. Cohérence visuelle entre les deux blocs.

### 4. 🔧 Vrai usage du consensus 10 modèles (suppression du rainJson override)
- **Bug** : `fetchWeather` (frontend) faisait un `fetch` direct à Open-Meteo en parallèle du Cloud Function consensus, puis ÉCRASAIT `precipitation_probability` avec ce fetch brut (best_match seul). Mon CASE B-bis (consensus 10 modèles sur la probabilité de pluie) était donc **inutilisé**.
- **Fix** : suppression du fetch direct. `precipitation_probability` vient maintenant directement du proxy = la version consensus.
- **Effet** : cliquer 🔄 fait vraiment passer les icônes par le consensus. Les "rain all day fantôme" disparaissent enfin.

### 5. 🐞 Bouton Update : spinner s'arrêtait au bout de 5 min au lieu de 1-2s
- **Bug** : un seul état `refreshingHeader` pilotait à la fois le `animate-spin` ET le cooldown 5 min. Du coup l'icône tournait pendant toute la durée du cooldown.
- **Fix** : deux états séparés.
    - `refreshingHeader` : true uniquement pendant le fetch (~1-2s), drive l'animation.
    - `refreshCooldown` : true 5 min après fetch, drive le `disabled`.

### 6. 🕒 Timestamp "Maj HH:MM" dans le header
- **Demande utilisateur** : "les prévisions 7 jours ne changent pas, donc tu me dis qu'aucune nouvelle donnée ne permet de faire une autre prévision ?"
- **Réponse** : oui — Open-Meteo publie 4 model runs par jour (00/06/12/18 UTC). Entre deux runs, le consensus 10 modèles renvoie le même résultat.
- **UX** : pour preuve visuelle, exposition de `weatherFetchedAt: number | null` dans AppContext, mis à jour à chaque `setWeather`. Affiché à côté du bouton 🔄 sous forme `Maj 17:23` (caché en `sm:inline` sur écran étroit). Tooltip du bouton montre aussi cette info pour les mobiles.

### 7. 🛑 Confirmation règle process : pas de fastlane release sans accord
- Toutes ces modifs commit local sur `fix/ios-finalization` mais **aucune n'a été uploadée** sur App Store Connect — Build 39 reste la dernière build envoyée, validée par l'utilisateur.

### 📦 Builds non uploadées (commits locaux uniquement)

Toutes les corrections du v2.4.2 sont prêtes à uploader dans une future Build (40+) une fois la review Apple de Build 30 conclue. Le code iOS et web est synchrone.
