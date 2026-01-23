import { useState, useEffect } from 'react';

// CONSTANTS
const MS_PER_CONTRIBUTION = 3600 * 1000; // 1 hour
const STORAGE_KEY = 'wise_contributor_state_v2'; // Bump version

interface ContributorState {
    accessExpiration: number; // Timestamp (ms) when access expires
    strikeCount: number;      // Qualité : Nombre de contributions "ratées"
}

export const useContributorLogic = () => {
    // État par défaut
    const [state, setState] = useState<ContributorState>({
        accessExpiration: 0,
        strikeCount: 0
    });

    // Charger l'état au démarrage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migration safety
                if (!parsed.accessExpiration) parsed.accessExpiration = 0;
                if (parsed.strikeCount === undefined) parsed.strikeCount = 0;
                setState(parsed);
            } catch (e) {
                console.error("Error parsing contributor state", e);
            }
        }
    }, []);

    const saveState = (newState: ContributorState) => {
        setState(newState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    };

    const recordContribution = () => {
        // En cas de ban (3 strikes), on ne gagne plus de temps
        if (state.strikeCount >= 3) return state;

        const now = Date.now();
        // Si expiré, on repart de "now". Si encore valide, on ajoute à la fin.
        const currentExpiration = Math.max(now, state.accessExpiration);
        const newExpiration = currentExpiration + MS_PER_CONTRIBUTION;

        const newState = {
            ...state,
            accessExpiration: newExpiration
        };

        saveState(newState);
        return newState;
    };

    // --- QUALITÉ : FONCTION DE SANCTION ---
    const recordCommunityStrike = () => {
        const newStrikes = state.strikeCount + 1;
        const newState = { ...state, strikeCount: newStrikes };
        saveState(newState);
        return newState;
    };

    const resetStrikes = () => {
        const newState = { ...state, strikeCount: 0 };
        saveState(newState);
    };

    // --- OUTILS DE TRICHE / DEBUG ---
    const debug_AddHour = () => {
        const now = Date.now();
        const currentExpiration = Math.max(now, state.accessExpiration);
        saveState({ ...state, accessExpiration: currentExpiration + MS_PER_CONTRIBUTION });
    };

    const debug_ResetExpire = () => {
        saveState({ ...state, accessExpiration: 0 }); // Tout de suite expiré
    };

    const debug_SimulateExpireIn1Min = () => {
        saveState({ ...state, accessExpiration: Date.now() + 60000 });
    };

    // L'accès est accordé SI : Temps restant > 0 ET Moins de 3 fautes (Qualité)
    const isAccessGranted = state.strikeCount < 3 && Date.now() < state.accessExpiration;

    // Remaining (live calc might need interval in UI, but this gives snapshot)
    const remainingMs = Math.max(0, state.accessExpiration - Date.now());

    return {
        contributorState: state,
        recordContribution,
        recordCommunityStrike,
        resetStrikes,
        isAccessGranted,
        remainingMs,
        debug: {
            addHour: debug_AddHour,
            expireNow: debug_ResetExpire,
            expireSoon: debug_SimulateExpireIn1Min
        }
    };
};
