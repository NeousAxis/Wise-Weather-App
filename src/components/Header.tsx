"use client";

import React from 'react';
import { Sun, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTemperatureUnit } from '../context/TemperatureUnitContext';
import { useUI } from '../context/UIContext';
import FeedbackModal from './FeedbackModal';

const Header = () => {
    const { language, setLanguage } = useLanguage();
    const { unit, toggleUnit } = useTemperatureUnit();
    const { isFeedbackOpen, openFeedback, closeFeedback } = useUI();

    return (
        <header className="header container">
            <div className="logo">
                <Sun className="icon-sun" size={28} />
                <span className="radiant-text">Wise Weather</span>
            </div>
            <div className="header-controls">
                {/* Feedback button moved to footer, but keeping modal here or in layout. 
            Actually, let's keep the button here for desktop if needed, but the design shows it in footer.
            I'll hide it here if it's redundant, or keep it as an extra access point. 
            The image shows a clean header with just EN and C. 
            So I will REMOVE the feedback button from header to match Image 5.
        */}
                <button
                    className="btn"
                    onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                >
                    {language.toUpperCase()}
                </button>
                <button
                    className="btn"
                    onClick={toggleUnit}
                >
                    °{unit}
                </button>
            </div>
            <FeedbackModal isOpen={isFeedbackOpen} onClose={closeFeedback} />
        </header>
    );
};

export default Header;
