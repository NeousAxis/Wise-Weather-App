import React, { useState, useEffect, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Sun, Cloud, CloudRain, Wind, Droplets, ArrowUp, ArrowDown, 
  Map as MapIcon, Bell, Menu, X, Heart, Thermometer,
  CloudLightning, Snowflake, Navigation, Check, AlertTriangle, Bug, Wand2,
  Search, MapPin, User, Sunrise, Sunset, Plus, CloudSun, MessageSquare, Layers, Crosshair
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppProvider, AppContext } from './context/AppContext';
import { TRANSLATIONS, MOCK_COMMUNITY_DATA } from './constants';
import { WeatherData, CommunityReport, ConfidenceLevel } from './types';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, size = 'md' }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 focus:ring-blue-500 shadow-md hover:shadow-lg",
    secondary: "bg-white text-foreground border border-gray-200 hover:bg-gray-50 focus:ring-gray-200",
    ghost: "hover:bg-gray-100 text-gray-700",
    radiant: "text-white font-bold bg-gradient-to-r from-amber-400 via-rose-500 to-blue-500 animate-radiant bg-[length:200%_auto] hover:opacity-90 shadow-lg",
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
  // Simple mapping for WMO codes
  if (code === 0) return <Sun size={size} className={`text-yellow-500 ${className}`} />;
  if (code >= 1 && code <= 3) return <Cloud size={size} className={`text-gray-400 ${className}`} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
  if (code >= 71 && code <= 77) return <Snowflake size={size} className={`text-blue-300 ${className}`} />;
  if (code >= 95) return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
  return <Sun size={size} className={`text-yellow-500 ${className}`} />; // Default
};

// --- Features ---

const QuoteBlock = () => {
  const { language } = useContext(AppContext)!;
  // Hardcoded for demo, normally fetched via AI
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
  const { weather, loadingWeather, unit, t } = useContext(AppContext)!;

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
    return d.getHours() === now.getHours() && d.getDate() === now.getDate();
  });
  
  const nextHours = currentHourIndex !== -1 
    ? weather.hourly.time.slice(currentHourIndex, currentHourIndex + 6)
    : [];

  const maxTemp = Math.round(weather.daily.temperature_2m_max[0]);
  const minTemp = Math.round(weather.daily.temperature_2m_min[0]);

  return (
    <Card className="mx-4 mb-6 p-6">
      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Current Location</h2>
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
             const index = currentHourIndex + i;
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
  const { t } = useContext(AppContext)!;
  // Mock logic to determine confidence (simplified)
  const getConfidence = (reports: number[]) => {
    const unique = new Set(reports);
    if (unique.size === 1 && reports.length > 1) return ConfidenceLevel.HIGH;
    if (reports.length === 1) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  };

  return (
    <div className="mx-4 mb-24">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <User size={20} className="text-primary"/>
        {t('community.title')}
      </h3>
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
        {MOCK_COMMUNITY_DATA.map((item, idx) => (
          <Card key={idx} className="min-w-[140px] flex flex-col items-center flex-shrink-0">
            {/* Top: Official */}
            <div className="w-full bg-blue-50 p-3 flex flex-col items-center border-b border-blue-100">
              <span className="text-[10px] font-bold text-blue-400 mb-1">{t('community.official')}</span>
              <Sun size={24} className="text-yellow-500 mb-1" />
              <span className="font-bold text-lg">22°</span>
            </div>
            
            {/* Bottom: Community */}
            <div className="w-full p-3 flex flex-col items-center bg-white relative">
              <span className="text-[10px] font-bold text-purple-400 mb-2">{t('community.reports')}</span>
              <div className="flex -space-x-2 mb-2">
                {item.conditions.map((c, i) => (
                  <div key={i} className="bg-purple-100 p-1.5 rounded-full border-2 border-white z-10">
                    {getWeatherIcon(c, 14, "text-purple-600")}
                  </div>
                ))}
              </div>
              <Badge 
                label={getConfidence(item.conditions)} 
                level={getConfidence(item.conditions)} 
              />
              <span className="absolute top-2 right-2 text-[10px] text-gray-400">-{idx}h</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- Pages & Modals ---

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { location, weather } = useContext(AppContext)!;
  const [viewMode, setViewMode] = useState<'official' | 'community'>('official');

  // 1. Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // 2. Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check if L is available
    const L = (window as any).L;
    if (!L) {
        // Retry once if script is slow
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
          // Default to Paris if location is not yet available
          const initialLat = location ? location.lat : 48.8566;
          const initialLng = location ? location.lng : 2.3522;

          const map = Leaflet.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
          }).setView([initialLat, initialLng], 13);

          // Changed to CartoDB Voyager for colorful map with labels
          Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }).addTo(map);

          mapInstance.current = map;
          
          // Force invalidateSize to ensure map fills container properly
          setTimeout(() => {
            map.invalidateSize();
          }, 100);
        }
    }
  }, []);

  // 3. Update View when location changes
  useEffect(() => {
      if(mapInstance.current && location) {
          mapInstance.current.setView([location.lat, location.lng], 13);
      }
  }, [location]);

  // 4. Handle Markers
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstance.current) return;

    // Clear existing
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Use current location or default
    const lat = location ? location.lat : 48.8566;
    const lng = location ? location.lng : 2.3522;

    // Helper: SVG Icons with Lucide paths for perfect consistency
    const getIconHtml = (type: 'sun' | 'rain' | 'cloud', isCommunity: boolean) => {
      const color = isCommunity ? '#fff' : (type === 'sun' ? '#F59E0B' : type === 'rain' ? '#3B82F6' : '#9CA3AF');
      
      let svgContent = '';
      
      if(type === 'sun') {
          // Lucide 'Sun' path
          svgContent = `
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 20v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4.93 4.93l1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17.66 17.66l1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.34 17.66l-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.07 4.93l-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      } else if (type === 'cloud') {
          // Lucide 'Cloud' path
          svgContent = `
            <path d="M17.5 19c2.485 0 4.5-2.015 4.5-4.5s-2.015-4.5-4.5-4.5c-.4 0-.77.08-1.12.23C15.9 7.65 13.5 6 10.5 6 6.36 6 3 9.36 3 13.5c0 .32.03.64.08.95C1.27 15.17 0 16.92 0 19h17.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          `;
      } else if (type === 'rain') {
           // Lucide 'CloudRain' path
           svgContent = `
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M16 14v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 14v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
      }

      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: ${color}; overflow: visible;">${svgContent}</svg>`;
    };

    if (viewMode === 'official') {
      // Official: White background
      const icon = L.divIcon({
        className: 'map-marker-official',
        html: getIconHtml('sun', false), 
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      const marker = L.marker([lat, lng], { icon }).addTo(mapInstance.current);
      markersRef.current.push(marker);

      // Dummies
      [[0.02, 0.02], [-0.02, -0.01], [0.01, -0.03]].forEach((offset, i) => {
         const icon = L.divIcon({
          className: 'map-marker-official',
          html: getIconHtml(i % 2 === 0 ? 'cloud' : 'rain', false),
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        const m = L.marker([lat + offset[0], lng + offset[1]], { icon }).addTo(mapInstance.current);
        markersRef.current.push(m);
      });

    } else {
      // Community: Purple background
      const numReports = 8;
      for(let i=0; i<numReports; i++) {
        const latOffset = (Math.random() - 0.5) * 0.08;
        const lngOffset = (Math.random() - 0.5) * 0.08;
        const type = Math.random() > 0.6 ? 'rain' : (Math.random() > 0.3 ? 'cloud' : 'sun');
        
        const icon = L.divIcon({
          className: 'map-marker-community',
          html: getIconHtml(type as any, true),
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        
        const m = L.marker([lat + latOffset, lng + lngOffset], { icon }).addTo(mapInstance.current);
        markersRef.current.push(m);
      }
    }
  }, [viewMode, location, weather]);

  const handleRecenter = () => {
    if (location && mapInstance.current) {
        mapInstance.current.setView([location.lat, location.lng], 13);
    }
  };

  return (
    <div className="flex-1 w-full h-full relative isolate"> 
      {/* 1. Search Bar - Floating Independent Card */}
      <div className="absolute top-20 left-0 right-0 z-[500] flex justify-center px-4 mt-2 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl p-3.5 flex items-center gap-3 border border-gray-100 w-full max-w-sm pointer-events-auto">
            <Search className="text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search city..." 
                className="flex-1 bg-transparent outline-none text-base font-medium text-gray-700 placeholder:text-gray-400"
            />
        </div>
      </div>
      
      {/* 2. Toggle - Floating Independent Below Search (Separated) */}
      <div className="absolute top-40 left-0 right-0 z-[500] flex justify-center px-4 mt-2 pointer-events-none">
          {/* Pointer events auto on children to allow clicking, none on container to let map clicks through on sides if wide */}
          <div className="bg-gray-100/90 backdrop-blur-md p-1.5 rounded-full flex shadow-lg border border-gray-200/50 w-full max-w-sm pointer-events-auto">
              <button 
                  onClick={() => setViewMode('official')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all duration-300 ${viewMode === 'official' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Official Forecasts
              </button>
              <button 
                  onClick={() => setViewMode('community')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all duration-300 ${viewMode === 'community' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  Community Reports
              </button>
          </div>
      </div>

      {/* Recenter Button */}
      <div className="absolute bottom-24 right-4 z-[500]">
        <Button variant="secondary" size="icon" className="rounded-full shadow-lg bg-white" onClick={handleRecenter}>
            <Crosshair size={24} className="text-gray-700" />
        </Button>
      </div>

      {/* Map Element - Full Screen */}
      <div id="map" ref={mapRef} className="absolute inset-0 w-full h-full z-0 bg-white" />
    </div>
  );
};

const AlertsPage = () => {
  const { t, weather } = useContext(AppContext)!;
  const [city, setCity] = useState('');
  
  // Persist alert in local state for the session
  const [alert, setAlert] = useState<{city: string, condition: 'rain'} | null>(null);

  const handleCreate = () => {
    if(!city) return;
    setAlert({ city, condition: 'rain' });
  };

  const handleDelete = () => {
    setAlert(null);
    setCity('');
  };

  const isRainDetected = weather?.current.weatherCode ? 
      ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weather.current.weatherCode)) : false;

  const isAlertTriggered = isRainDetected;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('nav.alerts')}</h2>
      </div>

      {/* Active Alert Card */}
      {alert && (
        <Card className={`p-6 border-l-4 transition-all relative overflow-hidden ${isAlertTriggered ? 'border-l-red-500 shadow-lg shadow-red-100/50' : 'border-l-green-500'}`}>
           <div className="flex justify-between items-start relative z-10">
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <div className={`p-1.5 rounded-full ${isAlertTriggered ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {isAlertTriggered ? <AlertTriangle size={16} /> : <Check size={16} />}
                 </div>
                 <h3 className="font-bold text-lg">{t('alert.existing')}</h3>
               </div>
               <p className="text-gray-800 text-2xl font-bold tracking-tight">{alert.city}</p>
               <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 bg-gray-50 inline-flex px-3 py-1 rounded-full border border-gray-200">
                 <CloudRain size={14} className="text-blue-500" />
                 <span>Condition: <span className="font-medium text-gray-700">{t('alert.rain')}</span></span>
               </div>
             </div>
             <button 
               onClick={handleDelete} 
               className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
             >
               <X size={20} />
             </button>
           </div>
           
           {isAlertTriggered && (
             <div className="mt-4 flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 animate-pulse">
               <CloudRain size={18} />
               <span>Rain detected in current forecast!</span>
             </div>
           )}
        </Card>
      )}

      {/* Creation Form */}
      <Card className={`p-6 transition-all duration-300 ${alert ? 'opacity-60 pointer-events-none grayscale-[0.8] scale-[0.98]' : 'scale-100'}`}>
        <div className="flex items-center gap-3 mb-6">
           <div className="p-3 bg-blue-50 rounded-full text-blue-600">
             <CloudRain size={24} />
           </div>
           <div>
             <h3 className="text-xl font-bold">{t('alert.title')}</h3>
             <p className="text-sm text-gray-500">{t('alert.desc')}</p>
           </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('alert.city')}</label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Paris, France"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                disabled={!!alert}
              />
            </div>
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={!city || !!alert} 
            className="w-full h-12 text-lg shadow-lg shadow-blue-500/20"
          >
            {alert ? 'Limit Reached (1/1)' : t('alert.create')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const FeedbackModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useContext(AppContext)!;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{t('nav.feedback')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <a href="mailto:hello@wiseweatherapp.xyz?subject=Bug Report" 
             className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary hover:bg-blue-50 transition-colors group">
            <div className="bg-red-100 p-3 rounded-full text-red-600 group-hover:bg-red-200">
              <Bug size={24} />
            </div>
            <div>
              <p className="font-bold text-foreground">{t('feedback.bug')}</p>
              <p className="text-sm text-gray-500">Something isn't working</p>
            </div>
          </a>
          <a href="mailto:hello@wiseweatherapp.xyz?subject=Feature Request"
             className="flex items-center gap-4 p-4 rounded-xl border hover:border-primary hover:bg-blue-50 transition-colors group">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600 group-hover:bg-purple-200">
              <Wand2 size={24} />
            </div>
            <div>
              <p className="font-bold text-foreground">{t('feedback.feature')}</p>
              <p className="text-sm text-gray-500">I have an idea</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

const ContributionModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useContext(AppContext)!;
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const toggleCondition = (label: string) => {
    if (selectedConditions.includes(label)) {
      setSelectedConditions(prev => prev.filter(c => c !== label));
    } else {
      if (selectedConditions.length < 3) {
        setSelectedConditions(prev => [...prev, label]);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
       <Card className="w-full max-w-md p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('modal.title')}</h2>
            <p className="text-gray-500">Select up to 3 elements to share the weather now.</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-8">
             {[
               { icon: Sun, label: 'Sunny', color: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
               { icon: Cloud, label: 'Cloudy', color: 'text-gray-500 bg-gray-50 border-gray-200' },
               { icon: CloudRain, label: 'Rain', color: 'text-blue-500 bg-blue-50 border-blue-200' },
               { icon: Wind, label: 'Windy', color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
               { icon: Snowflake, label: 'Snow', color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
               { icon: CloudLightning, label: 'Storm', color: 'text-purple-500 bg-purple-50 border-purple-200' },
             ].map((item, i) => {
               const isSelected = selectedConditions.includes(item.label);
               return (
                 <button 
                   key={i} 
                   onClick={() => toggleCondition(item.label)}
                   className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${item.color} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 ring-transparent'}`}
                 >
                   <item.icon size={32} className="mb-2" />
                   <span className="text-xs font-bold">{item.label}</span>
                 </button>
               );
             })}
          </div>

          <Button variant="radiant" size="lg" className="w-full text-white" onClick={onClose}>
            {t('modal.submit')}
          </Button>
       </Card>
    </div>
  );
}

// --- Main Layout ---

const App = () => {
  const { language, setLanguage, unit, setUnit, t } = useContext(AppContext)!;
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'alerts'>('home');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showContribution, setShowContribution] = useState(false);

  // Auto-show contribution modal on first load
  useEffect(() => {
    const timer = setTimeout(() => setShowContribution(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm z-40 flex items-center justify-between px-4 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Sun className="text-yellow-400 fill-yellow-400 animate-pulse" />
          <span className="font-extrabold text-xl tracking-tight radiant-text">Wise Weather</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
             className="w-8 h-8 rounded-full bg-gray-100 text-xs font-bold hover:bg-gray-200 transition-colors"
           >
             {language.toUpperCase()}
           </button>
           <button 
             onClick={() => setUnit(unit === 'celsius' ? 'fahrenheit' : 'celsius')}
             className="w-8 h-8 rounded-full bg-gray-100 text-xs font-bold hover:bg-gray-200 transition-colors"
           >
             °{unit === 'celsius' ? 'C' : 'F'}
           </button>
        </div>
      </header>

      {/* Content - Remove top padding when map is active for immersive feel */}
      <main className={`flex flex-col h-screen ${activeTab === 'map' ? 'pt-0' : 'pt-20'}`}>
        {activeTab === 'home' && (
          <div className="overflow-y-auto pb-24">
            <QuoteBlock />
            <WeatherDashboard />
            <CommunityCarousel />
          </div>
        )}
        {activeTab === 'map' && <MapPage />}
        {activeTab === 'alerts' && <AlertsPage />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-40 h-20">
        <div className="flex items-center justify-around h-16 px-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === 'home' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Sun size={24} />
            <span className="text-[10px] font-medium">{t('nav.home')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === 'map' ? 'text-primary' : 'text-gray-400'}`}
          >
            <MapIcon size={24} />
            <span className="text-[10px] font-medium">{t('nav.map')}</span>
          </button>

          {/* Center Action Button */}
          <div className="-mt-8">
            <Button 
              onClick={() => setShowContribution(true)}
              variant="radiant" 
              className="rounded-full w-14 h-14 shadow-xl flex items-center justify-center p-0"
            >
              <CloudSun size={32} className="text-white" />
            </Button>
          </div>

          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center justify-center w-16 gap-1 ${activeTab === 'alerts' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Bell size={24} />
            <span className="text-[10px] font-medium">{t('nav.alerts')}</span>
          </button>

          <button 
            onClick={() => setShowFeedback(true)}
            className="flex flex-col items-center justify-center w-16 gap-1 text-gray-400 hover:text-primary transition-colors"
          >
            <MessageSquare size={24} />
            <span className="text-[10px] font-medium">{t('nav.feedback')}</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showContribution && <ContributionModal onClose={() => setShowContribution(false)} />}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);