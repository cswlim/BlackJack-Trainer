import React, { useState } from 'react';
import BlackjackTrainer from './features/StrategyTrainer/StrategyTrainer'; // Corrected import path
import BlackjackCounter from './features/CardCounter/BlackjackCounter';

// Note: Global styles would typically go in a separate index.css file,
// but for this environment, we'll keep them here.
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Roboto+Mono&display=swap');
        
        body {
            font-family: 'Nunito', sans-serif;
            overflow-x: hidden;
            background-color: #121212; /* Ensure background is dark */
        }
        .font-mono {
            font-family: 'Roboto Mono', monospace;
        }
    `}</style>
);

export default function App() {
    const [gameMode, setGameMode] = useState(null);

    // This useEffect hook will run whenever the gameMode changes
    useEffect(() => {
        // Store the original body background color
        const originalColor = document.body.style.backgroundColor;

        if (gameMode === 'solo') {
            // Set the background for the Strategy Trainer
            document.body.style.backgroundColor = '#1f2937'; // A dark slate color
        } else if (gameMode === 'counting') {
            // Set the background for the Card Counter
            document.body.style.backgroundColor = '#121212'; // The dark gray/black color
        } else {
            // Set the background for the main menu
            document.body.style.backgroundColor = '#111827'; // The default dark blue/gray
        }

        // This is a cleanup function that runs when the component unmounts
        // It ensures the background color is reset if you navigate away from the app
        return () => {
            document.body.style.backgroundColor = originalColor;
        };
    }, [gameMode]); // The effect depends on the gameMode state

    if (gameMode === 'solo') {
        return <BlackjackTrainer onGoBack={() => setGameMode(null)} />;
    }

    if (gameMode === 'counting') {
        return <BlackjackCounter onGoBack={() => setGameMode(null)} />;
    }
