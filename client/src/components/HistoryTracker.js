// ===================================================================================
// --- FILE: src/components/HistoryTracker.js ---
// ===================================================================================
import React from 'react';

const HistoryTracker = ({ history, correctCount, incorrectCount, winCount, lossCount, pushCount, playerBjCount, dealerBjCount }) => {
    const opacities = ['opacity-100', 'opacity-75', 'opacity-60', 'opacity-40', 'opacity-25'];
    
    return (
        <div className="w-full md:w-72 bg-gray-800 bg-opacity-80 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl z-20 group">
            <div className="flex justify-between items-start border-b border-gray-600 pb-2 mb-2">
                <h3 className="text-lg font-bold">History</h3>
                <div className="flex flex-col items-end text-sm space-y-1">
                    <div className="flex gap-3">
                        <span className="text-blue-400">W: {winCount}</span>
                        <span className="text-orange-400">L: {lossCount}</span>
                        <span className="text-gray-400">P: {pushCount}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-green-400">✅ {correctCount}</span>
                        <span className="text-red-400">❌ {incorrectCount}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-yellow-400">P-BJ: {playerBjCount}</span>
                        <span className="text-purple-400">D-BJ: {dealerBjCount}</span>
                    </div>
                </div>
            </div>
            <ul className="space-y-2 max-h-28 overflow-hidden transition-all duration-300 group-hover:max-h-96 group-hover:overflow-y-auto">
                {history.slice(0, 25).map((item, index) => (
                    <li key={index} className={`text-sm transition-opacity duration-300 ${index < 5 ? opacities[index] : 'opacity-25'}`}>
                        {item.isResult ? (
                            <span className="font-bold text-yellow-300">{item.text}</span>
                        ) : (
                            <>
                                <span className={item.correct ? 'text-green-400' : 'text-red-400'}>{item.correct ? '✅' : '❌'}</span> {item.text}
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HistoryTracker;