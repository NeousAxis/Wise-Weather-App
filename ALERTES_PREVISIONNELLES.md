# 🚨 CORRECTION ALERTES PRÉVISIONNELLES - 6 Janvier 2026

## ✅ DÉPLOIEMENT RÉUSSI

**Heure** : 09:11 (UTC+7)
**URL** : https://wise-weather-app.web.app

---

## 🎯 PROBLÈME RÉSOLU

### ❌ AVANT : Alertes UNIQUEMENT pendant les événements
- Vous receviez une alerte **PENDANT** qu'il pleuvait sur votre tête
- **AUCUNE** alerte **AVANT** que la pluie/neige/orage n'arrive
- Détection limitée à la pluie uniquement

### ✅ MAINTENANT : Alertes PRÉVISIONNELLES (2 heures à l'avance)

Le système analyse maintenant les **prévisions à 15 minutes** sur les **2 prochaines heures** et vous alerte **AVANT** que les conditions dangereuses n'arrivent !

---

## 🌩️ TYPES D'ALERTES PRÉVISIONNELLES

### 1. ⛈️ **ALERTE ORAGE** (Priorité 1 - DANGER)
**Codes WMO** : 95-99
**Message FR** : "DANGER ! Orage prévu dans ~30 min (durée: 45 min). Mettez-vous à l'abri !"
**Message EN** : "DANGER! Storm expected in ~30 min (duration: 45 min). Take shelter!"

### 2. ❄️ **ALERTE NEIGE** (Priorité 2)
**Codes WMO** : 71-77, 85-86
**Message FR** : "Neige prévue dans ~15 min (durée: 30 min). Préparez-vous !"
**Message EN** : "Snow expected in ~15 min (duration: 30 min). Get ready!"

### 3. 🌧️ **PRÉVISION PLUIE** (Priorité 3)
**Codes WMO** : 51-67, 80-82
**Message FR** : "Pluie prévue dans ~45 min (durée estimée: 60 min)."
**Message EN** : "Rain expected in ~45 min (duration: 60 min)."

---

## 🔧 MODIFICATIONS TECHNIQUES

### Fichier : `functions/src/index.ts`

#### 1. Nouvelle fonction `getDangerousForecast()` (lignes 671-750)
Remplace l'ancienne `getPrecipitationEvent()` qui ne détectait que la pluie.

**Améliorations** :
- ✅ Détecte **TOUS** les dangers : Orage, Neige, Pluie
- ✅ Analyse les **8 prochains créneaux de 15 min** (= 2 heures)
- ✅ Retourne le **type** de danger + **délai d'arrivée** + **durée**
- ✅ Priorise les dangers : Orage > Neige > Pluie

#### 2. Messages d'alerte personnalisés (lignes 443-492)
- ✅ Messages **DANGER** en majuscules pour les orages
- ✅ Traductions FR/EN pour chaque type
- ✅ Indication précise du délai et de la durée

---

## 📊 EXEMPLE CONCRET

**Situation** : Il est 14:00, beau temps actuellement

**Prévisions Open-Meteo** :
- 14:00 : Code 1 (Clair) ✅
- 14:15 : Code 2 (Nuages) ✅
- 14:30 : Code 61 (Pluie légère) ⚠️
- 14:45 : Code 63 (Pluie modérée) ⚠️
- 15:00 : Code 95 (Orage) 🚨
- 15:15 : Code 96 (Orage + grêle) 🚨

**Alerte envoyée à 14:00** :
> ⛈️ **ALERTE ORAGE**
> DANGER ! Orage prévu dans ~60 min (durée: 30 min). Mettez-vous à l'abri !

---

## ⏰ FRÉQUENCE DES VÉRIFICATIONS

- **Cron** : Toutes les **15 minutes**
- **Fenêtre de prévision** : **2 heures** (8 créneaux de 15 min)
- **Limite d'envoi** : Max **10 alertes/jour** pour les dangers critiques

---

## 🧪 TESTS À EFFECTUER

1. **Attendre une journée avec prévisions de pluie/orage**
2. **Vérifier que vous recevez l'alerte AVANT** que ça commence
3. **Vérifier le délai annoncé** (ex: "dans ~30 min")
4. **Vérifier le type de danger** (Orage vs Pluie vs Neige)

---

## 📝 PROCHAINE ÉTAPE

🔴 **URGENT** : Corriger la logique de citation pour que **TOUS les utilisateurs du monde** reçoivent la **MÊME citation** le même jour calendaire (au lieu d'utiliser la date UTC qui crée des citations différentes selon les fuseaux horaires).

---

**Statut** : ✅ DÉPLOYÉ ET ACTIF
