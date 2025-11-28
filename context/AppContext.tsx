import React, { createContext, useState, useEffect } from 'react';
import { Language, Unit, WeatherData } from '../types';
import { TRANSLATIONS } from '../constants';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  location: { lat: number; lng: number } | null;
  weather: WeatherData | null;
  loadingWeather: boolean;
  t: (key: string) => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [unit, setUnit] = useState<Unit>('celsius');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Translation helper
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    // Get Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location", error);
          // Default to Paris if location access denied
          setLocation({ lat: 48.8566, lng: 2.3522 });
        }
      );
    } else {
      // Default to Paris
      setLocation({ lat: 48.8566, lng: 2.3522 });
    }
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) return;

      setLoadingWeather(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,weather_code,wind_speed_10m,is_day,relative_humidity_2m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
        );
        const data = await response.json();

        const weatherData: WeatherData = {
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

        setWeather(weatherData);
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [location]);

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      unit,
      setUnit,
      location,
      weather,
      loadingWeather,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};