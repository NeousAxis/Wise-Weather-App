# 🔐 IAP BACKUP — Wise Weather App

**Date archivage** : 2026-05-09
**Build au moment de la suppression ASC** : 30 (1.0)
**Raison** : Apple a rejeté la review parce que les IAPs étaient configurés en App Store Connect mais pas accessibles dans l'app (`IAP_ENABLED=false`). Décision : ship v1 sans IAP, supprimer les IAPs de ASC, les recréer en V2.

---

## 1. Configuration App Store Connect (à recréer manuellement plus tard)

### Subscription Group
- **Name** : `Wise Weather Plans`
- **Reference Name** : `Wise Weather Plans`

### Subscriptions (3)

| Product ID | Display Name (default) | Period | Price (CHF) | Group Level | Family Sharable |
|------------|------------------------|--------|-------------|-------------|-----------------|
| `standard_plan` | Standard | 1 month | 20 CHF | 1 (lowest) | No |
| `ultimate_plan` | Ultimate | 1 month | 40 CHF | 2 (mid) | No |
| `traveler_plan` | Accès premium complet 7 jours, idéal en voyage | 1 week | 4 CHF | 3 (highest) | No |

> **Group Level convention** : Higher level = higher tier. App Store Connect treats higher levels as "upgrades" within the same group.

### Localizations

#### `standard_plan`
| Locale | Display Name | Description |
|--------|--------------|-------------|
| en-US  | Standard | All Contributor + HD map no blur + 7-day forecast + Detailed air quality |
| fr-FR  | Standard | Tout le Contributeur + Carte HD sans flou + Prévisions 7 jours + Qualité air détaillée |

#### `ultimate_plan`
| Locale | Display Name | Description |
|--------|--------------|-------------|
| en-US  | Ultimate | All Standard + AI personalized alerts + Advanced pollen & UV + Pro mountain mode |
| fr-FR  | Ultimate | Tout le Standard + Alertes IA personnalisées + Pollen & UV avancés + Mode montagne pro |

#### `traveler_plan`
| Locale | Display Name | Description |
|--------|--------------|-------------|
| en-US  | Traveler | Ultimate access + 7-day duration + Ideal for travel + No commitment |
| fr-FR  | Traveler | Accès Ultimate + Durée 7 jours + Idéal en voyage + Sans engagement |

### Review notes (per subscription)
> Subscription plan for Wise Weather App

---

## 2. Code IAP (déjà en place dans `index.tsx`)

Tout le code IAP est **TOUJOURS PRÉSENT** dans `index.tsx`, simplement gaté par `IAP_ENABLED = false`. **Aucun code à réécrire.**

### Feature flag (ligne ~17)
```tsx
// FEATURE FLAG — set to true to re-enable in-app purchases.
// First App Store submission ships without paid offers (no IAP UI, no StoreKit init).
const IAP_ENABLED = false;
```

### Composants concernés (toujours présents, juste désactivés)
| Composant | Localisation approximative |
|-----------|---------------------------|
| `PremiumModal` (UI complète des plans) | Ligne ~2356-2544 |
| Bouton "Voir les offres Premium" dans Settings | Ligne ~2680-2698 (gated by `IAP_ENABLED`) |
| `useEffect` IAP init (cordova-plugin-purchase) | Ligne ~3082-3155 (gated by `IAP_ENABLED`) |
| Render `<PremiumModal>` | Ligne ~3614 (gated by `IAP_ENABLED`) |

### Marketing copy (déjà dans `PremiumModal.tiers`)
Les 5 tiers (Free, Contributor, Standard, Ultimate, Traveler) avec prix, périodes, features bilingues sont **déjà codés en dur dans `index.tsx`**. Un simple `IAP_ENABLED = true` les réactivera tous.

### StoreKit logic (déjà câblée)
- Product registration : `standard_plan`, `ultimate_plan`, `traveler_plan` via `CdvPurchase.ProductType.PAID_SUBSCRIPTION`
- Approval handler : écrit le tier + expiresAt dans Firestore
- Durée : 30 jours pour standard/ultimate, 7 jours pour traveler

### Plugin Capacitor utilisé
- `cordova-plugin-purchase` (CdvPurchase) — déjà installé dans `package.json`
- Vérifier en V2 que le plugin est toujours présent : `npm ls cordova-plugin-purchase`

---

## 3. Restoration playbook (V2)

Étapes pour réactiver les IAPs dans une future version :

### A. Côté App Store Connect (manuel via web UI)
1. App Store Connect → Wise Weather → **Monetization → Subscriptions**
2. **Create Subscription Group** : `Wise Weather Plans`
3. Pour chaque subscription :
   - Click `+` → Auto-Renewable Subscription
   - Saisir le Product ID exact (`standard_plan`, `ultimate_plan`, `traveler_plan`)
   - Renseigner Reference Name = display name de la table 1
   - Set Subscription Duration : 1 month / 1 month / 1 week
   - Set Group Level : 1 / 2 / 3
   - Add Localizations (FR-FR + EN-US) selon table 2
   - Set Pricing (Switzerland 20/40/4 CHF + propagate to other regions)
   - Add Review Information : "Subscription plan for Wise Weather App"
   - Save

### B. Côté code
```tsx
// Dans index.tsx, ligne ~17 :
const IAP_ENABLED = true;
```

### C. Build + soumettre
1. `npm run build && npx cap sync ios`
2. Bumper `CURRENT_PROJECT_VERSION` (pbxproj) ET `CFBundleVersion` (Info.plist) — les deux !
3. `cd ios/App && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 fastlane release`
4. Attacher le build à la version, set version `1.1.0`, attach IAPs to version submission
5. `fastlane submit`

### D. Test sandbox
- Créer un Sandbox Tester dans App Store Connect → Users and Access → Sandbox Testers
- Sur device : Settings → App Store → Sandbox Account → log in with sandbox tester
- Lancer l'app → Premium → tester un achat (sera gratuit en sandbox)

---

## 4. Subscription IDs Apple (référence historique)

Les IDs ASC ci-dessous sont **inutilisables** (subscriptions supprimées le 2026-05-09). Conservés à titre informatif uniquement.

| Product ID | ASC Subscription ID (deleted) |
|------------|------------------------------|
| `standard_plan`  | `6761102722` |
| `ultimate_plan`  | `6761102911` |
| `traveler_plan`  | `6761102569` |
| Group "Wise Weather Plans" | `21996164` |

API Key utilisé : `8QAFD5C266` (Issuer `b140c75c-a30c-4ea7-ad1c-5dda1c16945e`)
Path local : `~/private_keys/AuthKey_8QAFD5C266.p8`

---

## 5. Fastlane lanes existants
- `release` : build + upload .ipa (no review submit) — `submit_for_review: false`
- `submit` : metadata + request App Store review — `submit_for_review: true`, `reject_if_possible: true`
- Path : `ios/App/fastlane/Fastfile`

⚠️ Toujours lancer fastlane avec UTF-8 :
```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 fastlane release
```

---

## 6. Notes finales

- **Bundle ID** : `com.cyrilleger.wiseweatherapp`
- **App Store Connect App ID** : `6760452760`
- **Team ID** : `BXB662X8PV`
- **IAP_ENABLED toggle** : un seul booléen suffit pour tout réactiver
- **Backend** : la logique de tier persistance dans Firestore (`users/{uid}` doc, `tier` field, `expiresAt` field) est déjà déployée

**Estimation du temps de restauration en V2** : ~30 min côté code (déjà tout codé) + ~1h côté ASC (création manuelle des 3 IAPs avec localizations).
