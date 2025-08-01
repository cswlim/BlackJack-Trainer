// ===================================================================================
// --- FILE: src/components/StreakCounter.js ---
// ===================================================================================
import React from 'react';

const StreakCounter = ({ streak, burstAnimClass }) => {
    if (streak < 2) return null;

    const getStreakClass = () => {
        if (streak >= 300) return 'tier-8-box';
        if (streak >= 250) return 'animate-fast-pulse-ring';
        if (streak >= 200) return 'animate-slow-pulse-ring';
        if (streak >= 150) return 'animate-pulse-flicker';
        if (streak >= 100) return 'animate-energy-flicker';
        if (streak >= 50) return 'animate-blue-aura';
        if (streak >= 25) return 'animate-bright-glow';
        if (streak >= 10) return 'animate-subtle-glow';
        return '';
    };
    
    const isCosmic = streak >= 300;

    return (
        <div className={`streak-box mt-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 rounded-xl shadow-2xl flex items-center justify-center gap-2 text-white ${getStreakClass()} ${burstAnimClass}`}>
            <span className={`text-2xl ${isCosmic ? 'cosmic-text' : ''}`}>🔥</span>
            <span className={`text-xl font-bold ${isCosmic ? 'cosmic-text' : ''}`}>{streak} Streak!</span>
        </div>
    );
};

export default StreakCounter;