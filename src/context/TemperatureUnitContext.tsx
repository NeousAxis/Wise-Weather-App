"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Unit = 'C' | 'F';

interface TemperatureUnitContextType {
    unit: Unit;
    toggleUnit: () => void;
    convertTemp: (temp: number) => number;
}

const TemperatureUnitContext = createContext<TemperatureUnitContextType | undefined>(undefined);

export const TemperatureUnitProvider = ({ children }: { children: ReactNode }) => {
    const [unit, setUnit] = useState<Unit>('C');

    const toggleUnit = () => {
        setUnit((prev) => (prev === 'C' ? 'F' : 'C'));
    };

    const convertTemp = (temp: number) => {
        if (unit === 'C') return temp;
        return Math.round((temp * 9) / 5 + 32);
    };

    return (
        <TemperatureUnitContext.Provider value={{ unit, toggleUnit, convertTemp }}>
            {children}
        </TemperatureUnitContext.Provider>
    );
};

export const useTemperatureUnit = () => {
    const context = useContext(TemperatureUnitContext);
    if (context === undefined) {
        throw new Error('useTemperatureUnit must be used within a TemperatureUnitProvider');
    }
    return context;
};
