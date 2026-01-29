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

### ✅ [ACTUEL] `v2.4.3-Systematic-Modal` - 28 Jan 2026
**État :** Production Stable (Comportement Systématique)
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
