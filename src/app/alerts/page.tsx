"use client";

import React, { useState } from 'react';
import AlertSetupModal from '../../components/AlertSetupModal';

const AlertsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <div className="alerts-card">
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Create a weather alert
                </h1>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                    Get notifications for specific weather conditions in any city.
                </p>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Create Alert
                </button>

                <div style={{ marginTop: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        My Alerts
                    </h2>
                    <p style={{ color: '#64748b' }}>
                        You have no saved alerts.
                    </p>
                </div>
            </div>

            <AlertSetupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <style jsx>{`
        .alerts-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .btn-primary:hover {
          background-color: #2563eb;
        }
      `}</style>
        </div>
    );
};

export default AlertsPage;
