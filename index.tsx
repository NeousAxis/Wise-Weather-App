import React, { useState, useEffect, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Sun, Cloud, CloudRain, Wind, Droplets, ArrowUp, ArrowDown, 
  Map as MapIcon, Bell, Menu, X, Heart, Thermometer,
  CloudLightning, Snowflake, Navigation, Check, AlertTriangle, Bug, Wand2,
  Search, MapPin, User, Sunrise, Sunset, Plus, CloudSun, MessageSquare, Layers, Crosshair, CloudFog, Moon
} from 'lucide-react';
import { AppProvider, AppContext } from './context/AppContext';
import { TRANSLATIONS } from './constants';
import { WeatherData, CommunityReport, ConfidenceLevel, SearchResult } from './types';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, size = 'md' }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  // Updated Radiant Gradient Loop: Amber -> Orange -> Rose -> Blue -> Amber
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 focus:ring-blue-500 shadow-md hover:shadow-lg",
    secondary: "bg-white text-foreground border border-gray-200 hover:bg-gray-50 focus:ring-gray-200",
    ghost: "hover:bg-gray-100 text-gray-700",
    radiant: "text-white font-bold bg-gradient-to-r from-amber-400 via-orange-400 via-rose-500 via-blue-500 to-amber-400 animate-radiant bg-[length:200%_auto] hover:opacity-90 shadow-lg",
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

const getWeatherIcon = (code: number, size = 24, className = "") => {
  // Detailed mapping for WMO codes
  if (code === 0) return <Sun size={size} className={`text-yellow-500 ${className}`} />;
  if (code >= 1 && code <= 3) return <Cloud size={size} className={`text-gray-400 ${className}`} />;
  if (code === 45 || code === 48) return <CloudFog size={size} className={`text-gray-400 ${className}`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return <Snowflake size={size} className={`text-cyan-400 ${className}`} />;
  if (code >= 95) return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
  return <Sun size={size} className={`text-yellow-500 ${className}`} />; 
};

const getWeatherIconFromLabel = (label: string, size = 24, className = "") => {
  switch(label) {
    case 'Sunny': return <Sun size={size} className={`text-yellow-500 ${className}`} />;
    case 'Cloudy': return <Cloud size={size} className={`text-gray-400 ${className}`} />;
    case 'Rain': return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
    case 'Windy': return <Wind size={size} className={`text-blue-400 ${className}`} />;
    case 'Snow': return <Snowflake size={size} className={`text-cyan-400 ${className}`} />;
    case 'Storm': return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
    default: return <Sun size={size} className={`text-yellow-500 ${className}`} />;
  }
};

// --- Features ---

const QuoteBlock = () => {
  const { language } = useContext(AppContext)!;
  return (
    <Card className="mx-4 mt-4 mb-6 p-6 bg-gradient-to-br from-white to-blue-50">
      <div className="flex flex-col gap-3">
        <p className="text-lg italic text-gray-700 leading-relaxed">
          "The future belongs to those who believe in the beauty of their dreams."
        </p>
        <p className="text-sm font-semibold text-primary self-end">
          — Eleanor Roosevelt
        </p>
      </div>
    </Card>
  );
};

const WeatherDashboard = () => {
  const { weather, loadingWeather, unit, t, cityName } = useContext(AppContext)!;

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

  // Helper to format time
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format hourly time (Just hour)
  const formatHour = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', hour12: true });
  };

  const currentHourIndex = weather.hourly.time.findIndex(t => {
    const d = new Date(t);
    const now = new Date();
    // Simple current hour match
    return d.getHours() === now.getHours() && d.getDate() === now.getDate();
  });
  
  // Fallback if not found (timezone issues), take last available or middle
  const safeIndex = currentHourIndex !== -1 ? currentHourIndex : Math.floor(weather.hourly.time.length / 2);
  
  const nextHours = weather.hourly.time.slice(safeIndex, safeIndex + 6);

  const maxTemp = Math.round(weather.daily.temperature_2m_max[0]);
  const minTemp = Math.round(weather.daily.temperature_2m_min[0]);

  return (
    <Card className="mx-4 mb-6 p-6">
      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{cityName}</h2>
          <p className="text-gray-500 font-medium mt-1">Official Forecast</p>
        </div>
        <div className="text-right">
           <div className="flex items-center justify-end gap-3">
            {getWeatherIcon(weather.current.weatherCode, 48)}
            <span className="text-6xl font-bold text-foreground tracking-tighter">
              {Math.round(weather.current.temperature)}°
            </span>
           </div>
           <p className="text-gray-500 font-medium mt-1">
             H: {maxTemp}°  L: {minTemp}°
           </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8">
        {/* Sunrise */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-full text-yellow-600">
            <Sunrise size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Sunrise</p>
            <p className="font-semibold text-gray-700">{formatTime(weather.daily.sunrise[0])}</p>
          </div>
        </div>
        
        {/* Sunset */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-full text-orange-600">
            <Sunset size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Sunset</p>
            <p className="font-semibold text-gray-700">{formatTime(weather.daily.sunset[0])}</p>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-full text-blue-600">
            <Wind size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Wind</p>
            <p className="font-semibold text-gray-700">{weather.current.windSpeed} km/h</p>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 rounded-full text-cyan-600">
            <Droplets size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Humidity</p>
            <p className="font-semibold text-gray-700">{weather.current.relativeHumidity}%</p>
          </div>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Hourly Forecast</h3>
        <div className="flex overflow-x-auto gap-8 pb-2 scrollbar-hide">
          {nextHours.map((time, i) => {
             const index = safeIndex + i;
             const temp = weather.hourly.temperature_2m[index];
             const code = weather.hourly.weather_code[index];
             
             return (
               <div key={time} className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[3rem]">
                 <span className="text-sm font-medium text-gray-500">{formatHour(time)}</span>
                 <div className="my-1">
                   {getWeatherIcon(code, 24)}
                 </div>
                 <span className="text-lg font-bold text-foreground">{Math.round(temp)}°</span>
               </div>
             );
          })}
        </div>
      </div>
    </Card>
  );
};

const CommunityCarousel = () => {
  const { t, weather, communityReports } = useContext(AppContext)!;

  if (!weather) return null;

  // Find current hour index
  const currentHourIndex = weather.hourly.time.findIndex(time => {
     const d = new Date(time);
     const now = new Date();
     return d.getHours() === now.getHours() && d.getDate() === now.getDate();
  });

  if (currentHourIndex === -1) return null;

  // We want past 6 hours including current
  // Logic: currentHourIndex is the "now". 
  // We want [now, now-1, now-2, now-3, now-4, now-5]
  // This array will be rendered LTR, so "now" is first (left).
  const pastIndices = Array.from({length: 6}, (_, i) => currentHourIndex - i).filter(i => i >= 0);

  return (
    <div className="mx-4 mb-24">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <User size={20} className="text-primary"/>
        {t('community.title')}
      </h3>
      {/* Recent on Left */}
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
        {pastIndices.map((index, i) => {
           const time = weather.hourly.time[index];
           const temp = weather.hourly.temperature_2m[index];
           const code = weather.hourly.weather_code[index];
           const date = new Date(time);
           
           // Filter community reports for this hour block (approx +/- 30 min around the hour mark to catch slots)
           const hourTimestamp = date.getTime();
           
           const reportsForHour = communityReports.filter(r => {
             return Math.abs(r.timestamp - hourTimestamp) < 3600000; 
           });

           let displayConditions: string[] = [];
           let confidence = ConfidenceLevel.LOW;
           let hasReports = false;

           if (reportsForHour.length > 0) {
              reportsForHour.sort((a, b) => b.timestamp - a.timestamp);
              const latestReportTime = reportsForHour[0].timestamp;
              const FRESHNESS_WINDOW = 30 * 60 * 1000; 
              const recentReports = reportsForHour.filter(r => (latestReportTime - r.timestamp) < FRESHNESS_WINDOW);
              
              if (recentReports.length > 0) {
                 hasReports = true;
                 
                 const conditionCounts: Record<string, number> = {};
                 recentReports.forEach(r => {
                    r.conditions.forEach(c => {
                       conditionCounts[c] = (conditionCounts[c] || 0) + 1;
                    });
                 });

                 displayConditions = Object.entries(conditionCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .map(([cond]) => cond);

                 const topConditionCount = displayConditions.length > 0 ? conditionCounts[displayConditions[0]] : 0;
                 
                 if (topConditionCount >= 5) {
                    confidence = ConfidenceLevel.HIGH;
                 } else if (topConditionCount >= 3) {
                    confidence = ConfidenceLevel.MEDIUM;
                 } else {
                    confidence = ConfidenceLevel.LOW;
                 }
              }
           }

           return (
            <Card key={time} className="min-w-[140px] flex flex-col items-center flex-shrink-0">
              {/* Top: Official */}
              <div className="w-full bg-blue-50 p-3 flex flex-col items-center border-b border-blue-100">
                <span className="text-[10px] font-bold text-blue-400 mb-1">{t('community.official')}</span>
                {getWeatherIcon(code, 24, "mb-1")}
                <span className="font-bold text-lg">{Math.round(temp)}°</span>
              </div>
              
              {/* Bottom: Community */}
              <div className="w-full p-3 flex flex-col items-center bg-white relative h-[88px] justify-center">
                <span className="text-[10px] font-bold text-purple-400 mb-2 absolute top-2">{t('community.reports')}</span>
                
                {hasReports ? (
                  <>
                     <div className="flex -space-x-2 mt-2">
                      {displayConditions.slice(0,3).map((condition, ci) => (
                        <div key={ci} className="bg-purple-100 p-1.5 rounded-full border-2 border-white z-10">
                          {getWeatherIconFromLabel(condition, 14, "text-purple-600")}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Badge label={confidence} level={confidence} />
                    </div>
                  </>
                ) : (
                  <span className="text-gray-300 font-medium text-sm mt-2">N/A</span>
                )}
                
                <span className="absolute top-2 right-2 text-[10px] text-gray-400">
                   {date.getHours()}:00
                </span>
              </div>
            </Card>
           );
        })}
      </div>
    </div>
  );
};

// --- Pages & Modals ---

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { location, weather, cityName, communityReports, searchCity, updateLocation, majorCitiesWeather } = useContext(AppContext)!;
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
    updateLocation(result.latitude, result.longitude, result.name, result.country);
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
             if(LRetry && !mapInstance.current) {
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
      if(mapInstance.current && location) {
          mapInstance.current.setView([location.lat, location.lng], 13);
      }
  }, [location]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstance.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const getIconSvg = (type: 'sun' | 'rain' | 'cloud' | 'storm' | 'snow' | 'wind' | 'moon', color: string, size: number = 24) => {
      let svgContent = '';
      if(type === 'sun') {
          // Lucide Sun
          svgContent = `
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 20v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m4.93 4.93 1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m17.66 17.66 1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m6.34 17.66-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m19.07 4.93-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'moon') {
          // Lucide Moon
          svgContent = `
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'cloud') {
          // Lucide Cloud
          svgContent = `
            <path d="M17.5 19c0.41 0 0.81-0.05 1.2-0.15 0.39-0.1 0.77-0.25 1.13-0.44 0.36-0.19 0.69-0.43 0.99-0.71 0.3-0.28 0.56-0.6 0.78-0.95 0.22-0.35 0.4-0.74 0.52-1.15 0.12-0.41 0.18-0.84 0.18-1.28 0 0 0 0 0 0 0-0.45-0.06-0.89-0.19-1.32-0.13-0.43-0.31-0.84-0.54-1.22-0.23-0.38-0.52-0.73-0.85-1.04-0.33-0.31-0.7-0.58-1.1-0.81-0.4-0.23-0.83-0.41-1.28-0.53-0.45-0.12-0.91-0.18-1.38-0.18 0 0-0.01 0-0.01 0-0.29-1.23-0.87-2.36-1.68-3.3-0.81-0.94-1.84-1.64-3.01-2.05-1.17-0.41-2.42-0.51-3.64-0.29-1.22 0.22-2.34 0.76-3.25 1.57-0.91 0.81-1.57 1.86-1.9 3.05-0.33 1.19-0.33 2.45-0.01 3.66 0.08 0.3 0.2 0.58 0.34 0.85-0.64 0.08-1.27 0.27-1.86 0.58-0.59 0.31-1.13 0.73-1.59 1.23-0.46 0.5-0.83 1.08-1.09 1.71-0.26 0.63-0.4 1.3-0.42 1.98-0.02 0.68 0.1 1.35 0.34 1.98 0.24 0.63 0.6 1.2 1.05 1.68 0.45 0.48 0.99 0.86 1.59 1.13 0.6 0.27 1.25 0.41 1.91 0.41h13.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          `;
      } else if (type === 'rain') {
           // Lucide CloudRain
           svgContent = `
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 14v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 14v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           `;
      } else if (type === 'wind') {
           // Lucide Wind - DISTINCT FROM CLOUD - Only wind lines
           svgContent = `
             <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M9.6 4.6A2 2 0 1 1 11 8H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M12.6 19.4A2 2 0 1 0 14 16H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           `;
      } else if (type === 'snow') {
           // Lucide Snowflake
           svgContent = `
             <line x1="2" x2="22" y1="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <line x1="12" x2="12" y1="2" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="m4 4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="m4 20 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="m20 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           `;
      } else if (type === 'storm') {
          // Lucide CloudLightning
          svgContent = `
            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m13 12-3 5h4l-3 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else {
           // Fallback sun
           svgContent = `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 20v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m4.93 4.93 1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m17.66 17.66 1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m6.34 17.66-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m19.07 4.93-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      }

      // CRITICAL FIX: Replace 'currentColor' with the explicit hex color to override parent CSS
      const coloredSvgContent = svgContent.replace(/currentColor/g, color);

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="overflow: visible;">${coloredSvgContent}</svg>`;
    };
    
    // Helper for Marker Colors - Used for BOTH Official and Community maps now
    const getNaturalColor = (type: string) => {
        switch(type) {
            case 'sun': return '#F59E0B'; // Amber 500 (Vibrant Orange/Yellow)
            case 'rain': return '#3B82F6'; // Blue 500
            case 'cloud': return '#F1F5F9'; // Slate 100
            case 'storm': return '#FCD34D'; // Amber 300 (Lightning)
            case 'snow': return '#67E8F9'; // Cyan 300
            case 'wind': return '#93C5FD'; // Blue 300
            case 'moon': return '#D1D5DB'; // Gray 300
            default: return '#F59E0B';
        }
    };
    
    const getSpecificColor = (type: string, context: 'official' | 'community') => {
        if (context === 'official') {
             // On White Background
             switch(type) {
                case 'sun': return '#F59E0B';
                case 'rain': return '#3B82F6';
                case 'cloud': return '#64748B';
                case 'storm': return '#7C3AED';
                case 'snow': return '#06B6D4';
                case 'wind': return '#60A5FA';
                case 'moon': return '#6B7280';
                default: return '#F59E0B';
            }
        } else {
             // On Purple Background
             // Needs to be bright to contrast with Purple (#A855F7)
             switch(type) {
                case 'sun': return '#FCD34D'; // Brighter Yellow
                case 'rain': return '#60A5FA'; // Brighter Blue
                case 'cloud': return '#FFFFFF'; // White Cloud
                case 'storm': return '#FDE047'; // Bright Yellow Lightning
                case 'snow': return '#A5F3FC'; // Bright Cyan
                case 'wind': return '#BFDBFE'; // Light Blue
                case 'moon': return '#E5E7EB';
                default: return '#FCD34D';
            }
        }
    }

    // Official Markers
    if (viewMode === 'official') {
      const markersToDisplay = [];
      if (location && weather) {
        markersToDisplay.push({ 
           lat: location.lat, 
           lng: location.lng, 
           code: weather.current.weatherCode, 
           temp: weather.current.temperature,
           isDay: weather.current.isDay,
           isCurrent: true 
        });
      }
      
      if (majorCitiesWeather.length > 0) {
        markersToDisplay.push(...majorCitiesWeather);
      }

      markersToDisplay.forEach(m => {
          let type: 'sun' | 'rain' | 'cloud' | 'snow' | 'storm' | 'moon' = 'sun';
          
          if (m.code >= 95) type = 'storm';
          else if ((m.code >= 71 && m.code <= 77) || m.code === 85 || m.code === 86) type = 'snow';
          else if ((m.code >= 51 && m.code <= 67) || (m.code >= 80 && m.code <= 82)) type = 'rain';
          else if (m.code >= 1 && m.code <= 48) type = 'cloud';
          else {
             if (m.hasOwnProperty('isDay') && m.isDay === 0) type = 'moon';
             else type = 'sun';
          }

          const isCurrent = !!m.isCurrent;
          const bgClass = isCurrent ? "bg-green-100 border-green-200" : "bg-white border-white";
          
          const iconColor = getSpecificColor(type, 'official');
          const tempDisplay = m.temp !== undefined ? Math.round(m.temp) : '?';
          // Icon Size 22px
          const iconHtml = getIconSvg(type, iconColor, 22); 
          
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="flex flex-col items-center">
                 <div class="flex items-center gap-2 px-3 py-2 ${bgClass} rounded-full shadow-xl border border-gray-100 transform hover:scale-105 transition-transform">
                    <div class="flex items-center justify-center">${iconHtml}</div>
                    <span class="text-sm font-bold text-gray-800">${tempDisplay}°</span>
                 </div>
              </div>
            `,
            iconSize: [80, 48],
            iconAnchor: [40, -10]
          });
          
          const marker = L.marker([m.lat, m.lng], { 
              icon,
              zIndexOffset: isCurrent ? 2000 : 1000 
          }).addTo(mapInstance.current);
          markersRef.current.push(marker);
      });
    } 
    // Community Markers
    else {
      communityReports.forEach(report => {
         const iconElements = report.conditions.map(c => {
            let type: any = 'sun';
            if (c === 'Rain') type = 'rain';
            else if (c === 'Cloudy') type = 'cloud';
            else if (c === 'Windy') type = 'wind';
            else if (c === 'Snow') type = 'snow';
            else if (c === 'Storm') type = 'storm';
            
            // Use specific colors for Purple background
            return getIconSvg(type, getSpecificColor(type, 'community'), 16); 
         }).join('<div class="w-1"></div>');

         const tempDisplay = report.temp !== undefined ? `<span class="text-sm font-bold text-white">${Math.round(report.temp)}°</span>` : '';

         const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="flex flex-col items-center">
                 <div class="map-marker-community h-10 px-3 bg-violet-400 rounded-full flex items-center justify-center shadow-xl gap-2 overflow-visible">
                    <div class="flex items-center">${iconElements}</div>
                    ${tempDisplay}
                 </div>
              </div>
            `,
            iconSize: [80, 48],
            iconAnchor: [40, -10]
          });
          const marker = L.marker([report.lat, report.lng], { icon }).addTo(mapInstance.current);
          markersRef.current.push(marker);
      });
    }

  }, [viewMode, location, weather, cityName, communityReports, majorCitiesWeather]);

  return (
    <div className="absolute inset-0 top-0 left-0 w-full h-full bg-gray-100 z-0">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Floating UI Container - Z-Index 9999 to stay above map */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[9999] flex flex-col items-center pt-20 px-4">
        
        {/* Toggle Switch (Top) */}
        <div className="pointer-events-auto bg-gray-200/90 backdrop-blur-sm p-1 rounded-full flex shadow-lg mb-4">
          <button 
            onClick={() => setViewMode('official')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              viewMode === 'official' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Official Forecasts
          </button>
          <button 
            onClick={() => setViewMode('community')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              viewMode === 'community' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Community Reports
          </button>
        </div>

        {/* Search Bar (Below Toggle) */}
        <div className="pointer-events-auto w-full max-w-md relative z-50 mt-2">
           <div className="relative group">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
               <Search className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
             </div>
             <input 
               type="text" 
               placeholder="Search city..."
               className="w-full pl-10 pr-10 py-3 bg-white/95 backdrop-blur rounded-full shadow-xl text-gray-800 placeholder-gray-400 outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all font-medium"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <div className="absolute inset-y-0 right-3 flex items-center">
                {isSearching ? (
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                ) : (
                  <Crosshair className="text-blue-500 cursor-pointer hover:scale-110 transition-transform" size={20} onClick={() => {
                     if (navigator.geolocation) {
                         navigator.geolocation.getCurrentPosition(pos => updateLocation(pos.coords.latitude, pos.coords.longitude));
                     }
                  }}/>
                )}
             </div>
           </div>
           
           {/* Dropdown Results */}
           {searchResults.length > 0 && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2">
               {searchResults.map((result) => (
                 <div 
                    key={result.id}
                    onClick={() => selectCity(result)}
                    className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors"
                 >
                   <p className="font-bold text-gray-800">{result.name}</p>
                   <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{result.country}</p>
                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

const AlertsPage = () => {
  const { t, alertsCount, cityName } = useContext(AppContext)!;
  const [city, setCity] = useState('');
  const [hasAlert, setHasAlert] = useState(false);

  // Simplified: Only Rain Alert logic
  const handleCreateAlert = () => {
    if (city.length > 2) {
       setHasAlert(true);
    }
  };

  return (
    <div className="p-4 pb-24">
       <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
         <Bell className="text-primary" />
         {t('nav.alerts')}
       </h2>

       {/* Severe Weather Warning Auto-Card */}
       {alertsCount > 0 && (
          <Card className="mb-6 p-4 border-l-4 border-red-500 bg-red-50">
             <div className="flex items-start gap-3">
               <AlertTriangle className="text-red-500 shrink-0" size={24} />
               <div>
                 <h3 className="font-bold text-red-700">SEVERE WEATHER ALERT</h3>
                 <p className="text-sm text-red-600 mt-1">
                   Strong winds or storm conditions detected in {cityName}. Stay safe.
                 </p>
               </div>
             </div>
          </Card>
       )}

       {!hasAlert ? (
         <Card className="p-6">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-3 bg-blue-100 rounded-full text-blue-600">
               <CloudRain size={24} />
             </div>
             <div>
               <h3 className="font-bold text-lg">{t('alert.title')}</h3>
               <p className="text-sm text-gray-500">{t('alert.desc')}</p>
             </div>
           </div>
           
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">{t('alert.city')}</label>
               <div className="relative">
                 <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                 <input 
                   type="text" 
                   value={city}
                   onChange={(e) => setCity(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="e.g. London, UK"
                 />
               </div>
             </div>
             <Button className="w-full" onClick={handleCreateAlert} disabled={city.length < 3}>
               {t('alert.create')}
             </Button>
           </div>
         </Card>
       ) : (
         <Card className="p-6 border-l-4 border-green-500">
           <div className="flex justify-between items-start">
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <Check size={18} className="text-green-500" />
                 <h3 className="font-bold text-gray-800">{t('alert.existing')}</h3>
               </div>
               <p className="text-2xl font-bold text-primary mt-2">{city}</p>
               <p className="text-sm text-gray-500 mt-1">Condition: <span className="font-semibold text-blue-600">{t('alert.rain')}</span></p>
             </div>
             <button onClick={() => setHasAlert(false)} className="text-gray-400 hover:text-red-500">
               <X size={20} />
             </button>
           </div>
         </Card>
       )}
    </div>
  );
};

const ContributionModal = ({ onClose }: { onClose: () => void }) => {
  const { t, addReport } = useContext(AppContext)!;
  const [selected, setSelected] = useState<string[]>([]);
  
  const conditions = [
    { id: 'Sunny', icon: Sun, color: 'text-yellow-500' },
    { id: 'Cloudy', icon: Cloud, color: 'text-gray-500' },
    { id: 'Rain', icon: CloudRain, color: 'text-blue-500' },
    { id: 'Windy', icon: Wind, color: 'text-blue-300' },
    { id: 'Snow', icon: Snowflake, color: 'text-cyan-400' },
    { id: 'Storm', icon: CloudLightning, color: 'text-purple-500' },
  ];

  const toggleCondition = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, id]);
      }
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      addReport(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{t('modal.title')}</h2>
          <p className="text-gray-500 text-sm">Select up to 3 elements to share the weather now.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {conditions.map(({ id, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => toggleCondition(id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                selected.includes(id) 
                  ? 'border-primary bg-blue-50 scale-105 shadow-sm' 
                  : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <Icon size={32} className={`mb-2 ${color}`} />
              <span className={`text-xs font-semibold ${selected.includes(id) ? 'text-primary' : 'text-gray-600'}`}>
                {id}
              </span>
            </button>
          ))}
        </div>

        <Button 
          variant="radiant" 
          className="w-full h-12 text-lg shadow-xl" 
          onClick={handleSubmit}
          disabled={selected.length === 0}
        >
          {t('modal.submit')}
        </Button>
      </Card>
    </div>
  );
};

const FeedbackModal = ({ onClose }: { onClose: () => void }) => {
    const { t } = useContext(AppContext)!;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <Card className="w-full max-w-sm p-8 relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                 </button>
                 <h2 className="text-2xl font-bold mb-8 text-center">Feedback</h2>
                 <div className="space-y-4">
                     <a href="mailto:hello@wiseweatherapp.xyz?subject=Bug Report&body=I found a bug:" 
                        className="flex items-center gap-4 p-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                         <Bug size={24} />
                         <span className="font-bold">{t('feedback.bug')}</span>
                     </a>
                     <a href="mailto:hello@wiseweatherapp.xyz?subject=Feature Request&body=I would like to suggest:" 
                        className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                         <Wand2 size={24} />
                         <span className="font-bold">{t('feedback.feature')}</span>
                     </a>
                 </div>
             </Card>
        </div>
    );
};

// --- App Shell ---

const App = () => {
  const { t, language, setLanguage, unit, setUnit, alertsCount } = useContext(AppContext)!;
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'alerts'>('home');
  const [showContribution, setShowContribution] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Auto-open contribution on first load
  useEffect(() => {
    const timer = setTimeout(() => setShowContribution(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-40 px-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
           <Sun className="text-yellow-400 animate-spin-slow" size={28} />
           <span className="text-xl font-bold radiant-text tracking-tight">Wise Weather</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
             onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
             className="w-8 h-8 rounded-full bg-gray-100 font-bold text-xs text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {language.toUpperCase()}
          </button>
          <button 
             onClick={() => setUnit(unit === 'celsius' ? 'fahrenheit' : 'celsius')}
             className="w-8 h-8 rounded-full bg-gray-100 font-bold text-xs text-gray-700 hover:bg-gray-200 transition-colors"
          >
            °{unit === 'celsius' ? 'C' : 'F'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-20 ${activeTab === 'map' ? 'h-screen p-0 pt-0' : ''}`}>
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuoteBlock />
            <WeatherDashboard />
            <CommunityCarousel />
          </div>
        )}
        {activeTab === 'map' && <MapPage />}
        {activeTab === 'alerts' && <AlertsPage />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-40">
        <div className="flex justify-around items-center h-16 px-2 relative">
          
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'home' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Sun size={24} />
            <span className="text-[10px] font-medium">{t('nav.home')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'map' ? 'text-primary' : 'text-gray-400'}`}
          >
            <MapIcon size={24} />
            <span className="text-[10px] font-medium">{t('nav.map')}</span>
          </button>

          {/* FAB - Contribution Button */}
          <div className="relative -top-6">
            <Button 
               variant="radiant" 
               size="icon" 
               className="w-14 h-14 rounded-full shadow-xl ring-4 ring-white"
               onClick={() => setShowContribution(true)}
            >
               <CloudSun size={28} />
            </Button>
          </div>

          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center gap-1 w-16 relative ${activeTab === 'alerts' ? 'text-primary' : 'text-gray-400'}`}
          >
            <div className="relative">
              <Bell size={24} />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <span className="text-[10px] font-medium">{t('nav.alerts')}</span>
          </button>

          <button 
            onClick={() => setShowFeedback(true)}
            className={`flex flex-col items-center gap-1 w-16 text-gray-400 hover:text-gray-600`}
          >
            <MessageSquare size={24} />
            <span className="text-[10px] font-medium">{t('nav.feedback')}</span>
          </button>

        </div>
      </nav>

      {/* Modals */}
      {showContribution && <ContributionModal onClose={() => setShowContribution(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
};

// --- Entry Point ---

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);