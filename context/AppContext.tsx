
import React, { createContext, useState, useEffect } from 'react';
import { Language, Unit, WeatherData, CommunityReport, SearchResult } from '../types';
import { TRANSLATIONS } from '../constants';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  location: { lat: number; lng: number } | null;
  cityName: string;
  updateLocation: (lat: number, lng: number, name?: string, country?: string) => void;
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

// Database of major cities by country
const COUNTRY_MAJOR_CITIES: Record<string, {name: string, lat: number, lng: number}[]> = {
  "France": [
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "Lyon", lat: 45.7640, lng: 4.8357 },
    { name: "Marseille", lat: 43.2965, lng: 5.3698 },
    { name: "Bordeaux", lat: 44.8378, lng: -0.5792 },
    { name: "Lille", lat: 50.6292, lng: 3.0573 }
  ],
  "United Kingdom": [
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "Manchester", lat: 53.4808, lng: -2.2426 },
    { name: "Birmingham", lat: 52.4862, lng: -1.8904 }
  ],
  "Belgium": [
    { name: "Brussels", lat: 50.8503, lng: 4.3517 },
    { name: "Antwerp", lat: 51.2194, lng: 4.4025 },
    { name: "Liège", lat: 50.6326, lng: 5.5797 }
  ],
  "United States": [
    { name: "New York", lat: 40.7128, lng: -74.0060 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298 }
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
    { name: "Valencia", lat: 39.4699, lng: -0.3763 }
  ],
  "Switzerland": [
    { name: "Zurich", lat: 47.3769, lng: 8.5417 },
    { name: "Geneva", lat: 46.2044, lng: 6.1432 },
    { name: "Bern", lat: 46.9480, lng: 7.4474 }
  ],
  "Canada": [
    { name: "Toronto", lat: 43.6532, lng: -79.3832 },
    { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
    { name: "Montreal", lat: 45.5017, lng: -73.5673 }
  ],
  "Australia": [
    { name: "Sydney", lat: -33.8688, lng: 151.2093 },
    { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
    { name: "Brisbane", lat: -27.4698, lng: 153.0251 }
  ],
  "Netherlands": [
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
    { name: "Rotterdam", lat: 51.9244, lng: 4.4777 },
    { name: "The Hague", lat: 52.0705, lng: 4.3007 }
  ],
  "Japan": [
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Osaka", lat: 34.6937, lng: 135.5023 },
    { name: "Kyoto", lat: 35.0116, lng: 135.7681 }
  ],
  "South Korea": [
    { name: "Seoul", lat: 37.5665, lng: 126.9780 },
    { name: "Busan", lat: 35.1796, lng: 129.0756 }
  ],
  "India": [
    { name: "New Delhi", lat: 28.6139, lng: 77.2090 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Bangalore", lat: 12.9716, lng: 77.5946 }
  ],
  // Fallback global list
  "Global": [
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "New York", lat: 40.7128, lng: -74.0060 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Sydney", lat: -33.8688, lng: 151.2093 }
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [unit, setUnit] = useState<Unit>('celsius');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string>("Locating...");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  
  // Extra data for Map
  const [majorCitiesWeather, setMajorCitiesWeather] = useState<any[]>([]);
  // Alerts
  const [alertsCount, setAlertsCount] = useState(0);

  // Local "Database" for the session
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);

  // Translation helper
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // Helper to remove accents AND SPACES for country matching to ensure Vietnam works
  const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase();

  // Initialize Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Reverse Geocoding to get City Name and Country
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.municipality || "Unknown Location";
            const country = data.address.country;
            
            updateLocation(lat, lng, city, country);
          } catch (error) {
            console.error("Reverse geocoding failed", error);
            updateLocation(lat, lng, "Current Location", "Global");
          }
        },
        (error) => {
          console.error("Error getting location", error);
          // Default to Paris
          updateLocation(48.8566, 2.3522, "Paris", "France");
        }
      );
    } else {
      updateLocation(48.8566, 2.3522, "Paris", "France");
    }
  }, []);

  const fetchMajorCitiesForCountry = async (countryName: string) => {
    console.log("Fetching cities for:", countryName);
    // Find cities for the country, or default to Global
    // Improved matching logic: normalize string (remove accents AND spaces)
    let targetCities = COUNTRY_MAJOR_CITIES["Global"];
    
    // Normalize input
    const normalizedInput = normalizeString(countryName);

    // Find key
    const key = Object.keys(COUNTRY_MAJOR_CITIES).find(k => {
        const normalizedKey = normalizeString(k);
        return normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput);
    });

    if (key) {
        targetCities = COUNTRY_MAJOR_CITIES[key];
    } else {
        console.warn("Country not found in DB, defaulting to Global:", countryName);
    }

    // Fetch weather for each city
    const promises = targetCities.map(async (city) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current_weather=true&timezone=auto`);
        const data = await res.json();
        return {
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          code: data.current_weather.weathercode,
          temp: data.current_weather.temperature,
          isDay: data.current_weather.is_day
        };
      } catch (e) {
        console.error("Failed to fetch major city weather", e);
        return null;
      }
    });

    const results = await Promise.all(promises);
    setMajorCitiesWeather(results.filter(r => r !== null));
  };

  const updateLocation = async (lat: number, lng: number, name?: string, country?: string) => {
    setLocation({ lat, lng });
    if (name) setCityName(name);
    setLoadingWeather(true);

    // 1. Fetch official weather for location
    try {
      // Added relativehumidity_2m to hourly fetch
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,weather_code,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
      const data = await res.json();
      
      // Transform Open-Meteo response to match App WeatherData type
      const mappedWeather: WeatherData = {
        current: {
          temperature: data.current_weather.temperature,
          weatherCode: data.current_weather.weathercode,
          windSpeed: data.current_weather.windspeed,
          isDay: data.current_weather.is_day,
          // Get current hour humidity approx
          relativeHumidity: data.hourly && data.hourly.relativehumidity_2m ? data.hourly.relativehumidity_2m[0] : 0
        },
        hourly: {
          time: data.hourly.time,
          temperature_2m: data.hourly.temperature_2m,
          weather_code: data.hourly.weather_code
        },
        daily: {
          temperature_2m_max: data.daily.temperature_2m_max,
          temperature_2m_min: data.daily.temperature_2m_min,
          sunrise: data.daily.sunrise,
          sunset: data.daily.sunset
        }
      };

      setWeather(mappedWeather);
      
      // Check for severe weather (WMO codes 95-99 for storm, wind > 80kmh)
      let alerts = 0;
      if (mappedWeather.current.weatherCode >= 95) alerts++;
      if (mappedWeather.current.windSpeed > 80) alerts++;
      setAlertsCount(alerts);

    } catch (error) {
      console.error("Failed to fetch weather", error);
    } finally {
      setLoadingWeather(false);
    }
    
    // 2. Fetch Major Cities for the country (Only if country is provided or changed)
    // We always try to fetch based on the country provided to ensure icons update
    if (country) {
        fetchMajorCitiesForCountry(country);
    } else {
        fetchMajorCitiesForCountry("Global");
    }
  };

  const addReport = (conditions: string[]) => {
    if (!location) return;
    const newReport: CommunityReport = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      conditions,
      lat: location.lat,
      lng: location.lng,
      userId: 'user-current',
      temp: weather?.current.temperature
    };
    setCommunityReports(prev => [...prev, newReport]);
  };

  const searchCity = async (query: string): Promise<SearchResult[]> => {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error("Search failed", error);
      return [];
    }
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      unit, setUnit,
      location, cityName, updateLocation,
      weather, loadingWeather,
      communityReports, addReport,
      searchCity,
      majorCitiesWeather,
      alertsCount,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};
