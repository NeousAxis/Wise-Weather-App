# 🛡️ PROCÉDURE DE SAUVEGARDE & ROLLBACK

Dernière sauvegarde : **9 Mai 2026 — V1 LAUNCH**
État : **Version Live (web) + Build 36 iOS uploadée**

## ⭐ POINT DE RESTAURATION ACTUEL

| | Tag / Branche | Date | État |
|---|---|---|---|
| **Web** | `backup/with-subscriptions-2026-05-09` (commit `d032bb4`) | 9 Mai 2026 | Avec abonnements Stripe actifs (avant V1 launch) |
| **iOS** | [`IAP_BACKUP.md`](IAP_BACKUP.md) | 9 Mai 2026 | Métadonnées des 3 IAPs supprimés (playbook restauration V2) |

Sauvegarde historique précédente :
- Date : 10 Janvier 2026
- État : **Version Stable Fonctionnelle** (Avant intégration Freemium)
- Dossier : `/Users/cyrilleger/wise-weather-app/backups/pre_freemium_functional/`

---

## 📂 Fichiers Sauvegardés
Les fichiers critiques suivants ont été copiés en sécurité :
- `index.tsx` (Application Frontend principale)
- `types.ts` (Définitions Typescript)
- `constants.ts` (Traductions et configurations)
- `index.css` (Styles globaux)
- `functions/src/index.ts` (Backend Firebase Cloud Functions) -> renommé `functions_index.ts` dans la sauvegarde.

---

## 🚨 COMMENT FAIRE UN ROLLBACK ?

Si une modification future casse l'application ou introduit des bugs indésirables, vous pouvez revenir à cet état exact instantanément.

### Option 1 : Demandez-le moi (Recommandé)
Envoyez simplement le message suivant :
> **"ROLLBACK"**

Je comprendrai immédiatement qu'il faut écraser les fichiers actuels avec ceux du dossier de sauvegarde.

### Option 2 : Restauration Manuelle
Si vous devez le faire vous-même, exécutez ces commandes dans le terminal :

```bash
cp backups/pre_freemium_functional/index.tsx index.tsx
cp backups/pre_freemium_functional/types.ts types.ts
cp backups/pre_freemium_functional/constants.ts constants.ts
cp backups/pre_freemium_functional/index.css index.css
cp backups/pre_freemium_functional/functions_index.ts functions/src/index.ts
```

---

## 🕒 HISTORIQUE DES SAUVEGARDES RÉCENTES

| Date | Tag / Branche | État | Action |
| :--- | :--- | :--- | :--- |
| **9 Mai 2026** | `backup/with-subscriptions-2026-05-09` (web, commit `d032bb4`) | **Avant V1 launch (Stripe actif)** | Sortie V1 sans abonnements, ULTIMATE pour tous |
| **9 Mai 2026** | [`IAP_BACKUP.md`](IAP_BACKUP.md) (iOS) | **Métadonnées 3 IAPs supprimés** | Playbook restauration V2 (2h total) |
| **30 Jan 2026** | `V26.01.30-STABLE` | Optimisation Démarrage & Fix IA | Parallélisation APIs + Fix Prompt Gemini |
| **10 Jan 2026** | `PRE-FREEMIUM` | Stable avant système de paiement | Point de restauration complet |

---

## 🆕 ROLLBACK V1 (Mai 2026)

### Web — restaurer les abonnements Stripe

```bash
cd /Users/cyrilleger/wise-weather-app
git checkout backup/with-subscriptions-2026-05-09
npm run deploy:prod
```

Ou rollback ciblé sur main (revert des commits V1) :
```bash
cd /Users/cyrilleger/wise-weather-app
git revert --no-commit 548b9e7 5677a0d 672ecae 70b391d 4b6c916 3391a0d 017fc5c
git commit -m "rollback: restore pre-V1 subscription state"
npm run deploy:prod
```

### iOS — revenir avant le sprint V1

```bash
cd /Users/cyrilleger/wise-weather-app-ios
git log --oneline fix/ios-finalization -20
# Pour revenir à l'état pré-V1 (avant Wind Graph, 7-Day, etc.) :
git reset --hard 7009ebe
```

**Restaurer les IAPs iOS** : voir [IAP_BACKUP.md](IAP_BACKUP.md) — playbook complet (~2h : 1h ASC manuel + 30min code + build + submit).

---

**🔒 Note de sécurité** : Ce dossier de backup ne sera pas modifié par mes soins lors des prochaines étapes. Il reste votre "point de retour" sûr.
