"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isFeedbackOpen: boolean;
    openFeedback: () => void;
    closeFeedback: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const openFeedback = () => setIsFeedbackOpen(true);
    const closeFeedback = () => setIsFeedbackOpen(false);

    return (
        <UIContext.Provider value={{ isFeedbackOpen, openFeedback, closeFeedback }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
