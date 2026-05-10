# 📋 Wise Weather — TODO Prochaine Session

## 🗓️ Mise à jour : 10 Mai 2026 (soir) — V1 USER-FEEDBACK FIXES terminé (v2.4.2)
## Dernière build iOS uploadée : Build 39 (le matin 10 mai)
## Code v2.4.2 : commits locaux uniquement (pas encore en TestFlight)

---

## ✅ Fait dans le sprint v2.4.2 (après-midi 10 mai 2026, post user-test)

### Frontend
- ✅ i18n carte Communauté : `t('condition.${label}')` au lieu du label brut anglais (Showers → Averse en FR)
- ✅ **Persistance** carte Communauté via `localStorage` (clé `wise_last_community_report`, TTL 6h) → affichage instantané à la réouverture
- ✅ Rayon carte Communauté aligné sur le carrousel (10 km) — fini les contributions visibles dans l'un et pas dans l'autre
- ✅ Suppression du fetch direct `rainJson` qui écrasait `precipitation_probability` avec best_match seul → consensus 10 modèles enfin **vraiment utilisé**
- ✅ Bug bouton 🔄 : spinner tournait 5 min au lieu de 1-2s (séparation `refreshingHeader` / `refreshCooldown`)
- ✅ Timestamp `Maj HH:MM` à côté du bouton 🔄 (preuve visuelle que le fetch s'exécute) + tooltip
- ✅ Champ `weatherFetchedAt: number | null` exposé dans `AppContextType`

### Process
- ✅ Tous les fixes en commit local sur `fix/ios-finalization` — **pas d'upload App Store** (Build 39 reste la dernière en TestFlight)

---

## ✅ Fait dans le sprint v2.4.1 (9-10 mai 2026)

### Backend
- ✅ Migration Quote Gemini → **Mistral** (`mistral-small-latest`, free tier, EU-hosted)
- ✅ Suppression de la dép `@google/generative-ai`, slot `v23 → v24` pour purger Roosevelt
- ✅ Consensus 10 modèles sur **`hourly.precipitation_probability`** (CASE B-bis)
- ✅ Consensus 10 modèles sur **`hourly.weather_code`** (CASE B-ter) — résout le bug "rain all day fantôme"

### Frontend
- ✅ AppContext expose `refreshWeather()` (web + iOS)
- ✅ Bouton 🔄 **Update** dans le header global (à gauche des boutons °C/FR), cooldown 5 min
- ✅ Carte **Communauté** remplace HIER, toujours visible (placeholder si aucun signalement)
- ✅ Layout corrigé (carte communauté en pleine largeur, n'écrase plus le titre ville)

### iOS
- ✅ Build 39 uploadée App Store Connect via fastlane
- ✅ Auto-link aux 2 groupes TestFlight Internal (`Dev Build 26+` + `Internal Testers`)

### Process
- ✅ Nouvelle règle : **pas de fastlane release sans validation utilisateur explicite**

---

## 🟡 En attente

### 1. 🍎 Review Apple v1.0 — Build attaché = 30
- **Status actuel** : `WAITING_FOR_REVIEW`
- Apple review la Build 30 (la plus ancienne propre). Builds 31-39 sont en TestFlight uniquement.
- **Si rejet** : analyser raison, attacher Build 39 (la plus récente, contient tous les fixes), resoumettre via `fastlane submit`.
- **Si approbation** : release manuel dans App Store Connect (`releaseType: MANUAL`).

### 2. 🧪 Tests post-launch web (déjà live)
- Vérifier que le bloc Communauté s'affiche bien avec le placeholder quand aucun signalement
- Tester le bouton Update + cooldown 5 min
- Vérifier en condition réelle que le consensus 10 modèles élimine les "rain all day fantôme"

---

## 🔮 V2 (post-launch, après approbation Apple)

### Réactivation des abonnements
**Référence complète : [`IAP_BACKUP.md`](IAP_BACKUP.md)**

1. **App Store Connect** (~1h) : recréer Subscription Group + 3 IAPs (`standard_plan`, `ultimate_plan`, `traveler_plan`) avec localizations FR/EN
2. **Code** (~30 min) :
   - `IAP_ENABLED = true` dans `index.tsx` ligne ~17
   - Restaurer overrides `V1 OVERRIDE` dans `context/AppContext.tsx` (initial tier `FREE` au lieu d'`ULTIMATE`, sync Firestore au lieu de force-`ULTIMATE`)
   - Restaurer Crown header + Subscription block Settings + tier badge depuis l'historique git
3. **Build + soumission** : bump build, sync, fastlane release + submit

### Estimation V2 : ~2h (vs semaines de re-coding évitées)

---

## 🐛 Bugs connus (non bloquants)

### 1. Notifications iOS Safari (hors PWA)
- iOS Safari ne supporte pas les Web Notifications en mode navigateur.
- Workaround : alert demande à l'utilisateur d'ajouter l'app à l'écran d'accueil.

---

## 💡 Idées pour V2+ (backlog)

1. **Notifications push hyperlocales** : si la communauté signale "pluie en cours" dans un rayon de 1 km mais que la prévision officielle dit "ciel clair", envoyer une push proactive "Pluie en cours à proximité".
2. **Indicateur de confiance** : badge "Forte confiance" / "Moyenne" / "Faible" selon le degré d'accord entre les 10 modèles (ex: 10/10 vs 5/5).
3. **Hybride observation + forecast** : pour la prochaine heure, faire confiance à l'observation actuelle plutôt qu'à la prédiction si elles divergent.
4. **Auto-refresh intelligent** : refresh automatique mais SEULEMENT si la dernière donnée a > 1h, et cooldown adaptatif selon usage.

---

## 📊 Métriques à suivre post-launch

- Web : visiteurs uniques (Firebase Analytics)
- iOS : téléchargements App Store, rétention J7/J30
- Communauté : signalements/jour, % de localisations avec ≥1 signalement
- Notifications : taux d'opt-in (notificationsEnabled vs total users)
- Backend : invocations Cloud Functions/mois (limite free 2M), latence `getWeatherForecast`
- Mistral : usage tokens/mois (limite free tier)
