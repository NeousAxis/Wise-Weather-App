
export type Language = 'en' | 'fr';
export type Unit = 'celsius' | 'fahrenheit';

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    isDay: number;
    relativeHumidity: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
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
  temp?: number; // Snapshot of temperature at report time
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
