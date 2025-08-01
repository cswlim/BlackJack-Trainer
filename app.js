import React, { useState } from 'react';
import BlackjackTrainer from './features/StrategyTrainer/BlackjackTrainer';
import BlackjackCounter from './features/CardCounter/BlackjackCounter';

// Note: Global styles would typically go in an index.css file,
// but for this environment, we'll keep them here.
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Roboto+Mono&display=swap');
        body { font-family: 'Nunito', sans-serif; overflow-x: hidden; }
        .font-mono { font-family: 'Roboto Mono', monospace; }
        /* ... other global styles ... */
    `}</style>
);

export default function App() {
    const [gameMode, setGameMode] = useState(null);

    if (gameMode === 'solo') {
        return <BlackjackTrainer onGoBack={() => setGameMode(null)} />;
    }

    if (gameMode === 'counting') {
        return <BlackjackCounter onGoBack={() => setGameMode(null)} />;
    }

    return (
        <>
            <GlobalStyles />
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 bg-gray-900`}>
                <h1 className="text-4xl font-bold text-gray-100 transition-colors duration-300">Blackjack Trainer</h1>
                <p className="text-gray-400 transition-colors duration-300 mb-8">Select your training mode.</p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button onClick={() => setGameMode('solo')} className="px-8 py-4 bg-blue-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-blue-600 transition">Strategy Trainer</button>
                    <button onClick={() => setGameMode('counting')} className="px-8 py-4 bg-green-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-green-600 transition">Card Counter</button>
                </div>
            </div>
        </>
    );
}
