import { Language } from "./types";

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    "app.name": "Wise Weather",
    "nav.home": "Home",
    "nav.map": "Map",
    "nav.alerts": "Alerts",
    "nav.feedback": "Feedback",
    "weather.wind": "Wind",
    "weather.humidity": "Humidity",
    "weather.sunrise": "Sunrise",
    "weather.sunset": "Sunset",
    "weather.feelsLike": "Feels Like",
    "community.title": "Weather Community",
    "community.official": "OFFICIAL",
    "community.reports": "COMMUNITY",
    "community.confidence": "Confidence",
    "modal.title": "What's the weather?",
    "modal.desc": "Help the community by reporting real-time conditions.",
    "modal.submit": "Share Report",
    "modal.wait": "Skip in",
    "alert.title": "RAIN ALERT",
    "alert.desc": "Get notified when rain is coming.",
    "alert.city": "City & Country",
    "alert.rain": "Rain",
    "alert.create": "Create Rain Alert",
    "alert.existing": "Active Alert",
    "feedback.bug": "Report a bug",
    "feedback.feature": "Request a feature",
  },
  fr: {
    "app.name": "Wise Weather",
    "nav.home": "Accueil",
    "nav.map": "Carte",
    "nav.alerts": "Alertes",
    "nav.feedback": "Avis",
    "weather.wind": "Vent",
    "weather.humidity": "Humidité",
    "weather.sunrise": "Lever",
    "weather.sunset": "Coucher",
    "weather.feelsLike": "Ressenti",
    "community.title": "Météo Communautaire",
    "community.official": "OFFICIEL",
    "community.reports": "COMMUNAUTÉ",
    "community.confidence": "Confiance",
    "modal.title": "Quel temps fait-il ?",
    "modal.desc": "Aidez la communauté en signalant les conditions réelles.",
    "modal.submit": "Partager",
    "modal.wait": "Passer dans",
    "alert.title": "ALERTE PLUIE",
    "alert.desc": "Soyez notifié de l'arrivée de la pluie.",
    "alert.city": "Ville & Pays",
    "alert.rain": "Pluie",
    "alert.create": "Créer l'alerte",
    "alert.existing": "Alerte Active",
    "feedback.bug": "Signaler un bug",
    "feedback.feature": "Demander une fonction",
  }
};

export const MOCK_COMMUNITY_DATA = [
  { hourOffset: 0, conditions: [1, 1, 1] }, // All same -> High Confidence
  { hourOffset: -1, conditions: [3, 3, 3] }, // All same -> High Confidence
  { hourOffset: -2, conditions: [61, 0, 95] }, // Mixed -> Low Confidence (Conflict)
  { hourOffset: -3, conditions: [0] }, // Single -> Medium Confidence
  { hourOffset: -4, conditions: [0, 0] }, // All same -> High
  { hourOffset: -5, conditions: [61, 61, 0] }, // Mostly rain but some sun -> Low/Conflict logic
];