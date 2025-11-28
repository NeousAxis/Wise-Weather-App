"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Wind, CloudSnow, CloudLightning, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// no imports for carrousel: le popup reste dédié au reporting

interface WeatherReportingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WeatherReportingModal = ({ isOpen, onClose }: WeatherReportingModalProps) => {
    const { t } = useLanguage();
    const [submitting, setSubmitting] = useState(false);
    const [canClose, setCanClose] = useState(false);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    // le popup ne charge plus la timeline

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setCanClose(true), 10000);
            return () => clearTimeout(timer);
        } else {
            setCanClose(false);
            setSelectedConditions([]);
        }
    }, [isOpen]);

    // aucun chargement de timeline ici

    if (!isOpen) return null;

  const conditions = [
    { id: 'sun', icon: Sun, label: 'Sun' },
    { id: 'cloud', icon: Cloud, label: 'Cloudy' },
    { id: 'rain', icon: CloudRain, label: 'Rain' },
    { id: 'wind', icon: Wind, label: 'Wind' },
    { id: 'snow', icon: CloudSnow, label: 'Snow' },
    { id: 'storm', icon: CloudLightning, label: 'Storm' },
  ];

  const iconColors: Record<string, string> = {
    sun: '#facc15',
    cloud: '#94a3b8',
    rain: '#3b82f6',
    wind: '#14b8a6',
    snow: '#60a5fa',
    storm: '#8b5cf6',
  };

    const toggleCondition = (conditionId: string) => {
        setSelectedConditions(prev => {
            if (prev.includes(conditionId)) {
                return prev.filter(id => id !== conditionId);
            } else if (prev.length < 3) {
                return [...prev, conditionId];
            }
            return prev;
        });
    };

    const handleSubmit = async () => {
        if (selectedConditions.length === 0) return;
        setSubmitting(true);
        try {
            let latitude = 48.8566;
            let longitude = 2.3522;
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
            } catch {}

            const userId = 'temp-user-id';
            await addDoc(collection(db, `users/${userId}/weather_reports`), {
                conditions: selectedConditions,
                location: { latitude, longitude },
                timestamp: serverTimestamp(),
            });
            onClose();
        } catch (error) {
            console.error("Error reporting weather:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {canClose && (
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                )}
                <h2>{t.community.share_prompt}</h2>
                <p className="selection-hint">Select up to 3 weather conditions</p>
                <div className="icons-grid">
                    {conditions.map((item) => (
                        <button
                            key={item.id}
                            className={`icon-btn ${selectedConditions.includes(item.id) ? 'selected' : ''}`}
                            onClick={() => toggleCondition(item.id)}
                            disabled={submitting}
                        >
                            <item.icon size={40} style={{ color: iconColors[item.id] }} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={selectedConditions.length === 0 || submitting}
                >
                    <span className="radiant-text">
                        {t.community.share_button} {selectedConditions.length > 0 && `(${selectedConditions.length})`}
                    </span>
                </button>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          position: relative;
          width: 95%;
          max-width: 800px;
          text-align: left;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--foreground);
        }
        h2 {
          margin-bottom: 0.5rem;
          color: var(--foreground);
        }
        .selection-hint {
          color: #64748b;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .icons-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem 1rem;
          margin-bottom: 2rem;
        }
        
        .icon-btn {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
          background: rgba(128, 128, 128, 0.1);
          border: 2px solid transparent;
          padding: 0.5rem 0.75rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--foreground);
          flex: 1 1 140px;
          max-width: 200px;
        }
        .icon-btn:hover {
          background: rgba(128, 128, 128, 0.2);
        }
        .icon-btn.selected {
          background: rgba(59, 130, 246, 0.08);
          border-color: #3b82f6;
        }
        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .submit-btn {
          width: 100%;
          padding: 1rem 2rem;
          border: none;
          border-radius: 0.5rem;
          background: linear-gradient(to right, #facc15, #f97316, #ec4899, #8b5cf6, #facc15);
          background-size: 200% auto;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s;
          animation: gradient-shift 3s linear infinite;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .submit-btn .radiant-text {
          color: white;
          background: none;
          -webkit-background-clip: unset;
          background-clip: unset;
          animation: none;
        }
        @keyframes gradient-shift {
          to {
            background-position: 200% center;
          }
        }
      `}</style>
        </div>
    );
};

export default WeatherReportingModal;
