import React, { useState, useEffect, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {
  Sun, Cloud, CloudRain, Wind, Droplets, ArrowUp, ArrowDown,
  Map as MapIcon, Menu, X, Heart, Thermometer,
  CloudLightning, Snowflake, Navigation, Check, Bug, Wand2,
  Search, MapPin, User, Sunrise, Sunset, Plus, CloudSun, MessageSquare, Layers, Crosshair, CloudFog, Moon, Bell, Eye, Lock, Crown, ChevronUp, ChevronDown, Settings,
  BarChart2, Activity
} from 'lucide-react';
import { AppProvider, AppContext } from './context/AppContext';
import { TRANSLATIONS } from './constants';
import { WeatherData, CommunityReport, ConfidenceLevel, SearchResult, UserTier } from './types';

// --- Helpers ---

const convertTemp = (temp: number, unit: 'celsius' | 'fahrenheit') => {
  if (unit === 'fahrenheit') {
    return Math.round(temp * 1.8 + 32);
  }
  return Math.round(temp);
};

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, size = 'md' }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  // Updated Radiant Gradient Loop: Amber -> Orange -> Rose -> Blue -> Amber
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 focus:ring-blue-500 shadow-md hover:shadow-lg",
    secondary: "bg-white text-foreground border border-gray-200 hover:bg-gray-50 focus:ring-gray-200",
    ghost: "hover:bg-gray-100 text-gray-700",
    radiant: "text-white font-bold bg-[linear-gradient(0deg,#FCAF45,#FF0080,#FF8C00,#FD1D1D,#FCAF45)] animate-radiant bg-[length:100%_200%] hover:opacity-90 shadow-lg",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-md"
  };
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
    xl: "h-16 px-8 text-xl",
    icon: "h-10 w-10"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ label, level }: { label: string, level: ConfidenceLevel }) => {
  const colors = {
    [ConfidenceLevel.HIGH]: "bg-green-100 text-green-700 border-green-200",
    [ConfidenceLevel.MEDIUM]: "bg-yellow-100 text-yellow-700 border-yellow-200",
    [ConfidenceLevel.LOW]: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colors[level]}`}>
      {label}
    </span>
  );
};

const getWeatherIcon = (code: number, size = 24, className = "", isDay = 1) => {
  // If it's night (isDay === 0)
  if (isDay === 0) {
    // Clear (0), Mainly Clear (1), Partly Cloudy (2) -> Moon
    if (code >= 0 && code <= 2) {
      return <Moon size={size} className={`text-blue-200 ${className}`} />;
    }
  }

  // Detailed mapping for WMO codes
  if (code === 0) return <Sun size={size} className={`text-yellow-500 ${className}`} />;
  if (code >= 1 && code <= 3) return <Cloud size={size} className={`text-gray-400 ${className}`} />;
  if (code === 45 || code === 48) return <CloudFog size={size} className={`text-gray-400 ${className}`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return <Snowflake size={size} className={`text-cyan-400 ${className}`} />;
  if (code >= 95) return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;

  // Result: Sun for Day, Moon for Night (Fallback)
  if (isDay === 0) {
    return <Moon size={size} className={`text-blue-200 ${className}`} />;
  }
  return <Sun size={size} className={`text-yellow-500 ${className}`} />;
};



const getWeatherIconFromLabel = (label: string, size = 24, className = "") => {
  switch (label) {
    case 'Sunny': return <Sun size={size} className={`text-yellow-500 ${className}`} />;
    case 'Cloudy': return <Cloud size={size} className={`text-gray-400 ${className}`} />;
    case 'Rain': return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
    case 'Windy': return <Wind size={size} className={`text-blue-400 ${className}`} />;
    case 'Snow': return <Snowflake size={size} className={`text-cyan-400 ${className}`} />;
    case 'Storm': return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
    case 'Fog': return <CloudFog size={size} className={`text-gray-400 ${className}`} />;
    case 'Hail': return <CloudRain size={size} className={`text-indigo-400 ${className}`} />;
    default: return <Cloud size={size} className={`text-gray-400 ${className}`} />;
  }
};

// --- Reusable Components ---

const PremiumValue = ({ isLocked, children }: { isLocked: boolean, children: React.ReactNode }) => {
  const { setShowPremium } = useContext(AppContext)!;

  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative group cursor-pointer w-full" onClick={() => setShowPremium(true)}>
      <div className="blur-[4px] select-none pointer-events-none opacity-50 transition-all duration-300">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 transition-transform duration-300 group-hover:scale-105">
        <div className="bg-white/90 p-1.5 rounded-full shadow-sm mb-0.5 group-hover:bg-yellow-100 transition-colors">
          <Lock size={12} className="text-gray-600 group-hover:text-yellow-600 transition-colors" />
        </div>
        <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider group-hover:text-yellow-600 transition-colors">Premium</span>
      </div>
    </div>
  );
};

// --- Features ---

const QuoteBlock = () => {
  const { dailyQuote, language } = useContext(AppContext)!;

  if (!dailyQuote) {
    return (
      <Card className="mx-4 mt-4 mb-6 p-6 bg-gradient-to-br from-white to-blue-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </Card>
    )
  }

  const quoteData = dailyQuote[language];
  // Safety check: if quoteData is undefined (malformed response), fallback to defaults
  const text = quoteData?.text || (language === 'fr' ? "L'avenir appartient à ceux qui croient à la beauté de leurs rêves." : "The future belongs to those who believe in the beauty of their dreams.");
  const author = quoteData?.author || "Eleanor Roosevelt";

  // Debug Alert removed for production seamlessness
  // React.useEffect(() => {
  //   if ((dailyQuote as any).error_debug) {
  //      console.warn("Quote generation fallback active:", (dailyQuote as any).error_debug);
  //   }
  // }, [dailyQuote]);

  return (
    <Card className="mx-4 mt-4 mb-6 p-6 bg-gradient-to-br from-white to-blue-50">
      <div className="flex flex-col gap-3">
        <p className="text-lg italic text-gray-700 leading-relaxed">
          "{text}"
        </p>
        <p className="text-sm font-semibold text-primary self-end">
          — {author}
        </p>
      </div>
    </Card>
  );
};

const WeatherDashboard = () => {
  const { weather, loadingWeather, unit, t, cityName, language, userTier, setShowPremium } = useContext(AppContext)!;
  const [showAirDetails, setShowAirDetails] = useState(false);
  const [activeGraph, setActiveGraph] = useState<'uv' | 'aqi' | 'pollen' | null>(null);

  // Helper for 24h Data (for Expert Graph)
  const getTodayData = (key: 'uv_index' | 'european_aqi') => {
    if (weather && weather.hourly && weather.hourly[key]) {
      return weather.hourly[key].slice(0, 24);
    }
    return Array(24).fill(0);
  };

  if (loadingWeather || !weather) {
    return (
      <Card className="mx-4 mb-6 p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded w-full mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  // Helper to format time (Sunrise/Sunset)
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    if (language === 'fr') {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  // Format hourly time (Forecast Headers) - Manual to ensure consistency
  const formatHour = (isoString: string) => {
    const d = new Date(isoString);
    const hours = d.getHours();

    if (language === 'fr') {
      return `${hours} h`;
    } else {
      const h = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${h} ${ampm}`;
    }
  };

  const currentHourIndex = weather.hourly.time.findIndex(t => {
    const d = new Date(t);
    const now = new Date();
    // Simple current hour match
    return d.getHours() === now.getHours() && d.getDate() === now.getDate();
  });

  // Fallback if not found (timezone issues), take last available or middle
  const safeIndex = currentHourIndex !== -1 ? currentHourIndex : Math.floor(weather.hourly.time.length / 2);

  // Calculate critical times to display
  const sunriseTime = new Date(weather.daily.sunrise[0]);
  const sunsetTime = new Date(weather.daily.sunset[0]);
  const nowDate = new Date();

  // Build smart hourly forecast that includes sunrise and sunset
  const criticalTimes: Array<{ time: string, temp: number, code: number, label?: string, icon?: any }> = [];

  // Find sunrise index
  const sunriseIndex = weather.hourly.time.findIndex(t => {
    const d = new Date(t);
    return d.getTime() >= sunriseTime.getTime();
  });

  // Find sunset index
  const sunsetIndex = weather.hourly.time.findIndex(t => {
    const d = new Date(t);
    return d.getTime() >= sunsetTime.getTime();
  });

  // Add sunrise if it's today and in the future or recent
  if (sunriseIndex !== -1 && sunriseTime.getTime() > nowDate.getTime() - (2 * 60 * 60 * 1000)) {
    criticalTimes.push({
      time: weather.daily.sunrise[0],
      temp: weather.hourly.temperature_2m[sunriseIndex],
      code: weather.hourly.weather_code[sunriseIndex],
      label: 'sunrise',
      icon: <Sunrise size={24} className="text-yellow-500" />
    });
  }

  // Add next hourly slots (4 for Free, 24 for Premium)
  const hourlyLimit = (userTier === UserTier.FREE) ? 4 : 24;
  if (safeIndex !== -1) {
    for (let i = 0; i < hourlyLimit; i++) {
      const idx = safeIndex + i + 1;
      if (idx < weather.hourly.time.length) {
        const timeVal = weather.hourly.time[idx];
        // Skip if too close to sunrise or sunset (within 1 hour)
        const timeMs = new Date(timeVal).getTime();
        if (Math.abs(timeMs - sunriseTime.getTime()) > 60 * 60 * 1000 &&
          Math.abs(timeMs - sunsetTime.getTime()) > 60 * 60 * 1000) {
          criticalTimes.push({
            time: timeVal,
            temp: weather.hourly.temperature_2m[idx],
            code: weather.hourly.weather_code[idx]
          });
        }
      }
    }
  }

  // Add sunset if it's today and in the future
  if (sunsetIndex !== -1 && sunsetTime.getTime() > nowDate.getTime()) {
    criticalTimes.push({
      time: weather.daily.sunset[0],
      temp: weather.hourly.temperature_2m[sunsetIndex],
      code: weather.hourly.weather_code[sunsetIndex],
      label: 'sunset',
      icon: <Moon size={24} className="text-blue-300" />
    });
  }

  // Sort by time
  criticalTimes.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Take appropriate number of slots
  const displayLimit = (userTier === UserTier.FREE) ? 6 : 24;
  const displayTimes = criticalTimes.slice(0, displayLimit);

  // Use API's isDay calculation - it correctly handles sunrise/sunset and timezones
  const isDayNow = weather.current.isDay;

  const maxTemp = convertTemp(weather.daily.temperature_2m_max[0], unit);
  const minTemp = convertTemp(weather.daily.temperature_2m_min[0], unit);
  const currentTemp = convertTemp(weather.current.temperature, unit);


  return (
    <Card className="mx-4 mb-6 p-6">
      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {cityName.includes('(') ? (
            <>
              <h2 className="text-3xl font-bold text-foreground tracking-tight leading-tight">
                {cityName.split('(')[0].trim()}
              </h2>
              <p className="text-lg text-gray-400 font-medium mt-0.5">
                {cityName.split('(')[1].replace(')', '').trim()}
              </p>
            </>
          ) : (
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{cityName}</h2>
          )}
          <p className="text-gray-500 font-medium mt-1 text-sm">{t('weather.official_forecast')}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-3">
            {(() => {
              // SYNC STRATEGY: Use Hourly Forecast code for local icon
              // This ensures the local icon always matches current hour data
              const hourlyCode = weather.hourly.weather_code[safeIndex];
              let displayCode = hourlyCode;

              // PRECIPITATION OVERRIDE LOGIC
              // If real-time precipitation is detected but hourly shows clear/cloudy,
              // override to show rain/snow icon
              const precip = weather.current.precipitation || 0;
              const temp = weather.current.temperature;

              if (precip >= 0.1 && displayCode < 50) {
                // It is precipitating but hourly says clear/cloudy. Force precipitation icon.
                if (temp <= 1) displayCode = 71; // Force Snow
                else displayCode = 61; // Force Rain
              }

              return getWeatherIcon(displayCode, 48, "", isDayNow);
            })()}
            <span className="text-6xl font-bold text-foreground tracking-tighter">
              {currentTemp}°
            </span>
          </div>
          <p className="text-gray-500 font-medium mt-1">
            H: {maxTemp}°  L: {minTemp}°
          </p>
          {userTier === UserTier.ULTIMATE && weather.yesterday && weather.yesterday.details && (
            <div className="mt-3 bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-purple-100 shadow-sm animate-in fade-in slide-in-from-top-1 mx-4">
              <div className="flex items-center justify-between gap-1">
                <div className="text-[9px] font-bold text-purple-600 uppercase tracking-widest leading-none transform rotate-180 py-1" style={{ writingMode: 'vertical-rl' }}>
                  {language === 'fr' ? 'HIER' : 'YEST'}
                </div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-[9px] text-gray-400 font-medium mb-0.5">{language === 'fr' ? 'Matin' : 'AM'}</span>
                  <div className="opacity-90 scale-75 -my-1">{getWeatherIcon(weather.yesterday.details.morning.code, 24)}</div>
                  <span className="text-xs font-bold text-gray-700">{convertTemp(weather.yesterday.details.morning.temp, unit)}°</span>
                </div>

                <div className="w-px h-8 bg-gray-100"></div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-[9px] text-gray-400 font-medium mb-0.5">{language === 'fr' ? 'Midi' : 'Noon'}</span>
                  <div className="opacity-90 scale-75 -my-1">{getWeatherIcon(weather.yesterday.details.noon.code, 24)}</div>
                  <span className="text-xs font-bold text-gray-700">{convertTemp(weather.yesterday.details.noon.temp, unit)}°</span>
                </div>

                <div className="w-px h-8 bg-gray-100"></div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-[9px] text-gray-400 font-medium mb-0.5">{language === 'fr' ? 'Soir' : 'PM'}</span>
                  <div className="opacity-90 scale-75 -my-1">{getWeatherIcon(weather.yesterday.details.evening.code, 24)}</div>
                  <span className="text-xs font-bold text-gray-700">{convertTemp(weather.yesterday.details.evening.temp, unit)}°</span>
                </div>
              </div>
            </div>
          )}
          <p className="hidden">
            {(() => {
              const p = weather.current.precipitation || 0;
              const c = weather.current.weatherCode;
              const isSnow = (c >= 71 && c <= 77) || c === 85 || c === 86;
              const isWet = (c >= 51 && c <= 67) || (c >= 80 && c <= 86) || (c >= 95);

              // Case: Rain/Snow icon but 0mm (Inconsistency)
              if (p < 0.1 && (isWet || isSnow)) {
                return isSnow
                  ? (language === 'fr' ? "(Neige faible)" : "(Light snow)")
                  : (language === 'fr' ? "(Pluie faible)" : "(Light rain)");
              }
              // Case: Cloud icon but Precip detected (Force Rain logic handles icon, text clarifies)
              if (p >= 0.1 && c < 50) {
                return language === 'fr' ? "(Pluie légère)" : "(Light rain)";
              }

              // Default: Show measurable precip (or 0mm if dry)
              return `(Precip: ${p}mm)`;
            })()}
          </p>
        </div>
      </div >

      {/* Stats Grid - Unified Layout */}
      <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8">
        {/* Sunrise */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-full text-yellow-600">
            <Sunrise size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{t('weather.sunrise')}</p>
            <p className="font-semibold text-gray-700">{formatTime(weather.daily.sunrise[0])}</p>
          </div>
        </div>

        {/* Sunset */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-full text-orange-600">
            <Sunset size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{t('weather.sunset')}</p>
            <p className="font-semibold text-gray-700">{formatTime(weather.daily.sunset[0])}</p>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-full text-blue-600">
            <Wind size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{t('weather.wind')}</p>
            <p className="font-semibold text-gray-700">{weather.current.windSpeed} km/h</p>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 rounded-full text-cyan-600">
            <Droplets size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{t('weather.humidity')}</p>
            <p className="font-semibold text-gray-700">{weather.current.relativeHumidity}%</p>
          </div>
        </div>

        {/* Visibility */}
        {weather.current.visibility !== undefined && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{t('weather.visibility')}</p>
              <p className="font-semibold text-gray-700">{(weather.current.visibility / 1000).toFixed(1)} km</p>
            </div>
          </div>
        )}

        {/* UV Index - Clickable for Ultimate (Unified Style with Pulse) */}
        {weather.current.uvIndex !== undefined && (
          <div
            className={`flex items-center gap-3 transition-all rounded-xl p-2 -m-2 ${userTier === UserTier.ULTIMATE ? 'cursor-pointer hover:bg-orange-50/50 active:scale-95' : ''}`}
            onClick={() => userTier === UserTier.ULTIMATE && setActiveGraph('uv')}
          >
            <div className="p-2 bg-orange-50 rounded-full text-orange-600 relative">
              {(weather.current.uvIndex || 0) > 5 && (
                <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${(weather.current.uvIndex || 0) > 7 ? 'bg-red-400' : 'bg-orange-400'}`}></span>
              )}
              <Sun size={20} className="relative z-10" />
              {userTier === UserTier.ULTIMATE && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-orange-100 z-20"><BarChart2 size={8} className="text-orange-400" /></div>}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{language === 'fr' ? 'Index UV' : 'UV Index'}</p>
              <PremiumValue isLocked={userTier === UserTier.FREE}>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-gray-700">{weather.current.uvIndex?.toFixed(0)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">/ 11</span>
                </div>
              </PremiumValue>
            </div>
          </div>
        )}

        {/* Air Quality - Clickable for Ultimate (Unified Style with Pulse) */}
        {(weather.current.aqi !== undefined) && (
          <div
            className={`flex items-center gap-3 transition-all rounded-xl p-2 -m-2 ${userTier === UserTier.ULTIMATE ? 'cursor-pointer hover:bg-blue-50/50 active:scale-95' : ''}`}
            onClick={() => userTier === UserTier.ULTIMATE && setActiveGraph('aqi')}
          >
            <div className={`p-2 rounded-full relative ${weather.current.aqi <= 50 ? 'bg-green-50 text-green-600' :
              weather.current.aqi <= 100 ? 'bg-yellow-50 text-yellow-600' :
                weather.current.aqi <= 150 ? 'bg-orange-50 text-orange-600' :
                  'bg-red-50 text-red-600'
              }`}>
              {(weather.current.aqi || 0) > 50 && (
                <span className={`absolute inset-0 rounded-full animate-ping opacity-75 
                  ${(weather.current.aqi || 0) > 150 ? 'bg-red-500' :
                    (weather.current.aqi || 0) > 100 ? 'bg-orange-500' : 'bg-yellow-400'
                  }`}>
                </span>
              )}
              <Activity size={20} className="relative z-10" />
              {userTier === UserTier.ULTIMATE && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-blue-100 z-20"><BarChart2 size={8} className="text-blue-400" /></div>}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{language === 'fr' ? 'Qualité Air' : 'Air Quality'}</p>
              <PremiumValue isLocked={userTier === UserTier.FREE}>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-gray-700">{weather.current.aqi?.toFixed(0)}</span>
                  <span className="text-[10px] text-gray-400 font-medium">/ 500</span>
                </div>
              </PremiumValue>
            </div>
          </div>
        )}

        {/* Pollen - Unified Style with Dominant Type */}
        {weather.current.pollen && (
          <div
            className={`flex items-center gap-3 transition-all rounded-xl p-2 -m-2 ${userTier === UserTier.ULTIMATE ? 'cursor-pointer hover:bg-green-50/50 active:scale-95' : ''}`}
            onClick={() => userTier === UserTier.ULTIMATE && setActiveGraph('pollen')}
          >
            {(() => {
              const isFr = language === 'fr';
              const pollens = [
                { val: weather.current.pollen.alder || 0, label: isFr ? 'Aulne' : 'Alder' },
                { val: weather.current.pollen.birch || 0, label: isFr ? 'Bouleau' : 'Birch' },
                { val: weather.current.pollen.grass || 0, label: isFr ? 'Graminées' : 'Grass' },
                { val: weather.current.pollen.ragweed || 0, label: isFr ? 'Ambroisie' : 'Ragweed' },
                { val: weather.current.pollen.olive || 0, label: isFr ? 'Olivier' : 'Olive' },
                { val: weather.current.pollen.mugwort || 0, label: isFr ? 'Armoise' : 'Mugwort' }
              ];
              // Find dominant pollen
              const dominant = pollens.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), pollens[0]);
              const maxPollen = dominant.val;
              const isHigh = maxPollen > 50;

              // Risk Label
              let riskLabel = '';
              if (maxPollen <= 20) riskLabel = isFr ? 'Faible' : 'Low';
              else if (maxPollen <= 50) riskLabel = isFr ? 'Modéré' : 'Moderate';
              else if (maxPollen <= 100) riskLabel = isFr ? 'Élevé' : 'High';
              else riskLabel = isFr ? 'Extrême' : 'Extreme';

              return (
                <>
                  <div className={`p-2 rounded-full relative ${isHigh ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {isHigh && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-red-400"></span>
                    )}
                    <Wind size={20} className="relative z-10" />
                    {userTier === UserTier.ULTIMATE && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-green-100 z-20"><BarChart2 size={8} className="text-green-600" /></div>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Pollen</p>
                    <PremiumValue isLocked={userTier === UserTier.FREE}>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-semibold text-gray-700">{maxPollen.toFixed(0)}</span>
                          <span className="text-[10px] text-gray-400 font-medium">/ 100</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5 truncate w-24">
                          {maxPollen > 10 ? (
                            <span className="text-blue-600">{dominant.label}</span>
                          ) : (
                            riskLabel
                          )}
                        </p>
                      </div>
                    </PremiumValue>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Expert Graph Modal */}
      {activeGraph && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveGraph(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {activeGraph === 'uv' ? (language === 'fr' ? 'Index UV (24h)' : 'UV Index (24h)') :
                    activeGraph === 'aqi' ? (language === 'fr' ? 'Pollution (AQI)' : 'Air Quality (AQI)') :
                      (language === 'fr' ? 'Détails Pollens' : 'Pollen Details')}
                </h3>
                <p className="text-xs text-gray-500">
                  {activeGraph === 'pollen'
                    ? (language === 'fr' ? 'Niveaux actuels par type' : 'Current levels by type')
                    : (language === 'fr' ? 'Evolution sur la journée' : 'Forecast for today')}
                </p>
              </div>
              <button onClick={() => setActiveGraph(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            {/* Graph or List Render */}
            {activeGraph === 'pollen' ? (
              <div className="space-y-4 py-2">
                {[
                  { key: 'alder', label: language === 'fr' ? 'Aulne' : 'Alder', color: 'bg-amber-400' },
                  { key: 'birch', label: language === 'fr' ? 'Bouleau' : 'Birch', color: 'bg-yellow-400' },
                  { key: 'grass', label: language === 'fr' ? 'Graminées' : 'Grass', color: 'bg-green-500' },
                  { key: 'ragweed', label: language === 'fr' ? 'Ambroisie' : 'Ragweed', color: 'bg-emerald-600' },
                  { key: 'olive', label: language === 'fr' ? 'Olivier' : 'Olive', color: 'bg-lime-500' },
                  { key: 'mugwort', label: language === 'fr' ? 'Armoise' : 'Mugwort', color: 'bg-teal-500' },
                ].map(item => {
                  // @ts-ignore
                  const val = weather.current.pollen ? (weather.current.pollen[item.key] || 0) : 0;
                  const percent = Math.min(val, 100);
                  return (
                    <div key={item.key}>
                      <div className="flex justify-between text-sm mb-1 font-medium text-gray-700">
                        <span>{item.label}</span>
                        <span>{val} <span className="text-xs text-gray-400 font-normal">/ 100</span></span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${val > 50 ? 'bg-red-500' : item.color}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-end gap-1 mb-2">
                {(() => {
                  const rawData = getTodayData(activeGraph === 'uv' ? 'uv_index' : 'european_aqi');
                  const data = rawData.length > 0 ? rawData : Array(24).fill(0);
                  const max = Math.max(...data, 10); // Min max to avoid huge bars for small values

                  return data.map((val, i) => (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] px-1 rounded pointer-events-none whitespace-nowrap z-10">
                        {i}h: {val.toFixed(0)}
                      </div>
                      <div
                        className={`w-full rounded-t-sm transition-all ${activeGraph === 'uv' ? 'bg-orange-400' : 'bg-blue-400'}`}
                        style={{ height: `${(val / max) * 100}%`, minHeight: '4px' }}
                      ></div>
                    </div>
                  ));
                })()}
              </div>
            )}
            {/* X Axis */}
            <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
              <span>00h</span>
              <span>06h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
          </div>
        </div>
      )}


      {/* Hourly Forecast */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('weather.hourly')}</h3>
          {/* Small Badge for Tier Debug/Info */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${userTier === UserTier.FREE ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
            {userTier === UserTier.FREE ? 'BASIC' : userTier}
          </span>
        </div>

        <div className="flex overflow-x-auto gap-8 pb-2 scrollbar-hide">
          {(() => {
            // Logic: Standard/Ultimate get 24h, Free gets 3h
            const isPremium = userTier === UserTier.STANDARD || userTier === UserTier.ULTIMATE;
            const limit = isPremium ? 24 : 3;
            const visibleItems = displayTimes.slice(0, limit);

            return (
              <>
                {visibleItems.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[3rem]">
                    <span className="text-sm font-medium text-gray-500">
                      {item.label === 'sunrise' ? (language === 'fr' ? 'Lever' : 'Rise') :
                        item.label === 'sunset' ? (language === 'fr' ? 'Coucher' : 'Set') :
                          formatHour(item.time)}
                    </span>
                    <div className="my-1">
                      {item.icon || getWeatherIcon(item.code, 24)}
                    </div>
                    <span className="text-lg font-bold text-foreground">{convertTemp(item.temp, unit)}°</span>
                  </div>
                ))}

                {/* Lock Teaser - Explicitly show if not premium */}
                {!isPremium && (
                  <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0 min-w-[3rem] opacity-60 cursor-pointer group" onClick={() => setShowPremium(true)}>
                    <span className="text-sm font-medium text-gray-400">...</span>
                    <div className="my-1 bg-gray-100 p-2 rounded-full group-hover:bg-yellow-100 transition-colors animate-pulse">
                      <Lock size={16} className="text-gray-500 group-hover:text-yellow-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 group-hover:text-yellow-600">+20h</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </Card>
  );
};

const CommunityCarousel = () => {
  const { t, weather, communityReports, unit, language, location } = useContext(AppContext)!;

  if (!weather) return null;

  // Find current hour index
  const currentHourIndex = weather.hourly.time.findIndex(time => {
    const d = new Date(time);
    const now = new Date();
    return d.getHours() === now.getHours() && d.getDate() === now.getDate();
  });

  if (currentHourIndex === -1) return null;

  // We want past 6 hours including current
  const pastIndices = Array.from({ length: 6 }, (_, i) => currentHourIndex - i).filter(i => i >= 0);

  return (
    <div className="mx-4 mb-24">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <User size={20} className="text-primary" />
        {t('community.title')}
      </h3>
      {/* Recent on Left */}
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
        {pastIndices.map((index, i) => {
          const time = weather.hourly.time[index];
          const temp = weather.hourly.temperature_2m[index];
          const code = weather.hourly.weather_code[index];
          const date = new Date(time);

          // Format time manually based on language
          let timeDisplay = `${date.getHours()}:00`;
          if (language !== 'fr') {
            const h = date.getHours() % 12 || 12;
            const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
            timeDisplay = `${h}:00 ${ampm}`;
          }

          // Filter reports for this exact clock hour AND nearby location (~10km)
          const reportsForHour = communityReports.filter(r => {
            const rDate = new Date(r.timestamp);
            const isSameHour = rDate.getHours() === date.getHours() && rDate.toDateString() === date.toDateString();

            // Spatial Filter (essential for hyper-local accuracy)
            if (!location) return isSameHour; // Fallback
            const isNearby = Math.abs(r.lat - location.lat) < 0.1 && Math.abs(r.lng - location.lng) < 0.1;

            return isSameHour && isNearby;
          });

          let displayConditions: string[] = [];
          let confidence = ConfidenceLevel.LOW;
          let hasReports = false;

          if (reportsForHour.length > 0) {
            hasReports = true;

            const conditionCounts: Record<string, number> = {};
            reportsForHour.forEach(r => {
              r.conditions.forEach(c => {
                conditionCounts[c] = (conditionCounts[c] || 0) + 1;
              });
            });

            displayConditions = Object.entries(conditionCounts)
              .sort(([, countA], [, countB]) => countB - countA)
              .map(([cond]) => cond);

            // Revert to Consensus Logic based on USER feedback (Step 298)
            // Confidence depends on AGREEMENT on the dominant condition.
            // If 5 people say "Rain" -> High Confidence.
            // If 2 say "Sun" and 3 say "Rain" -> Medium Confidence (because only 3 agree).
            // Total reports might be 5, but consensus is only 3.

            const topConditionCount = displayConditions.length > 0 ? conditionCounts[displayConditions[0]] : 0;

            if (topConditionCount >= 5) {
              confidence = ConfidenceLevel.HIGH;
            } else if (topConditionCount >= 3) {
              confidence = ConfidenceLevel.MEDIUM;
            } else {
              confidence = ConfidenceLevel.LOW;
            }
          }

          return (
            <Card key={time} className="min-w-[140px] flex flex-col items-center flex-shrink-0">
              {/* Top: Official */}
              {/* Top: Official */}
              <div className="w-full bg-blue-50 p-3 flex flex-col items-center border-b border-blue-100">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t('community.label_official')}</span>
                  <span className="text-[8px] text-blue-300">●</span>
                  <span className="text-[10px] font-bold text-blue-400 font-mono">{timeDisplay}</span>
                </div>
                {getWeatherIcon(code, 24, "mb-1")}
                <span className="font-bold text-lg">{convertTemp(temp, unit)}°</span>
              </div>

              {/* Bottom: Community */}
              <div className="w-full p-4 flex flex-col items-center bg-white relative min-h-[110px] justify-between flex-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{t('community.reports')}</span>

                {hasReports ? (
                  <>
                    <div className="flex -space-x-2 my-2">
                      {displayConditions.slice(0, 3).map((condition, ci) => (
                        <div key={ci} className="bg-purple-100 p-1.5 rounded-full border-2 border-white z-10">
                          {getWeatherIconFromLabel(condition, 14)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <Badge label={t(`confidence.${confidence.toLowerCase()}`)} level={confidence} />
                    </div>
                  </>
                ) : (
                  <span className="text-gray-300 font-medium text-sm my-auto">N/A</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// --- Pages & Modals ---

// --- Pages ---

const MapPage = ({ userTier, setShowPremium }: { userTier: UserTier, setShowPremium: (show: boolean) => void }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { location, userPosition, weather, cityName, communityReports, searchCity, updateLocation, majorCitiesWeather, unit, t } = useContext(AppContext)!;
  const [viewMode, setViewMode] = useState<'official' | 'community'>('official');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Handle Search Input
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        const results = await searchCity(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectCity = (result: SearchResult) => {
    updateLocation(result.latitude, result.longitude, result.name, result.country, 'manual');
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    if (!L) {
      setTimeout(() => {
        const LRetry = (window as any).L;
        if (LRetry && !mapInstance.current) {
          initMap(LRetry);
        }
      }, 500);
      return;
    }

    initMap(L);

    function initMap(Leaflet: any) {
      if (!mapInstance.current) {
        const initialLat = location ? location.lat : 48.8566;
        const initialLng = location ? location.lng : 2.3522;

        const map = Leaflet.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([initialLat, initialLng], 13);

        Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(map);

        mapInstance.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && location) {
      mapInstance.current.setView([location.lat, location.lng], 13);
    }
  }, [location]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstance.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const getIconSvg = (type: 'sun' | 'rain' | 'cloud' | 'storm' | 'snow' | 'wind' | 'moon', color: string, size: number = 24) => {
      const common = `stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

      let path = '';
      if (type === 'sun') {
        path = `
          <circle cx="12" cy="12" r="4" ${common} />
          <path d="M12 2v2" ${common} />
          <path d="M12 20v2" ${common} />
          <path d="m4.93 4.93 1.41 1.41" ${common} />
          <path d="m17.66 17.66 1.41 1.41" ${common} />
          <path d="M2 12h2" ${common} />
          <path d="M20 12h2" ${common} />
          <path d="m6.34 17.66-1.41 1.41" ${common} />
          <path d="m19.07 4.93-1.41 1.41" ${common} />
        `;
      } else if (type === 'moon') {
        path = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" ${common} />`;
      } else if (type === 'cloud') {
        path = `<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" ${common} />`;
      } else if (type === 'rain') {
        path = `
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" ${common} />
          <path d="M16 14v6" ${common} />
          <path d="M8 14v6" ${common} />
          <path d="M12 16v6" ${common} />
        `;
      } else if (type === 'storm') {
        path = `
          <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" ${common} />
          <path d="m13 12-3 5h4l-3 5" ${common} />
        `;
      } else if (type === 'snow') {
        path = `
          <path d="m10 20-1.25-2.5L6 18" ${common} />
          <path d="M10 4 8.75 6.5 6 6" ${common} />
          <path d="m14 20 1.25-2.5L18 18" ${common} />
          <path d="m14 4 1.25 2.5L18 6" ${common} />
          <path d="m17 21-3-6h-4" ${common} />
          <path d="m17 3-3 6 1.5 3" ${common} />
          <path d="M2 12h6.5L10 9" ${common} />
          <path d="m20 10-1.5 2 1.5 2" ${common} />
          <path d="M22 12h-6.5L14 15" ${common} />
          <path d="m4 10 1.5 2L4 14" ${common} />
          <path d="m7 21 3-6-1.5-3" ${common} />
          <path d="m7 3 3 6h4" ${common} />
        `;
      } else if (type === 'wind') {
        path = `
          <path d="M12.8 19.6A2 2 0 1 0 14 16H2" ${common} />
          <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" ${common} />
          <path d="M9.8 4.4A2 2 0 1 1 11 8H2" ${common} />
        `;
      } else {
        // Fallback Sun
        path = `
          <circle cx="12" cy="12" r="4" ${common} />
          <path d="M12 2v2" ${common} />
          <path d="M12 20v2" ${common} />
          <path d="m4.93 4.93 1.41 1.41" ${common} />
          <path d="m17.66 17.66 1.41 1.41" ${common} />
          <path d="M2 12h2" ${common} />
          <path d="M20 12h2" ${common} />
          <path d="m6.34 17.66-1.41 1.41" ${common} />
          <path d="m19.07 4.93-1.41 1.41" ${common} />
        `;
      }
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
    };

    if (viewMode === 'official') {
      // 1. Current Location Marker
      if (location && weather) {
        const isCurrentGps = userPosition &&
          Math.abs(userPosition.lat - location.lat) < 0.001 &&
          Math.abs(userPosition.lng - location.lng) < 0.001;

        const code = weather.current.weatherCode;
        let iconType: 'sun' | 'moon' | 'rain' | 'cloud' | 'storm' | 'snow' | 'wind' = 'sun';
        let iconColor = '#F59E0B'; // Yellow

        // Determine icon & color based on code & day/night
        if (code >= 95) { iconType = 'storm'; iconColor = '#7C3AED'; }
        else if ((code >= 71 && code <= 77) || code === 85 || code === 86) { iconType = 'snow'; iconColor = '#06B6D4'; }
        else if (code >= 51 || code >= 80) { iconType = 'rain'; iconColor = '#3B82F6'; }
        else if (code >= 45) { iconType = 'cloud'; iconColor = '#64748B'; }
        else if (code >= 1) { iconType = 'cloud'; iconColor = '#64748B'; }
        else {
          // Clear sky
          if (weather.current.isDay === 0) { iconType = 'moon'; iconColor = '#64748B'; }
          else { iconType = 'sun'; iconColor = '#F59E0B'; }
        }

        const temp = convertTemp(weather.current.temperature, unit);
        const bgColor = isCurrentGps ? 'bg-green-100 border-green-200' : 'bg-white border-gray-100';

        const el = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div class="${bgColor} rounded-full shadow-lg border px-3 py-2 flex items-center gap-2 transform hover:scale-110 transition-transform">
               ${getIconSvg(iconType, iconColor, 22)}
               <span class="font-bold text-gray-800 text-sm">${temp}°</span>
            </div>
          `,
          iconSize: [80, 42],
          iconAnchor: [40, -10]
        });

        markersRef.current.push(L.marker([location.lat, location.lng], { icon: el, zIndexOffset: 1000 }).addTo(mapInstance.current));
      }

      // 2. Major Cities Markers
      majorCitiesWeather.forEach(city => {
        // Don't duplicate current location
        if (Math.abs(city.lat - location?.lat) < 0.1 && Math.abs(city.lng - location?.lng) < 0.1) return;

        let iconType: 'sun' | 'moon' | 'rain' | 'cloud' | 'storm' | 'snow' | 'wind' = 'sun';
        let iconColor = '#F59E0B';
        const code = city.code;

        if (code >= 95) { iconType = 'storm'; iconColor = '#7C3AED'; }
        else if ((code >= 71 && code <= 77) || code === 85 || code === 86) { iconType = 'snow'; iconColor = '#06B6D4'; }
        else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { iconType = 'rain'; iconColor = '#3B82F6'; }
        else {
          // Non-precipitating weather (Clear, Cloudy, Fog)
          if (city.isDay === 0) {
            // NIGHT -> Always MOON (unless precipitating) as per request
            iconType = 'moon';
            iconColor = '#64748B';
          } else {
            // DAY
            // 0=Clear, 1=Mainly Clear, 2=Partly Cloudy -> SUN
            if (code <= 2) {
              iconType = 'sun';
              iconColor = '#F59E0B';
            } else {
              // 3=Overcast, 45/48=Fog -> CLOUD
              iconType = 'cloud';
              iconColor = '#64748B';
            }
          }
        }

        const temp = convertTemp(city.temp, unit);

        const el = L.divIcon({
          className: 'bg-transparent overflow-visible',
          html: `
              <div class="absolute bottom-3 left-0 -translate-x-1/2">
                <div class="bg-white rounded-full shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2 whitespace-nowrap transform hover:scale-110 transition-transform duration-200 origin-bottom">
                  ${getIconSvg(iconType, iconColor, 26)}
                  <span class="font-bold text-gray-800 text-base">${temp}°</span>
                </div>
              </div>
            `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });
        markersRef.current.push(L.marker([city.lat, city.lng], { icon: el }).addTo(mapInstance.current));
      });

    } else {
      // Community View

      // ALGORITHME "WAZE-LIKE" (Vérité Terrain)
      // 1. Trier par le plus récent (priorité absolue)
      const sortedReports = [...communityReports]
        .filter(r => (Date.now() - r.timestamp) < (6 * 60 * 60 * 1000)) // Garder 6h max comme la liste
        .sort((a, b) => b.timestamp - a.timestamp);

      const consolidatedReports: (CommunityReport & { count?: number })[] = [];
      const MERGE_RADIUS_KM = 0.15; // 150 mètres

      // Fonction distance (Haversine)
      const getDistKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Rayon Terre km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // 2. Consolidation
      sortedReports.forEach(report => {
        // Chercher un "Leader" existant dans la zone
        const leader = consolidatedReports.find(l => getDistKm(l.lat, l.lng, report.lat, report.lng) < MERGE_RADIUS_KM);

        if (leader) {
          // Si trouvé, c'est une "confirmation" (ou une vieille info écrasée par le leader)
          // On incrémente juste le compteur du leader
          leader.count = (leader.count || 1) + 1;
        } else {
          // Sinon, c'est un nouveau point d'intérêt (le plus récent de sa zone)
          consolidatedReports.push({ ...report, count: 1 });
        }
      });

      // 3. Affichage des Leaders uniquement
      consolidatedReports.forEach(report => {
        // CHECK FREEMIUM STATUS
        const isFree = userTier === UserTier.FREE;
        // Optional: Allow seeing own reports? Assuming anonymous for now or purely location based.
        // If we had user ID check: const isMine = report.userId === user.uid;

        let iconContent = '';
        let className = 'bg-transparent overflow-visible';

        if (isFree) {
          // --- LOCKED VIEW (Blurry + Lock) ---
          iconContent = `
            <div class="relative group cursor-pointer">
              <div class="bg-gray-200/80 backdrop-blur-md rounded-full shadow-sm px-3 py-2 flex items-center justify-center gap-2 transform transition-transform hover:scale-110">
                 <div class="text-gray-500 opacity-50 blur-[2px]">
                    ${getIconSvg('cloud', '#6B7280', 24)}
                 </div>
                 <div class="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 </div>
              </div>
            </div>
          `;
        } else {
          // --- STANDARD VIEW (Details) ---
          let iconsHtml = '';
          report.conditions.forEach(cond => {
            let type: any = 'sun';
            let color = '#F59E0B'; // Default yellow

            switch (cond) {
              case 'Sunny': type = 'sun'; color = '#FFFFFF'; break;
              case 'Cloudy': type = 'cloud'; color = '#FFFFFF'; break;
              case 'Rain': type = 'rain'; color = '#FFFFFF'; break;
              case 'Windy': type = 'wind'; color = '#FFFFFF'; break;
              case 'Snow': type = 'snow'; color = '#FFFFFF'; break;
              case 'Storm': type = 'storm'; color = '#FFFFFF'; break;
              default: type = 'sun'; color = '#FFFFFF';
            }

            iconsHtml += `<div class="flex-shrink-0">${getIconSvg(type, color, 18)}</div>`;
          });

          const hasTemp = report.temp !== undefined && report.temp !== null;
          const tempDisplay = hasTemp ? `${convertTemp(report.temp!, unit)}°` : '';

          const countBadge = (report.count && report.count > 1)
            ? `<div class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm z-50">${report.count}</div>`
            : '';

          iconContent = `
            <div class="relative">
              <div class="bg-violet-400 rounded-full shadow-md px-3 py-1.5 h-10 flex items-center justify-center gap-2 transform hover:scale-110 transition-transform whitespace-nowrap">
                <div class="flex gap-1 items-center">
                  ${iconsHtml}
                </div>
                ${tempDisplay ? `<span class="font-bold text-white text-base leading-none pt-0.5">${tempDisplay}</span>` : ''}
              </div>
              ${countBadge}
            </div>
          `;
        }


        const el = L.divIcon({
          className: className,
          html: iconContent,
          iconSize: isFree ? [40, 40] : [Math.max(50, 30 + (report.conditions.length * 22) + ((report.temp !== undefined && report.temp !== null) ? 25 : 0)), 40],
          iconAnchor: isFree ? [20, 20] : [Math.max(50, 30 + (report.conditions.length * 22) + ((report.temp !== undefined && report.temp !== null) ? 25 : 0)) / 2, 20]
        });

        const marker = L.marker([report.lat, report.lng], { icon: el, zIndexOffset: 2000 }).addTo(mapInstance.current);

        // Add click handler for Free tier
        if (isFree) {
          marker.on('click', () => {
            setShowPremium(true);
          });
        }

        markersRef.current.push(marker);
      });
    }

  }, [viewMode, location, weather, communityReports, majorCitiesWeather, userPosition, unit, userTier, setShowPremium]);

  return (
    <div className="relative w-full h-full">
      {/* Floating UI Controls - High Z-Index */}
      <div className="absolute top-24 left-0 right-0 z-[9999] px-4 flex flex-col items-center gap-4 pointer-events-none">

        {/* Toggle Switch */}
        <div className="bg-gray-100 p-1 rounded-full shadow-sm flex pointer-events-auto">
          <button
            onClick={() => setViewMode('official')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${viewMode === 'official'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {t('map.toggle.official')}
          </button>
          <button
            onClick={() => setViewMode('community')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${viewMode === 'community'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {t('map.toggle.community')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md pointer-events-auto shadow-xl rounded-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-12 py-3.5 border-none rounded-full leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
            placeholder={t('map.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(pos => {
                    updateLocation(pos.coords.latitude, pos.coords.longitude, undefined, undefined, 'gps');
                  });
                }
              }}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
            >
              <Crosshair size={20} />
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-1.5 ml-2 text-sm font-medium">
              {t('map.search.button')}
            </button>
          </div>

          {/* Dropdown */}
          {searchResults.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl py-2 z-50 max-h-60 overflow-auto border border-gray-100">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  onClick={() => selectCity(result)}
                  className="px-6 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                >
                  <MapPin size={18} className="text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{result.name}</span>
                    <span className="text-gray-500 text-xs">{result.country}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* Full Screen Map */}
      <div id="map" ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
};

const ContributionModal = ({ onClose, initialSelection }: { onClose: () => void, initialSelection?: string | null }) => {
  const { addReport, t, notificationsEnabled, requestNotifications } = useContext(AppContext)!;
  const [selected, setSelected] = useState<string[]>(initialSelection ? [initialSelection] : []);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [precisionGain, setPrecisionGain] = useState(0);

  const [contributionRank, setContributionRank] = useState(0);

  const toggle = (label: string) => {
    if (selected.includes(label)) {
      setSelected(s => s.filter(i => i !== label));
    } else {
      if (selected.length < 3) {
        setSelected(s => [...s, label]);
      }
    }
  };

  const submit = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    // Call API and get calculated gain and rank
    try {
      const result = await addReport(selected);
      setIsSubmitting(false);
      setPrecisionGain(result.gain);
      setContributionRank(result.rank);
      setShowSuccess(true);
    } catch (e: any) {
      setIsSubmitting(false);
      // Handle Blocking Error
      if (e.message === "ALREADY_CONTRIBUTED") {
        alert(t("error.already_contributed") || "You have already contributed to this event. We are waiting for other users to confirm!");
      } else {
        alert("Error sending report. Please try again.");
      }
    }
  };

  const handleFinish = () => {
    if ("Notification" in window && Notification.permission === "default") {
      setShowPermissionModal(true);
    } else {
      onClose();
    }
  };

  if (showPermissionModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <Card className="w-full max-w-sm p-6 bg-white relative text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('modal.notifications.title')}</h3>
          <p className="text-gray-500 mb-6">{t('modal.notifications.desc')}</p>

          <div className="flex flex-col gap-3">
            <Button onClick={() => { requestNotifications(); onClose(); }} variant="primary" className="w-full">
              {t('modal.notifications.accept')}
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full text-gray-400">
              {t('modal.notifications.cancel')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success View
  if (showSuccess) {
    let successMessage = t('gamification.feedback').replace('{{val}}', precisionGain.toString());

    // Special messages logic
    // Rank 1: Only show ~33% of the time to avoid feeling "alone" in the region
    if (contributionRank === 1 && Math.random() < 0.33) {
      successMessage = t('gamification.first'); // "Faster than light"
    } else if (precisionGain === 100) {
      // Priority 2: 100% Reliability
      successMessage = t('gamification.fifth'); // "Expert Reliability"
    } else {
      // Default: Random encouragement
      const randomIdx = Math.floor(Math.random() * 12);
      successMessage = t(`gamification.cycle.${randomIdx}`);
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <Card className="w-full max-w-sm p-8 bg-white relative text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Check size={40} strokeWidth={3} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 whitespace-pre-line">
            {successMessage}
          </h3>

          <Button onClick={handleFinish} variant="secondary" className="w-full text-lg shadow-xl">
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-sm bg-white relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>

        <div className="p-6 pb-2 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{t('modal.title')}</h3>
          <p className="text-sm text-gray-500">{t('modal.desc')}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-bold text-gray-400 mb-4 tracking-wider text-center">
            {t('modal.select_hint')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {['Sunny', 'Cloudy', 'Rain', 'Storm', 'Windy', 'Snow'].map((cond) => (
              <button
                key={cond}
                onClick={() => toggle(cond)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selected.includes(cond)
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                  : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <div className="mb-2">
                  {getWeatherIconFromLabel(cond, 32)}
                </div>
                <span className="font-medium">{cond}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 pt-2 border-t border-gray-100">
          <Button
            onClick={submit}
            disabled={selected.length === 0 || isSubmitting}
            variant="secondary"
            className="w-full text-lg h-14 shadow-xl"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </span>
            ) : t('modal.submit')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const FeedbackModal = ({ onClose }: { onClose: () => void }) => {
  const { t, testPush } = useContext(AppContext)!;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{t('nav.feedback')}</h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <a href="mailto:hello@wiseweatherapp.xyz?subject=Bug Report - Wise Weather" className="flex items-center gap-4 p-4 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
            <Bug size={24} />
            <span className="font-semibold">{t('feedback.bug')}</span>
          </a>
          <a href="mailto:hello@wiseweatherapp.xyz?subject=Feature Request - Wise Weather" className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
            <Wand2 size={24} />
            <span className="font-semibold">{t('feedback.feature')}</span>
          </a>
          <button onClick={() => { testPush(); onClose(); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-left">
            <Bell size={24} />
            <span className="font-semibold">{t('feedback.push_notification')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

const PremiumModal = ({ onClose }: { onClose: () => void }) => {
  const { language, simulateSubscription, user, userTier } = useContext(AppContext)!;
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  const tiers = [
    {
      name: language === 'fr' ? 'Gratuit' : 'Free',
      price: 'CHF 0.-',
      period: '',
      color: 'from-gray-100 to-gray-200',
      textColor: 'text-gray-700',
      features: [
        language === 'fr' ? 'Météo actuelle + 3h' : 'Current weather + 3h',
        language === 'fr' ? 'Alertes vitales uniquement' : 'Price alerts only', // Wait, previous trans was inaccurate?
        language === 'fr' ? 'Poster des rapports' : 'Post reports',
        language === 'fr' ? '❌ Carte communautaire floutée' : '❌ Blurred community map',
        language === 'fr' ? '❌ Données Santé masquées' : '❌ Masked Health Data'
      ],
      cta: language === 'fr' ? 'Basique' : 'Basic',
      disabled: true
    },
    {
      name: 'Standard',
      price: billing === 'yearly' ? 'CHF 20.-' : 'CHF 2.-',
      period: billing === 'yearly' ? (language === 'fr' ? '/ an' : '/ year') : (language === 'fr' ? '/ mois' : '/ month'),
      savings: billing === 'yearly' ? '-17%' : null,
      color: 'from-blue-400 to-blue-600',
      textColor: 'text-white',
      features: [
        language === 'fr' ? 'Prévisions 12h' : '12h forecast',
        language === 'fr' ? 'Carte communautaire active' : 'Active community map',
        language === 'fr' ? 'Données Santé (UV, Pollen, Pollution)' : 'Health Data (UV, Pollen, Pollution)',
        language === 'fr' ? 'Alertes confort (Pluie...)' : 'Comfort alerts (Rain...)',
        language === 'fr' ? 'Expérience complète' : 'Full experience'
      ],
      cta: language === 'fr' ? 'Choisir Standard' : 'Choose Standard',
      disabled: false
    },
    {
      name: 'Ultimate',
      price: billing === 'yearly' ? 'CHF 45.-' : 'CHF 5.-',
      period: billing === 'yearly' ? (language === 'fr' ? '/ an' : '/ year') : (language === 'fr' ? '/ mois' : '/ month'),
      savings: billing === 'yearly' ? '-25%' : null,
      color: 'from-yellow-400 via-orange-500 to-red-500',
      textColor: 'text-white',
      features: [
        language === 'fr' ? 'Tout du Standard' : 'Everything in Standard',
        language === 'fr' ? 'Détails Experts (Graphiques)' : 'Expert Details (Graphs)',
        language === 'fr' ? 'Indices Qualité Air détaillés' : 'Detailed Air Quality indices',
        language === 'fr' ? 'Comparaison J-1' : 'Yesterday comparison',
        language === 'fr' ? 'Expérience Expert' : 'Expert Experience'
      ],
      cta: language === 'fr' ? 'Choisir Ultimate' : 'Choose Ultimate',
      disabled: false
    }
  ];

  const handleSubscribe = (tierIndex: number) => {
    if (tierIndex === 0) return;

    // Determine which link to use
    const isStandard = tierIndex === 1;
    const isYearly = billing === 'yearly';
    let url = "";

    if (isStandard) {
      // Standard Links
      url = isYearly
        ? "https://buy.stripe.com/test_fZu3cuaeI0wI8J0gQ80RG02" // Standard Yearly
        : "https://buy.stripe.com/test_00w9ASgD6bbm4sK6bu0RG00"; // Standard Monthly
    } else {
      // Ultimate Links
      url = isYearly
        ? "https://buy.stripe.com/test_14A7sKeuYcfq7EWgQ80RG04" // Ultimate Yearly
        : "https://buy.stripe.com/test_3cIfZgbiM4MY8J0czS0RG03"; // Ultimate Monthly
    }

    // Append Client Reference ID (CRITICAL for Webhook activation)
    if (user && user.uid) {
      // Check if URL already has query params (Stripe links usually don't but to be safe)
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}client_reference_id=${user.uid}`;

      // Optional: Prefill email if we have it (Anonymous users don't have email usually)
      if (user.email) {
        url += `&prefilled_email=${encodeURIComponent(user.email)}`;
      }
    } else {
      console.warn("User ID missing during subscription attempt. Webhook may fail to identify user.");
      // We let them proceed but activation might need manual support without UID
    }

    // Redirect to Stripe
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-opacity" onClick={onClose}>
      <div
        className="w-full max-h-[90vh] sm:h-auto sm:max-w-5xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Compact */}
        <div className="p-5 pb-2 text-center relative shrink-0">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-900 transition-colors p-2 bg-gray-50 rounded-full z-20">
            <X size={20} />
          </button>

          <Crown size={40} className="mx-auto mb-2 text-yellow-500" />
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
            {language === 'fr' ? 'Passez à Premium' : 'Upgrade to Premium'}
          </h2>
        </div>

        {/* Billing Toggle - Compact */}
        <div className="flex justify-center mb-4 shrink-0 px-4">
          <div className="bg-gray-100 p-1 rounded-full flex relative">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all z-10 ${billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {language === 'fr' ? 'Mensuel' : 'Monthly'}
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all z-10 flex items-center gap-1 ${billing === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {language === 'fr' ? 'Annuel' : 'Yearly'}
              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full ml-1">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards Container - Horizontal Scroll / Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto sm:overflow-visible p-4 pt-0">
          <div className="flex sm:grid sm:grid-cols-3 gap-4 min-w-max sm:min-w-0 mx-auto px-2 sm:px-0 h-full items-stretch snap-x snap-mandatory">
            {tiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`snap-center w-[85vw] sm:w-auto flex flex-col rounded-2xl relative overflow-hidden transition-all duration-300 border ${tier.name === 'Ultimate' ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-lg scale-[1.02] z-10' : 'border-gray-200 shadow-md'} bg-white`}
              >
                {/* Header Card */}
                <div className={`p-4 bg-gradient-to-br ${tier.color} ${tier.textColor} relative shrink-0`}>
                  {tier.savings && (
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/30">
                      {tier.savings}
                    </div>
                  )}
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="flex items-baseline mt-1">
                    <span className="text-2xl font-extrabold">{tier.price}</span>
                    {tier.period && <span className="text-xs opacity-80 ml-1 font-medium">{tier.period}</span>}
                  </div>
                </div>

                {/* Body Card */}
                <div className="p-4 flex flex-col flex-1 bg-white">
                  <ul className="space-y-2.5 mb-4 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 leading-snug">
                        {feature.startsWith('❌') ? (
                          <span className="text-gray-400">{feature.substring(2)}</span>
                        ) : (
                          <>
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${tier.name === 'Free' ? 'bg-gray-100' : 'bg-green-100'}`}>
                              <Check size={10} className={tier.name === 'Free' ? 'text-gray-400' : 'text-green-600'} />
                            </div>
                            <span>{feature}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(index)}
                    disabled={tier.disabled || (index === 0 && userTier === UserTier.FREE) || (index === 1 && userTier === UserTier.STANDARD) || (index === 2 && userTier === UserTier.ULTIMATE)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all mt-auto active:scale-95 ${((index === 0 && userTier === UserTier.FREE) || (index === 1 && userTier === UserTier.STANDARD) || (index === 2 && userTier === UserTier.ULTIMATE))
                      ? 'bg-green-100 text-green-700 border-2 border-green-200 cursor-default shadow-none pointer-events-none'
                      : tier.disabled
                        ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-black shadow-md'
                      }`}
                  >
                    {((index === 0 && userTier === UserTier.FREE) || (index === 1 && userTier === UserTier.STANDARD) || (index === 2 && userTier === UserTier.ULTIMATE))
                      ? (language === 'fr' ? 'Plan Actuel' : 'Current Plan')
                      : tier.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 text-center text-[10px] text-gray-400 shrink-0 border-t border-gray-100">
          {language === 'fr' ? 'Annulez à tout moment • Paiement sécurisé via Stripe' : 'Cancel anytime • Secure payment via Stripe'}
        </div>
      </div>
    </div>
  );
};

// --- App Layout ---

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { userTier, language, t, testPush } = useContext(AppContext)!;

  const planLabel = userTier === UserTier.FREE ? (language === 'fr' ? 'Pack Gratuit' : 'Free Pack') :
    userTier === UserTier.STANDARD ? (language === 'fr' ? 'Pack Standard' : 'Standard Pack') :
      (language === 'fr' ? 'Pack Ultimate' : 'Ultimate Pack');

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 relative overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6 mt-2">Settings</h2>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Subscription</h3>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium text-sm">Plan</span>
              <span className="bg-white text-gray-800 border border-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                {planLabel}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium text-sm">Status</span>
              <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded">Active</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium text-sm">Renewal</span>
              <span className="font-bold text-gray-900 text-sm">03/02/2026</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Feedback</h3>
          <div className="space-y-2">
            <a href="mailto:hello@wiseweatherapp.xyz?subject=Bug Report - Wise Weather" className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors group">
              <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Bug size={18} />
              </div>
              <span className="text-sm font-semibold">{t('feedback.bug') || 'Report a Bug'}</span>
            </a>
            <a href="mailto:hello@wiseweatherapp.xyz?subject=Feature Request - Wise Weather" className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors group">
              <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Wand2 size={18} />
              </div>
              <span className="text-sm font-semibold">{t('feedback.feature') || 'Suggest Feature'}</span>
            </a>
            <button onClick={() => { testPush(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-left group">
              <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <Bell size={18} />
              </div>
              <span className="text-sm font-semibold">{t('feedback.push_notification') || 'Test Notification'}</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            className="w-full py-3 rounded-full border border-red-100 text-red-400 font-semibold hover:bg-red-50 hover:text-red-500 transition-colors text-sm"
            onClick={() => alert("Subscription cancellation logic needed")}
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {

  const [page, setPage] = useState<'home' | 'map'>('home');
  const [showContribution, setShowContribution] = useState(false);
  const [initialSelection, setInitialSelection] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { language, setLanguage, unit, setUnit, t, requestNotifications, notificationsEnabled, testPush, lastNotification, user, userTier, showPremium, setShowPremium } = useContext(AppContext)!;

  // Handle Notification Clicks & Auto-Open
  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      // Check for 'contribution' action
      if (params.get('action') === 'contribution') {
        const select = params.get('select');
        if (select) setInitialSelection(select);

        setShowContribution(true);
        // Clean URL to prevent loop
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    // 1. Check on Mount
    handleUrlParams();

    // 2. Check when App comes to Foreground (for background instances)
    const handleFocus = () => {
      // Small delay to ensure URL is updated by browser navigation
      setTimeout(handleUrlParams, 500);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden font-sans">

      {/* Header - Fixed & Glassy */}
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100/50 h-16 flex items-center justify-between px-4 transition-all duration-300">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Sun className="text-yellow-400 animate-spin-slow" size={28} />
          <span className="text-xl font-extrabold tracking-tight radiant-text">
            {t('app.name')}
          </span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPremium(true)}
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-1 relative overflow-hidden group transition-all ${userTier === UserTier.FREE
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-600 hover:bg-yellow-100'
              : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md border-orange-400'
              }`}
          >
            {userTier === UserTier.FREE && (
              <div className="absolute inset-0 bg-yellow-400/20 animate-pulse rounded-full"></div>
            )}
            <Crown size={18} className="relative z-10" />
          </button>
          <button
            onClick={() => setUnit(unit === 'celsius' ? 'fahrenheit' : 'celsius')}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center hover:bg-gray-50"
          >
            °{unit === 'celsius' ? 'C' : 'F'}
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center hover:bg-gray-50"
          >
            {language.toUpperCase()}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Settings size={16} />
          </button>






        </div>
      </header>

      {/* Notification Banner */}
      {/* Notification Banner */}
      {lastNotification && (
        <div className="fixed top-24 left-4 right-4 z-[9999] animate-in slide-in-from-top-4 duration-500 pointer-events-none flex justify-center">
          <div
            onClick={() => setShowContribution(true)}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-blue-100 w-full max-w-2xl pointer-events-auto ring-1 ring-black/5 flex flex-col gap-4 cursor-pointer hover:bg-white transition-colors max-h-[70vh] overflow-y-auto"
          >
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 flex-shrink-0 mt-1">
                <Bell size={24} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900">{lastNotification.title}</h4>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-snug">
                  {lastNotification.body}
                </p>
              </div>
            </div>

            {/* Actions for Interactive Notifications */}
            {lastNotification.data?.type === 'quote' && (
              <div className="flex gap-3 justify-end mt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setInitialSelection('Sunny');
                    setShowContribution(true);
                  }}
                  className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                >
                  ☀️ {t('weather.sunny')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setInitialSelection('Rain');
                    setShowContribution(true);
                  }}
                  className="text-blue-600 bg-blue-50 hover:bg-blue-100"
                >
                  🌧️ {t('weather.rain')}
                </Button>
              </div>
            )}

            {lastNotification.data?.type === 'weather_alert' && (
              <div className="flex gap-2 justify-end mt-1">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    // For alerts, usually we want users to confirm the condition mentioned.
                    // But the simplest flow is to open the contribution modal.
                    setShowContribution(true);
                  }}
                >
                  {t('modal.submit')}
                </Button>
              </div>
            )}

            {/* Verification type */}
            {lastNotification.data?.type === 'verification' && (
              <div className="flex gap-2 justify-end mt-1">
                {lastNotification.data.reporterId && user && lastNotification.data.reporterId === user.uid ? (
                  <span className="text-gray-400 text-xs font-bold px-2 py-1 bg-gray-100 rounded-lg">
                    {language === 'fr' ? 'Votre contribution' : 'Your report'}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (lastNotification.data.condition) {
                        setInitialSelection(lastNotification.data.condition);
                      }
                      setShowContribution(true);
                    }}
                  >
                    {t('modal.submit')}
                  </Button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${page === 'map' ? 'h-screen pt-0' : 'pt-20'}`}>
        {page === 'home' && (
          <div key={language} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuoteBlock />
            <WeatherDashboard />
            <CommunityCarousel />
          </div>
        )}

        {page === 'map' && <MapPage userTier={userTier} setShowPremium={setShowPremium} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 text-xs font-medium text-gray-400 pb-safe">
        <button
          onClick={() => setPage('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${page === 'home' ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <div className="relative">
            <Sun size={28} strokeWidth={page === 'home' ? 2.5 : 2} />
            {page === 'home' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>}
          </div>
          <span>{t('nav.home')}</span>
        </button>

        {/* Contribution FAB in Center */}
        <div className="relative -top-6">
          <button
            onClick={() => setShowContribution(true)}
            className="w-20 h-20 rounded-full bg-[linear-gradient(0deg,#FCAF45,#FF0080,#FF8C00,#FD1D1D,#FCAF45)] animate-radiant bg-[length:100%_200%] flex items-center justify-center shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-transform border-4 border-white"
          >
            <CloudSun className="text-white" size={40} />
          </button>
        </div>

        {/* Map Button moved to Right */}
        <button
          onClick={() => setPage('map')}
          className={`flex flex-col items-center gap-1 transition-colors ${page === 'map' ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <MapIcon size={28} strokeWidth={page === 'map' ? 2.5 : 2} />
          <span>{t('nav.map')}</span>
        </button>
      </nav>

      {/* Modals */}
      {/* Modals */}
      {showContribution && <ContributionModal onClose={() => { setShowContribution(false); setInitialSelection(null); }} initialSelection={initialSelection} />}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

    </div>
  );
};

const container = document.getElementById('root');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((err) => {
      console.error('Service Worker registration failed:', err);
    });
}

const root = createRoot(container!);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);
