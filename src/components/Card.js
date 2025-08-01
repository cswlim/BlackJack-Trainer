// ===================================================================================
// --- FILE: src/components/Card.js ---
// ===================================================================================
import React from 'react';

const Card = ({ suit, rank, isHidden, isCutCard }) => {
    if (isCutCard) {
        return <div className="flex-shrink-0 w-[clamp(5rem,18vw,8rem)] h-[clamp(7.5rem,27vw,12rem)] bg-yellow-400 rounded-lg border-2 border-yellow-600 shadow-lg flex items-center justify-center text-black font-bold text-xs sm:text-base">CUT</div>;
    }
    if (isHidden) {
        return <div className="flex-shrink-0 w-[clamp(5rem,18vw,8rem)] h-[clamp(7.5rem,27vw,12rem)] bg-gray-700 rounded-lg border-2 border-gray-800 shadow-lg flex items-center justify-center"><div className="w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] bg-gray-600 rounded-md"></div></div>;
    }
    const suitColor = ['♥', '♦'].includes(suit) ? 'text-red-600' : 'text-gray-900';
    return (
        <div className="relative flex-shrink-0 w-[clamp(5rem,18vw,8rem)] h-[clamp(7.5rem,27vw,12rem)] bg-white rounded-lg border border-gray-200 shadow-md p-1 sm:p-2 transition-all transform animate-deal">
            <div className={`absolute top-1 left-2 text-center leading-none ${suitColor}`}>
                <p className="text-lg sm:text-2xl font-bold">{rank}</p>
            </div>
            <div className={`absolute inset-0 flex items-center justify-center text-[clamp(2.5rem,10vw,4rem)] sm:text-5xl md:text-6xl ${suitColor}`}>
                {suit}
            </div>
            <div className={`absolute bottom-1 right-2 text-center leading-none rotate-180 ${suitColor}`}>
                <p className="text-lg sm:text-2xl font-bold">{rank}</p>
            </div>
        </div>
    );
};

export default Card;
