
import React, { createContext, useState, useEffect } from 'react';
import { Language, Unit, WeatherData, CommunityReport, SearchResult } from '../types';
import { TRANSLATIONS } from '../constants';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  location: { lat: number; lng: number } | null;
  userPosition: { lat: number; lng: number } | null;
  cityName: string;
  updateLocation: (lat: number, lng: number, name?: string, country?: string, source?: 'gps' | 'manual') => void;
  weather: WeatherData | null;
  loadingWeather: boolean;
  communityReports: CommunityReport[];
  addReport: (conditions: string[]) => void;
  searchCity: (query: string) => Promise<SearchResult[]>;
  majorCitiesWeather: any[];
  alertsCount: number;
  t: (key: string) => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// Database of major cities by country (Expanded)
const COUNTRY_MAJOR_CITIES: Record<string, {name: string, lat: number, lng: number}[]> = {
  "France": [
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "Lyon", lat: 45.7640, lng: 4.8357 },
    { name: "Marseille", lat: 43.2965, lng: 5.3698 },
    { name: "Bordeaux", lat: 44.8378, lng: -0.5792 },
    { name: "Nice", lat: 43.7102, lng: 7.2620 }
  ],
  "United Kingdom": [
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "Manchester", lat: 53.4808, lng: -2.2426 },
    { name: "Birmingham", lat: 52.4862, lng: -1.8904 },
    { name: "Edinburgh", lat: 55.9533, lng: -3.1883 }
  ],
  "Belgium": [
    { name: "Brussels", lat: 50.8503, lng: 4.3517 },
    { name: "Antwerp", lat: 51.2194, lng: 4.4025 },
    { name: "Liège", lat: 50.6326, lng: 5.5797 }
  ],
  "Switzerland": [
    { name: "Zurich", lat: 47.3769, lng: 8.5417 },
    { name: "Geneva", lat: 46.2044, lng: 6.1432 },
    { name: "Bern", lat: 46.9480, lng: 7.4474 },
    { name: "Basel", lat: 47.5596, lng: 7.5886 }
  ],
  "Germany": [
    { name: "Berlin", lat: 52.5200, lng: 13.4050 },
    { name: "Munich", lat: 48.1351, lng: 11.5820 },
    { name: "Hamburg", lat: 53.5511, lng: 9.9937 }
  ],
  "Italy": [
    { name: "Rome", lat: 41.9028, lng: 12.4964 },
    { name: "Milan", lat: 45.4642, lng: 9.1900 },
    { name: "Naples", lat: 40.8518, lng: 14.2681 }
  ],
  "Spain": [
    { name: "Madrid", lat: 40.4168, lng: -3.7038 },
    { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
    { name: "Seville", lat: 37.3891, lng: -5.9845 }
  ],
  "Netherlands": [
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
    { name: "Rotterdam", lat: 51.9244, lng: 4.4777 },
    { name: "The Hague", lat: 52.0705, lng: 4.3007 }
  ],
  "Vietnam": [
    { name: "Hanoi", lat: 21.0285, lng: 105.8542 },
    { name: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297 },
    { name: "Da Nang", lat: 16.0544, lng: 108.2022 }
  ],
  "Thailand": [
    { name: "Bangkok", lat: 13.7563, lng: 100.5018 },
    { name: "Chiang Mai", lat: 18.7061, lng: 98.9817 },
    { name: "Phuket", lat: 7.8804, lng: 98.3923 }
  ],
  "Canada": [
    { name: "Toronto", lat: 43.6510, lng: -79.3470 },
    { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
    { name: "Montreal", lat: 45.5017, lng: -73.5673 }
  ],
  "Australia": [
    { name: "Sydney", lat: -33.8688, lng: 151.2093 },
    { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
    { name: "Brisbane", lat: -27.4698, lng: 153.0251 }
  ],
  "United States": [
    { name: "New York", lat: 40.7128, lng: -74.0060 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298 }
  ],
  "Global": [
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "New York", lat: 40.7128, lng: -74.0060 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Sydney", lat: -33.8688, lng: 151.2093 }
  ]
};

export const AppProvider = ({ children }: { children?: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [unit, setUnit] = useState<Unit>('celsius');
  // 'location' is the currently VIEWED location (e.g. searched city)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  // 'userPosition' is the physical GPS location of the user
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  const [cityName, setCityName] = useState('Loading...');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [majorCitiesWeather, setMajorCitiesWeather] = useState<any[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // Initialize with geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocation(position.coords.latitude, position.coords.longitude, undefined, undefined, 'gps');
        },
        () => {
          // Default to Paris if denied
          updateLocation(48.8566, 2.3522, "Paris", "France", 'manual');
        }
      );
    } else {
      updateLocation(48.8566, 2.3522, "Paris", "France", 'manual');
    }
  }, []);

  const fetchMajorCitiesForCountry = async (countryName: string) => {
    // Normalize country name: remove accents, lowercase, remove spaces to handle "Việt Nam" vs "Vietnam"
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    const target = normalize(countryName);

    let cities = COUNTRY_MAJOR_CITIES["Global"]; // Default
    
    // Find matching country key
    const matchKey = Object.keys(COUNTRY_MAJOR_CITIES).find(key => normalize(key) === target);
    
    if (matchKey) {
        cities = COUNTRY_MAJOR_CITIES[matchKey];
    } else {
       // Check for partial matches (e.g. "United States" in "United States of America")
       const partialKey = Object.keys(COUNTRY_MAJOR_CITIES).find(key => target.includes(normalize(key)) || normalize(key).includes(target));
       if (partialKey) cities = COUNTRY_MAJOR_CITIES[partialKey];
    }

    try {
      const weatherPromises = cities.map(async (city) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,weather_code,is_day`;
        const res = await fetch(url);
        const data = res.json();
        return data.then((d: any) => ({
            ...city,
            code: d.current.weather_code,
            temp: d.current.temperature_2m,
            isDay: d.current.is_day,
            isCurrent: false // Major cities are never "current" in this list
        }));
      });

      const results = await Promise.all(weatherPromises);
      setMajorCitiesWeather(results);
    } catch (e) {
      console.error("Failed to fetch major cities weather", e);
    }
  };

  const updateLocation = async (lat: number, lng: number, name?: string, country?: string, source: 'gps' | 'manual' = 'manual') => {
    setLoadingWeather(true);
    setLocation({ lat, lng });

    // Store physical position if source is GPS
    if (source === 'gps') {
        setUserPosition({ lat, lng });
    }

    try {
      // 1. Get City Name if not provided (Reverse Geocoding)
      let resolvedName = name;
      let resolvedCountry = country;

      if (!resolvedName || !resolvedCountry) {
        try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const geoData = await geoRes.json();
            resolvedName = geoData.address.city || geoData.address.town || geoData.address.village || "Unknown Location";
            resolvedCountry = geoData.address.country || "Unknown";
        } catch (e) {
            console.error("Reverse geocoding failed", e);
            resolvedName = "Unknown Location";
        }
      }
      
      setCityName(resolvedName || "Unknown");

      // 2. Fetch Weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      );
      const weatherData = await weatherRes.json();

      // Transform snake_case API to camelCase type
      const formattedWeather: WeatherData = {
          current: {
              temperature: weatherData.current.temperature_2m,
              weatherCode: weatherData.current.weather_code,
              windSpeed: weatherData.current.wind_speed_10m,
              isDay: weatherData.current.is_day,
              relativeHumidity: weatherData.current.relative_humidity_2m
          },
          hourly: {
              time: weatherData.hourly.time,
              temperature_2m: weatherData.hourly.temperature_2m,
              weather_code: weatherData.hourly.weather_code
          },
          daily: {
              temperature_2m_max: weatherData.daily.temperature_2m_max,
              temperature_2m_min: weatherData.daily.temperature_2m_min,
              sunrise: weatherData.daily.sunrise,
              sunset: weatherData.daily.sunset
          }
      };

      setWeather(formattedWeather);

      // 3. Fetch Major Cities - ONLY if source is GPS (User physically moved)
      // If manual search, we keep the previous major cities (e.g. user in Bangkok searches Paris -> keeps Thailand cities)
      if (source === 'gps' && resolvedCountry) {
          fetchMajorCitiesForCountry(resolvedCountry);
      } else if (majorCitiesWeather.length === 0 && resolvedCountry) {
          // Fallback: if no major cities loaded yet (e.g. first load failed), try loading
          fetchMajorCitiesForCountry(resolvedCountry);
      }

      // Check severe weather
      if (weatherData.current.weather_code >= 95 || weatherData.current.wind_speed_10m > 80) {
          setAlertsCount(1);
      } else {
          setAlertsCount(0);
      }

    } catch (error) {
      console.error("Error updating location:", error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const searchCity = async (query: string): Promise<SearchResult[]> => {
    if (!query) return [];
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const data = await res.json();
      if (!data.results) return [];
      
      return data.results.map((r: any) => ({
        id: r.id,
        name: r.name,
        country: r.country,
        latitude: r.latitude,
        longitude: r.longitude
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const addReport = (conditions: string[]) => {
    if (!location || !weather) return;
    const newReport: CommunityReport = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      conditions,
      lat: location.lat,
      lng: location.lng,
      userId: 'user-' + Math.random().toString(36).substr(2, 9),
      temp: weather.current.temperature // Capture current official temp
    };
    setCommunityReports(prev => [newReport, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      unit, setUnit,
      location, userPosition,
      cityName,
      updateLocation,
      weather,
      loadingWeather,
      communityReports,
      addReport,
      searchCity,
      majorCitiesWeather,
      alertsCount,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};
