import React, { useState, useEffect, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import {
  Sun, Cloud, CloudRain, Wind, Droplets, ArrowUp, ArrowDown,
  Map as MapIcon, Menu, X, Heart, Thermometer,
  CloudLightning, Snowflake, Navigation, Check, Bug, Wand2,
  Search, MapPin, User, Sunrise, Sunset, Plus, CloudSun, MessageSquare, Layers, Crosshair, CloudFog, Moon, Bell, Eye, Lock, Crown, ChevronUp, ChevronDown, Settings,
  BarChart2, Activity, Zap, Waves
} from 'lucide-react';
import { AppProvider, AppContext } from './context/AppContext';
import { TRANSLATIONS } from './constants';
import { WeatherData, CommunityReport, ConfidenceLevel, SearchResult, UserTier } from './types';
import { useContributorLogic } from './src/hooks/useContributorLogic';

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
  if (code === 1) return <Sun size={size} className={`text-yellow-500 ${className}`} />; // Mainly Clear -> Sun
  if (code === 2) return <CloudSun size={size} className={`text-yellow-500 ${className}`} />; // Partly Cloudy -> Sun + Cloud
  if (code === 3) return <Cloud size={size} className={`text-gray-400 ${className}`} />; // Overcast -> Cloud
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
    case 'Mist': return <CloudFog size={size} className={`text-gray-300 ${className}`} />;
    case 'Whiteout': return <Wind size={size} className={`text-gray-200 ${className}`} />;
    case 'Ice': return <Snowflake size={size} className={`text-blue-200 ${className}`} />;
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

const WeatherDashboard = ({ tierOverride }: { tierOverride?: UserTier }) => {
  const { weather, loadingWeather, unit, t, cityName, language, userTier: contextTier, setShowPremium } = useContext(AppContext)!;
  const userTier = tierOverride || contextTier;
  const [showAirDetails, setShowAirDetails] = useState(false);
  const [activeGraph, setActiveGraph] = useState<'uv' | 'aqi' | 'pollen' | null>(null);

  // Helper for 24h Data (for Expert Graph)
  const getTodayData = (key: 'uv_index' | 'european_aqi') => {
    // Dynamic Date Matching to ensure "Happening Today" accuracy
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    // Select Source Array
    let sourceTime: string[] = [];
    let sourceData: number[] = [];

    if (key === 'european_aqi') {
      sourceTime = weather?.hourlyAirQuality?.time || [];
      sourceData = weather?.hourly?.european_aqi || [];
    } else {
      sourceTime = weather?.hourly?.time || [];
      sourceData = weather?.hourly?.[key] || [];
    }

    // Find Indice
    if (sourceTime.length > 0 && sourceData.length > 0) {
      const index = sourceTime.findIndex((t: string) => t.startsWith(todayStr));
      if (index !== -1) {
        return sourceData.slice(index, index + 24);
      }
    }

    // Fallback: Use manual offset [24..48] if strict match fails but data exists
    // (Assuming past_days=1 structure: Yesterday, Today, Tomorrow)
    if (sourceData.length >= 48) {
      return sourceData.slice(24, 48);
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
  const criticalTimes: Array<{ time: string, temp: number, code: number, label?: string, icon?: any, isDay?: number }> = [];

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
        const slotTime = new Date(timeVal);

        // Skip if too close to sunrise or sunset (within 1 hour)
        if (Math.abs(slotTime.getTime() - sunriseTime.getTime()) > 60 * 60 * 1000 &&
          Math.abs(slotTime.getTime() - sunsetTime.getTime()) > 60 * 60 * 1000) {

          let isSlotDay = 1;

          try {
            // Robust Date String extraction (avoiding timezone shifts from toISOString)
            // timeVal is "YYYY-MM-DDTHH:mm"
            const dateStr = timeVal.split('T')[0];
            const dailyIdx = weather.daily.time.findIndex((t: string) => t.startsWith(dateStr));

            if (dailyIdx !== -1 && weather.daily.sunrise[dailyIdx] && weather.daily.sunset[dailyIdx]) {
              const sr = new Date(weather.daily.sunrise[dailyIdx]);
              const ss = new Date(weather.daily.sunset[dailyIdx]);
              // Use timestamps for accurate comparison
              isSlotDay = (slotTime.getTime() >= sr.getTime() && slotTime.getTime() < ss.getTime()) ? 1 : 0;
            } else {
              // Fallback if daily data missing: Simple hour check (6am - 6pm generally, or reuse today's times)
              const hour = slotTime.getHours();
              // Best fallback: Check against Today's sunrise/sunset times (shifted to day-neutral comparison)
              const srHour = sunriseTime.getHours();
              const ssHour = sunsetTime.getHours();
              isSlotDay = (hour >= srHour && hour < ssHour) ? 1 : 0;
            }
          } catch (e) {
            console.error("Error calculating isDay for slot", e);
            // Emergency fallback
            const h = new Date(timeVal).getHours();
            isSlotDay = (h >= 6 && h < 18) ? 1 : 0;
          }

          criticalTimes.push({
            time: timeVal,
            temp: weather.hourly.temperature_2m[idx],
            code: weather.hourly.weather_code[idx],
            isDay: isSlotDay
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
              // SYNC STRATEGY: Use CURRENT weather code (Patched by Backend Safety Proxy)
              // This ensures the local icon matches the notification alert immediately
              let displayCode = weather.current.weatherCode;

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
          {(userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) && weather.yesterday && weather.yesterday.details && (
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

      {/* Hourly Forecast - Moved above Stats */}
      <div className="border-b border-gray-100 pb-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('weather.hourly')}</h3>
          {/* Small Badge for Tier Debug/Info */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${userTier === UserTier.FREE ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
            {(() => {
              // Check if really a Contributor (using localStorage as proxy since contextTier might be obscured)
              // We use contextTier (base tier) to ensure we don't label a real Ultimate user as Contributor
              const isContributor = contextTier === UserTier.FREE && typeof window !== 'undefined' && localStorage.getItem('wise_contributor_accepted') === 'true';

              if (isContributor) return language === 'fr' ? 'CONTRIBUTEUR' : 'CONTRIBUTOR';

              // Normal Labels
              if (userTier === UserTier.FREE) return language === 'fr' ? 'GRATUIT' : 'FREE';
              return userTier;
            })()}
          </span>
        </div>

        <div className="flex overflow-x-auto gap-8 pb-2 scrollbar-hide">
          {(() => {
            // Logic: Standard/Ultimate/Traveler get 24h, Free gets 3h
            const isPremium = userTier === UserTier.STANDARD || userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER;
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
                      {item.icon || getWeatherIcon(item.code, 24, "", item.isDay ?? 1)}
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
            className={`flex items-center gap-3 transition-all rounded-xl p-2 -m-2 ${(userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) ? 'cursor-pointer hover:bg-orange-50/50 active:scale-95' : ''}`}
            onClick={() => (userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) && setActiveGraph('uv')}
          >
            {/* Sync Logic: Use Hourly UV if available to match Graph */}
            {(() => {
              const todayUV = getTodayData('uv_index');
              const currentHour = new Date().getHours();
              // Prioritize REALTIME current value for Main Display, but fallback to hourly if current is 0 (API bug or lag).
              // This is more accurate than hourly forecast and aligns with the Graph "NOW" bar.
              const hourlyUV = (todayUV && todayUV.length > currentHour) ? todayUV[currentHour] : 0;
              const currentUV = weather.current.uvIndex;

              // Logic: If currentUV is defined and > 0, use it. If it's 0 or undefined, use hourly (which handles 0 correctly at night).
              const displayUV = (currentUV !== undefined && currentUV > 0) ? currentUV : hourlyUV;

              return (
                <>
                  <div className="p-2 bg-orange-50 rounded-full text-orange-600 relative">
                    {displayUV > 2 && (
                      <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${displayUV > 7 ? 'bg-red-400' : (displayUV > 5 ? 'bg-orange-400' : 'bg-yellow-400')}`}></span>
                    )}
                    <Sun size={20} className="relative z-10" />
                    {(userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-orange-100 z-20"><BarChart2 size={8} className="text-orange-400" /></div>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{language === 'fr' ? 'Index UV' : 'UV Index'}</p>
                    <PremiumValue isLocked={false}>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-gray-700">{displayUV.toFixed(0)}</span>
                        <span className="text-[10px] text-gray-400 font-medium">/ 11</span>
                      </div>
                    </PremiumValue>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Air Quality - Clickable for Ultimate (Unified Style with Pulse) */}
        {(weather.current.aqi !== undefined) && (
          <div
            className={`flex items-center gap-3 transition-all rounded-xl p-2 -m-2 ${(userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) ? 'cursor-pointer hover:bg-blue-50/50 active:scale-95' : ''}`}
            onClick={() => (userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) && setActiveGraph('aqi')}
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
              {(userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-blue-100 z-20"><BarChart2 size={8} className="text-blue-400" /></div>}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{language === 'fr' ? 'Qualité Air' : 'Air Quality'}</p>
              <PremiumValue isLocked={false}>
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
            className={`flex items-center gap-3 transition-all rounded-xl p-2 -m-2 ${(userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) ? 'cursor-pointer hover:bg-green-50/50 active:scale-95' : ''}`}
            onClick={() => (userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) && setActiveGraph('pollen')}
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
              // Google Pollen Index (UPI) is 0-5
              const isHigh = maxPollen >= 3;

              // Risk Label (Mapped for UPI 0-5)
              let riskLabel = '';
              if (maxPollen <= 1) riskLabel = isFr ? 'Faible' : 'Low';
              else if (maxPollen === 2) riskLabel = isFr ? 'Modéré' : 'Moderate';
              else if (maxPollen === 3) riskLabel = isFr ? 'Élevé' : 'High';
              else riskLabel = isFr ? 'Extrême' : 'Extreme'; // 4 and 5

              return (
                <>
                  <div className={`p-2 rounded-full relative ${isHigh ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {isHigh && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-red-400"></span>
                    )}
                    <Wind size={20} className="relative z-10" />
                    {(userTier === UserTier.ULTIMATE || userTier === UserTier.TRAVELER) && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-green-100 z-20"><BarChart2 size={8} className="text-green-600" /></div>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Pollen</p>
                    <PremiumValue isLocked={userTier === UserTier.FREE}>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-semibold text-gray-700">{maxPollen.toFixed(0)}</span>
                          <span className="text-[10px] text-gray-400 font-medium">/ 5</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5 truncate w-24">
                          {maxPollen > 1 ? (
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
                  {activeGraph === 'uv' ? (language === 'fr' ? 'Index UV' : 'UV Index') :
                    activeGraph === 'aqi' ? (language === 'fr' ? 'Pollution (AQI)' : 'Air Quality (AQI)') :
                      (language === 'fr' ? 'Détails Pollens' : 'Pollen Details')}
                  <span className="ml-2 text-base font-normal text-gray-400 border-l border-gray-300 pl-2">
                    {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}
                  </span>
                </h3>
                <p className="text-xs text-blue-500 font-medium mt-1">
                  {activeGraph === 'pollen'
                    ? (language === 'fr' ? 'Niveaux actuels par type' : 'Current levels by type')
                    : (language === 'fr' ? 'Évolution de la journée (00h - Maintenant)' : 'Daily Evolution (00h - Now)')}
                </p>
              </div>
              <button onClick={() => setActiveGraph(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            {/* Graph or List Render */}
            {activeGraph === 'pollen' ? (
              <div className="space-y-4 py-2">
                {(() => {
                  // Translation Map for common Google Pollen Codes
                  const translator: Record<string, string> = language === 'fr' ? {
                    "ALDER": "Aulne", "ASH": "Frêne", "BIRCH": "Bouleau", "COTTONWOOD": "Peuplier",
                    "ELM": "Orme", "HAZEL": "Noisetier", "JUNIPER": "Genévrier", "MAPLE": "Érable",
                    "OAK": "Chêne", "PINE": "Pin", "POPLAR": "Peuplier", "WALNUT": "Noyer", "WILLOW": "Saule",
                    "CYPRESS": "Cyprès", "ACACIA": "Acacia", "JAPANESE_CEDAR": "Cèdre du Japon",
                    "GRASS": "Graminées (Herbes)", "MUGWORT": "Armoise", "OLIVE": "Olivier", "RAGWEED": "Ambroisie",
                    "TREE": "Arbres (Général)", "WEED": "Herbacées (Général)", "CASUARINA": "Filao"
                  } : {
                    "GRASS": "Grass (General)", "TREE": "Tree (General)", "WEED": "Weed (General)"
                  };

                  // @ts-ignore
                  const dynamicItems = weather.current.pollen?._dynamicItems as Array<{ code: string, value: number, category: string }>;
                  // @ts-ignore
                  const errorMsg = weather.current.pollen?._error as string;

                  let itemsToRender = [];

                  if (dynamicItems && dynamicItems.length > 0) {
                    itemsToRender = [...dynamicItems]
                      .sort((a, b) => b.value - a.value)
                      .map(item => ({
                        key: item.code,
                        label: translator[item.code] || (item.code.charAt(0) + item.code.slice(1).toLowerCase().replace('_', ' ')),
                        val: item.value,
                        code: item.code
                      }));
                  } else if (dynamicItems && dynamicItems.length === 0 && !errorMsg) {
                    // Valid response but no items (e.g. Winter or Desert) AND NO ERROR
                    return (
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-xl text-center">
                        <p className="font-medium text-sm">
                          {language === 'fr' ? 'Aucun pollen actif détecté pour ce lieu.' : 'No active pollen detected for this location.'}
                        </p>
                        <p className="text-xs mt-2 opacity-70">Google Pollen API OK</p>
                      </div>
                    );
                  } else {
                    // Legacy Fallback (should not happen if cache key updated, unless error)
                    itemsToRender = [
                      { key: 'alder', label: language === 'fr' ? 'Aulne' : 'Alder', val: weather.current.pollen?.alder || 0 },
                      { key: 'birch', label: language === 'fr' ? 'Bouleau' : 'Birch', val: weather.current.pollen?.birch || 0 },
                      { key: 'grass', label: language === 'fr' ? 'Graminées' : 'Grass', val: weather.current.pollen?.grass || 0 },
                      { key: 'ragweed', label: language === 'fr' ? 'Ambroisie' : 'Ragweed', val: weather.current.pollen?.ragweed || 0 },
                      { key: 'olive', label: language === 'fr' ? 'Olivier' : 'Olive', val: weather.current.pollen?.olive || 0 },
                      { key: 'mugwort', label: language === 'fr' ? 'Armoise' : 'Mugwort', val: weather.current.pollen?.mugwort || 0 },
                    ];
                  }

                  return itemsToRender.map((item, idx) => {
                    // Color logic
                    const val = item.val;
                    const percent = Math.min((val / 5) * 100, 100);
                    let color = 'bg-green-500';
                    if (val >= 4) color = 'bg-purple-600';      // Extreme
                    else if (val >= 3) color = 'bg-red-500';    // Very High
                    else if (val >= 2) color = 'bg-orange-500'; // High
                    else if (val >= 1) color = 'bg-yellow-400'; // Moderate
                    else color = 'bg-blue-400';                 // Low (Good)

                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1 font-medium text-gray-700">
                          <span>{item.label}</span>
                          <span>{val} <span className="text-xs text-gray-400 font-normal">/ 5</span></span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${color}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="flex gap-2 h-48 mb-2">
                {/* Y Axis Labels */}
                <div className="flex flex-col justify-between text-[9px] text-gray-400 font-medium py-1 w-6 text-right">
                  {activeGraph === 'uv' ? (
                    <>
                      <span>12</span><span>9</span><span>6</span><span>3</span><span>0</span>
                    </>
                  ) : (
                    <>
                      <span>500</span><span>375</span><span>250</span><span>125</span><span>0</span>
                    </>
                  )}
                </div>

                {/* Bars Area */}
                <div className="flex-1 flex items-end gap-1 h-full border-l border-gray-100 pl-1">
                  {(() => {
                    const rawData = getTodayData(activeGraph === 'uv' ? 'uv_index' : 'european_aqi');
                    const data = rawData.length > 0 ? rawData : Array(24).fill(0);

                    // Strict Official Limits
                    // AQI: 0-500
                    // UV: 0-12 (technically can go higher rarely but 11+ is extreme)
                    const strictMax = activeGraph === 'uv' ? 12 : 500;

                    return data.map((val, i) => {
                      const currentHour = new Date().getHours();
                      // STRICT USER RULE: Future hours must be EMPTY.
                      // Show only history from 00h to currentHour.
                      const isFuture = i > currentHour;
                      const isCurrent = i === currentHour;

                      // SYNCHRONIZATION:
                      // For the "NOW" bar, we override the hourly forecast value with the REALTIME current value.
                      // This ensures the Graph's "current" bar matches the Main Dashboard indicator exactly.
                      let displayVal = val;
                      if (isCurrent) {
                        if (activeGraph === 'uv') {
                          // Fix: Only override if current > 0. If current is 0, trust hourly val (which comes from Today Data).
                          if (weather.current.uvIndex !== undefined && weather.current.uvIndex > 0) {
                            displayVal = weather.current.uvIndex;
                          }
                        } else if (activeGraph === 'aqi' && weather.current.aqi !== undefined) {
                          displayVal = weather.current.aqi;
                        }
                      }

                      if (isFuture) {
                        // Render empty placeholder to keep spacing but show NO bar.
                        return (
                          <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                            <div className="w-full bg-gray-50 rounded-t-sm" style={{ height: '4px', opacity: 0.3 }}></div>
                          </div>
                        );
                      }

                      return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer">
                          {/* Tooltip */}
                          {(() => {
                            const numericVal = Math.round(displayVal);
                            let label = '';
                            let status = '';

                            if (activeGraph === 'uv') {
                              label = 'UV';
                              // UV Scale
                              if (numericVal <= 2) status = language === 'fr' ? 'Faible' : 'Low';
                              else if (numericVal <= 5) status = language === 'fr' ? 'Modéré' : 'Moderate';
                              else if (numericVal <= 7) status = language === 'fr' ? 'Fort' : 'High';
                              else if (numericVal <= 10) status = language === 'fr' ? 'Très Fort' : 'Very High';
                              else status = language === 'fr' ? 'Extrême' : 'Extreme';
                            } else {
                              label = 'AQI';
                              // AQI Scale (US EPA approx)
                              if (numericVal <= 50) status = language === 'fr' ? 'Bon' : 'Good';
                              else if (numericVal <= 100) status = language === 'fr' ? 'Moyen' : 'Moderate';
                              else if (numericVal <= 150) status = language === 'fr' ? 'Mauvais' : 'Unhealthy';
                              else status = language === 'fr' ? 'Très Mauvais' : 'Very Unhealthy';
                            }

                            return (
                              <div className={`absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/95 text-white p-2 rounded-lg pointer-events-none whitespace-nowrap z-20 flex flex-col items-center shadow-xl backdrop-blur-md ${isCurrent ? 'ring-1 ring-white/50' : ''} min-w-[80px]`}>
                                {/* Time Header */}
                                <div className="flex items-center gap-1 mb-1 border-b border-gray-700 pb-1 w-full justify-center">
                                  <span className="text-[10px] font-medium text-gray-400">{i}h00</span>
                                  {isCurrent && <span className="text-[9px] bg-blue-500 px-1 rounded text-white font-bold ml-1">NOW</span>}
                                </div>

                                {/* Value & Label */}
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-bold">{label}: {numericVal}</span>
                                  <span className={`text-[10px] font-medium mt-0.5 ${status === 'Bon' || status === 'Good' || status === 'Faible' || status === 'Low' ? 'text-green-400' :
                                    status === 'Modéré' || status === 'Moderate' || status === 'Moyen' ? 'text-yellow-400' :
                                      status === 'Mauvais' || status === 'Unhealthy' || status === 'Fort' || status === 'High' ? 'text-orange-400' : 'text-red-400'
                                    }`}>
                                    {status}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {(() => {
                            let barColor = '';
                            if (activeGraph === 'uv') {
                              if (displayVal <= 2) barColor = 'bg-green-400';
                              else if (displayVal <= 5) barColor = 'bg-yellow-400';
                              else if (displayVal <= 7) barColor = 'bg-orange-500';
                              else if (displayVal <= 10) barColor = 'bg-red-500';
                              else barColor = 'bg-purple-600';
                            } else {
                              // AQI Color Scale
                              if (displayVal <= 20) barColor = 'bg-blue-400';      // Good
                              else if (displayVal <= 40) barColor = 'bg-green-400'; // Fair
                              else if (displayVal <= 60) barColor = 'bg-yellow-400'; // Moderate
                              else if (displayVal <= 80) barColor = 'bg-orange-500'; // Poor
                              else if (displayVal <= 100) barColor = 'bg-red-500';   // Very Poor
                              else barColor = 'bg-purple-700';                       // Extremely Poor
                            }

                            return (
                              <div
                                className={`w-full rounded-t-sm transition-all ${barColor} ${isCurrent ? 'opacity-100 ring-1 ring-offset-0 ring-gray-400 brightness-110' : 'opacity-80'}`}
                                style={{ height: `${Math.min((displayVal / strictMax) * 100, 100)}%`, minHeight: '2px' }}
                              ></div>
                            );
                          })()}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* X Axis (aligned with bars, offset by Y-axis width) */}
            <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1 ml-8">
              <span>00h</span>
              <span>06h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>




          </div>
        </div>
      )}



    </Card >
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
                      <Badge label={`${t('community.confidence')} : ${t(`confidence.${confidence.toLowerCase()}`)}`} level={confidence} />
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
  const { location, userPosition, weather, cityName, communityReports, searchCity, updateLocation, majorCitiesWeather, unit, t, language } = useContext(AppContext)!;
  const [viewMode, setViewMode] = useState<'official' | 'community'>('community');

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
          // No replacement, just reading. weather (Clear, Cloudy, Fog)
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
        .filter(r => {
          // EXCEPTION: Avalanche Risk alerte remains effectively visible for 12 HOURS
          if (r.avalancheRisk && r.avalancheRisk > 0) {
            return (Date.now() - r.timestamp) < (12 * 60 * 60 * 1000);
          }
          // Standard Reports: 1 Hour max
          return (Date.now() - r.timestamp) < (1 * 60 * 60 * 1000);
        })
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
      // Extraire le nom de ville principal pour comparaison (FREE)
      const userMainCity = cityName.includes('(') ? cityName.split('(')[0].trim() : cityName;

      consolidatedReports.forEach(report => {
        // CHECK FREEMIUM STATUS
        const isFree = userTier === UserTier.FREE;
        // Check if Mountain Report (Avalanche or Snow)
        const isMountain = (report.avalancheRisk != null) || (report.snowLevel != null);

        // Pour FREE: Vérifier si le rapport est dans la même ville
        const reportCity = report.cityName || '';
        const isSameCity = reportCity.toLowerCase() === userMainCity.toLowerCase();
        // FREE voit les rapports de sa ville, les autres tiers voient tout
        const shouldShowDetails = !isFree || isSameCity;

        let iconContent = '';
        let className = 'bg-transparent overflow-visible';

        if (isFree && !isSameCity) {
          // --- LOCKED VIEW (Blurry + Lock) ---
          // MOUNTAIN: px-3 py-2, SVG 24, Size 40
          // GENERAL: px-2 py-1.5, SVG 20, Size 32
          const pxClass = isMountain ? "px-3 py-2 gap-2" : "px-2 py-1.5 gap-1.5";
          const svgSize = isMountain ? 24 : 20;
          const lockSize = isMountain ? 16 : 14;
          const blurClass = isMountain ? "blur-[2px]" : "blur-[1.5px]";

          iconContent = `
            <div class="relative group cursor-pointer">
              <div class="bg-gray-200/80 backdrop-blur-md rounded-full shadow-sm ${pxClass} flex items-center justify-center transform transition-transform hover:scale-110">
                 <div class="text-gray-500 opacity-50 ${blurClass}">
                    ${getIconSvg('cloud', '#6B7280', svgSize)}
                 </div>
                 <div class="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="${lockSize}" height="${lockSize}" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 </div>
              </div>
            </div>
          `;
        } else {
          // --- STANDARD VIEW (Details) ---
          let iconsHtml = '';
          // MOUNTAIN: SVG 18
          // GENERAL: SVG 20 (Slightly smaller than 24 to fit compact bubble)
          const svgSize = isMountain ? 18 : 20;

          // Limit displayed icons:
          // MOUNTAIN: Show all
          // GENERAL: Show 1st Icon + separate visual indicator for others
          const displayConditions = isMountain ? report.conditions : report.conditions.slice(0, 1);
          const hiddenCount = (!isMountain && report.conditions.length > 1) ? report.conditions.length - 1 : 0;

          displayConditions.forEach(cond => {
            let type: any = 'sun';
            let color = '#F59E0B'; // Default yellow

            switch (cond) {
              case 'Sunny': type = 'sun'; color = '#FFFFFF'; break;
              case 'Cloudy': type = 'cloud'; color = '#FFFFFF'; break;
              case 'Rain': type = 'rain'; color = '#FFFFFF'; break;
              case 'Windy': type = 'wind'; color = '#FFFFFF'; break;
              case 'Snow': type = 'snow'; color = '#FFFFFF'; break;
              case 'Storm': type = 'storm'; color = '#FFFFFF'; break;
              case 'Mist': type = 'cloud'; color = '#CBD5E1'; break; // Light Gray for Mist
              case 'Whiteout': type = 'snow'; color = '#F8FAFC'; break; // Very White for Whiteout
              case 'Ice': type = 'snow'; color = '#7DD3FC'; break; // Light Blue for Ice
              default: type = 'sun'; color = '#FFFFFF';
            }

            iconsHtml += `<div class="flex-shrink-0">${getIconSvg(type, color, svgSize)}</div>`;
          });

          // Add +N badge if hidden icons exist (General Only)
          if (hiddenCount > 0) {
            iconsHtml += `<div class="text-[10px] font-bold text-white bg-white/20 rounded-full w-5 h-5 flex items-center justify-center -ml-0.5 cursor-pointer">+${hiddenCount}</div>`;
          }

          const hasTemp = report.temp !== undefined && report.temp !== null;
          const tempDisplay = hasTemp ? `${convertTemp(report.temp!, unit)}°` : '';

          // MOUNTAIN BADGES
          // Revert to original styling for Mountain badges if isMountain
          const badgePy = isMountain ? "py-0.5" : "py-0.5"; // kept same
          const badgePx = isMountain ? "px-1.5" : "px-1";

          const avalancheBadge = (report.avalancheRisk != null) ? `<span class="bg-red-500 text-white text-[9px] ${badgePx} ${badgePy} rounded font-bold ml-1 flex items-center shadow-sm">⚠️ ${report.avalancheRisk}/5</span>` : '';
          const snowBadge = (report.snowLevel != null) ? `<span class="bg-blue-500 text-white text-[9px] ${badgePx} ${badgePy} rounded font-bold ml-1 flex items-center shadow-sm">❄️ ${report.snowLevel}cm</span>` : '';

          const countSize = isMountain ? "w-5 h-5 text-[10px]" : "w-4 h-4 text-[9px]";
          const countBadge = (report.count && report.count > 1)
            ? `<div class="absolute -top-2 -right-2 bg-red-500 text-white ${countSize} font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-50">${report.count}</div>`
            : '';

          // Dynamic background based on mode
          const bgClass = isMountain ? 'bg-slate-800' : 'bg-violet-400';

          if (!isMountain) {
            // --- GENERAL MODE: MATCH OFFICIAL FORECAST MARKER EXACTLY ---
            // Use CSS absolute positioning + transform for auto-width centering
            // Wrapper: absolute bottom-3 left-0 -translate-x-1/2 (Same as Major Cities)
            // Bubble: rounded-full shadow-lg border items-center gap-2

            // Icon Size matching Official (22).
            const genSvgSize = 22;
            let genIconsHtml = '';

            // Show 1st Icon + Badge
            const firstCond = report.conditions[0] || 'Sunny';
            const hiddenCount = Math.max(0, report.conditions.length - 1);

            // Generate 1st icon
            let type: any = 'sun';
            let color = '#FFFFFF'; // White icons on colored bubble

            const isNight = weather?.current?.isDay === 0;

            switch (firstCond) {
              case 'Sunny': type = isNight ? 'moon' : 'sun'; break;
              case 'Cloudy': type = 'cloud'; break;
              case 'Rain': type = 'rain'; break;
              case 'Windy': type = 'wind'; break;
              case 'Snow': type = 'snow'; break;
              case 'Storm': type = 'storm'; break;
              case 'Mist': type = 'cloud'; color = '#CBD5E1'; break;
              case 'Whiteout': type = 'snow'; color = '#F8FAFC'; break;
              case 'Ice': type = 'snow'; color = '#7DD3FC'; break;
              default: type = 'sun';
            }
            genIconsHtml += getIconSvg(type, color, genSvgSize);

            // Badge if needed
            if (hiddenCount > 0) {
              genIconsHtml += `<div class="text-[10px] font-bold text-white bg-white/20 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer">+${hiddenCount}</div>`;
            }

            const temp = hasTemp ? `${convertTemp(report.temp!, unit)}°` : '';

            iconContent = `
              <div class="absolute bottom-4 left-0 -translate-x-1/2">
                 <div class="${bgClass} rounded-full shadow-lg border border-white/20 px-3 py-2 flex items-center gap-2 whitespace-nowrap transform hover:scale-110 transition-transform">
                    <div class="flex items-center gap-1.5">
                      ${genIconsHtml}
                    </div>
                    ${temp ? `<span class="font-bold text-white text-sm pt-0.5 leading-none">${temp}</span>` : ''}
                 </div>
                 ${countBadge}
              </div>
            `;

            // General Mode uses CSS centering, so Leaflet dimensions are 0/0
            // This guarantees the width is exactly "content" width, just like the Official bubble
            const el = L.divIcon({
              className: className + ' overflow-visible', // Important for absolute child
              html: iconContent,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            });
            // Generate FULL icons list for popup (to show on click)
            let fullIconsHtml = '';
            report.conditions.forEach(cond => {
              let type: any = 'sun';
              let color = '#FFFFFF';
              switch (cond) {
                case 'Sunny': type = isNight ? 'moon' : 'sun'; break;
                case 'Cloudy': type = 'cloud'; break;
                case 'Rain': type = 'rain'; break;
                case 'Windy': type = 'wind'; break;
                case 'Snow': type = 'snow'; break;
                case 'Storm': type = 'storm'; break;
                case 'Mist': type = 'cloud'; color = '#CBD5E1'; break;
                case 'Whiteout': type = 'snow'; color = '#F8FAFC'; break;
                case 'Ice': type = 'snow'; color = '#7DD3FC'; break;
                default: type = 'sun';
              }
              fullIconsHtml += `<div class="p-1">${getIconSvg(type, color, 24)}</div>`;
            });

            const diffMs = Date.now() - report.timestamp;
            const diffMins = Math.floor(diffMs / 60000);
            const timeAgo = diffMins < 1
              ? (language === 'fr' ? "À l'instant" : 'Now')
              : `${diffMins} min`;

            const popupContent = `
              <div class="${bgClass} rounded-2xl shadow-xl border-2 border-white/20 px-3 py-2 flex flex-col items-center justify-center gap-1 animate-in zoom-in-95 duration-200">
                 <div class="flex items-center justify-center gap-2">
                   <div class="flex flex-wrap justify-center gap-1 max-w-[200px]">
                     ${fullIconsHtml}
                   </div>
                   ${temp ? `<div class="font-bold text-white text-lg pl-2 border-l border-white/20">${temp}</div>` : ''}
                 </div>
                 <div class="flex items-center gap-1.5 opacity-90">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span class="text-[10px] font-bold text-white tracking-wide leading-none">${timeAgo}</span>
                 </div>
              </div>
            `;

            const marker = L.marker([report.lat, report.lng], { icon: el, zIndexOffset: 2000 }).addTo(mapInstance.current);

            if (isFree) {
              marker.on('click', () => setShowPremium(true));
            } else {
              // Bind popup to show full details on click
              marker.bindPopup(popupContent, {
                closeButton: false,
                className: 'custom-popup-no-bg', // See index.css or assume style relies on inner HTML
                offset: [0, -20],
                minWidth: 100
              });
            }

            markersRef.current.push(marker);

          } else {
            // --- MOUNTAIN MODE: RETAIN EXISTING CALCULATED LAYOUT ---

            const containerClass = "px-3 py-1.5 h-10 gap-2";
            const tempSize = "text-base";

            iconContent = `
              <div class="relative">
                <div class="${bgClass} rounded-full shadow-md ${containerClass} flex items-center justify-center transform hover:scale-110 transition-transform whitespace-nowrap border-2 border-white/20">
                  <div class="flex gap-1 items-center">
                    ${iconsHtml}
                  </div>
                  ${avalancheBadge}
                  ${snowBadge}
                  ${tempDisplay ? `<span class="font-bold text-white ${tempSize} leading-none pt-0.5">${tempDisplay}</span>` : ''}
                </div>
                ${countBadge}
              </div>
            `;

            // Dimensions Calculation (Mountain Only)
            const baseW = 30;
            const condW = 20;
            const tempW = 25;
            const avW = 45;
            const snowW = 50;
            const height = 40;

            const calculatedW = Math.max(50, baseW
              + (report.conditions.length * condW)
              + ((report.temp !== undefined && report.temp !== null) ? tempW : 0)
              + (report.avalancheRisk ? avW : 0)
              + (report.snowLevel !== undefined ? snowW : 0)
            );

            const el = L.divIcon({
              className: className,
              html: iconContent,
              iconSize: [calculatedW, height],
              iconAnchor: [calculatedW / 2, height / 2]
            });
            const marker = L.marker([report.lat, report.lng], { icon: el, zIndexOffset: 2000 }).addTo(mapInstance.current);

            if (isFree) {
              marker.on('click', () => setShowPremium(true));
            }

            markersRef.current.push(marker);
          }
        } // End Standard View Logic
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

const ContributionModal = ({ onClose, initialSelection, onOpenMountainMode, activationMessage, onReportSuccess }: { onClose: () => void, initialSelection?: string | null, onOpenMountainMode?: () => void, activationMessage?: string | null, onReportSuccess?: () => void }) => {
  const { addReport, t, notificationsEnabled, requestNotifications, loadingWeather, weather } = useContext(AppContext)!;
  const [selected, setSelected] = useState<string[]>(initialSelection ? [initialSelection] : []);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [precisionGain, setPrecisionGain] = useState(0);


  const [snowLevel, setSnowLevel] = useState(0);
  const [contributionRank, setContributionRank] = useState(0);
  const isStaging = typeof window !== 'undefined' && (window.location.hostname.includes('staging') || window.location.hostname.includes('localhost'));

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
      if (onReportSuccess) onReportSuccess();
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
            {['Sunny', 'Cloudy', 'Rain', 'Storm', 'Windy', 'Snow']
              .filter(cond => !(cond === 'Sunny' && weather?.current?.isDay === 0))
              .map((cond) => (
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
          {onOpenMountainMode && (
            <button
              onClick={onOpenMountainMode}
              className="w-full mt-3 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <span>🏔️</span>
              <span>{t('button.mountain_mode')}</span>
            </button>
          )}
        </div>
      </Card >
    </div >
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
  const { language, simulateSubscription, user, userTier, userPlan } = useContext(AppContext)!;
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  // Detect active Contributor mode directly (independent of App state for immediate UI feedback)
  const isContributor = typeof window !== 'undefined' && localStorage.getItem('wise_contributor_accepted') === 'true';

  const tiers = [
    {
      name: language === 'fr' ? 'Gratuit' : 'Free',
      price: 'CHF 0.-',
      period: '',
      color: 'bg-gradient-to-br from-gray-100 to-gray-200',
      textColor: 'text-gray-700',
      features: [
        language === 'fr' ? 'Météo actuelle + 3h' : 'Current weather + 3h',
        language === 'fr' ? 'UV + Pollution' : 'UV + Pollution',
        language === 'fr' ? 'Carte communautaire (votre ville)' : 'Community map (your city)',
        language === 'fr' ? 'Alertes vitales uniquement' : 'Vital alerts only',
        language === 'fr' ? 'Poster des rapports' : 'Post reports'
      ],
      cta: language === 'fr' ? 'Basique' : 'Basic',
      disabled: true,
      tierId: 'FREE'
    },
    {
      name: language === 'fr' ? 'CONTRIBUTEUR' : 'CONTRIBUTOR',
      price: language === 'fr' ? 'Mode Participatif' : 'Participative Mode',
      period: '',
      color: 'bg-gradient-to-br from-green-500 to-emerald-700',
      textColor: 'text-white',
      features: [
        language === 'fr' ? '✅ TOUTES OPTIONS (Local)' : '✅ ALL FEATURES (Local only)',
        language === 'fr' ? '✅ 1 contribution = 1h accès' : '✅ 1 contribution = 1 hour access',
        language === 'fr' ? '✅ Cumulable (infini)' : '✅ Access stacks (+1h per contrib)',
        language === 'fr' ? '✅ Publicités activées' : '✅ Ads enabled',
        language === 'fr' ? '❤️ Accès Solidaire' : '❤️ Solidarity access'
      ],
      cta: language === 'fr' ? 'Activer (Gratuit)' : 'Activate (Free)',
      disabled: false,
      tierId: 'CONTRIBUTOR'
    },
    {
      name: 'Standard',
      price: billing === 'yearly' ? 'CHF 20.-' : 'CHF 2.-',
      period: billing === 'yearly' ? (language === 'fr' ? '/ an' : '/ year') : (language === 'fr' ? '/ mois' : '/ month'),
      savings: billing === 'yearly' ? '-17%' : null,
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      textColor: 'text-white',
      features: [
        language === 'fr' ? 'Prévisions 12h' : '12h forecast',
        language === 'fr' ? 'Carte communautaire complète' : 'Full community map',
        language === 'fr' ? 'Données Santé (UV, Pollution + Pollen)' : 'Health Data (UV, Pollution + Pollen)',
        language === 'fr' ? 'Alertes confort (Pluie...)' : 'Comfort alerts (Rain...)',
        language === 'fr' ? 'Expérience complète' : 'Full experience'
      ],
      cta: language === 'fr' ? 'Choisir Standard' : 'Choose Standard',
      disabled: false,
      tierId: 'STANDARD'
    },
    {
      name: 'Ultimate',
      price: billing === 'yearly' ? 'CHF 45.-' : 'CHF 5.-',
      period: billing === 'yearly' ? (language === 'fr' ? '/ an' : '/ year') : (language === 'fr' ? '/ mois' : '/ month'),
      savings: billing === 'yearly' ? '-25%' : null,
      color: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
      textColor: 'text-white',
      features: [
        language === 'fr' ? 'Pack Standard' : 'Standard Pack',
        language === 'fr' ? 'Détails Experts (Graphiques)' : 'Expert Details (Graphs)',
        language === 'fr' ? 'Indices AIR, UV, Pollens' : 'AIR, UV, Pollen Indices',
        language === 'fr' ? 'Comparaison J-1' : 'Yesterday comparison',
        language === 'fr' ? 'Mode Montagne 🏔️' : 'Mountain Mode 🏔️'
      ],
      cta: language === 'fr' ? 'Choisir Ultimate' : 'Choose Ultimate',
      disabled: false,
      tierId: 'ULTIMATE'
    },
    {
      name: 'Traveler',
      price: 'CHF 4.-',
      period: language === 'fr' ? '/ semaine' : '/ week',
      savings: null,
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      textColor: 'text-white',
      features: [
        language === 'fr' ? 'Valable 1 semaine' : 'Valid for 1 week',
        language === 'fr' ? 'Idéal pour les vacances' : 'Perfect for holidays',
        language === 'fr' ? 'Fonctionnalités Ultimate' : 'Ultimate Features',
        language === 'fr' ? 'Sans engagement' : 'No long commitment'
      ],
      cta: language === 'fr' ? 'Choisir Traveler' : 'Choose Traveler',
      disabled: false,
      tierId: 'TRAVELER'
    }
  ];

  const handleSubscribe = async (tierIndex: number) => {
    const tier = tiers[tierIndex];

    if (tier.tierId === 'FREE') return;

    if (tier.tierId === 'CONTRIBUTOR') {
      if (isContributor) {
        // Toggle OFF
        if (confirm(language === 'fr' ? "Désactiver le mode Participatif ?" : "Disable Participatory Mode?")) {
          // AWAIT the downgrade first
          await simulateSubscription(UserTier.FREE);
          localStorage.removeItem('wise_contributor_accepted');
          onClose(); // No reload, just close
        }
        return;
      }

      const msg = language === 'fr'
        ? "Voulez-vous activer le mode Participatif ?\n\nChaque contribution météo vous donne 1 HEURE d'accès complet (Local).\nLes heures se cumulent !"
        : "Activate Participative Mode?\n\nEach weather contribution gives you 1 HOUR of full access (Local only).\nHours stack up!";

      if (confirm(msg)) {
        // AWAIT the downgrade first
        await simulateSubscription(UserTier.FREE);

        // CRITICAL: Reset the logic state (strikes, blocked status) so they start FRESH
        localStorage.removeItem('wise_contributor_state_v2');

        localStorage.setItem('wise_contributor_accepted', 'true');

        // Set flag for auto-open with message after reload
        localStorage.setItem('wise_contributor_activation_pending', 'true');

        // Force reload to enable the 'staged' contributor logic
        // alert(language === 'fr' ? "Mode Activé ! Faites une contribution pour gagner 1h." : "Mode Activated! Make a contribution to earn 1h.");
        window.location.reload();
        window.location.reload();
      }
      return;
    }

    // Determine which link to use
    // Re-mapped indexes due to insertion of Contributor at [1]
    const isStandard = tier.tierId === 'STANDARD';
    const isYearly = billing === 'yearly';

    let url = "";

    if (isStandard) {
      // Standard Links
      url = isYearly
        ? "https://buy.stripe.com/test_fZu3cuaeI0wI8J0gQ80RG02" // Standard Yearly
        : "https://buy.stripe.com/test_00w9ASgD6bbm4sK6bu0RG00"; // Standard Monthly
    } else if (tier.tierId === 'ULTIMATE') {
      // Ultimate Links
      url = isYearly
        ? "https://buy.stripe.com/test_14A7sKeuYcfq7EWgQ80RG04" // Ultimate Yearly
        : "https://buy.stripe.com/test_3cIfZgbiM4MY8J0czS0RG03"; // Ultimate Monthly
    } else if (tier.tierId === 'TRAVELER') {
      // Traveler (Weekly)
      url = "https://buy.stripe.com/test_7sYeVc4Uo4MY7EW8jC0RG05";
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

    // Explicitly disable local contributor mode logic when switching to a paid plan
    // This allows seamless switching: "Last action wins"
    localStorage.removeItem('wise_contributor_accepted');

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
          <div className="flex sm:grid sm:grid-cols-5 gap-4 min-w-max sm:min-w-0 mx-auto px-2 sm:px-0 h-full items-stretch snap-x snap-mandatory">
            {tiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`snap-center w-[85vw] sm:w-auto flex flex-col rounded-2xl relative overflow-hidden transition-all duration-300 border ${tier.tierId === 'CONTRIBUTOR' ? 'border-green-400 ring-2 ring-green-400/20 shadow-lg scale-[1.01] z-10' :
                  tier.tierId === 'ULTIMATE' ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-lg scale-[1.01] z-10' :
                    'border-gray-200 shadow-md'
                  } bg-white`}
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
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${tier.tierId === 'FREE' ? 'bg-gray-100' : 'bg-green-100'}`}>
                              <Check size={10} className={tier.tierId === 'FREE' ? 'text-gray-400' : 'text-green-600'} />
                            </div>
                            <span>{feature}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(index)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all mt-auto active:scale-95 ${
                      // Active Plan Logic
                      // 1. Contributor Check
                      (tier.tierId === 'CONTRIBUTOR' && isContributor) ||
                        // 2. Traveler Check (Explicit Plan Check)
                        (tier.tierId === 'TRAVELER' && userPlan === 'traveler') ||
                        // 3. Fallback Tier Check (Standard/Ultimate/Free) - ONLY if not Contributor/Traveler active on another card
                        (tier.tierId === userTier && !isContributor && userPlan !== 'traveler')
                        ? (tier.tierId === 'CONTRIBUTOR' ? 'bg-green-100 text-green-800 pointer-events-none' : 'bg-gray-100 text-gray-900 pointer-events-none ring-1 ring-gray-200')
                        : tier.disabled
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : tier.tierId === 'CONTRIBUTOR'
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                            : 'bg-gray-900 text-white hover:bg-black shadow-md'
                      }`}
                  >
                    {
                      (tier.tierId === 'CONTRIBUTOR' && isContributor) ||
                        (tier.tierId === 'TRAVELER' && userPlan === 'traveler') ||
                        (tier.tierId === userTier && !isContributor && userPlan !== 'traveler')
                        ? (tier.tierId === 'CONTRIBUTOR' ? (language === 'fr' ? 'Actif ✅' : 'Active ✅') : (language === 'fr' ? 'Actuel' : 'Current'))
                        : tier.cta
                    }
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

// --- Alerts Modal ---
const AlertsModal = ({ onClose }: { onClose: () => void }) => {
  const { notificationsHistory, language } = useContext(AppContext)!;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 relative overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors z-10">
          <X size={24} />
        </button>

        <div className="text-center mb-6 mt-2">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{language === 'fr' ? 'Alertes (12h)' : 'Alerts (12h)'}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'fr' ? 'Historique des notifications reçues' : 'History of received notifications'}
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px]">
          {notificationsHistory.filter(n => {
            // Filter out Quotes / Daily Inspirations
            const isQuote = n.data?.type === 'quote' ||
              n.title.includes('Inspiration') ||
              n.title.includes('Citation') ||
              n.title.includes('Conseil');
            return !isQuote;
          }).length === 0 ? (
            <div className="text-center py-10 text-gray-400 flex flex-col items-center">
              <span className="text-4xl mb-2">😴</span>
              <span>{language === 'fr' ? "Pas d'alertes météo récentes" : "No recent weather alerts"}</span>
            </div>
          ) : (
            notificationsHistory.filter(n => {
              const isQuote = n.data?.type === 'quote' ||
                n.title.includes('Inspiration') ||
                n.title.includes('Citation') ||
                n.title.includes('Conseil');
              return !isQuote;
            }).map((notif, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex gap-3 items-start">
                <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
                  {notif.title.includes('Pluie') || notif.title.includes('Rain') ? (
                    <CloudRain size={20} className="text-blue-500" />
                  ) : notif.title.includes('Orage') || notif.title.includes('Storm') ? (
                    <Zap size={20} className="text-purple-500" />
                  ) : (
                    <Bell size={20} className="text-orange-500" />
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-start w-full">
                    <h4 className="font-bold text-gray-900 text-sm">{notif.title}</h4>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-snug mt-1">{notif.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
            {language === 'fr' ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { userTier, userPlan, userExpiresAt, language, t, testPush } = useContext(AppContext)!;
  const isContributor = typeof window !== 'undefined' && localStorage.getItem('wise_contributor_accepted') === 'true';

  const planLabel = isContributor ? (language === 'fr' ? 'Mode Contributeur' : 'Contributor Mode') :
    userTier === UserTier.FREE ? (language === 'fr' ? 'Pack Gratuit' : 'Free Pack') :
      userTier === UserTier.STANDARD ? (language === 'fr' ? 'Pack Standard' : 'Standard Pack') :
        userTier === UserTier.TRAVELER ? (language === 'fr' ? 'Pack Traveler' : 'Traveler Pack') : // Fix for Traveler Label
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
              {isContributor ? (
                <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded">
                  {/* We don't have access to contributorLogic hook variables here directly unless we move the hook or context */}
                  {/* Actually we can't easily get the 'hours left' without the hook instance from parent. */}
                  {/* Simplified: just Active */}
                  {language === 'fr' ? 'Actif (Mode Local)' : 'Active (Local Mode)'}
                </span>
              ) : userPlan === 'traveler' && userExpiresAt ? (
                <span className={`font-bold text-sm px-2 py-0.5 rounded ${new Date() > userExpiresAt ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'}`}>
                  {(() => {
                    const diff = userExpiresAt.getTime() - Date.now();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    if (days <= 0) return language === 'fr' ? 'Expiré' : 'Expired';
                    return language === 'fr' ? `${days} Jours Restants` : `${days} Days Left`;
                  })()}
                </span>
              ) : (
                <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded">Active</span>
              )}
            </div>

            {userPlan !== 'traveler' && !isContributor && userTier !== UserTier.FREE && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-sm">Renewal</span>
                <span className="font-bold text-gray-900 text-sm">Auto-renew</span>
              </div>
            )}

            {/* Show Expiration Date for Traveler explicitly if needed */}
            {/* Show Expiration Date for Traveler explicitly - ALWAYS if plan is traveler */}
            {userPlan === 'traveler' && userExpiresAt && (
              <div className="mt-4 pt-3 border-t border-gray-200/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium text-sm">Expires</span>
                  <span className="font-bold text-gray-900 text-sm">{userExpiresAt.toLocaleDateString()}</span>
                </div>
                {/* Calculated Purchase Date: Expiry - 7 Days */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium text-sm">{language === 'fr' ? 'Acheté le' : 'Purchased on'}</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {(() => {
                      const purchaseDate = new Date(userExpiresAt.getTime());
                      purchaseDate.setDate(purchaseDate.getDate() - 7);
                      return `${purchaseDate.toLocaleDateString()} ${purchaseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-500 font-medium text-sm">{language === 'fr' ? 'Temps Restant' : 'Time Left'}</span>
                  <span className={`font-bold text-sm ${new Date() > userExpiresAt ? 'text-red-600' : 'text-orange-600'}`}>
                    {(() => {
                      const diff = userExpiresAt.getTime() - Date.now();
                      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      if (days <= 0) return language === 'fr' ? 'Expiré' : 'Expired';
                      return language === 'fr' ? `${days} Jours` : `${days} Days`;
                    })()}
                  </span>
                </div>
              </div>
            )}
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

const MountainModal = ({ onClose, onReportSuccess }: { onClose: () => void, onReportSuccess?: () => void }) => {
  const { addReport, t, loadingWeather } = useContext(AppContext)!;
  const [selected, setSelected] = useState<string[]>([]);
  const [snowLevel, setSnowLevel] = useState(0);
  const [avalancheRisk, setAvalancheRisk] = useState(1);
  const [visibility, setVisibility] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [avalancheUnlocked, setAvalancheUnlocked] = useState(false);

  const toggle = (label: string) => {
    if (selected.includes(label)) {
      setSelected(s => s.filter(i => i !== label));
    } else {
      if (selected.length < 3) setSelected(s => [...s, label]);
    }
  };

  const submit = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await addReport(selected, {
        snowLevel,
        // Only send avalanche risk if explicitly unlocked by the user
        avalancheRisk: avalancheUnlocked ? avalancheRisk : undefined,
        visibilityDist: visibility,
        windExposure: 'ridge' // Defaulting to ridge for now or add selector if needed
      });
      setIsSubmitting(false);
      if (onReportSuccess) onReportSuccess();
      setShowSuccess(true);
    } catch (e) {
      setIsSubmitting(false);
      alert("Error sending report.");
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <Card className="w-full max-w-sm p-8 bg-white relative text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Check size={40} strokeWidth={3} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">{t('mountain.success.title')}</h3>
          <p className="text-gray-500 mb-6">{t('mountain.success.desc')}</p>
          <Button onClick={onClose} variant="secondary" className="w-full text-lg shadow-xl">{t('mountain.back')}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md bg-white relative flex flex-col max-h-[90vh] overflow-hidden">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>

        <div className="p-6 pb-2 text-center bg-gray-50 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
            {t('mountain.title')}
          </h3>
          <p className="text-sm text-gray-500">{t('mountain.desc')}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

          {/* Conditions */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">{t('mountain.conditions')}</label>
            <div className="grid grid-cols-3 gap-2">
              {['Sunny', 'Snow', 'Windy', 'Mist', 'Whiteout', 'Ice'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => toggle(cond)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selected.includes(cond)
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="scale-75 mb-1">{getWeatherIconFromLabel(cond, 24)}</div>
                  <span className="text-xs font-medium">{t(`condition.${cond}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Snow Level */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <label className="text-sm font-bold text-blue-800 block mb-3 flex items-center justify-between">
              <span>{t('mountain.snow')}</span>
              <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md text-xs font-bold">{snowLevel} cm</span>
            </label>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={snowLevel}
              onChange={(e) => setSnowLevel(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Visibility */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="text-sm font-bold text-gray-700 block mb-3 flex items-center justify-between">
              <span>{t('mountain.visibility')}</span>
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md text-xs font-bold">{visibility < 20 ? `< 20m` : visibility > 200 ? `> 200m` : `${visibility}m`}</span>
            </label>
            <input
              type="range"
              min="0"
              max="250"
              step="10"
              value={visibility}
              onChange={(e) => setVisibility(parseInt(e.target.value))}
              className="w-full accent-gray-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
              <span>{t('mountain.visibility.fog')}</span>
              <span>{t('mountain.visibility.haze')}</span>
              <span>{t('mountain.visibility.clear')}</span>
            </div>
          </div>

          {/* Avalanche Risk */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${avalancheUnlocked ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
            <label className="text-sm font-bold text-red-800 block mb-3 flex items-center justify-between">
              <span className={avalancheUnlocked ? '' : 'text-gray-400'}>{t('mountain.avalanche')}</span>
              {avalancheUnlocked && <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-md text-xs font-black">{avalancheRisk}/5</span>}
            </label>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={avalancheRisk}
              onChange={(e) => setAvalancheRisk(parseInt(e.target.value))}
              disabled={!avalancheUnlocked}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer mb-2 transition-all ${avalancheUnlocked ? 'bg-red-200 accent-red-600' : 'bg-gray-200 accent-gray-400'}`}
            />

            <div className={`flex justify-between text-[10px] mt-1 font-bold ${avalancheUnlocked ? 'text-red-400' : 'text-gray-300'}`}>
              <span>{t('mountain.avalanche.low')}</span>
              <span>{t('mountain.avalanche.moderate')}</span>
              <span>{t('mountain.avalanche.considerable')}</span>
              <span>{t('mountain.avalanche.high')}</span>
              <span>{t('mountain.avalanche.extreme')}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/50">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="avalanche-confirm"
                  checked={avalancheUnlocked}
                  onChange={(e) => setAvalancheUnlocked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="avalanche-confirm" className="text-xs text-gray-600 leading-snug cursor-pointer select-none">
                  <span className="font-bold block text-red-700 mb-0.5">{t('mountain.avalanche.warning')}</span>
                  {t('mountain.avalanche.confirm')}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 border-t border-gray-100 bg-gray-50">
          <Button
            onClick={submit}
            disabled={selected.length === 0 || isSubmitting}
            variant="primary"
            className="w-full text-lg h-12 shadow-md bg-gray-900 hover:bg-black text-white"
          >
            {isSubmitting ? 'Sending...' : t('modal.submit')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const App = () => {

  const [page, setPage] = useState<'home' | 'map'>('home');
  const [showContribution, setShowContribution] = useState(false);
  const [initialSelection, setInitialSelection] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showMountainModal, setShowMountainModal] = useState(false);
  const [showExpirationWarning, setShowExpirationWarning] = useState(false); // New State for Expiration Warning
  const [contributionIntroMessage, setContributionIntroMessage] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0); // 0 = off, 1 = contrib, 2 = lang/unit, 3 = map

  // 0. CONTRIBUTOR LOGIC
  // We use this hook to simulate the "Give to Get" model
  const contributorLogic = useContributorLogic();

  // Logic: User must be Free + HAVE ACCEPTED THE DEAL via Premium Modal
  const { language, setLanguage, unit, setUnit, t, requestNotifications, notificationsEnabled, testPush, lastNotification, user, userTier, userPlan, userExpiresAt, showPremium, setShowPremium, location, userPosition } = useContext(AppContext)!;

  const hasAcceptedContributorDeal = typeof window !== 'undefined' && localStorage.getItem('wise_contributor_accepted') === 'true';
  // ENABLED FOR EVERYONE NOW (Production Launch)
  // Check both 'FREE + Flag' AND explicit 'CONTRIBUTOR' tier (legacy/firestore sync)
  const isContributorMode = (userTier === UserTier.FREE && hasAcceptedContributorDeal) || userTier === 'CONTRIBUTOR';

  // Local Check for Participative Mode (Strictly 5km ~ 0.05 deg)
  const isLocal = React.useMemo(() => {
    if (!userPosition || !location) return true; // Fail-open
    const dx = Math.abs(userPosition.lat - location.lat);
    const dy = Math.abs(userPosition.lng - location.lng);
    return dx < 0.05 && dy < 0.05;
  }, [userPosition, location]);

  const effectiveTierMap = React.useMemo(() => {
    if (!isContributorMode) return userTier; // Normal paid/free users

    if (contributorLogic.isAccessGranted) {
      if (isLocal) return UserTier.ULTIMATE; // Success: Unlocks everything
      return UserTier.FREE; // Restricted: Out of zone
    }
    return UserTier.FREE; // Restricted: No contribution
  }, [isContributorMode, contributorLogic.isAccessGranted, isLocal, userTier]);
  // Note: We pass 'effectiveTierMap' to MapPage so it unblurs.

  // Debug / Cheat Menu Toggle
  const [showCheatMenu, setShowCheatMenu] = useState(false);

  // Handle Notification Clicks & Auto-Open
  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      // Check for 'contribution' action or deeper 'link' param commonly used by FCM
      const actionParam = params.get('action');
      const linkParam = params.get('link');

      let targetAction = actionParam;
      if (!targetAction && linkParam && linkParam.includes('action=contribution')) {
        targetAction = 'contribution';
      }

      if (targetAction === 'contribution') {
        const isSelf = params.get('isReporter') === 'true';

        if (isSelf) {
          const msg = language === 'fr'
            ? "Votre signalement est en cours de vérification par la communauté. Merci !"
            : "Your report is being verified by the community. Thanks!";
          alert(msg);
        } else {
          const select = params.get('select');
          if (select) setInitialSelection(select);
          setShowContribution(true);
        }
        // Clean URL to prevent loop
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    // 1. Check on Mount
    handleUrlParams();

    // Check for Contributor Activation Flag (Msg 1)
    // Auto-Open Contribution Modal if Pending
    if (localStorage.getItem('wise_contributor_activation_pending') === 'true') {
      localStorage.removeItem('wise_contributor_activation_pending');
      setContributionIntroMessage(language === 'fr'
        ? "Bienvenue en mode Participatif ! 🎉\n\nVotre accès est actif. Merci de contribuer régulièrement."
        : "Welcome to Participative Mode! 🎉\n\nYour access is active. Please contribute regularly.");
      setShowContribution(true);
    }
    // removed automatic open on load.

    // CHECK TRAVELER EXPIRATION (Last Day Warning)
    if (userPlan === 'traveler' && userExpiresAt) {
      const now = new Date();
      const diff = userExpiresAt.getTime() - now.getTime();
      const hoursLeft = diff / (1000 * 60 * 60);

      // Rule: Show if within last 24h AND hasn't been shown today
      // Key format: wise_traveler_warning_YYYY-MM-DD
      const todayKey = `wise_traveler_warning_${now.toLocaleDateString()}`;
      const hasShownToday = localStorage.getItem(todayKey);

      if (hoursLeft > 0 && hoursLeft <= 24 && !hasShownToday) {
        setShowExpirationWarning(true);
        localStorage.setItem(todayKey, 'true');
      }
    }

    // setTimeout to ensure params are read even if hydration delays
    setTimeout(handleUrlParams, 500);

    // Initial Coach Mark check (v2 for new multi-step)
    const hasSeenTuto = localStorage.getItem('has_seen_tuto_v2');
    if (!hasSeenTuto) {
      // Small delay to ensure UI is ready
      setTimeout(() => setTutorialStep(1), 1000);
    }

    // 2. Check when App comes to Foreground (for background instances)
    const handleFocus = () => {
      // Small delay to ensure URL is updated by browser navigation or deep link intent
      setTimeout(handleUrlParams, 500);

      // Fallback: Check if we have a pending action stored in localStorage (if deep link failed but opened app)
      const pendingAction = localStorage.getItem('pending_notification_action');
      if (pendingAction) {
        try {
          const action = JSON.parse(pendingAction);
          if (action.type === 'contribution') {
            if (action.select) setInitialSelection(action.select);
            setShowContribution(true);
            localStorage.removeItem('pending_notification_action');
          }
        } catch (e) { console.error("Error parsing pending action", e); }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });

    // 3. Listen for SW Messages (Reliable for Background -> Foreground)
    const handleSWMessage = (event: MessageEvent) => {
      console.log("SW Message received:", event.data);
      if (event.data && event.data.type === 'OPEN_CONTRIBUTION') {
        if (event.data.select) setInitialSelection(event.data.select);
        setShowContribution(true);
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // 4. broadcastChannel (Even MORE Reliable for inter-context comms)
    const channel = new BroadcastChannel('weather_channel');
    channel.onmessage = (event) => {
      console.log("Broadcast Channel Message:", event.data);
      if (event.data && event.data.type === 'OPEN_CONTRIBUTION') {
        if (event.data.select) setInitialSelection(event.data.select);
        setShowContribution(true);
      }
    };

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      channel.close();
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [language, userPlan, userExpiresAt, tutorialStep]);

  // Auto-clean useEffect REMOVED to prevent race conditions with Firestore sync.
  // The flag is now managed explicitly in handleSubscribe and PremiumModal.

  // Ad display logic: Show ads for ALL Free users OR anyone who accepted Contributor mode (even if Stripe mistakenly thinks they are Ultimate)
  const showAds = userTier === UserTier.FREE || (typeof window !== 'undefined' && localStorage.getItem('wise_contributor_accepted') === 'true');

  // 5. General Auto-Prompt (App Launch Only)
  // Auto-open Contribution Modal on launch (Robust implementation)
  const autoOpenRef = useRef(false);

  useEffect(() => {
    // Only run once per session/mount
    if (autoOpenRef.current) return;

    const hasSeenIntro = localStorage.getItem('has_seen_tuto_v2');
    // If tutorial already seen, open Contrib modal
    if (hasSeenIntro) {
      autoOpenRef.current = true;
      // Reduced delay to 500ms since fallback makes UI ready faster
      setTimeout(() => setShowContribution(true), 500);
    }
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans ${showAds ? 'pb-32' : 'pb-20'}`}>
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
            className={`w-8 h-8 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center hover:bg-gray-50 ${tutorialStep === 2 ? 'relative z-[70] ring-4 ring-white ring-offset-4 ring-offset-black/50' : ''}`}
          >
            °{unit === 'celsius' ? 'C' : 'F'}
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
            className={`w-8 h-8 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center hover:bg-gray-50 ${tutorialStep === 2 ? 'relative z-[70] ring-4 ring-white ring-offset-4 ring-offset-black/50' : ''}`}
          >
            {language.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {/* Notification Banner */}
      {lastNotification && (
        <div className="fixed top-24 left-4 right-4 z-[99999] animate-in slide-in-from-top-4 duration-500 pointer-events-none flex justify-center">
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
                <div onClick={() => setShowContribution(true)} className="text-xs font-bold text-gray-400 cursor-pointer hover:text-gray-600 self-center ml-2">
                  {language === 'fr' ? 'Corriger ?' : 'Incorrect?'}
                </div>
              </div>
            )}

            {/* Standard Weather Forecast Alert */}
            {lastNotification.data?.type === 'weather_forecast' && (
              <div className="flex gap-2 justify-end mt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowContribution(true)}
                >
                  {language === 'fr' ? 'Corriger' : 'Correct'}
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
            <WeatherDashboard tierOverride={effectiveTierMap} />
            <CommunityCarousel />
          </div>
        )}

        {page === 'map' && (
          <>
            <MapPage userTier={effectiveTierMap} setShowPremium={setShowPremium} />

            {/* CONTRIBUTOR HUD (Staging Only) */}
            {isContributorMode && (
              <div className="absolute top-20 left-4 z-[50] animate-in slide-in-from-left duration-500">
                <div className={`backdrop-blur-md border rounded-xl p-3 shadow-lg flex flex-col gap-1 w-48 transition-colors ${contributorLogic.isAccessGranted ? 'bg-green-500/10 border-green-200' : 'bg-red-500/10 border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{language === 'fr' ? 'Temps Restant' : 'Time Left'}</span>
                    {contributorLogic.isAccessGranted ? <Check size={14} className="text-green-600" /> : <Lock size={14} className="text-red-500" />}
                  </div>

                  <div className="flex justify-between text-xs text-gray-700 font-mono mt-1 font-bold">
                    {(() => {
                      const ms = contributorLogic.remainingMs;
                      if (ms <= 0) return <span className="text-red-600">00:00:00</span>;
                      const h = Math.floor(ms / 3600000);
                      const m = Math.floor((ms % 3600000) / 60000);
                      return <span>{h}h {m}m</span>;
                    })()}
                  </div>

                  <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-0.5 mb-1">
                    <span>Zone: {isLocal ? <span className="text-green-600 font-bold">OK</span> : <span className="text-red-500 font-bold">{language === 'fr' ? 'HORS ZONE' : 'OUT OF ZONE'}</span>}</span>
                    <span className={contributorLogic.isAccessGranted ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>
                      {contributorLogic.isAccessGranted
                        ? (language === 'fr' ? 'ACCÈS OK' : 'ACCESS OK')
                        : (language === 'fr' ? 'EXPIRÉ' : 'EXPIRED')}
                    </span>
                  </div>

                  {/* HELPFUL DIRECTIVES */}
                  {(!isLocal || !contributorLogic.isAccessGranted) && (
                    <div className="mt-1 pt-1 border-t border-red-200 text-[9px] text-red-700 leading-tight">
                      {!isLocal && (
                        <div className="flex flex-col gap-1 mb-1">
                          <div className="flex gap-1 items-center">
                            <span>⚠️ {language === 'fr' ? 'Local uniquement (<5km)' : 'Local only (<5km)'}</span>
                          </div>
                          <button
                            onClick={() => setShowPremium(true)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-1 rounded shadow text-[9px] font-bold mt-0.5 animate-pulse hover:scale-105 transition-transform"
                          >
                            {language === 'fr' ? '🌍 Passer en Mondial' : '🌍 Go Worldwide'}
                          </button>
                        </div>
                      )}
                      {!contributorLogic.isAccessGranted && (
                        <div className="font-bold">
                          {language === 'fr' ? '👉 Faites une contribution (+1h)' : '👉 Make a contribution (+1h)'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CHEAT BUTTON */}
                <button
                  onClick={() => setShowCheatMenu(!showCheatMenu)}
                  className="mt-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded hover:bg-black/90 flex gap-1 items-center font-mono opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Bug size={10} /> DEBUG / CHEAT
                </button>

                {/* CHEAT MENU */}
                {showCheatMenu && (
                  <div className="mt-2 bg-white/95 backdrop-blur shadow-xl border border-gray-200 rounded-lg p-2 text-xs flex flex-col gap-2 w-48">
                    <div className="font-bold text-gray-400 border-b pb-1 mb-1">SIMULATION (Staging)</div>
                    <button onClick={contributorLogic.recordContribution} className="border border-green-200 bg-green-50 text-green-800 px-2 py-1.5 rounded hover:bg-green-100 flex items-center justify-between">
                      <span>+1 Contribution (+1h)</span>
                      <Plus size={12} />
                    </button>
                    <button onClick={contributorLogic.debug.addHour} className="border border-blue-200 bg-blue-50 text-blue-800 px-2 py-1.5 rounded hover:bg-blue-100 flex items-center justify-between">
                      <span>Add 1 Hour (Debug)</span>
                      <Activity size={12} />
                    </button>
                    <button onClick={contributorLogic.debug.expireNow} className="border border-red-200 bg-red-50 text-red-800 px-2 py-1.5 rounded hover:bg-red-100 flex items-center justify-between">
                      <span>Expire Now</span>
                      <Lock size={12} />
                    </button>

                    <div className="font-bold text-gray-400 border-b pb-1 mb-1 mt-2">QUALITÉ (Staging)</div>
                    <button onClick={contributorLogic.recordCommunityStrike} className="border border-red-200 bg-red-50 text-red-800 px-2 py-1.5 rounded hover:bg-red-100 flex items-center justify-between bg-red-100 font-bold">
                      <span>❌ SIGNALER (Strike {contributorLogic.contributorState.strikeCount}/3)</span>
                    </button>
                    <button onClick={contributorLogic.resetStrikes} className="border border-green-200 bg-green-50 text-green-800 px-2 py-1.5 rounded hover:bg-green-100 flex items-center justify-between mt-1 opacity-50">
                      <span>Pardonner</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-2 py-3 grid grid-cols-5 items-center z-50 text-[10px] font-medium text-gray-400 pb-safe">
        {/* 1. HOME */}
        <button
          onClick={() => setPage('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${page === 'home' ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <div className="relative">
            <Sun size={24} strokeWidth={page === 'home' ? 2.5 : 2} />
            {page === 'home' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>}
          </div>
          <span>{t('nav.home')}</span>
        </button>

        {/* 2. ALERTS */}
        {/* 2. ALERTS (Locked for Free) */}
        <button
          onClick={() => effectiveTierMap === UserTier.FREE ? setShowPremium(true) : setShowAlerts(true)}
          className={`flex flex-col items-center gap-1 transition-colors ${showAlerts ? 'text-primary' : 'hover:text-gray-600'} ${effectiveTierMap === UserTier.FREE ? 'opacity-40 grayscale' : ''}`}
        >
          <div className="relative">
            <Bell size={24} strokeWidth={showAlerts ? 2.5 : 2} />
            {effectiveTierMap === UserTier.FREE && <Lock size={12} className="absolute -top-1 -right-1 text-gray-500" />}
          </div>
          <span>{language === 'fr' ? 'Alertes' : 'Alerts'}</span>
        </button>

        {/* 3. CONTRIBUTION (Center) */}
        <div className="relative -top-5 flex items-center justify-center pointer-events-none">
          {/* Wrap button in pointer-events-auto to ensure clickability despite container style */}
          <button
            onClick={() => setShowContribution(true)}
            className={`pointer-events-auto relative z-50 w-16 h-16 rounded-full bg-[linear-gradient(0deg,#FCAF45,#FF0080,#FF8C00,#FD1D1D,#FCAF45)] animate-radiant bg-[length:100%_200%] flex items-center justify-center shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-transform border-4 border-white ${tutorialStep === 1 ? 'ring-4 ring-white ring-offset-4 ring-offset-black/80 z-[70]' : ''}`}
          >
            <CloudSun className="text-white" size={32} />
          </button>
        </div>

        {/* 4. MAP */}
        <button
          onClick={() => setPage('map')}
          className={`flex flex-col items-center gap-1 transition-colors ${page === 'map' ? 'text-primary' : 'hover:text-gray-600'} ${tutorialStep === 3 ? 'relative z-[70] bg-white p-1 rounded-lg ring-4 ring-white ring-offset-4 ring-offset-black/80' : ''}`}
        >
          <MapIcon size={24} strokeWidth={page === 'map' ? 2.5 : 2} />
          <span>{t('nav.map')}</span>
        </button>

        {/* 5. SETTINGS */}
        <button
          onClick={() => setShowSettings(true)}
          className={`flex flex-col items-center gap-1 transition-colors ${showSettings ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <Settings size={24} strokeWidth={showSettings ? 2.5 : 2} />
          <span>Settings</span>
        </button>
      </nav>

      {/* AD BANNER (Staging + Free Only) - HIDDEN DURING TUTORIAL */}
      {showAds && tutorialStep === 0 && (
        <div className="fixed bottom-24 left-0 w-full z-[100] px-2 animate-in slide-in-from-bottom-10 duration-700 delay-500">
          <div className="bg-amber-100/95 backdrop-blur-md border border-amber-300 rounded-xl p-2.5 shadow-xl flex items-center justify-between text-xs text-amber-900 ring-1 ring-amber-400/30">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-white px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Pub</span>
              <span className="font-medium">Le Bar du Coin vous offre la météo !</span>
            </div>
            <button className="bg-white/50 px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-white transition-colors">VOIR</button>
          </div>
        </div>
      )}

      {/* Tutorial Overlay (Multi-Step) */}
      {tutorialStep > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 animate-in fade-in duration-500"
          onClick={() => {
            if (tutorialStep < 3) {
              setTutorialStep(tutorialStep + 1);
            } else {
              setTutorialStep(0);
              localStorage.setItem('has_seen_tuto_v2', 'true');
              // Request Notifications on Tutorial End (Fresh Install)
              requestNotifications();
            }
          }}
        >
          {/* Step 1: Contribution (Bottom Center) */}
          {tutorialStep === 1 && (
            <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center text-center text-white px-8 animate-bounce">
              <h3 className="text-2xl font-bold mb-2">
                {language === 'fr' ? 'Participez à la communauté !' : 'Join the community!'}
              </h3>
              <p className="text-lg opacity-90">
                {language === 'fr'
                  ? 'Appuyez ici pour signaler la météo en temps réel.'
                  : 'Tap here to report live weather.'}
              </p>
              <ArrowDown size={40} className="mt-4 mx-auto text-white/50" />
            </div>
          )}

          {/* Step 2: Language & Unit (Top Right) */}
          {tutorialStep === 2 && (
            <div className="absolute top-20 right-4 max-w-[250px] flex flex-col items-end text-right text-white animate-pulse">
              <ArrowUp size={40} className="mb-4 mr-8 text-white/50" />
              <h3 className="text-xl font-bold mb-1">
                {language === 'fr' ? 'Personnalisez votre expérience' : 'Customize your view'}
              </h3>
              <p className="text-sm opacity-90">
                {language === 'fr'
                  ? 'Changez la langue (FR/EN) et les unités (°C/°F) ici.'
                  : 'Switch language and units here.'}
              </p>
            </div>
          )}

          {/* Step 3: Map (Bottom Right) */}
          {tutorialStep === 3 && (
            <div className="absolute bottom-24 right-4 max-w-[200px] flex flex-col items-end text-right text-white animate-bounce">
              <h3 className="text-xl font-bold mb-1">
                {language === 'fr' ? 'Carte Communautaire' : 'Community Map'}
              </h3>
              <p className="text-sm opacity-90">
                {language === 'fr'
                  ? 'Voyez les contributions des autres utilisateurs ici.'
                  : 'See what others are reporting nearby.'}
              </p>
              <ArrowDown size={40} className="mt-4 mr-8 text-white/50" />
            </div>
          )}

          {/* Navigation/Skip */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[90]">
            {/* Step indicator or instructions to tap to continue */}
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              {language === 'fr' ? 'Toucher pour continuer' : 'Tap to continue'} ({tutorialStep}/3)
            </p>
          </div>

          <button
            className="absolute top-6 left-6 text-white/80 hover:text-white font-bold text-xs pointer-events-auto z-[90] bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setTutorialStep(0);
              localStorage.setItem('has_seen_tuto_v2', 'true');
              // Request Notifications even when skipping the tutorial
              requestNotifications();
            }}
          >
            {language === 'fr' ? 'PASSER' : 'SKIP'}
          </button>
        </div>
      )}

      {/* Modals */}
      {/* Modals */}
      {showContribution && (
        <ContributionModal
          onClose={() => { setShowContribution(false); setInitialSelection(null); setContributionIntroMessage(null); }}
          initialSelection={initialSelection}
          activationMessage={contributionIntroMessage}
          onReportSuccess={() => {
            contributorLogic.recordContribution();
            // Force refresh/repaint if needed, but state update should trigger re-render
          }}
          onOpenMountainMode={() => {
            setShowContribution(false);
            // STRICT ACCESS CONTROL: Mountain Mode is for ULTIMATE or TRAVELER only.
            // (Contributors get 'ULTIMATE' via effectiveTierMap if valid).
            // Standard users must Upgrade.
            const hasMountainAccess = effectiveTierMap === UserTier.ULTIMATE || effectiveTierMap === UserTier.TRAVELER;

            if (hasMountainAccess) {
              setShowMountainModal(true);
            } else {
              // Trigger Upsell
              // Maybe show a specific alert or just open Premium Modal?
              // Let's open Premium Modal which shows the comparison.
              // Ideally we'd scroll them to Ultimate, but general modal is fine.
              if (language === 'fr') {
                alert("🏔️ Le Mode Montagne est réservé aux membres ULTIMATE.\n\nMettez à niveau pour voir la météo et la neige signalées par la communauté !");
              } else {
                alert("🏔️ Mountain Mode is for ULTIMATE members only.\n\nUpgrade to see community weather and snow reports!");
              }
              setShowPremium(true);
            }
          }}
        />
      )}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}

      {/* Alerts Modal */}
      {showAlerts && <AlertsModal onClose={() => setShowAlerts(false)} />}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Expiration Warning Modal (Traveler) */}
      {showExpirationWarning && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm p-6 bg-white relative text-center">
            <button onClick={() => setShowExpirationWarning(false)} className="absolute right-4 top-4 text-gray-400">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-4">
              <Activity size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {language === 'fr' ? 'Dernier Jour !' : 'Last Day!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'fr'
                ? "Votre Pack Traveler expire dans moins de 24h. Pensez à renouveler pour ne pas perdre l'accès."
                : "Your Traveler Pack expires in less than 24h. Don't forget to renew to keep access."}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => { setShowExpirationWarning(false); setShowPremium(true); }} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                {language === 'fr' ? 'Renouveler Maintenant' : 'Renew Now'}
              </Button>
              <button onClick={() => setShowExpirationWarning(false)} className="text-gray-400 text-sm font-medium hover:text-gray-600">
                {language === 'fr' ? 'Plus tard' : 'Later'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Mountain Modal */}
      {showMountainModal && <MountainModal onClose={() => setShowMountainModal(false)} onReportSuccess={() => contributorLogic.recordContribution()} />}

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
