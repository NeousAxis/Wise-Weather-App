"use client";

import React, { useEffect, useState } from 'react';
import { fetchWeather, WeatherData, weatherCodeToIcon } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { useTemperatureUnit } from '../context/TemperatureUnitContext';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Sunrise, Sunset, Moon, CloudSun, CloudMoon, CloudFog } from 'lucide-react';
import { format } from 'date-fns';
import WeatherCommunityCarousel from './WeatherCommunityCarousel';
import QuoteBlock from './QuoteBlock';

const IconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Sunrise, Sunset, Moon, CloudSun, CloudMoon, CloudFog
};

const WeatherDashboard = () => {
  const { t } = useLanguage();
  const { convertTemp, unit } = useTemperatureUnit();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchWeather(position.coords.latitude, position.coords.longitude);
          setWeather(data);
          // You could fetch city name here
          setLocation('Your Location');
        } catch (err) {
          setError('Failed to load weather data');
        } finally {
          setLoading(false);
        }
      },
      async (error) => {
        try {
          const data = await fetchWeather(20.9517, 105.8200); // Nha Trang
          setWeather(data);
          setLocation('Nha Trang');
        } catch (err) {
          setError('Failed to load weather data');
        } finally {
          setLoading(false);
        }
      }
    );
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!weather) return null;

  const CurrentIcon = IconMap[weatherCodeToIcon(weather.current.weatherCode, weather.current.isDay)] || Cloud;

  return (
    <div className="weather-dashboard">
      <QuoteBlock />
      <div className="current-weather-card">
        <div className="header-row">
          <div className="location-temp">
            <h1 className="location-name">{location}</h1>
            <p className="forecast-label">Official Forecast</p>
          </div>
          <div className="temp-display">
            <CurrentIcon size={48} className="weather-icon-inline" />
            <span className="temperature">{convertTemp(weather.current.temperature)}°{unit}</span>
          </div>
        </div>

        <div className="feels-like-row">
          <span className="feels-like">Feels Like {convertTemp(weather.daily.temperatureMax)}°{unit} / {convertTemp(weather.daily.temperatureMin)}°{unit}</span>
        </div>

        <div className="details-row">
          <div className="detail-item">
            <Sunrise size={20} style={{ color: '#facc15' }} />
            <span className="detail-value">{format(new Date(weather.daily.sunrise), 'h:mm a')}</span>
          </div>
          <div className="detail-item">
            <Sunset size={20} style={{ color: '#f97316' }} />
            <span className="detail-value">{format(new Date(weather.daily.sunset), 'h:mm a')}</span>
          </div>
          <div className="detail-item">
            <Wind size={20} style={{ color: '#64748b' }} />
            <span className="detail-value">{weather.current.windSpeed} km/h</span>
          </div>
          <div className="detail-item">
            <Droplets size={20} style={{ color: '#3b82f6' }} />
            <span className="detail-value">{weather.current.humidity}%</span>
          </div>
        </div>

        <div className="hourly-divider"></div>

        <div className="hourly-forecast">
          <h3 className="section-title">HOURLY FORECAST</h3>
          <div className="hourly-scroll">
            {weather.hourly.time.slice(0, 6).map((time, index) => {
              const date = new Date(time);
              const isDay = date.getHours() > 6 && date.getHours() < 20;
              const iconName = weatherCodeToIcon(weather.hourly.weatherCode[index], isDay);
              const Icon = IconMap[iconName] || Cloud;

              return (
                <div key={time} className="hourly-item">
                  <span className="time">{format(date, 'h a')}</span>
                  <Icon size={28} className="hourly-icon" />
                  <span className="temp">{convertTemp(weather.hourly.temperature[index])}°{unit}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <WeatherCommunityCarousel weather={weather} />

      <style jsx>{`
        .weather-dashboard {
          padding: 1rem 0;
        }
        .current-weather-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin: 0 1rem 1rem 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .location-temp {
          flex: 1;
        }
        .location-name {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--foreground);
          margin: 0;
          line-height: 1.2;
        }
        .forecast-label {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }
        .temp-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .weather-icon-inline {
          color: var(--primary);
        }
        .temperature {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--foreground);
          line-height: 1;
        }
        .feels-like-row {
          text-align: right;
          margin-bottom: 1rem;
        }
        .feels-like {
          font-size: 0.875rem;
          color: #64748b;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .icon-sunrise {
          stroke: #facc15;
        }
        .icon-sunset {
          stroke: #f97316;
        }
        .icon-wind {
          stroke: #64748b;
        }
        .icon-droplets {
          stroke: #3b82f6;
        }
        .detail-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground);
        }
        .hourly-divider {
          height: 1px;
          background: var(--border);
          margin: 1rem 0;
        }
        .hourly-forecast {
          margin: 0;
        }
        .section-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748b;
          margin: 0 0 0.75rem 0;
        }
        .hourly-scroll {
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .hourly-scroll::-webkit-scrollbar {
          display: none;
        }
        .hourly-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          flex: 1;
          min-width: 0;
        }
        .time {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .hourly-icon {
          color: var(--primary);
        }
        .temp {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--foreground);
        }
      `}</style>
    </div>
  );
};

export default WeatherDashboard;
