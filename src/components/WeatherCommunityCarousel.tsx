"use client";

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTemperatureUnit } from '../context/TemperatureUnitContext';
import { WeatherData, weatherCodeToIcon } from '../lib/api';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subHours } from 'date-fns';

const IconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind
};

const WeatherCommunityCarousel = ({ weather }: { weather: WeatherData }) => {
  const { t } = useLanguage();
  const { convertTemp, unit } = useTemperatureUnit();

  const cards = useMemo(() => {
    const now = new Date();
    const last6Hours = Array.from({ length: 6 }, (_, i) => subHours(now, 5 - i));
    return last6Hours.map((hourDate) => {
      // Find the closest matching hour in weather data
      const hourString = format(hourDate, 'HH:00');
      const targetHour = hourDate.getHours();

    // Find index in weather.hourly.time
    const index = weather.hourly.time.findIndex(time => {
      const weatherHour = new Date(time).getHours();
      return weatherHour === targetHour;
    });

    if (index === -1) return null;

    const officialTemp = weather.hourly.temperature[index];
    const officialCode = weather.hourly.weatherCode[index];
    const isDay = targetHour > 6 && targetHour < 20;
    const OfficialIcon = IconMap[weatherCodeToIcon(officialCode, isDay)] || Cloud;

    // Mock community data - deterministic placeholder based on time string
    const seed = Array.from(hourString).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const hasCommunityReport = (seed % 5) > 2;
    const communityIcon = hasCommunityReport ? ((seed % 2 === 0) ? CloudRain : Cloud) : null;
    const confidence = hasCommunityReport ? ((seed % 3 === 0) ? 'High' : 'Medium') : null;

      return {
        time: hourString,
        official: { Icon: OfficialIcon },
        community: { Icon: communityIcon, confidence }
      };
    }).filter(Boolean);
  }, [weather]);

  

  const [page, setPage] = useState(0);
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
  const visibleCards = cards.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="weather-community">
      <h2 className="section-title">{t.community.title}</h2>
      <p className="section-description">{t.community.subtitle}</p>

      <div className="carousel-wrapper">
        <button
          className="carousel-nav left"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="carousel-container carousel-row">
          {visibleCards.map((card: { time: string; official: { Icon: React.ComponentType<{ size?: number; className?: string }> }; community: { Icon: React.ComponentType<{ size?: number; className?: string }> | null; confidence: 'High' | 'Medium' | null } }, idx: number) => (
            <div
              key={idx}
              className="carousel-card"
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                overflow: 'hidden',
                minHeight: 220,
              }}
            >
              <div className="card-time">{card.time}</div>

              <div className="card-section">
                <div className="section-label">OFFICIAL</div>
                <card.official.Icon size={40} style={{ color: '#60a5fa' }} />
              </div>

              <div className="card-divider"></div>

              <div className="card-section">
                <div className="section-label">COMMUNITY</div>
                {card.community.Icon ? (
                  <>
                    <card.community.Icon size={40} style={{ color: '#64748b' }} />
                    {card.community.confidence && (
                      <div className={`confidence-badge ${card.community.confidence.toLowerCase()}`}>
                        Confidence: {card.community.confidence}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="na-text">N/A</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          className="carousel-nav right"
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <style jsx>{`
                .weather-community {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin: 0 1rem 1rem 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--foreground);
                    margin-bottom: 0.5rem;
                }
                .section-description {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 1.5rem;
                }
                .carousel-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0 1.5rem;
                }
                .carousel-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
                    transition: all 0.2s;
                }
                .carousel-nav[disabled] { opacity: 0.5; cursor: not-allowed; }
                .carousel-nav.left { left: -12px; }
                .carousel-nav.right { right: -12px; }
                .carousel-nav:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }
                .carousel-row {
                    display: flex;
                    flex-wrap: nowrap;
                    gap: 1rem;
                    justify-content: space-between;
                    width: 100%;
                }
                .carousel-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    width: calc((100% - 2rem) / 3);
                    padding-bottom: 1rem;
                    transition: box-shadow 0.2s;
                }
                .carousel-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                }
                .card-time {
                    font-size: 1.25rem;
                    font-weight: 700;
                    text-align: center;
                    padding: 1rem;
                    background: #f8fafc;
                    border-bottom: 1px solid var(--border);
                }
                .card-section {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                }
                .section-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    letter-spacing: 0.05em;
                }
                .card-divider {
                    height: 1px;
                    background: #e5e7eb;
                    margin: 0;
                }
                .confidence-badge {
                    font-size: 0.75rem;
                    font-weight: 500;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    border: 1px solid;
                }
                .confidence-badge.high {
                    color: #16a34a;
                    background: #f0fdf4;
                    border-color: #86efac;
                }
                .confidence-badge.medium {
                    color: #ca8a04;
                    background: #fffbeb;
                    border-color: #f59e0b;
                }
                .na-text {
                    font-size: 1rem;
                    color: #94a3b8;
                    font-style: italic;
                }
            `}</style>
    </div>
  );
};

export default WeatherCommunityCarousel;
