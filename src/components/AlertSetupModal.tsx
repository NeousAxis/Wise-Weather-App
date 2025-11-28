"use client";

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Bell, X } from 'lucide-react';

interface AlertSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AlertSetupModal = ({ isOpen, onClose }: AlertSetupModalProps) => {
    const { t } = useLanguage();
    const [city, setCity] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!city) return;

        setSubmitting(true);
        try {
            // Geocode city to get lat/lon
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const { latitude, longitude, name } = data.results[0];
                const userId = 'temp-user-id'; // TODO: Replace with real auth

                await addDoc(collection(db, `users/${userId}/alerts`), {
                    city: name,
                    location: { latitude, longitude },
                    condition: 'Rain', // Fixed to Rain as per requirements
                    createdAt: serverTimestamp(),
                });

                onClose();
                alert('Alert set for Rain in ' + name);
            } else {
                alert('City not found');
            }
        } catch (error) {
            console.error("Error saving alert:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
                <h2>Set Rain Alert</h2>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>City</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Enter city name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Condition</label>
                        <div className="condition-preview">
                            <Bell size={20} />
                            <span>Rain (Fixed)</span>
                        </div>
                    </div>
                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Set Alert'}
                    </button>
                </form>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .modal-content {
          background: var(--background);
          padding: 2rem;
          border-radius: 1rem;
          position: relative;
          width: 90%;
          max-width: 400px;
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
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(128, 128, 128, 0.2);
          border-radius: 0.5rem;
          background: var(--background);
          color: var(--foreground);
        }
        .condition-preview {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(128, 128, 128, 0.1);
          border-radius: 0.5rem;
        }
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 1rem;
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
};

export default AlertSetupModal;
