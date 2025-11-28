"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTemperatureUnit } from '../context/TemperatureUnitContext';
import { Search, MapPin, Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix Leaflet icon issue
import L from 'leaflet';

const MapComponent = () => {
    const { t } = useLanguage();
    const { convertTemp, unit } = useTemperatureUnit();
    const [viewMode, setViewMode] = useState<'official' | 'community'>('official');
    const [searchQuery, setSearchQuery] = useState('');
    const [center, setCenter] = useState<[number, number]>([48.8566, 2.3522]); // Paris default
    const [zoom, setZoom] = useState(13);

    useEffect(() => {
        // Fix Leaflet icon issue
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    // Mock data
    const officialMarkers = [
        { id: 1, lat: 48.8566, lon: 2.3522, temp: 15, condition: 'Sun' },
        { id: 2, lat: 48.8606, lon: 2.3376, temp: 16, condition: 'Cloud' },
    ];

    const communityMarkers = [
        { id: 101, lat: 48.8580, lon: 2.3500, condition: 'Rain', user: 'User1' },
        { id: 102, lat: 48.8550, lon: 2.3550, condition: 'Sun', user: 'User2' },
    ];

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;

        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=1&language=en&format=json`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const { latitude, longitude } = data.results[0];
                setCenter([latitude, longitude]);
            }
        } catch (err) {
            console.error("Search failed", err);
        }
    };

    const handleLocate = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            setCenter([pos.coords.latitude, pos.coords.longitude]);
        });
    };

    // Custom MapController to handle center updates
    const MapController = () => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, zoom);
        }, [center, zoom, map]);
        return null;
    };

    // We need to import React-Leaflet components dynamically inside this component or just assume this component is loaded dynamically.
    // I'll use the "import inside render" or "require" approach if I can't use top-level imports.
    // Actually, the best way in Next.js App Router is to make a wrapper component that imports this one dynamically.
    // So I will write this file using standard imports, but I'll need to make sure 'leaflet' is not accessed during SSR.
    // 'react-leaflet' imports are safe? No, they use 'leaflet'.

    // I'll use the dynamic import approach for the sub-components here to be safe within this file.

    return (
        <div className="map-page">
            <div className="map-controls">
                <form onSubmit={handleSearch} className="search-bar">
                    <input
                        type="text"
                        placeholder={t.map.search_placeholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit"><Search size={20} /></button>
                </form>
                <button className="btn-icon" onClick={handleLocate} title={t.map.my_position}>
                    <Locate size={20} />
                </button>

                <div className="toggle-switch">
                    <button
                        className={`toggle-btn ${viewMode === 'official' ? 'active' : ''}`}
                        onClick={() => setViewMode('official')}
                    >
                        {t.map.official_forecasts}
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'community' ? 'active community' : ''}`}
                        onClick={() => setViewMode('community')}
                    >
                        {t.map.community_reports}
                    </button>
                </div>
            </div>

            <div className="map-container">
                <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <MapController />

                    {viewMode === 'official' ? (
                        officialMarkers.map(m => (
                            <Marker key={m.id} position={[m.lat, m.lon]}>
                                <Popup>
                                    <div className="popup-content">
                                        <strong>Official</strong>
                                        <br />
                                        Temp: {convertTemp(m.temp)}°{unit}
                                        <br />
                                        {m.condition}
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                    ) : (
                        communityMarkers.map(m => (
                            <Marker key={m.id} position={[m.lat, m.lon]}>
                                <Popup>
                                    <div className="popup-content">
                                        <strong>Community</strong>
                                        <br />
                                        User: {m.user}
                                        <br />
                                        {m.condition}
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                    )}
                </MapContainer>
            </div>

            <style jsx>{`
        .map-page {
          height: calc(100vh - var(--header-height));
          display: flex;
          flex-direction: column;
        }
        .map-controls {
          padding: 1rem;
          display: flex;
          gap: 1rem;
          align-items: center;
          background: var(--background);
          z-index: 10;
        }
        .search-bar {
          display: flex;
          align-items: center;
          border: 1px solid rgba(128, 128, 128, 0.2);
          border-radius: 0.5rem;
          padding: 0.5rem;
          flex: 1;
        }
        .search-bar input {
          border: none;
          outline: none;
          flex: 1;
          background: transparent;
          color: var(--foreground);
        }
        .btn-icon {
          background: none;
          border: 1px solid rgba(128, 128, 128, 0.2);
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--foreground);
        }
        .toggle-switch {
          display: flex;
          background: rgba(128, 128, 128, 0.1);
          border-radius: 0.5rem;
          padding: 0.25rem;
        }
        .toggle-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: var(--foreground);
        }
        .toggle-btn.active {
          background: white;
          color: black;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .toggle-btn.active.community {
          background: var(--secondary);
          color: white;
        }
        .map-container {
          flex: 1;
          position: relative;
        }
      `}</style>
        </div>
    );
};

export default MapComponent;
