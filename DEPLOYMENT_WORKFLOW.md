# 🚀 WORKFLOW DE DÉPLOIEMENT - WISE WEATHER APP

## ⚠️ RÈGLE D'OR : JAMAIS DE DÉPLOIEMENT DIRECT EN PRODUCTION !

**TOUJOURS** tester en staging avant de pousser en production !

---

## 📋 PROCESSUS DE DÉPLOIEMENT

### 1️⃣ **DÉVELOPPEMENT LOCAL**

```bash
# Démarrer le serveur de développement
npm run dev

# Tester l'app sur http://localhost:3000
# Vérifier que TOUT fonctionne correctement
```

**Checklist** :
- [ ] L'app charge sans écran blanc
- [ ] Les traductions fonctionnent (FR/EN)
- [ ] La carte s'affiche correctement
- [ ] Les données météo se chargent
- [ ] Aucune erreur dans la console

---

### 2️⃣ **DÉPLOIEMENT EN STAGING**

```bash
# Déployer le frontend en staging
npm run deploy:staging

# Déployer les functions en staging (si modifiées)
npm run deploy:functions:staging
```

**URL de staging** : https://wise-weather-app--staging-XXXXX.web.app
(L'URL exacte sera affichée après le déploiement)

**Tests en staging** :
- [ ] Ouvrir l'URL de staging dans un navigateur
- [ ] Tester TOUTES les fonctionnalités
- [ ] Vérifier les notifications push
- [ ] Tester avec différents navigateurs (Chrome, Safari, Firefox)
- [ ] Tester sur mobile
- [ ] Vérifier les logs Firebase Functions

**Durée de vie** : 30 jours (auto-suppression après)

---

### 3️⃣ **VALIDATION AVANT PRODUCTION**

**Questions à se poser** :
1. ✅ L'app fonctionne parfaitement en staging ?
2. ✅ Aucune erreur dans les logs ?
3. ✅ Les notifications fonctionnent ?
4. ✅ Les traductions sont correctes ?
5. ✅ Le Service Worker fonctionne ?

**Si OUI à TOUTES** → OK pour production
**Si NON à UNE SEULE** → **NE PAS DÉPLOYER !**

---

### 4️⃣ **DÉPLOIEMENT EN PRODUCTION**

```bash
# Déployer le frontend en production
npm run deploy:prod

# Déployer les functions en production (si modifiées)
npm run deploy:functions:prod
```

**URL de production** : https://wise-weather-app.web.app

**Tests post-déploiement** :
- [ ] Ouvrir l'URL de production
- [ ] Vérifier que l'app charge correctement
- [ ] Tester une fonctionnalité critique (ex: météo)
- [ ] Vérifier les logs Firebase

---

## 🚨 EN CAS DE PROBLÈME EN PRODUCTION

### Rollback Immédiat

```bash
# Revenir à la version précédente
git log --oneline  # Trouver le dernier commit stable
git checkout <COMMIT_HASH>
npm run deploy:prod
```

### Hotfix d'Urgence

1. **Créer une branche hotfix**
```bash
git checkout -b hotfix/nom-du-bug
```

2. **Corriger le bug**

3. **Tester en staging**
```bash
npm run deploy:staging
# TESTER COMPLÈTEMENT !
```

4. **Déployer en prod**
```bash
git checkout main
git merge hotfix/nom-du-bug
npm run deploy:prod
```

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Logs à surveiller

1. **Firebase Hosting**
   - https://console.firebase.google.com/project/wise-weather-app/hosting

2. **Firebase Functions**
   - https://console.firebase.google.com/project/wise-weather-app/functions/logs

3. **Erreurs utilisateurs**
   - Vérifier les rapports d'erreurs dans la console

### Métriques à surveiller

- [ ] Temps de chargement de l'app
- [ ] Taux d'erreur (doit être < 1%)
- [ ] Nombre de notifications envoyées
- [ ] Nombre d'utilisateurs actifs

---

## 🔒 RÈGLES DE SÉCURITÉ

1. **JAMAIS** de `console.log` avec des données sensibles en production
2. **TOUJOURS** tester en staging avant prod
3. **JAMAIS** de déploiement direct sans tests
4. **TOUJOURS** commit + push avant déploiement
5. **JAMAIS** de modification directe en production

---

## 📝 CHECKLIST COMPLÈTE

### Avant chaque déploiement

- [ ] Code commité et pushé sur GitHub
- [ ] Tests locaux réussis (npm run dev)
- [ ] Build réussi (npm run build)
- [ ] Déploiement staging réussi
- [ ] Tests staging complets
- [ ] Validation par le développeur
- [ ] Backup de la version actuelle

### Après chaque déploiement

- [ ] Vérification URL production
- [ ] Tests de fumée (smoke tests)
- [ ] Vérification logs Firebase
- [ ] Monitoring actif pendant 30 min
- [ ] Documentation des changements

---

## 🎯 RÉSUMÉ

```
LOCAL → STAGING → VALIDATION → PRODUCTION
  ↓         ↓          ↓            ↓
 Dev    Test tout   OK? OUI    Déployer
              ↓          ↓            ↓
           Fix bug    NON      Surveiller
```

**JAMAIS de raccourci ! La sécurité des utilisateurs avant tout !** 🛡️
