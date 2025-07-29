import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- HELPER FUNCTIONS & DATA ---

const getBasicStrategy = (playerHand, dealerUpCard) => {
    const handValue = card => {
        if (!card) return 0;
        if (['J', 'Q', 'K'].includes(card.rank)) return 10;
        if (card.rank === 'A') return 11;
        return parseInt(card.rank);
    };

    const calculateScore = (hand) => {
        let score = 0;
        let aceCount = 0;
        hand.forEach(card => {
            if (!card) return;
            if (card.rank === 'A') {
                aceCount++;
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                score += 10;
            } else {
                score += parseInt(card.rank);
            }
        });

        if (aceCount === 0) {
            return { score: score, isSoft: false, display: `${score}` };
        }

        const lowScore = score + aceCount;
        const highScore = lowScore + 10;
        
        if (highScore === 21 && hand.length === 2) {
            return { score: 21, isSoft: false, display: 'Blackjack' };
        }

        if (highScore > 21) {
            return { score: lowScore, isSoft: false, display: `${lowScore}` };
        } else {
            return { score: highScore, isSoft: true, display: `${lowScore} / ${highScore}` };
        }
    };

    const player = calculateScore(playerHand);
    const dealerValue = handValue(dealerUpCard);
    const canDouble = playerHand.length === 2;

    // Strategy based on the provided chart (4/6/8 Decks, Dealer Stands on All 17s)
    // H = Hit, S = Stand, D = Double, P = Split, R = Surrender (not implemented, default to H)

    // Pairs
    if (playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank) {
        const rank = playerHand[0].rank;
        switch (rank) {
            case 'A': return 'P';
            case '10': case 'J': case 'Q': case 'K': return 'S';
            case '9':
                if ([7, 10, 11].includes(dealerValue)) return 'S';
                return 'P';
            case '8': return 'P';
            case '7':
                if (dealerValue <= 7) return 'P';
                return 'H';
            case '6':
                if (dealerValue <= 6) return 'P';
                return 'H';
            case '5':
                if (dealerValue <= 9) return canDouble ? 'D' : 'H'; // Chart says D vs 2-9
                return 'H';
            case '4':
                // Custom rule: 4,4 vs 4 is Hit, not Split (as per user request, overriding chart)
                if (dealerValue === 4) return 'H';
                if ([5, 6].includes(dealerValue)) return 'P'; // Chart says P vs 5,6
                return 'H'; // All other 4,4 pairs are Hit
            case '3': case '2':
                if (dealerValue <= 7) return 'P';
                return 'H';
            default: return 'H'; // Should not happen
        }
    }

    // Soft Totals
    if (player.isSoft) {
        const softTotal = player.score; // This is the high score (e.g., A+7 = 18)
        switch (softTotal) {
            case 20: // A,9
                return 'S';
            case 19: // A,8
                if (dealerValue === 6) return canDouble ? 'D' : 'S';
                return 'S';
            case 18: // A,7
                if ([2, 3, 4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'S';
                if ([7, 8].includes(dealerValue)) return 'S';
                return 'H';
            case 17: // A,6
                if ([3, 4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 16: // A,5
                if ([4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 15: // A,4
                if ([4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 14: // A,3
                if ([5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 13: // A,2
                if ([5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            default: return 'H'; // Should not happen for soft totals < 13
        }
    }

    // Hard Totals
    const hardTotal = player.score; // This is the final score if not soft
    if (hardTotal >= 17) return 'S';
    if (hardTotal >= 13 && hardTotal <= 16) {
        if (dealerValue <= 6) return 'S';
        return 'H';
    }
    if (hardTotal === 12) {
        if ([4, 5, 6].includes(dealerValue)) return 'S';
        return 'H';
    }
    if (hardTotal === 11) {
        if (dealerValue === 11) return 'H'; // Chart says H vs A
        return canDouble ? 'D' : 'H';
    }
    if (hardTotal === 10) {
        if (dealerValue <= 9) return canDouble ? 'D' : 'H';
        return 'H';
    }
    if (hardTotal === 9) {
        if (dealerValue >= 3 && dealerValue <= 6) return canDouble ? 'D' : 'H';
        return 'H';
    }
    // Hard totals 5-8 (chart says H for all)
    if (hardTotal >= 5 && hardTotal <= 8) return 'H';

    return 'H'; // Default catch-all, should be covered by above
};

const getCardCountValue = (card) => {
    const rank = card.rank;
    if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
    if (['10', 'J', 'Q', 'K', 'A'].includes(rank)) return -1;
    return 0;
};

// --- UI COMPONENTS ---

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

const CountPromptModal = ({ onConfirm }) => {
    const [count, setCount] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 p-6 rounded-xl shadow-2xl w-80 text-center">
                <h3 className="text-xl font-bold mb-4 text-gray-100">What's the Running Count?</h3>
                <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full p-3 text-center text-2xl font-mono bg-gray-800 border border-gray-600 rounded-lg mb-4 text-gray-100"
                    autoFocus
                />
                <button onClick={() => onConfirm(parseInt(count))} className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition">Confirm</button>
            </div>
        </div>
    );
};

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

const StreakCounter = ({ streak }) => {
    if (streak < 2) return null;

    const getStreakClass = () => {
        if (streak >= 300) return 'animate-god-tier text-white';
        if (streak >= 250) return 'animate-mythic text-yellow-300';
        if (streak >= 200) return 'animate-grandmaster text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500';
        if (streak >= 150) return 'animate-mastery text-gray-200';
        if (streak >= 100) return 'text-orange-400 animate-super-saiyan';
        if (streak >= 75) return 'text-cyan-400 animate-legendary';
        if (streak >= 50) return 'text-red-400 animate-pulse-fast';
        if (streak >= 25) return 'text-yellow-400 animate-glow-strong';
        if (streak >= 10) return 'text-yellow-300 animate-glow';
        return 'text-white';
    };

    return (
        <div className={`mt-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 rounded-xl shadow-2xl z-20 flex items-center justify-center gap-2 ${getStreakClass()}`}>
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold">{streak} Streak!</span>
        </div>
    );
};

const BasicStrategyChartModal = ({ playerHand, dealerUpCard, onClose, calculateScore }) => {
    const dealerRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
    // Hard totals from the provided chart, including 5-7 as a range
    const hardTotals = ['5-7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17+'];
    const softTotals = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
    const pairs = ['2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s', 'As']; // Updated pairs notation

    // Strategy data matching the provided image
    const strategyData = {
        hard: {
            '17+': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
            '16': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
            '15': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
            '14': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
            '13': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
            '12': ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
            '11': ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'],
            '10': ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
            '9': ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
            '8': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
            '5-7': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        },
        soft: {
            'A,9': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
            'A,8': ['S', 'S', 'S', 'S', 'D', 'S', 'S', 'S', 'S', 'S'],
            'A,7': ['D', 'D', 'D', 'D', 'D', 'S', 'S', 'H', 'H', 'H'],
            'A,6': ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
            'A,5': ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
            'A,4': ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
            'A,3': ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
            'A,2': ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
        },
        pairs: {
            'As': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            '10s': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
            '9s': ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'],
            '8s': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            '7s': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
            '6s': ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
            '5s': ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
            '4s': ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'], // Changed 4,4 vs 4 from P to H
            '3s': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
            '2s': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
        }
    };

    const getPlayerHandKeyForChart = useCallback((hand) => {
        if (!hand || hand.length === 0) return null;
        const { score, isSoft } = calculateScore(hand);
        const ranks = hand.map(card => card.rank);

        // Handle pairs (normalize J,Q,K to 10)
        if (hand.length === 2 && ranks[0] === ranks[1]) {
            const normalizedRank = ['J', 'Q', 'K'].includes(ranks[0]) ? '10' : ranks[0];
            return `${normalizedRank}s`; // Use 's' suffix
        }
        // Handle soft totals
        if (isSoft) {
            if (score >= 20) return 'A,9';
            if (score === 19) return 'A,8';
            if (score === 18) return 'A,7';
            if (score === 17) return 'A,6';
            if (score === 16) return 'A,5';
            if (score === 15) return 'A,4';
            if (score === 14) return 'A,3';
            if (score === 13) return 'A,2';
        }
        // Handle hard totals
        if (score >= 17) return '17+';
        if (score >= 5 && score <= 7) return '5-7';
        return `${score}`;
    }, [calculateScore]);

    const getDealerUpCardKeyForChart = useCallback((card) => {
        if (!card) return null;
        // Normalize J,Q,K to 10 for dealer's up-card
        if (['J', 'Q', 'K'].includes(card.rank)) return '10';
        if (card.rank === 'A') return 'A';
        return card.rank;
    }, []);

    const playerKey = playerHand ? getPlayerHandKeyForChart(playerHand) : null;
    const dealerKey = dealerUpCard ? getDealerUpCardKeyForChart(dealerUpCard) : null;

    const getActionColorClass = (action) => {
        switch (action) {
            case 'H': return 'bg-green-700 text-white';   // Hit: Muted Green
            case 'S': return 'bg-red-700 text-white';     // Stand: Muted Red
            case 'D': return 'bg-orange-700 text-white';  // Double: Muted Orange/Gold
            case 'P': return 'bg-blue-900 text-white';    // Split: Darker Blue (Navy)
            default: return 'bg-gray-700 text-gray-100';  // Default or unknown
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 p-4 rounded-xl shadow-2xl w-full max-w-sm md:max-w-xl max-h-[95vh] overflow-y-auto text-gray-100 relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center text-blue-400">Basic Strategy Chart</h2>

                <div className="space-y-6">
                    {/* Hard Totals */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-yellow-300">Hard Totals</h3>
                        <table className="w-full table-fixed border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-700">
                                    <th className="p-1 text-center w-1/12">P</th>
                                    {dealerRanks.map(rank => (
                                        <th key={rank} className="p-1 text-center w-[8.8%]">{rank}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {hardTotals.slice().reverse().map(playerTotal => (
                                    <tr key={playerTotal} className="odd:bg-gray-700 even:bg-gray-900">
                                        <td className="p-1 text-center font-bold">{playerTotal}</td>
                                        {dealerRanks.map((dealerRank, colIndex) => {
                                            const isHighlighted = (playerKey === playerTotal && dealerKey === dealerRank);
                                            const cellValue = strategyData.hard[playerTotal][colIndex];
                                            return (
                                                <td key={dealerRank} className={`p-1 text-center font-semibold
                                                    ${getActionColorClass(cellValue)}
                                                    ${isHighlighted ? 'border-4 border-yellow-300' : ''}`}>
                                                    {cellValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Soft Totals */}
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-yellow-300">Soft Totals</h3>
                        <table className="w-full table-fixed border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-700">
                                    <th className="p-1 text-center w-1/12">P</th>
                                    {dealerRanks.map(rank => (
                                        <th key={rank} className="p-1 text-center w-[8.8%]">{rank}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {softTotals.slice().reverse().map(playerTotal => (
                                    <tr key={playerTotal} className="odd:bg-gray-700 even:bg-gray-900">
                                        <td className="p-1 text-center font-bold">{playerTotal}</td>
                                        {dealerRanks.map((dealerRank, colIndex) => {
                                            const isHighlighted = (playerKey === playerTotal && dealerKey === dealerRank);
                                            const cellValue = strategyData.soft[playerTotal][colIndex];
                                            return (
                                                <td key={dealerRank} className={`p-1 text-center font-semibold
                                                    ${getActionColorClass(cellValue)}
                                                    ${isHighlighted ? 'border-4 border-yellow-300' : ''}`}>
                                                    {cellValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pairs */}
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-yellow-300">Pairs</h3>
                        <table className="w-full table-fixed border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-700">
                                    <th className="p-1 text-center w-1/12">P</th>
                                    {dealerRanks.map(rank => (
                                        <th key={rank} className="p-1 text-center w-[8.8%]">{rank}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pairs.slice().reverse().map(playerTotal => (
                                    <tr key={playerTotal} className="odd:bg-gray-700 even:bg-gray-900">
                                        <td className="p-1 text-center font-bold">{playerTotal}</td>
                                        {dealerRanks.map((dealerRank, colIndex) => {
                                            const isHighlighted = (playerKey === playerTotal && dealerKey === dealerRank);
                                            const cellValue = strategyData.pairs[playerTotal][colIndex];
                                            return (
                                                <td key={dealerRank} className={`p-1 text-center font-semibold
                                                    ${getActionColorClass(cellValue)}
                                                    ${isHighlighted ? 'border-4 border-yellow-300' : ''}`}>
                                                    {cellValue}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

export default function App() {
    const [gameMode, setGameMode] = useState(null);
    const NUM_DECKS = 6;

    const [deck, setDeck] = useState([]);
    const [cutCardPosition, setCutCardPosition] = useState(0);
    const [isCutCardRevealed, setIsCutCardRevealed] = useState(false);
    const [showCutCardOnTable, setShowCutCardOnTable] = useState(false);
    const [gameState, setGameState] = useState('pre-game');
    
    const [playerHands, setPlayerHands] = useState([]);
    const [activeHandIndex, setActiveHandIndex] = useState(0);
    const [dealerHand, setDealerHand] = useState({ cards: [] });
    
    const [tableHands, setTableHands] = useState(Array.from({ length: 7 }, () => ({ cards: [], score: 0, display: '0', status: 'playing' })));
    const [playerSeat, setPlayerSeat] = useState(null);
    const [runningCount, setRunningCount] = useState(0);
    const [showCountPrompt, setShowCountPrompt] = useState(false);
    const [activeTableHandIndex, setActiveTableHandIndex] = useState(0);
    const [pendingPlayerAction, setPendingPlayerAction] = useState(null);

    const [message, setMessage] = useState('Select a game mode to start.');
    const [feedback, setFeedback] = useState('');
    const [isFeedbackCorrect, setIsFeedbackCorrect] = useState(false); // New state for feedback color
    const [history, setHistory] = useState([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [winCount, setWinCount] = useState(0);
    const [lossCount, setLossCount] = useState(0);
    const [pushCount, setPushCount] = useState(0);
    const [playerBjCount, setPlayerBjCount] = useState(0);
    const [dealerBjCount, setDealerBjCount] = useState(0);
    const [streakCount, setStreakCount] = useState(0);
    const [isActionDisabled, setIsActionDisabled] = useState(false);
    const lastActionFeedback = useRef('');
    const endOfRoundMessageSet = useRef(false);
    const [showChartModal, setShowChartModal] = useState(false); // State for chart modal

    const createShoe = useCallback(() => {
        const suits = ['♠', '♣', '♥', '♦'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        let newDeck = [];
        for (let i = 0; i < NUM_DECKS; i++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    newDeck.push({ suit, rank });
                }
            }
        }
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        
        const min = Math.floor(newDeck.length * 0.72);
        const max = Math.floor(newDeck.length * 0.78);
        setCutCardPosition(Math.floor(Math.random() * (max - min + 1)) + min);

        setDeck(newDeck);
        setRunningCount(0);
        setIsCutCardRevealed(false);
        setShowCutCardOnTable(false);
    }, []);

    const calculateScore = useCallback((hand) => {
        let scoreWithoutAces = 0;
        let aceCount = 0;
        hand.forEach(card => {
            if (!card) return;
            if (card.rank === 'A') {
                aceCount++;
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                scoreWithoutAces += 10;
            } else {
                scoreWithoutAces += parseInt(card.rank);
            }
        });

        if (aceCount === 0) {
            return { score: scoreWithoutAces, isSoft: false, display: `${scoreWithoutAces}` };
        }

        const lowScore = scoreWithoutAces + aceCount;
        const highScore = lowScore + 10;
        
        if (highScore === 21 && hand.length === 2) {
            return { score: 21, isSoft: false, display: 'Blackjack' };
        }

        if (highScore > 21) {
            return { score: lowScore, isSoft: false, display: `${lowScore}` };
        } else {
            return { score: highScore, isSoft: true, display: `${lowScore} / ${highScore}` };
        }
    }, []);

    const dealCard = useCallback((callback) => {
        setDeck(prevDeck => {
            if (prevDeck.length === 0) {
                callback(null);
                return [];
            }
            const newDeck = [...prevDeck];
            if (newDeck.length === cutCardPosition) {
                setIsCutCardRevealed(true);
                setShowCutCardOnTable(true);
            }
            const card = newDeck.pop();
            setRunningCount(prev => prev + getCardCountValue(card));
            callback(card);
            return newDeck;
        });
    }, [cutCardPosition]);

    const dealNewGame = useCallback(() => {
        if (gameState !== 'pre-deal' && gameState !== 'end') return; // Prevent dealing mid-game

        const performDeal = () => {
            endOfRoundMessageSet.current = false;
            lastActionFeedback.current = '';
            setMessage('');
            setFeedback('');
            setIsFeedbackCorrect(false); // Reset feedback color
            setActiveHandIndex(0);
            
            if (gameMode === 'solo') {
                let cardsToDeal = [];
                let dealtCount = 0;
                const dealInitialSolo = () => {
                    if (dealtCount < 4) {
                        dealCard(card => {
                            if (!card) return; // Stop if deck runs out
                            cardsToDeal.push(card);
                            dealtCount++;
                            setTimeout(dealInitialSolo, 50); // Short delay for dealing animation
                        });
                    } else {
                        const [playerCard1, dealerCard1, playerCard2, dealerCard2] = cardsToDeal;
                        const tempPlayerHand = [playerCard1, playerCard2];
                        const tempDealerHand = [dealerCard1, { ...dealerCard2, isHidden: true }];
                        const playerInitialState = { cards: tempPlayerHand, ...calculateScore(tempPlayerHand), status: 'playing' };
                        setPlayerHands([playerInitialState]);
                        setDealerHand({ cards: tempDealerHand });
                        const playerHasBj = playerInitialState.score === 21;
                        const dealerHasBj = calculateScore([dealerCard1, dealerCard2]).score === 21;
                        if (playerHasBj || dealerHasBj) {
                            setGameState('end');
                        } else {
                            setGameState('player-turn');
                        }
                    }
                };
                dealInitialSolo();
            } 
        };

        if (isCutCardRevealed) {
            setMessage("Cut card revealed. Reshuffling after this round.");
            createShoe();
            setTimeout(performDeal, 1500); // Give user time to read message
        } else {
            performDeal();
        }
    }, [isCutCardRevealed, gameMode, createShoe, calculateScore, dealCard, gameState]);
    
    const executePlayerAction = useCallback((actionCode, actionName) => {
        setIsActionDisabled(true);
        const hands = playerHands;
        const handIndex = activeHandIndex;
        const handsUpdater = setPlayerHands;

        const currentHandRef = hands[handIndex];
        const dealerUpCard = dealerHand.cards.find(c => !c.isHidden);
        const correctMove = getBasicStrategy(currentHandRef.cards, dealerUpCard);
        
        const isCorrect = actionCode === correctMove;
        
        if (isCorrect) {
            setFeedback('✅');
            setIsFeedbackCorrect(true);
            setCorrectCount(prev => prev + 1);
            setStreakCount(prev => prev + 1);
            lastActionFeedback.current = "Correct!";
        } else {
            setFeedback(`❌ Correct: ${correctMove}`);
            setIsFeedbackCorrect(false);
            setIncorrectCount(prev => prev + 1);
            setStreakCount(0);
            lastActionFeedback.current = "Incorrect.";
        }
        
        const historyItem = { text: `You ${actionName} on ${currentHandRef.display}. Correct: ${correctMove}.`, correct: isCorrect };
        setHistory(prevHistory => [historyItem, ...prevHistory]);

        switch(actionCode) {
            case 'H':
                dealCard(card => {
                    if(!card) return;
                    handsUpdater(prevHands => {
                        const newHands = JSON.parse(JSON.stringify(prevHands));
                        const currentHand = newHands[handIndex];
                        currentHand.cards.push(card);
                        Object.assign(currentHand, calculateScore(currentHand.cards));
                        return newHands;
                    });
                });
                break;
            case 'D':
                dealCard(card => {
                    if(!card) return;
                    handsUpdater(prevHands => {
                        const newHands = JSON.parse(JSON.stringify(prevHands));
                        const currentHand = newHands[handIndex];
                        currentHand.cards.push(card);
                        Object.assign(currentHand, calculateScore(currentHand.cards));
                        currentHand.status = 'stood';
                        currentHand.doubled = true;
                        return newHands;
                    });
                });
                break;
            case 'S': {
                handsUpdater(prevHands => {
                    const newHands = JSON.parse(JSON.stringify(prevHands));
                    const currentHand = newHands[handIndex];
                    currentHand.status = 'stood';
                    return newHands;
                });
                break;
            }
            case 'P': {
                const handToSplit = hands[handIndex].cards;
                const isAces = handToSplit[0].rank === 'A';
                
                if (isAces) {
                    dealCard(card1 => {
                        dealCard(card2 => {
                            const hand1 = { cards: [handToSplit[0], card1], status: 'stood' };
                            const hand2 = { cards: [handToSplit[1], card2], status: 'stood' };
                            Object.assign(hand1, calculateScore(hand1.cards));
                            Object.assign(hand2, calculateScore(hand2.cards));
                            setPlayerHands([hand1, hand2]);
                        });
                    });
                } else {
                    const newHands = JSON.parse(JSON.stringify(playerHands));
                    newHands.splice(activeHandIndex, 1, 
                        { cards: [handToSplit[0]], status: 'playing' },
                        { cards: [handToSplit[1]], status: 'playing' }
                    );
                    setPlayerHands(newHands);
                }
                break;
            }
            default: break;
        }
    }, [activeHandIndex, calculateScore, dealCard, dealerHand.cards, playerHands]);

    const handlePlayerAction = useCallback((actionCode, actionName) => {
        if (gameMode === 'counting') {
            setPendingPlayerAction({ actionCode, actionName });
            setShowCountPrompt(true);
        } else {
            executePlayerAction(actionCode, actionName);
        }
    }, [gameMode, executePlayerAction]);

    const canSplit = useMemo(() => {
        if (gameMode !== 'solo' || !playerHands[activeHandIndex]) return false;
        const cards = playerHands[activeHandIndex].cards;
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }, [playerHands, activeHandIndex, gameMode]);

    const canDouble = useMemo(() => {
        if (gameMode !== 'solo' || !playerHands[activeHandIndex]) return false;
        return playerHands[activeHandIndex].cards.length === 2;
    }, [playerHands, activeHandIndex, gameMode]);
    
    useEffect(() => {
        if (gameState !== 'player-turn' || gameMode !== 'solo') return;
        const activeHand = playerHands[activeHandIndex];
        if (activeHand && activeHand.cards.length === 1) {
            setTimeout(() => {
                dealCard(card => {
                    if (!card) return;
                    setPlayerHands(prevHands => {
                        const newHands = JSON.parse(JSON.stringify(prevHands));
                        const currentHand = newHands[activeHandIndex];
                        currentHand.cards.push(card);
                        Object.assign(currentHand, calculateScore(currentHand.cards));
                        if (currentHand.score === 21) {
                            currentHand.status = 'stood';
                        }
                        return newHands;
                    });
                });
            }, 500);
        }
    }, [playerHands, activeHandIndex, gameState, calculateScore, dealCard, gameMode]);

    useEffect(() => {
        if (gameState !== 'player-turn' || gameMode !== 'solo') {
            if (gameState === 'player-turn') setIsActionDisabled(false);
            return;
        }

        const hands = playerHands;
        const handsUpdater = setPlayerHands;
        const index = activeHandIndex;

        const newHands = JSON.parse(JSON.stringify(hands));
        const activeHand = newHands[index];

        if (activeHand && activeHand.cards.length >= 2) {
            if (activeHand.status === 'playing') {
                if (activeHand.score > 21) activeHand.status = 'bust';
                else if (activeHand.score === 21) activeHand.status = 'stood';
            }
        }
        
        if (activeHand && activeHand.status !== 'playing') {
            const nextHandIndex = newHands.findIndex((hand, i) => i > index && hand.status === 'playing');
            if (nextHandIndex !== -1) {
                setActiveHandIndex(nextHandIndex);
            } else {
                const allBusted = newHands.every(h => h.status === 'bust');
                if (allBusted) {
                    setDealerHand(prev => ({...prev, cards: prev.cards.map(c => ({...c, isHidden: false}))}));
                    setTimeout(() => setGameState('end'), 500);
                } else {
                    setGameState('dealer-turn');
                }
            }
        }
        
        if (JSON.stringify(newHands) !== JSON.stringify(hands)) {
            handsUpdater(newHands);
        }

        setTimeout(() => setIsActionDisabled(false), 500);

    }, [playerHands, gameState, activeHandIndex, gameMode]);

    useEffect(() => {
        if (gameState !== 'dealer-turn') return;

        setDealerHand(prev => ({
            ...prev,
            cards: prev.cards.map(c => ({...c, isHidden: false}))
        }));

        const dealerDrawLoop = () => {
            setDealerHand(currentDealerHand => {
                const scoreInfo = calculateScore(currentDealerHand.cards);
                
                if (scoreInfo.score < 17) {
                    dealCard(card => {
                        if (card) {
                            setTimeout(() => {
                                setDealerHand(prev => ({
                                    ...prev,
                                    cards: [...prev.cards, card],
                                    ...calculateScore([...prev.cards, card])
                                }));
                                dealerDrawLoop();
                            }, 300);
                        } else {
                            setGameState('end');
                        }
                    });
                    return currentDealerHand;
                } else {
                    setGameState('end');
                    return currentDealerHand;
                }
            });
        };
        
        dealerDrawLoop(); 

    }, [gameState, calculateScore, dealCard]);
    
    useEffect(() => {
        if (gameState === 'end' && !endOfRoundMessageSet.current) {
            endOfRoundMessageSet.current = true;
            
            const revealedDealerHand = dealerHand.cards.map(c => ({...c, isHidden: false}));
            const dealerScoreInfo = calculateScore(revealedDealerHand);
            
            const handsToEvaluate = playerHands;
            
            const playerHasBj = handsToEvaluate.length === 1 && handsToEvaluate[0]?.cards.length === 2 && handsToEvaluate[0]?.score === 21;
            const dealerHasBj = dealerScoreInfo.score === 21 && revealedDealerHand.length === 2;

            let resultMessage = '';
            
            if (playerHasBj && !dealerHasBj) {
                resultMessage = 'Blackjack! You win.';
                setWinCount(prev => prev + 1);
                setPlayerBjCount(prev => prev + 1);
            } else if (dealerHasBj && !playerHasBj) {
                resultMessage = 'Dealer has Blackjack. You lose.';
                setLossCount(prev => prev + 1);
                setDealerBjCount(prev => prev + 1);
            } else if (dealerHasBj && playerHasBj) {
                resultMessage = 'Push (Both have Blackjack).';
                setPushCount(prev => prev + 1);
            } else {
                handsToEvaluate.forEach((hand, index) => {
                    if (!hand) return;
                    const handResultPrefix = handsToEvaluate.length > 1 ? `Hand ${index + 1}: ` : '';
                    const winIncrement = hand.doubled ? 2 : 1;
                    const lossIncrement = hand.doubled ? 2 : 1;
                    const pushIncrement = 1;

                    if (hand.status === 'bust') {
                        resultMessage += `${handResultPrefix}Bust. You lose. `;
                        setLossCount(prev => prev + lossIncrement);
                    } else if (dealerScoreInfo.score > 21) {
                        resultMessage += `${handResultPrefix}Dealer Busts. You win. `;
                        setWinCount(prev => prev + winIncrement);
                    } else if (hand.score > dealerScoreInfo.score) {
                        resultMessage += `${handResultPrefix}You win. `;
                        setWinCount(prev => prev + winIncrement);
                    } else if (hand.score < dealerScoreInfo.score) {
                        resultMessage += `${handResultPrefix}You lose. `;
                        setLossCount(prev => prev + lossIncrement);
                    } else {
                        resultMessage += `${handResultPrefix}Push. `;
                        setPushCount(prev => prev + pushIncrement);
                    }
                });
            }
            
            setDealerHand(prev => ({...prev, cards: revealedDealerHand, ...dealerScoreInfo}));
            const finalMessage = `${lastActionFeedback.current} ${resultMessage}`;
            setMessage(finalMessage);
            setHistory(prev => [{ text: resultMessage, isResult: true }, ...prev]);
        }
    }, [gameState, playerHands, dealerHand.cards, calculateScore]);

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => { setFeedback(''); }, 1500);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (showCountPrompt || isActionDisabled) return;

            if (gameState === 'player-turn') {
                if (event.key.toLowerCase() === 'a') handlePlayerAction('H', 'Hit');
                if (event.key.toLowerCase() === 's') handlePlayerAction('S', 'Stand');
                if (event.key.toLowerCase() === 'd' && canDouble) handlePlayerAction('D', 'Double');
                if (event.key.toLowerCase() === 'f' && canSplit) handlePlayerAction('P', 'Split');
            }

            if ((gameState === 'pre-deal' || gameState === 'end') && event.key === ' ') {
                event.preventDefault();
                dealNewGame();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, canDouble, canSplit, dealNewGame, handlePlayerAction, showCountPrompt, isActionDisabled]);

    const selectMode = (mode) => {
        setGameMode(mode);
        createShoe();
        setHistory([]);
        setCorrectCount(0);
        setIncorrectCount(0);
        setWinCount(0);
        setLossCount(0);
        setPushCount(0);
        setPlayerBjCount(0);
        setDealerBjCount(0);
        setStreakCount(0);
        setGameState('pre-deal');
        if (mode === 'solo') {
            setMessage('Solo Mode: Tap the player area to deal.');
        } else {
            const seat = Math.floor(Math.random() * 7);
            setPlayerSeat(seat);
            setMessage(`Card Counting Mode: You are at seat ${seat + 1}. Press Deal.`);
        }
    };

    const handleCountConfirm = (val) => {
        setShowCountPrompt(false);
        let countFeedback = `You entered: ${val}. Actual count: ${runningCount}. `;
        if (val === runningCount) {
            countFeedback += "✅ Correct!";
        } else {
            countFeedback += "❌ Incorrect.";
        }
        setFeedback(countFeedback);
        if (pendingPlayerAction) {
            executePlayerAction(pendingPlayerAction.actionCode, pendingPlayerAction.actionName);
            setPendingPlayerAction(null);
        }
    };

    const activePlayerHand = useMemo(() => {
        if (gameMode === 'solo' && playerHands.length > activeHandIndex) {
            return playerHands[activeHandIndex].cards;
        }
        if (gameMode === 'counting' && playerSeat !== null && tableHands.length > playerSeat) {
            return tableHands[playerSeat].cards;
        }
        return [];
    }, [gameMode, playerHands, activeHandIndex, playerSeat, tableHands]);

    const dealerUpCard = useMemo(() => {
        return dealerHand.cards.find(card => !card.isHidden);
    }, [dealerHand.cards]);


    if (!gameMode) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 bg-gray-900`}>
                <h1 className="text-4xl font-bold text-gray-100 transition-colors duration-300">Blackjack Trainer</h1>
                <p className="text-gray-400 transition-colors duration-300 mb-8">Select your training mode.</p>
                <div className="flex space-x-4">
                    <button onClick={() => selectMode('solo')} className="px-8 py-4 bg-blue-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-blue-600 transition">Solo Mode</button>
                   { /*<button onClick={() => selectMode('counting')} className="px-8 py-4 bg-green-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-green-600 transition">Card Counting</button>*/}
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 flex flex-col items-center transition-colors duration-300 bg-gray-900 text-gray-100`}>
            <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                    <header className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-6">
                            <h1 className="text-3xl font-bold transition-colors duration-300">{gameMode === 'solo' ? 'Solo Mode' : 'Card Counting Mode'}</h1>
                        </div>
                        {/* Basic Strategy Chart Icon */}
                        <button
                            onClick={() => setShowChartModal(true)}
                            className="bg-gray-700 text-white rounded-lg p-2 shadow-md hover:bg-gray-600 transition-colors flex items-center justify-center"
                            title="View Basic Strategy Chart"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </header>

                    <div className="bg-slate-800 border-4 border-slate-900 rounded-3xl shadow-xl p-2 md:p-6 text-white flex flex-col justify-between flex-grow min-h-[60vh]">
                        <div className="text-center mb-2">
                            <h2 className="text-xl font-semibold mb-2">Dealer's Hand {gameState !== 'player-turn' && dealerHand.display ? `: ${dealerHand.display}` : ''}</h2>
                            <div className="flex justify-center items-center gap-x-1 gap-y-2 flex-wrap">
                                {dealerHand.cards.map((card, i) => <Card key={i} {...card} />)}
                            </div>
                        </div>

                        <div className="text-center my-0 h-10 flex items-center justify-center">
                            {feedback && gameState !== 'pre-deal' && gameState !== 'pre-game' && (
                                <p className={`text-2xl font-bold animate-fade-in ${isFeedbackCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    {feedback}
                                </p>
                            )}
                        </div>

                        {gameMode === 'solo' ? (
                            <div className="text-center">
                                {playerHands.length === 0 && gameState === 'pre-deal' ? (
                                    <div 
                                        className="relative w-full min-h-[14rem] flex items-center justify-center group cursor-pointer rounded-lg transition-colors hover:bg-gray-500 hover:bg-opacity-20"
                                        onClick={dealNewGame}
                                    >
                                        <span className="text-2xl font-bold text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity">
                                            Tap to Deal
                                        </span>
                                    </div>
                                ) : (
                                    <div 
                                        className={`relative inline-flex flex-wrap justify-center items-start gap-1 sm:gap-2 p-2 min-h-[14rem] ${(gameState === 'end') ? 'cursor-pointer' : ''}`}
                                        onClick={(gameState === 'end') ? dealNewGame : undefined}
                                    >
                                        {playerHands.map((hand, i) => (
                                            <div key={i} className={`relative p-2 rounded-lg ${i === activeHandIndex && gameState === 'player-turn' ? 'bg-yellow-400 bg-opacity-30' : ''}`}>
                                                <div className="font-bold text-xl text-center h-8 flex flex-col justify-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <span>
                                                            {playerHands.length > 1 ? `Hand ${i + 1}: ` : ''}
                                                            {hand.status === 'bust' ? 'Bust' : hand.display}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center items-center flex-wrap gap-x-1 gap-y-2 mt-2">
                                                    {hand.cards.map((card, j) => <Card key={j} {...card} />)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Fallback for other modes, if any
                            <div></div>
                        )}
                    </div>
                    
                    <div className="mt-4 flex justify-center space-x-2 md:space-x-4">
                            {[
                                ['Hit', 'H'], 
                                ['Stand', 'S'], 
                                ['Double', 'D'], 
                                ['Split', 'P']
                            ].map(([actionName, actionCode]) => (
                                <button
                                    key={actionName}
                                    onClick={() => handlePlayerAction(actionCode, actionName)}
                                    disabled={isActionDisabled || gameState !== 'player-turn' || (actionCode === 'P' && !canSplit) || (actionCode === 'D' && !canDouble)}
                                    className={`w-24 md:w-28 py-4 font-bold text-lg rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                                        ${actionCode === 'H' && 'bg-green-500 text-white'}
                                        ${actionCode === 'S' && 'bg-red-500 text-white'}
                                        ${actionCode === 'D' && 'bg-orange-400 text-white'}
                                        ${actionCode === 'P' && 'bg-blue-500 text-white'}`}
                                >
                                    {actionName}
                                </button>
                            ))}
                    </div>
                </div>
                {/* Responsive order for History and Streak */}
                <div className="w-full md:w-72 mt-4 md:mt-0 flex flex-col-reverse md:flex-col flex-shrink-0">
                    {/* StreakCounter is above HistoryTracker on mobile due to flex-col-reverse */}
                    <HistoryTracker history={history} correctCount={correctCount} incorrectCount={incorrectCount} winCount={winCount} lossCount={lossCount} playerBjCount={playerBjCount} dealerBjCount={dealerBjCount} pushCount={pushCount} />
                    <div className="md:hidden h-4"></div> {/* Small buffer for mobile only */}
                    <StreakCounter streak={streakCount} />
                </div>
            </div>
            {showCountPrompt && <CountPromptModal onConfirm={handleCountConfirm} />}
            {showChartModal && (
                <BasicStrategyChartModal 
                    playerHand={activePlayerHand} 
                    dealerUpCard={dealerUpCard} 
                    onClose={() => setShowChartModal(false)}
                    calculateScore={calculateScore} // Pass calculateScore to the modal
                />
            )}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Roboto+Mono&display=swap');
                body {
                    font-family: 'Nunito', sans-serif;
                }
                .font-mono {
                    font-family: 'Roboto Mono', monospace;
                }
                @keyframes deal {
                    from { opacity: 0; transform: translateY(-20px) scale(0.8); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-deal { animation: deal 0.4s ease-out forwards; }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes glow {
                    0%, 100% { text-shadow: 0 0 5px currentColor; }
                    50% { text-shadow: 0 0 10px currentColor; }
                }
                .animate-glow { animation: glow 2s ease-in-out infinite; }
                @keyframes glow-strong {
                    0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor; }
                    50% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
                }
                .animate-glow-strong { animation: glow-strong 1.5s ease-in-out infinite; }
                @keyframes pulse-fast {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-pulse-fast { animation: pulse-fast 1s ease-in-out infinite; }
                 @keyframes super-saiyan {
                    0%, 100% { text-shadow: 0 0 15px #ff8c00, 0 0 25px #ff8c00, 0 0 40px #ffae42; transform: scale(1); }
                    50% { text-shadow: 0 0 25px #ffae42, 0 0 40px #ffcc00, 0 0 60px #ffdd57; transform: scale(1.1); }
                }
                .animate-super-saiyan { animation: super-saiyan 0.8s ease-in-out infinite; }
                @keyframes legendary {
                    0%, 100% { text-shadow: 0 0 12px #00ffff, 0 0 22px #00ffff, 0 0 32px #ffffff; transform: scale(1.05); }
                    50% { text-shadow: 0 0 22px #00ffff, 0 0 32px #ffffff, 0 0 42px #00aaff; transform: scale(1.1); }
                }
                .animate-legendary { animation: legendary 1.2s ease-in-out infinite; }
                @keyframes mastery {
                    0%, 100% { text-shadow: 0 0 10px #ffffff, 0 0 15px #ffffff; }
                    50% { text-shadow: 0 0 15px #ffffff, 0 0 25px #dddddd; }
                }
                .animate-mastery { animation: mastery 1.5s ease-in-out infinite; }
                @keyframes grandmaster {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-grandmaster {
                    background-size: 200% 200%;
                    animation: grandmaster 3s ease-in-out infinite;
                }
                @keyframes mythic {
                    0%, 100% { text-shadow: 0 0 10px #ffc300, 0 0 20px #ff5733, 0 0 30px #c70039, 0 0 40px #900c3f; }
                    50% { text-shadow: 0 0 15px #ffc300, 0 0 25px #ff5733, 0 0 35px #c70039, 0 0 50px #900c3f; transform: scale(1.02); }
                }
                .animate-mythic { animation: mythic 1s ease-in-out infinite; }
                @keyframes god-tier {
                    0% { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073, 0 0 70px #e60073; }
                    50% { text-shadow: 0 0 20px #fff, 0 0 30px #ff4da6, 0 0 40px #ff4da6, 0 0 50px #ff4da6, 0 0 60px #ff4da6, 0 0 70px #ff4da6, 0 0 80px #ff4da6; }
                    100% { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073, 0 0 70px #e60073; }
                }
                .animate-god-tier { animation: god-tier 2s linear infinite; }
            `}</style>
        </div>
    );
}
