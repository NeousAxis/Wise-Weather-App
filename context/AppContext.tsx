
import React, { createContext, useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Unit, WeatherData, CommunityReport, SearchResult, DailyQuote } from '../types';
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
  dailyQuote: DailyQuote | null;
  t: (key: string) => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    { name: "Chiang Mai", lat: 18.7883, lng: 98.9853 },
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
  "USA": [
      { name: "New York", lat: 40.7128, lng: -74.0060 },
      { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
      { name: "Chicago", lat: 41.8781, lng: -87.6298 }
  ]
};

const GLOBAL_MAJOR_CITIES = [
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "New York", lat: 40.7128, lng: -74.0060 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 }
];

export const AppProvider = ({ children }: { children?: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [unit, setUnit] = useState<Unit>('celsius');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState('Current Location');
  const [currentCountry, setCurrentCountry] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [majorCitiesWeather, setMajorCitiesWeather] = useState<any[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // --- Quote Generation ---
  useEffect(() => {
    const generateQuote = async () => {
      try {
        const hour = new Date().getHours();
        let theme = "";
        
        if (hour >= 5 && hour < 12) {
          theme = "Wisdom & Presence (introspection, silence, trust, attention, peace). Authors: Lao Tzu, Buddha, Epictetus, Seneca, Marcus Aurelius, Eckhart Tolle, Jiddu Krishnamurti, Thich Nhat Hanh, Alan Watts, Rumi, Khalil Gibran, Sri Nisargadatta Maharaj, Ramana Maharshi.";
        } else if (hour >= 12 && hour < 18) {
          theme = "Creation, Courage & Transformation (action, dreaming, evolving, rising up). Authors: Nietzsche, Emerson, Thoreau, Walt Whitman, Carl Jung, Joseph Campbell, Anaïs Nin, Virginia Woolf, Albert Camus, Jean-Paul Sartre, Saint-Exupéry, Maya Angelou.";
        } else {
          theme = "Mysticism, Love & Transcendence (spirit, unity, light, mystery). Authors: Meister Eckhart, Teresa of Avila, Rumi, Hildegard of Bingen, Ibn Arabi, Simone Weil, Teilhard de Chardin, Sri Aurobindo, Osho, Thomas Merton.";
        }

        const prompt = `Generate a short, inspiring quote based on the theme: "${theme}". 
        Return ONLY a JSON object with "text" and "author" keys. Do not use Markdown. 
        Language: ${language === 'fr' ? 'French' : 'English'}.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
             responseMimeType: 'application/json',
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  author: { type: Type.STRING }
                }
             }
          }
        });
        
        const data = JSON.parse(response.text);
        setDailyQuote(data);
      } catch (e) {
        console.error("Failed to generate quote", e);
        setDailyQuote({
           text: "The future belongs to those who believe in the beauty of their dreams.",
           author: "Eleanor Roosevelt"
        });
      }
    };
    generateQuote();
  }, [language]);

  const updateLocation = (lat: number, lng: number, name?: string, country?: string, source: 'gps' | 'manual' = 'manual') => {
    setLocation({ lat, lng });
    if (name) setCityName(name);
    
    if (source === 'gps') {
       setUserPosition({ lat, lng });
       // Reverse geocode if name not provided
       if (!name) {
         fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            const city = data.address.city || data.address.town || data.address.village || "Unknown Location";
            const ctry = data.address.country;
            setCityName(city);
            if (ctry) {
                setCurrentCountry(ctry);
                fetchMajorCitiesForCountry(ctry);
            }
          });
       } else if (country) {
           setCurrentCountry(country);
           fetchMajorCitiesForCountry(country);
       }
    }
  };

  const fetchMajorCitiesForCountry = async (countryName: string) => {
    // Normalize country name (remove accents, lowercase, remove spaces) to handle "Việt Nam" vs "Vietnam"
    const normalizedInput = countryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    
    let targetCities = GLOBAL_MAJOR_CITIES; // Default fallback

    // Find match in database
    for (const key of Object.keys(COUNTRY_MAJOR_CITIES)) {
        const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
            targetCities = COUNTRY_MAJOR_CITIES[key];
            break;
        }
    }

    const promises = targetCities.map(async (city) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,is_day,weather_code&timezone=auto`
        );
        const data = await res.json();
        return {
          ...city,
          temp: data.current.temperature_2m,
          code: data.current.weather_code,
          isDay: data.current.is_day
        };
      } catch (e) {
        return null;
      }
    });

    const results = await Promise.all(promises);
    setMajorCitiesWeather(results.filter(c => c !== null));
  };

  const searchCity = async (query: string): Promise<SearchResult[]> => {
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

  const fetchWeather = async (lat: number, lng: number) => {
    setLoadingWeather(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&past_days=1&forecast_days=2`
      );
      const data = await res.json();
      
      // Transform snake_case API response to camelCase structure expected by WeatherData type
      const mappedWeather: WeatherData = {
          current: {
              temperature: data.current.temperature_2m,
              weatherCode: data.current.weather_code,
              windSpeed: data.current.wind_speed_10m,
              isDay: data.current.is_day,
              relativeHumidity: data.current.relative_humidity_2m
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

      // Check for Severe Weather (Storm codes 95, 96, 99 or high wind > 80kmh)
      if (data.current.weather_code >= 95 || data.current.wind_speed_10m > 80) {
          setAlertsCount(prev => prev + 1);
      } else {
          setAlertsCount(0);
      }

    } catch (error) {
      console.error("Weather fetch failed", error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const addReport = (conditions: string[]) => {
    if (!location) return;
    // Capture current temp if available
    const currentTemp = weather?.current?.temperature;

    const newReport: CommunityReport = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      conditions,
      lat: location.lat,
      lng: location.lng,
      userId: 'user-me', // In real app, auth user id
      temp: currentTemp
    };
    setCommunityReports(prev => [newReport, ...prev]);
  };

  useEffect(() => {
    if (location) {
      fetchWeather(location.lat, location.lng);
    } else {
      // Init with Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation(position.coords.latitude, position.coords.longitude, undefined, undefined, 'gps');
          },
          (err) => {
            // Default to Paris
            updateLocation(48.8566, 2.3522, "Paris", "France", 'manual');
          }
        );
      }
    }
  }, [location]);

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      unit, setUnit,
      location, userPosition, cityName, updateLocation,
      weather, loadingWeather,
      communityReports, addReport,
      searchCity,
      majorCitiesWeather,
      alertsCount,
      dailyQuote,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};
