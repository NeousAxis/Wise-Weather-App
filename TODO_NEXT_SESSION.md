# 📋 Wise Weather — TODO Prochaine Session

## 🗓️ Mise à jour : 9 Mai 2026 — V1 LAUNCH SPRINT terminé (v2.4.0)

---

## ✅ Fait dans le sprint V1 (7-9 mai 2026)

- ✅ Wind Graph 24h dépliable + boussole cardinale + flèches directionnelles
- ✅ 7-Day Forecast carte standalone entre Dashboard et Communauté
- ✅ Backend consensus 10 modèles 7 jours déployé en PROD
- ✅ Time markers absolus (Rain & Wind Graph)
- ✅ Inversion titre ville (MainCity gros / SubArea petit) + responsive
- ✅ Stats Grid sans Wind (info dans header Wind Graph)
- ✅ Hint chip "Partagez votre météo" + animation `bounce-slow`
- ✅ Auto-popup contribution supprimée
- ✅ Tuto multi-step désactivé (loop bug)
- ✅ Tous users sur ULTIMATE pour V1, ads supprimées
- ✅ Header Crown + Settings Subscription bloc + tier badge + "Cancel Subscription" supprimés
- ✅ Bouton "Désactiver les alertes" rouge avec confirm dialog + warning
- ✅ Notifications : feedback explicite (API absente / denied / granted)
- ✅ Bug "soleil + pluie" → helper `overrideCodeForRain`
- ✅ Icône courante unifiée → helper `getEffectiveCurrentCode`
- ✅ iOS : safe area Dynamic Island fix (`viewport-fit=cover` + `pt-safe`)
- ✅ iOS : `IAP_ENABLED = false` flag, 3 subscriptions ASC supprimées
- ✅ Web : déployé en prod sur https://wiseweatherapp.xyz
- ✅ iOS : Build 36 uploadée App Store Connect, Build 30 attachée à v1.0 en `WAITING_FOR_REVIEW`
- ✅ Sauvegardes : web `backup/with-subscriptions-2026-05-09`, iOS `IAP_BACKUP.md`

---

## 🟡 En attente

### 1. 🍎 Review Apple v1.0 Build 30
- Status actuel : `WAITING_FOR_REVIEW`
- Délai habituel : 24-48h
- Si rejet : analyser raison, fixer, attacher Build 36 (ou plus récente) à la version 1.0, resoumettre via `fastlane submit`
- Si approbation : faire le release manuel dans App Store Connect (`releaseType: MANUAL` dans Fastfile)

### 2. 🧪 Tests post-launch (web déjà live)
- Vérifier le hint chip s'affiche bien sur mobile / desktop
- Vérifier le 7-Day Forecast charge en moins de 3s
- Vérifier les icônes courantes sont cohérentes (Map / Hourly / Dashboard)
- Vérifier la désactivation des alertes fonctionne et persiste

---

## 🔮 V2 (post-launch, après approbation Apple)

### Réactivation des abonnements
**Référence complète : [`IAP_BACKUP.md`](IAP_BACKUP.md)**

1. **Côté App Store Connect** (manuel, ~1h)
   - Recréer Subscription Group "Wise Weather Plans"
   - Recréer 3 subscriptions : `standard_plan` (CHF 20/mois), `ultimate_plan` (CHF 40/mois), `traveler_plan` (CHF 4/semaine)
   - Localizations FR/EN (intégrales dans IAP_BACKUP.md)

2. **Côté code** (~30 min)
   - Flipper `IAP_ENABLED = true` dans `index.tsx` ligne ~17
   - Restaurer les overrides `V1 OVERRIDE` dans `context/AppContext.tsx` :
     - `useState<UserTier>(UserTier.ULTIMATE)` → `UserTier.FREE`
     - `setUserTier(UserTier.ULTIMATE)` dans Firestore sync → `setUserTier(effectiveTier)`
   - Restaurer le bloc Subscription dans Settings (depuis l'historique git) + Crown header
   - Restaurer le tier badge (FREE/ULTIMATE) dans Hourly Forecast header
   - Restaurer ad banner conditionnel (si business model le justifie)

3. **Build + soumission**
   - Bump build number dans pbxproj ET Info.plist
   - `npm run build && npx cap sync ios`
   - `cd ios/App && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 fastlane release`
   - Attacher build à nouvelle version (1.1.0 ?)
   - `fastlane submit` avec metadata mise à jour

### Estimation totale V2 : ~2h (vs semaines de re-coding évitées)

---

## 🐛 Bugs connus (non bloquants pour V1)

### 1. Notifications iOS Safari (hors PWA)
**Symptôme** : Sur iOS Safari en mode navigateur, "Activer les alertes" ne fonctionne pas (Web Push API non supportée).
**Workaround actuel** : Alert explicatif demande à l'utilisateur d'ajouter l'app à l'écran d'accueil.
**Fix V2** : Détecter mode PWA et activer les notifications uniquement dans ce mode + bannière "Installer l'app" sur Safari mobile.

---

## 📊 Métriques à suivre post-launch

- Web : nombre de visiteurs uniques (Firebase Analytics)
- iOS : téléchargements App Store, taux de rétention J7/J30
- Communauté : nombre de signalements / jour (collection `reports` Firestore)
- Notifications : taux d'opt-in (notificationsEnabled vs total users)
- Backend : coût Cloud Functions / mois, latence `getWeatherForecast`
