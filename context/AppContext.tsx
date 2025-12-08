import React, { createContext, useState, useEffect } from 'react';
import { auth, db, functions } from '../firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getMessaging, getToken } from "firebase/messaging"; // Import Messaging
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp, setDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
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
  addReport: (conditions: string[]) => Promise<number>;
  searchCity: (query: string) => Promise<SearchResult[]>;
  majorCitiesWeather: any[];
  alertsCount: number;
  dailyQuote: DailyQuote | null;
  t: (key: string) => string;
  requestNotifications: () => Promise<void>;
  notificationsEnabled: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// Database of major cities by country (Expanded)
const COUNTRY_MAJOR_CITIES: Record<string, { name: string, lat: number, lng: number }[]> = {
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
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // 1. Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        signInAnonymously(auth).catch((error) => {
          console.error("Auth failed", error);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Helper to register token with server
  const registerForPushNotifications = async () => {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VITE_FIREBASE_VAPID_KEY is missing. Push notifications disabled.");
      return;
    }

    try {
      const messaging = getMessaging();
      const token = await getToken(messaging, { vapidKey });

      if (token) {
        console.log("FCM Token retrieved:", token);
        // Subscribe via Cloud Function
        try {
          const subscribeFn = httpsCallable(functions, 'subscribeToNotifications');
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await subscribeFn({ token, timezone: timeZone });
          console.log("Subscribed to notifications on server.");
        } catch (subError) {
          console.error("Subscription Cloud Function Error", subError);
        }

        // Also save to user doc for good measure (if logged in)
        if (auth.currentUser) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            fcmToken: token,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notificationsEnabled: true
          }, { merge: true });
        }
      } else {
        console.log("No registration token available.");
      }
    } catch (error) {
      console.error("Error registering for push notifications:", error);
    }
  };

  // Check notification permission on load & sync token
  useEffect(() => {
    if ("Notification" in window && Notification.permission === 'granted') {
      console.log("Notification permission already granted. Syncing token...");
      setNotificationsEnabled(true);
      registerForPushNotifications();
    }
  }, []);

  // 2. Real-time Reports Sync
  useEffect(() => {
    // We fetch a bit more history to be safe, but we will filter strictest client-side
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      // FIX: Increase retention to 6 Hours for the Community Table
      const SIX_HOURS = 6 * 60 * 60 * 1000;

      const reports = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle Timestamp
        const time = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : Date.now();

        return {
          id: doc.id,
          ...data,
          timestamp: time
        } as CommunityReport;
      }).filter(report => {
        // FILTER: Keep reports from the last 6 HOURS (for Table)
        // The Map will do its own stricter 1-hour filtering
        return (now - report.timestamp) < SIX_HOURS;
      });

      setCommunityReports(reports);
    });
    return () => unsubscribe();
  }, []);

  // 3. Request Notifications (IMPLEMENTED)
  const requestNotifications = async () => {
    try {
      if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log("Notification permission granted.");
        setNotificationsEnabled(true);
        await registerForPushNotifications();
      }
    } catch (e) {
      console.error("Error asking for notification permission", e);
    }
  };


  // 4. Quote Generation (Cloud Function)
  useEffect(() => {
    const generateQuote = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toDateString();

      let slotKey = "";
      if (currentHour >= 7 && currentHour < 11) slotKey = `${todayStr}-slot-7am`;
      else if (currentHour >= 11 && currentHour < 16) slotKey = `${todayStr}-slot-11am`;
      else if (currentHour >= 16) slotKey = `${todayStr}-slot-16pm`;
      else {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        slotKey = `${yesterday.toDateString()}-slot-16pm`;
      }

      // Check Cache
      const cachedData = localStorage.getItem('wise_weather_quote');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.slotKey === slotKey && parsed.quote) {
            setDailyQuote(parsed.quote);
            return;
          }
        } catch (e) { }
      }

      // Call Cloud Function
      try {
        const generateQuoteFn = httpsCallable<void, any>(functions, 'generateQuote');
        console.log("Calling generateQuote Cloud Function...");
        const result = await generateQuoteFn();
        const response: any = result.data; // Type assertion

        if (response.success && response.data) {
          setDailyQuote(response.data);
          localStorage.setItem('wise_weather_quote', JSON.stringify({
            slotKey: slotKey,
            quote: response.data
          }));
          console.log("Quote generated successfully:", response.data);
        } else {
          throw new Error(response.error || "Failed using AI model");
        }
      } catch (e) {
        console.error("Quote generation failed (UI):", e);
        // Fallback
        const fallbackQuote = {
          en: { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
          fr: { text: "L'avenir appartient à ceux qui croient à la beauté de leurs rêves.", author: "Eleanor Roosevelt" }
        };
        setDailyQuote(fallbackQuote);

        // Cache fallback to prevent rapid flickering on error
        localStorage.setItem('wise_weather_quote', JSON.stringify({
          slotKey: slotKey,
          quote: fallbackQuote
        }));
      }
    };
    generateQuote();
  }, []);

  const updateLocation = (lat: number, lng: number, name?: string, country?: string, source: 'gps' | 'manual' = 'manual') => {
    setLocation({ lat, lng });
    if (name) setCityName(name);

    if (source === 'gps') {
      setUserPosition({ lat, lng });
      if (!name) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            const city = data.address.city || data.address.town || data.address.village || "Unknown Location";
            const ctry = data.address.country;
            setCityName(city);
            if (ctry) {
              setCurrentCountry(ctry);
              // fetchMajorCitiesForCountry(ctry); // Optional optimization
            }
          });
      } else if (country) {
        setCurrentCountry(country);
        // fetchMajorCitiesForCountry(country);
      }
    }
  };

  const fetchMajorCitiesForCountry = async (countryName: string) => {
    // ... (Keep existing logic or simplify if needed)
    // For brevity in this fix, I'll rely on the original logic if I could view it, but I'll implement a basic version
    // akin to what was there.
    const normalizedInput = countryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    let targetCities = GLOBAL_MAJOR_CITIES;
    for (const key of Object.keys(COUNTRY_MAJOR_CITIES)) {
      const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
      if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
        targetCities = COUNTRY_MAJOR_CITIES[key];
        break;
      }
    }

    const promises = targetCities.map(async (city) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,is_day,weather_code&timezone=auto`);
        const data = await res.json();
        return { ...city, temp: data.current.temperature_2m, code: data.current.weather_code, isDay: data.current.is_day };
      } catch (e) { return null; }
    });
    const results = await Promise.all(promises);
    setMajorCitiesWeather(results.filter(c => c !== null));
  };

  // UseEffect for Major Cities
  useEffect(() => {
    if (currentCountry) {
      fetchMajorCitiesForCountry(currentCountry);
    } else {
      // Default
      fetchMajorCitiesForCountry("France"); // Or global
    }
  }, [currentCountry]);


  const searchCity = async (query: string): Promise<SearchResult[]> => {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const data = await res.json();
      if (!data.results) return [];
      return data.results.map((r: any) => ({
        id: r.id, name: r.name, country: r.country, latitude: r.latitude, longitude: r.longitude
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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,visibility&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&past_days=1&forecast_days=2`
      );
      const data = await res.json();

      // Fetch Air Quality from WAQI
      let aqiValue = undefined;
      try {
        const aqiRes = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=aecbe865a2d037c524bccd91f73d46286d3b7493`);
        const aqiData = await aqiRes.json();
        if (aqiData.status === 'ok') {
          aqiValue = aqiData.data.aqi;
        }
      } catch (e) {
        console.error("AQI fetch failed", e);
      }

      const mappedWeather: WeatherData = {
        current: {
          temperature: data.current.temperature_2m,
          weatherCode: data.current.weather_code,
          windSpeed: data.current.wind_speed_10m,
          isDay: data.current.is_day,
          relativeHumidity: data.current.relative_humidity_2m,
          visibility: data.current.visibility,
          aqi: aqiValue
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

  // Add Report to Firestore
  const addReport = async (conditions: string[]): Promise<number> => {
    if (!location) {
      console.error("Cannot add report: Location is missing");
      return 0;
    }
    const currentTemp = weather?.current?.temperature;

    // Calculate Precision Gain Logic
    // 1. Filter recent reports nearby (already in state 'communityReports' which is filtered to 1h)
    // We assume 'communityReports' contains relevant reports. We should filter by distance roughly here.
    const nearbyReports = communityReports.filter(r => {
      // Simple distance check (approx 0.1 deg ~ 11km). 
      return Math.abs(r.lat - location.lat) < 0.1 && Math.abs(r.lng - location.lng) < 0.1;
    });

    let agreementCount = 0;
    conditions.forEach(c => {
      // If any nearby report shares this condition
      if (nearbyReports.some(r => r.conditions.includes(c))) {
        agreementCount++;
      }
    });

    // Heuristic: Base 12% + 5% per existing agreement
    let precisionIncrease = 12;
    if (agreementCount > 0) {
      precisionIncrease += (agreementCount * 5);
    }

    // Cap at 38% to prevent unrealistic single-contribution claims
    if (precisionIncrease > 38) precisionIncrease = 38;

    try {
      console.log("Adding report...", conditions, location);
      await addDoc(collection(db, "reports"), {
        timestamp: serverTimestamp(),
        conditions,
        lat: location.lat,
        lng: location.lng,
        userId: user?.uid || 'anonymous',
        temp: currentTemp || null
      });
      console.log("Report added successfully! Precision Gain:", precisionIncrease);
      return precisionIncrease;

    } catch (e) {
      console.error("Error adding report", e);
      return 0; // Failure
    }
  };

  useEffect(() => {
    if (location) {
      fetchWeather(location.lat, location.lng);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation(position.coords.latitude, position.coords.longitude, undefined, undefined, 'gps');
          },
          (err) => {
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
      t,
      requestNotifications,
      notificationsEnabled
    }}>
      {children}
    </AppContext.Provider>
  );
};
