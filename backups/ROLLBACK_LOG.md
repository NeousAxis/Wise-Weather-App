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

### ✅ [ACTUEL] `v2.4.0-Intelligent-Alerts` (`9d8e892`) - 24 Jan 2026
**État :** Production Stable (Smart Notifications & Community Fix)
**Contenu :**
- **Notifications Intelligentes :**
  - **Gestion d'Intermittence :** Détection des "trous" (Pluie -> Sec -> Pluie) pour alerter sur chaque nouvelle averse significative.
  - **Précision Horaire :** Affiche "Pluie à 09:13" au lieu d'un générique "Active now".
  - **Intensité & Fin :** Ajout des adjectifs (Faible/Forte) et de l'heure de fin ("Fin prévue : 11:45").
- **Contribution Communautaire :**
  - **Feedback Garanti :** Le reporter reçoit TOUJOURS une notif (Transmis / Validé / Doublon). Plus de "silence".
  - **Vérification Unifiée :** Le backend de vérification utilise désormais le modèle Multi-Source (9 canaux) pour s'aligner sur les alertes et éviter les faux "mismatchs".
- **UX & Textes :**
  - "Tombées de neige" (FR).
  - Clic sur la bannière notif ouvre le Modal de Contribution.

---

### 🕰️ `6e8d88d` - 23 Jan 2026 (08:53)
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
