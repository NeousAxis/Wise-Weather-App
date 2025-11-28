"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Bug, Lightbulb, X } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleFeedback = (type: 'bug' | 'feature') => {
        const subject = type === 'bug' ? 'Report a Bug - Wise Weather' : 'Feature Request - Wise Weather';
        const body = type === 'bug' ? 'Please describe the bug you encountered:' : 'Please describe the feature you would like to see:';
        window.location.href = `mailto:hello@wiseweatherapp.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
                <h2>Feedback</h2>
                <div className="options-grid">
                    <button className="option-btn" onClick={() => handleFeedback('bug')}>
                        <Bug size={32} />
                        <span>Report a Bug</span>
                    </button>
                    <button className="option-btn" onClick={() => handleFeedback('feature')}>
                        <Lightbulb size={32} />
                        <span>Request a Feature</span>
                    </button>
                </div>
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
          text-align: center;
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
          margin-bottom: 2rem;
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .option-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          background: rgba(128, 128, 128, 0.1);
          border: none;
          padding: 2rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
          color: var(--foreground);
        }
        .option-btn:hover {
          background: rgba(128, 128, 128, 0.2);
        }
      `}</style>
        </div>
    );
};

export default FeedbackModal;
