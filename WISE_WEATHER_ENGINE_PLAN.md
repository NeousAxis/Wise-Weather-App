# Wise Weather Engine - Spécifications Techniques & Plan de Migration

Ce document détaille la conception de la future plateforme API indépendante destinée à centraliser toute la "matière grise" de l'écosystème Wise Weather.

## 1. Vision & Architecture
L'objectif est d'extraire la logique métier lourde et fragile de l'application cliente pour la confier à un service Node.js robuste hébergé sur **Vercel**.

### Avantages :
- **Consolidation** : Un seul appel API côté application cliente pour tout récupérer.
- **Robustesse** : Les mises à jour de logique biologique ou météorologique n'exigent plus de redéployer l'application.
- **Performance** : Cache serveur haute performance permettant de respecter strictement les quotas (ex: 3 appels/jour pour les pollens).
- **Protection** : Toutes les clés API (Google, Open-Meteo, Gemini) sont sécurisées côté serveur.

---

## 2. Le Moteur Biologique (Pollen Intelligence)
Cœur de la plateforme, ce moteur transforme l'indice journalier statique de Google en une donnée dynamique et réaliste.

### Algorithme de Pondération (Dynamic Bio-Weighting) :
Le moteur appliquera des courbes de concentration basées sur :
1. **L'Espèce** (Fournie par Google) :
   - **Arbres** (Aulne, Noisetier, Chêne, etc.) : Très sensibles au cycle jour/nuit et à la température.
   - **Graminées** : Double pic (matin et tombée de la nuit).
   - **Herbacées** (Ambroisie) : Très volatiles, restent en suspension tard.
2. **Le Cycle Local** (`isDay`) :
   - Utilisation des coordonnées pour déterminer le lever/coucher du soleil précis.
   - Application automatique de coefficients réducteurs progressifs dès le coucher du soleil.
3. **La Saisonnalité** :
   - Ajustement de l'agressivité des courbes selon le mois de l'année (Hiver vs Été).

---

## 3. Le Moteur Météorologique (Multi-Model Safety)
Fusionne les flux de données pour garantir que l'utilisateur n'est jamais surpris par une averse non détectée.

- **Synthèse** : Agrégation de +10 modèles (Météo-France, ECMWF, GFS, JMA, etc.).
- **Priorité Sécurité** : Si un seul modèle détecte un danger imminent (Orage, Pluie forte), l'API surcharge l'indice global envoyé à l'application.
- **Nowcasting** : Analyse des données minutely_15 pour extraire une phrase de résumé ("Pluie attendue dans 15min").

---

## 4. Spécifications de l'API (Endpoint Unique)

### `GET /api/v1/weather-pack`
**Entrées :** `lat`, `lng`, `lang` (fr/en), `userId`.

**Sortie (JSON consolidé) :**
```json
{
  "current": {
    "temp": 12.5,
    "weatherCode": 61,
    "isDay": true,
    "description": "Pluie faible"
  },
  "pollen": {
    "status": "active",
    "items": [
      { "code": "HAZEL", "label": "Noisetier", "bioValue": 0.2, "originalValue": 1.0, "color": "green" }
    ],
    "message": "Concentration faible, chute nocturne prévue."
  },
  "aqi": { "value": 42, "level": "Good", "details": { "pm25": 10.2 } },
  "quote": { "text": "...", "author": "..." }
}
```

---

## 5. Caching & Quotas
Pour protéger les finances du projet et optimiser la vitesse :
- **Cache Pollen** : 3 slots fixes par 24h (6h, 11h, 17h) par zone de 10km (toFixed(1)).
- **Cache Météo** : Rafraîchissement toutes les 15 minutes.
- **Cache Citations** : Persistance 24h par jour calendaire.

---

## 6. Plan de Migration (Étapes)
1. **Initialisation** : Création du projet Node.js/Typescript indépendant.
2. **Déploiement Vercel** : Configuration des variables d'environnement secrètes.
3. **Migration des fonctions** : Déplacement successif de `getWeatherForecast`, `getPollenForecast`, et `generateQuote` vers l'API Gateway.
4. **Switch Client** : Mise à jour de `AppContext.tsx` pour pointer vers l'URL Vercel au lieu de Firebase Functions.

---
*Ce document sert de référence pour le futur développement du Wise Weather Engine.*
