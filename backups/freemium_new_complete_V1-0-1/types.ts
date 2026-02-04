
export type Language = 'en' | 'fr';
export type Unit = 'celsius' | 'fahrenheit';

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    isDay: number;
    relativeHumidity: number;
    visibility?: number; // meters
    aqi?: number; // WAQI index
    uvIndex?: number;
    pollen?: {
      alder?: number;      // Aulne (hiver)
      birch?: number;      // Bouleau (printemps)
      grass?: number;      // Graminées (été)
      ragweed?: number;    // Ambroisie (fin été)
      olive?: number;      // Olivier (printemps)
      mugwort?: number;    // Armoise (été/automne)
    }; // Grains/m3
    precipitation?: number;
    airQualityDetails?: {
      pm2_5: number;
      pm10: number;
      no2: number;
      o3: number;
    };
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    uv_index?: number[];
    european_aqi?: number[];
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    time: string[];
  };
  hourlyAirQuality?: {
    pm2_5: number[];
    pm10: number[];
    no2: number[];
    o3: number[];
    time: string[];
  };
  yesterday?: {
    tempMax: number;
    weatherCode?: number;
    details?: {
      morning: { temp: number; code: number };
      noon: { temp: number; code: number };
      evening: { temp: number; code: number };
    };
  };
}

export interface SearchResult {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export enum ConfidenceLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface CommunityReport {
  id: string;
  timestamp: number;
  conditions: string[]; // Store labels like 'Rain', 'Sunny'
  lat: number;
  lng: number;
  userId: string;
  cityName?: string; // City name for FREE tier filtering
  temp?: number; // Snapshot of temperature at report time
  snowLevel?: number; // Optional: Snow level in cm (Mountain Mode)
  avalancheRisk?: number; // 1-5 (Mountain Mode)
  visibilityDist?: number; // meters (Mountain Mode)
  isoLimit?: number; // altitude in meters (Mountain Mode)
  windExposure?: 'ridge' | 'valley'; // (Mountain Mode)
}

export interface DailyQuote {
  en: {
    text: string;
    author: string;
  };
  fr: {
    text: string;
    author: string;
  };
}

export enum UserTier {
  FREE = 'FREE',
  CONTRIBUTOR = 'CONTRIBUTOR',
  STANDARD = 'STANDARD',
  ULTIMATE = 'ULTIMATE',
  TRAVELER = 'TRAVELER'
}

export interface UserProfile {
  uid: string;
  email: string | null;
  tier: UserTier;
  // Futureproofing for "Mécène" status or other badges
  badges?: string[];
  createdAt: number;
}
