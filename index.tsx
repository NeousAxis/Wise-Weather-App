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

  const maxTemp = convertTemp(weather.daily.temperature_2m_max[0], unit);
  const minTemp = convertTemp(weather.daily.temperature_2m_min[0], unit);
  const currentTemp = convertTemp(weather.current.temperature, unit);

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
              {currentTemp}°
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
                 <span className="text-lg font-bold text-foreground">{convertTemp(temp, unit)}°</span>
               </div>
             );
          })}
        </div>
      </div>
    </Card>
  );
};

const CommunityCarousel = () => {
  const { t, weather, communityReports, unit } = useContext(AppContext)!;

  if (!weather) return null;

  // Find current hour index
  const currentHourIndex = weather.hourly.time.findIndex(time => {
     const d = new Date(time);
     const now = new Date();
     return d.getHours() === now.getHours() && d.getDate() === now.getDate();
  });

  if (currentHourIndex === -1) return null;

  // We want past 6 hours including current
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
                <span className="font-bold text-lg">{convertTemp(temp, unit)}°</span>
              </div>
              
              {/* Bottom: Community */}
              <div className="w-full p-3 flex flex-col items-center bg-white relative h-[88px] justify-center">
                <span className="text-[10px] font-bold text-purple-400 mb-2 absolute top-2">{t('community.reports')}</span>
                
                {hasReports ? (
                  <>
                     <div className="flex -space-x-2 mt-2">
                      {displayConditions.slice(0,3).map((condition, ci) => (
                        <div key={ci} className="bg-purple-100 p-1.5 rounded-full border-2 border-white z-10">
                          {getWeatherIconFromLabel(condition, 14)}
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
  const { location, userPosition, weather, cityName, communityReports, searchCity, updateLocation, majorCitiesWeather, unit } = useContext(AppContext)!;
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
            <circle cx="12" cy="12" r="4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 2v2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 20v2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m4.93 4.93 1.41 1.41" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m17.66 17.66 1.41 1.41" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12h2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 12h2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m6.34 17.66-1.41 1.41" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m19.07 4.93-1.41 1.41" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'moon') {
          // Lucide Moon
          svgContent = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else if (type === 'rain') {
          // Lucide CloudRain
          svgContent = `
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 14v6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 14v6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16v6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'cloud') {
          // Lucide Cloud
          svgContent = `
            <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17.5 19c3.037 0 5.5-2.463 5.5-5.5S20.537 8 17.5 8h-1.79A7.002 7.002 0 0 0 3.29 14.9" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'storm') {
          // Lucide CloudLightning
          svgContent = `
            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m13 12-3 5h4l-3 5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'snow') {
          // Lucide Snowflake
          svgContent = `
            <line x1="2" x2="22" y1="12" y2="12" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" x2="12" y1="2" y2="22" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m20 20-4-4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m4 4 4 4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m20 4-4 4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="m4 20 4-4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'wind') {
          // Lucide Wind
           svgContent = `
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      }
      
      // Return SVG with specified size and fill none for clean stroke rendering
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    };

    if (viewMode === 'official') {
      // 1. Current Location Marker
      if (location && weather) {
        const isCurrentGps = userPosition && 
            Math.abs(userPosition.lat - location.lat) < 0.001 && 
            Math.abs(userPosition.lng - location.lng) < 0.001;

        const code = weather.current.weatherCode;
        let iconType: 'sun'|'moon'|'rain'|'cloud'|'storm'|'snow'|'wind' = 'sun';
        let iconColor = '#F59E0B'; // Yellow

        // Determine icon & color based on code & day/night
        if (code >= 95) { iconType = 'storm'; iconColor = '#7C3AED'; }
        else if (code >= 71 || code === 85 || code === 86) { iconType = 'snow'; iconColor = '#06B6D4'; }
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

          let iconType: 'sun'|'moon'|'rain'|'cloud'|'storm'|'snow'|'wind' = 'sun';
          let iconColor = '#F59E0B'; 
          const code = city.code;
          
          if (code >= 95) { iconType = 'storm'; iconColor = '#7C3AED'; }
          else if (code >= 71 || code === 85 || code === 86) { iconType = 'snow'; iconColor = '#06B6D4'; }
          else if (code >= 51 || code >= 80) { iconType = 'rain'; iconColor = '#3B82F6'; }
          else if (code >= 45) { iconType = 'cloud'; iconColor = '#64748B'; }
          else if (code >= 1) { iconType = 'cloud'; iconColor = '#64748B'; }
          else { 
              if (city.isDay === 0) { iconType = 'moon'; iconColor = '#64748B'; }
              else { iconType = 'sun'; iconColor = '#F59E0B'; }
          }
          
          const temp = convertTemp(city.temp, unit);

          const el = L.divIcon({
            className: 'bg-transparent',
            html: `
              <div class="bg-white rounded-full shadow-md border border-gray-100 px-3 py-2 flex items-center gap-2 transform hover:scale-110 transition-transform">
                ${getIconSvg(iconType, iconColor, 22)}
                <span class="font-bold text-gray-800 text-sm">${temp}°</span>
              </div>
            `,
            iconSize: [80, 42],
            iconAnchor: [40, -10]
          });
          markersRef.current.push(L.marker([city.lat, city.lng], { icon: el }).addTo(mapInstance.current));
      });

    } else {
      // Community View
      communityReports.forEach(report => {
        let iconsHtml = '';
        
        report.conditions.forEach(cond => {
            let type: any = 'sun';
            let color = '#F59E0B'; // Default yellow

            // Requirement: Colored icons on community map as well
            switch(cond) {
                case 'Sunny': type = 'sun'; color = '#FCD34D'; break; // Amber
                case 'Cloudy': type = 'cloud'; color = '#E2E8F0'; break; // Light Slate (Cloud)
                case 'Rain': type = 'rain'; color = '#60A5FA'; break; // Blue
                case 'Windy': type = 'wind'; color = '#93C5FD'; break; // Light Blue
                case 'Snow': type = 'snow'; color = '#A5F3FC'; break; // Cyan
                case 'Storm': type = 'storm'; color = '#FBBF24'; break; // Yellow Lightning
                default: type = 'sun'; color = '#F59E0B';
            }
            
            iconsHtml += getIconSvg(type, color, 16);
        });

        const temp = report.temp ? convertTemp(report.temp, unit) : '--';

        // Requirement: Violet Pill (bg-violet-400), No Border, White Temp Text
        const el = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div class="bg-violet-400 rounded-full shadow-md px-3 py-1.5 h-10 flex items-center gap-2 transform hover:scale-110 transition-transform">
              <div class="flex gap-1">
                ${iconsHtml}
              </div>
              <span class="font-bold text-white text-xs">${temp}°</span>
            </div>
          `,
          iconSize: [Math.max(60, 40 + (report.conditions.length * 20)), 40],
          iconAnchor: [30, -10]
        });
        markersRef.current.push(L.marker([report.lat, report.lng], { icon: el, zIndexOffset: 2000 }).addTo(mapInstance.current));
      });
    }

  }, [viewMode, location, weather, communityReports, majorCitiesWeather, userPosition, unit]);

  return (
    <div className="relative w-full h-full">
      {/* Floating UI Controls - High Z-Index */}
      <div className="absolute top-24 left-0 right-0 z-[9999] px-4 flex flex-col items-center gap-4 pointer-events-none">
         
         {/* Toggle Switch */}
         <div className="bg-gray-100 p-1 rounded-full shadow-sm flex pointer-events-auto">
            <button 
              onClick={() => setViewMode('official')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                viewMode === 'official' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Official Forecasts
            </button>
            <button 
              onClick={() => setViewMode('community')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                viewMode === 'community' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Community Reports
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
              placeholder="e.g., Paris, France"
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
                 Search
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

const AlertsPage = () => {
  const { t, alertsCount } = useContext(AppContext)!;
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [hasAlert, setHasAlert] = useState(false);

  // Severe weather simulation
  const isSevere = alertsCount > 0;

  const handleCreate = (e: any) => {
    e.preventDefault();
    if (city && country) setHasAlert(true);
  };

  return (
    <div className="px-4 pb-24">
      <div className="flex items-center gap-2 mb-6 mt-4">
         <div className="p-2 bg-red-100 rounded-lg text-red-600">
            <Bell size={24} />
         </div>
         <h1 className="text-2xl font-bold">{t('nav.alerts')}</h1>
      </div>

      {isSevere && (
          <Card className="mb-6 p-4 bg-red-50 border-red-200">
             <div className="flex gap-3">
               <AlertTriangle className="text-red-600 shrink-0" />
               <div>
                  <h3 className="font-bold text-red-700">SEVERE WEATHER WARNING</h3>
                  <p className="text-sm text-red-600 mt-1">
                    Storm conditions detected in your area. Please stay safe.
                  </p>
               </div>
             </div>
          </Card>
      )}

      {!hasAlert ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-blue-100 rounded-full text-blue-600">
               <CloudRain size={20}/>
             </div>
             <div>
               <h3 className="font-bold text-lg">{t('alert.title')}</h3>
               <p className="text-gray-500 text-sm">{t('alert.desc')}</p>
             </div>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('alert.city')}</label>
              <input 
                type="text" 
                placeholder="e.g. London, UK"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
               <Check size={18} className="text-green-500" />
               <span className="text-sm font-medium text-gray-700">{t('alert.rain')}</span>
            </div>

            <Button variant="radiant" className="w-full h-12 text-lg">
              {t('alert.create')}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-6 border-l-4 border-l-green-500">
           <div className="flex justify-between items-start">
              <div>
                 <h3 className="font-bold text-lg text-gray-900">{t('alert.existing')}</h3>
                 <p className="text-gray-500">{city}</p>
              </div>
              <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">
                Active
              </div>
           </div>
           <div className="mt-4 flex gap-2">
              <CloudRain size={16} className="text-blue-500"/>
              <span className="text-sm text-gray-600">Monitoring for Rain</span>
           </div>
        </Card>
      )}
    </div>
  );
};

const ContributionModal = ({ onClose }: { onClose: () => void }) => {
  const { addReport, t } = useContext(AppContext)!;
  const [selected, setSelected] = useState<string[]>([]);
  
  const toggle = (label: string) => {
    if (selected.includes(label)) {
        setSelected(s => s.filter(i => i !== label));
    } else {
        if (selected.length < 3) {
            setSelected(s => [...s, label]);
        }
    }
  };

  const submit = () => {
    if (selected.length === 0) return;
    addReport(selected);
    onClose();
  };

  const options = [
    { label: 'Sunny', icon: Sun, color: 'text-yellow-500' },
    { label: 'Cloudy', icon: Cloud, color: 'text-gray-400' },
    { label: 'Rain', icon: CloudRain, color: 'text-blue-500' },
    { label: 'Windy', icon: Wind, color: 'text-blue-300' },
    { label: 'Snow', icon: Snowflake, color: 'text-cyan-400' },
    { label: 'Storm', icon: CloudLightning, color: 'text-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{t('modal.title')}</h2>
          <p className="text-gray-500">{t('modal.desc')}</p>
          <p className="text-xs font-bold text-primary mt-2 uppercase tracking-wide">Select up to 3 elements to share the weather now</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => toggle(opt.label)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                selected.includes(opt.label)
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <opt.icon size={32} className={`mb-2 ${opt.color}`} />
              <span className={`text-sm font-medium ${selected.includes(opt.label) ? 'text-blue-700' : 'text-gray-600'}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        <Button 
          variant="radiant" 
          className="w-full h-14 text-lg shadow-xl"
          onClick={submit}
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
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]" onClick={onClose}>
            <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Feedback</h2>
                    <button onClick={onClose}><X className="text-gray-400"/></button>
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
                </div>
            </div>
        </div>
    )
}

// --- App Layout ---

const App = () => {
  const [page, setPage] = useState<'home'|'map'|'alerts'>('home');
  const [showContribution, setShowContribution] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { language, setLanguage, alertsCount, unit, setUnit } = useContext(AppContext)!;

  // Auto-open contribution on first visit
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenContribution');
    if (!hasSeen) {
      setTimeout(() => setShowContribution(true), 2000);
      localStorage.setItem('hasSeenContribution', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden font-sans">
      
      {/* Header - Fixed & Glassy */}
      <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100/50 h-16 flex items-center justify-between px-4 transition-all duration-300">
        <div className="flex items-center gap-2">
            <Sun className="text-yellow-400 animate-spin-slow" size={28} />
            <span className="text-xl font-extrabold tracking-tight radiant-text">
            Wise Weather
            </span>
        </div>
        <div className="flex gap-2">
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
        </div>
      </header>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${page === 'map' ? 'h-screen pt-0' : 'pt-20'}`}>
        {page === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuoteBlock />
            <WeatherDashboard />
            <CommunityCarousel />
          </div>
        )}
        
        {page === 'map' && <MapPage />}
        
        {page === 'alerts' && <AlertsPage />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 text-xs font-medium text-gray-400 pb-safe">
        <button 
          onClick={() => setPage('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${page === 'home' ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <div className="relative">
             <Sun size={24} strokeWidth={page === 'home' ? 2.5 : 2} />
             {page === 'home' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>}
          </div>
          <span>Home</span>
        </button>

        <button 
          onClick={() => setPage('map')}
          className={`flex flex-col items-center gap-1 transition-colors ${page === 'map' ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <MapIcon size={24} strokeWidth={page === 'map' ? 2.5 : 2} />
          <span>Map</span>
        </button>

        {/* Contribution FAB in Center */}
        <div className="relative -top-6">
            <button 
            onClick={() => setShowContribution(true)}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 via-blue-500 to-amber-400 animate-radiant bg-[length:200%_auto] flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-transform border-4 border-white"
            >
            <CloudSun className="text-white" size={40} />
            </button>
        </div>

        <button 
          onClick={() => setPage('alerts')}
          className={`flex flex-col items-center gap-1 transition-colors ${page === 'alerts' ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <div className="relative">
            <Bell size={24} strokeWidth={page === 'alerts' ? 2.5 : 2} />
            {alertsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <span>Alerts</span>
        </button>

        <button 
          onClick={() => setShowFeedback(true)}
          className={`flex flex-col items-center gap-1 transition-colors ${showFeedback ? 'text-primary' : 'hover:text-gray-600'}`}
        >
          <MessageSquare size={24} />
          <span>Feedback</span>
        </button>
      </nav>

      {/* Modals */}
      {showContribution && <ContributionModal onClose={() => setShowContribution(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);