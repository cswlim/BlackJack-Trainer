import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- Chart.js ---
// Since we can't import this conventionally in this environment,
// we'll rely on it being available on the window object after loading the script.
// A script loader is included in the BlackjackCounter component.

// ===================================================================================
// --- HELPER COMPONENTS & FUNCTIONS (Restored) ---
// ===================================================================================

const getBasicStrategy = (playerHand, dealerUpCard) => {
    if (!playerHand || playerHand.length === 0) {
        return 'H'; // Default action if hand is empty
    }
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
                if (dealerValue <= 9) return canDouble ? 'D' : 'H';
                return 'H';
            case '4':
                if (dealerValue === 4) return 'H';
                if ([5, 6].includes(dealerValue)) return 'P';
                return 'H';
            case '3': case '2':
                if (dealerValue <= 7) return 'P';
                return 'H';
            default: return 'H';
        }
    }

    // Soft Totals
    if (player.isSoft) {
        const softTotal = player.score;
        switch (softTotal) {
            case 20: return 'S';
            case 19:
                if (dealerValue === 6) return canDouble ? 'D' : 'S';
                return 'S';
            case 18:
                if ([2, 3, 4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'S';
                if ([7, 8].includes(dealerValue)) return 'S';
                return 'H';
            case 17:
                if ([3, 4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 16:
                if ([4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 15:
                if ([4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 14:
                if ([5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 13:
                if ([5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            default: return 'H';
        }
    }

    // Hard Totals
    const hardTotal = player.score;
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
        if (dealerValue === 11) return 'H';
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
    if (hardTotal >= 5 && hardTotal <= 8) return 'H';

    return 'H';
};

const getCardCountValue = (card) => {
    if (!card) return 0;
    const rank = card.rank;
    if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
    if (['10', 'J', 'Q', 'K', 'A'].includes(rank)) return -1;
    return 0;
};

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

const BasicStrategyChartModal = ({ playerHand, dealerUpCard, onClose, calculateScore }) => {
    const dealerRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
    const hardTotals = ['7-', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17+'];
    const softTotals = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
    const pairs = ['2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s', 'As'];

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
            '7-': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
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
            '4s': ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
            '3s': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
            '2s': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
        }
    };

    const getPlayerHandKeyForChart = useCallback((hand) => {
        if (!hand || hand.length === 0) return null;
        const { score, isSoft } = calculateScore(hand);
        const ranks = hand.map(card => card.rank);

        if (hand.length === 2 && ranks[0] === ranks[1]) {
            const normalizedRank = ['J', 'Q', 'K'].includes(ranks[0]) ? '10' : ranks[0];
            return `${normalizedRank}s`;
        }
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
        if (score >= 17) return '17+';
        if (score >= 5 && score <= 7) return '7-';
        return `${score}`;
    }, [calculateScore]);

    const getDealerUpCardKeyForChart = useCallback((card) => {
        if (!card) return null;
        if (['J', 'Q', 'K'].includes(card.rank)) return '10';
        if (card.rank === 'A') return 'A';
        return card.rank;
    }, []);

    const playerKey = playerHand ? getPlayerHandKeyForChart(playerHand) : null;
    const dealerKey = dealerUpCard ? getDealerUpCardKeyForChart(dealerUpCard) : null;

    const getActionColorClass = (action) => {
        switch (action) {
            case 'H': return 'bg-green-700 text-white';
            case 'S': return 'bg-red-700 text-white';
            case 'D': return 'bg-orange-700 text-white';
            case 'P': return 'bg-blue-900 text-white';
            default: return 'bg-gray-700 text-gray-100';
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

// ===================================================================================
// --- 1. ADVANCED BLACKJACK COUNTER COMPONENT ---
// ===================================================================================

const BlackjackCounter = ({ onGoBack }) => {
    // --- STATE MANAGEMENT ---
    const [numDecks, setNumDecks] = useState(8);
    const [runningCount, setRunningCount] = useState(0);
    const [cardsPlayed, setCardsPlayed] = useState(0);
    const [lowCardsPlayed, setLowCardsPlayed] = useState(0);
    const [neutralCardsPlayed, setNeutralCardsPlayed] = useState(0);
    const [highCardsPlayed, setHighCardsPlayed] = useState(0);
    const [acesPlayed, setAcesPlayed] = useState(0); // New state for aces
    const [trendData, setTrendData] = useState([]);
    const [showDeckSelector, setShowDeckSelector] = useState(false);

    // --- REFS ---
    const chartCanvasRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const deckSelectorRef = useRef(null);


    // --- DERIVED CONSTANTS ---
    const { TOTAL_CARDS, INITIAL_LOW_CARDS, INITIAL_NEUTRAL_CARDS, INITIAL_HIGH_CARDS, TOTAL_ACES } = useMemo(() => {
        const CARDS_PER_DECK = 52;
        return {
            TOTAL_CARDS: numDecks * CARDS_PER_DECK,
            INITIAL_LOW_CARDS: 5 * 4 * numDecks, // 2,3,4,5,6
            INITIAL_NEUTRAL_CARDS: 3 * 4 * numDecks, // 7,8,9
            INITIAL_HIGH_CARDS: 5 * 4 * numDecks, // 10,J,Q,K,A
            TOTAL_ACES: 4 * numDecks,
        };
    }, [numDecks]);


    // --- CORE LOGIC ---
    const calculateTrueCount = useCallback(() => {
        const CARDS_PER_DECK = 52;
        const cardsRemaining = TOTAL_CARDS - cardsPlayed;
        if (cardsRemaining === 0) return 0;
        const decksRemaining = cardsRemaining / CARDS_PER_DECK;
        return runningCount / decksRemaining;
    }, [runningCount, cardsPlayed, TOTAL_CARDS]);
    
    const resetAll = useCallback(() => {
        setRunningCount(0);
        setCardsPlayed(0);
        setLowCardsPlayed(0);
        setNeutralCardsPlayed(0);
        setHighCardsPlayed(0);
        setAcesPlayed(0); // Reset aces
        setTrendData([]);
        console.log("Counter and history have been reset.");
    }, []);

    const handleDeckChange = (newDeckCount) => {
        setNumDecks(newDeckCount);
        resetAll();
        setShowDeckSelector(false);
    };

    const handleCard = (value, isAce = false) => {
        if (cardsPlayed >= TOTAL_CARDS) {
            console.warn("Shoe is finished. Please reset.");
            return;
        }

        const newTrendData = [...trendData];
        
        newTrendData.push({
            rc: runningCount,
            tc: calculateTrueCount(),
            actionValue: value,
            cardsPlayedBefore: cardsPlayed,
            lowCardsPlayedBefore: lowCardsPlayed,
            neutralCardsPlayedBefore: neutralCardsPlayed,
            highCardsPlayedBefore: highCardsPlayed,
            acesPlayedBefore: acesPlayed, // Store ace count for undo
            isAce: isAce
        });

        setRunningCount(prev => prev + value);
        setCardsPlayed(prev => prev + 1);
        setTrendData(newTrendData);

        if (value === 1) setLowCardsPlayed(p => p + 1);
        else if (value === 0) setNeutralCardsPlayed(p => p + 1);
        else if (value === -1) {
            setHighCardsPlayed(p => p + 1);
            if (isAce) {
                setAcesPlayed(p => p + 1);
            }
        }
    };

    const undoLastAction = () => {
        if (trendData.length === 0) {
            console.log("Nothing to undo.");
            return;
        }

        const newTrendData = [...trendData];
        const lastAction = newTrendData.pop();
        
        setRunningCount(lastAction.rc);
        setCardsPlayed(lastAction.cardsPlayedBefore);
        setLowCardsPlayed(lastAction.lowCardsPlayedBefore);
        setNeutralCardsPlayed(lastAction.neutralCardsPlayedBefore);
        setHighCardsPlayed(lastAction.highCardsPlayedBefore);
        setAcesPlayed(lastAction.acesPlayedBefore); // Revert ace count
        setTrendData(newTrendData);
    };

    // --- CHART LOGIC & Event Listeners ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (deckSelectorRef.current && !deckSelectorRef.current.contains(event.target)) {
                setShowDeckSelector(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.async = true;
        
        script.onload = () => {
            if (chartCanvasRef.current && window.Chart) {
                const chartContext = chartCanvasRef.current.getContext('2d');
                chartInstanceRef.current = new window.Chart(chartContext, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Running Count',
                            data: [],
                            borderColor: '#ffffff',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 2,
                            tension: 0.2,
                            pointRadius: 0
                        }, {
                            label: 'True Count',
                            data: [],
                            borderColor: '#34c759',
                            backgroundColor: 'rgba(52, 199, 89, 0.1)',
                            borderWidth: 2,
                            tension: 0.2,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        animation: { duration: 0 },
                        scales: {
                            y: { beginAtZero: false, ticks: { color: '#8e8e93' }, grid: { color: '#3a3a3c' } },
                            x: { ticks: { color: '#8e8e93', maxTicksLimit: 10 }, grid: { display: false } }
                        },
                        plugins: {
                            legend: { labels: { color: '#e0e0e0' } }
                        }
                    }
                });
            }
        };

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, []);

    useEffect(() => {
        if (chartInstanceRef.current) {
            const currentTrueCount = calculateTrueCount();
            const allData = [...trendData, { rc: runningCount, tc: currentTrueCount }];
            
            chartInstanceRef.current.data.labels = allData.map((_, index) => index);
            chartInstanceRef.current.data.datasets[0].data = allData.map(d => d.rc);
            chartInstanceRef.current.data.datasets[1].data = allData.map(d => d.tc);
            chartInstanceRef.current.update('none');
        }
    }, [runningCount, trendData, calculateTrueCount]);

    // --- RENDER LOGIC ---
    const trueCount = calculateTrueCount();
    const trueCountColor = trueCount >= 2 ? '#34c759' : trueCount <= -1 ? '#ff3b30' : '#e0e0e0';

    return (
        <>
            <style>{`
                .bjc-body, .bjc-html {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  background-color: #121212;
                  color: #e0e0e0;
                  -webkit-tap-highlight-color: transparent;
                }
                .bjc-app-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: flex-start;
                  min-height: 100vh;
                  padding: 1.5rem;
                  box-sizing: border-box;
                  text-align: center;
                  background-color: #121212;
                }
                .bjc-header {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    max-width: 380px;
                    position: relative; /* For pop-out positioning */
                }
                .bjc-header-right {
                    display: flex;
                    gap: 0.5rem;
                }
                .bjc-title {
                  font-size: 1.8rem;
                  font-weight: 700;
                  color: #ffffff;
                }
                .bjc-header-button {
                  background-color: #3a3a3c;
                  color: white;
                  border: none;
                  border-radius: 10px;
                  padding: 0.5rem 1rem;
                  font-weight: 600;
                  cursor: pointer;
                  transition: background-color 0.2s;
                }
                .bjc-header-button:hover { background-color: #555; }
                
                /* Deck Pop-out Selector */
                .bjc-deck-popout {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background-color: #2c2c2e;
                    border-radius: 12px;
                    padding: 0.75rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                    z-index: 10;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.5rem;
                    border: 1px solid #444;
                }
                .bjc-deck-popout-button {
                    width: 45px;
                    height: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    font-weight: 600;
                    border: none;
                    border-radius: 8px;
                    background-color: #3a3a3c;
                    color: #e0e0e0;
                    cursor: pointer;
                    transition: background-color 0.2s, transform 0.1s;
                }
                .bjc-deck-popout-button:hover {
                    background-color: #555;
                }
                .bjc-deck-popout-button:active {
                    transform: scale(0.95);
                }
                .bjc-deck-popout-button.active {
                    background-color: #007aff;
                    color: white;
                }

                .bjc-controls-panel {
                    background-color: #1c1c1e;
                    border-radius: 20px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    width: 100%;
                    max-width: 380px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .bjc-utility-buttons {
                    display: flex;
                    gap: 0.75rem;
                }
                .bjc-utility-button {
                    flex-grow: 1;
                    background-color: #3a3a3c;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 0.6rem 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .bjc-utility-button:hover {
                    background-color: #555;
                }

                .bjc-counter-display {
                  background-color: #1c1c1e;
                  border-radius: 20px;
                  padding: 1rem 1.5rem;
                  margin-bottom: 1.5rem;
                  width: 100%;
                  max-width: 380px;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .bjc-counter {
                  font-size: 4.5rem;
                  font-weight: bold;
                  line-height: 1;
                  color: #ffffff;
                }
                .bjc-counter-label {
                  font-size: 1rem;
                  color: #8e8e93;
                  margin-bottom: 1rem;
                }
                .bjc-true-count {
                  font-size: 1.5rem;
                  font-weight: 600;
                }
                .bjc-buttons {
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                  width: 100%;
                  max-width: 380px;
                  margin-bottom: 1.5rem;
                }
                .bjc-button {
                  padding: 1rem;
                  font-size: 1.5rem;
                  font-weight: 600;
                  border: none;
                  border-radius: 15px;
                  color: white;
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                  transition: transform 0.1s ease, box-shadow 0.1s ease;
                  cursor: pointer;
                }
                .bjc-button:active {
                  transform: scale(0.97);
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }
                .bjc-button .bjc-hint {
                  display: block;
                  font-size: 1rem;
                  font-weight: 400;
                  opacity: 0.8;
                  margin-top: 0.25rem;
                }
                .bjc-plus { background-color: #34c759; }
                .bjc-zero { background-color: #5856d6; }
                .bjc-minus { background-color: #ff3b30; }
                .bjc-minus-group { display: flex; gap: 0.5rem; }
                .bjc-ace-button {
                    flex-shrink: 0;
                    width: 60px; /* smaller width */
                    background-color: #ff9500; /* orange */
                }
                .bjc-stats-container {
                  width: 100%;
                  max-width: 380px;
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                  margin-bottom: 1.5rem;
                }
                .bjc-stats-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 1rem;
                  background-color: #1c1c1e;
                  padding: 1rem;
                  border-radius: 20px;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .bjc-stats-grid.two-col {
                    grid-template-columns: repeat(2, 1fr);
                }
                .bjc-stats-grid h4 {
                  grid-column: 1 / -1;
                  margin: 0 0 0.5rem 0;
                  font-size: 1rem;
                  color: #fff;
                  text-align: left;
                }
                .bjc-stat-item { display: flex; flex-direction: column; }
                .bjc-stat-value { font-size: 1.2rem; font-weight: 600; color: #ffffff; }
                .bjc-stat-label { font-size: 0.8rem; color: #8e8e93; text-transform: uppercase; }
                .bjc-data-section {
                  width: 100%;
                  max-width: 380px;
                  background: #1c1c1e;
                  border-radius: 20px;
                  padding: 1rem;
                  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                  margin-bottom: 1.5rem;
                }
                .bjc-data-section h4 {
                  margin: 0 0 1rem 0;
                  font-size: 1.2rem;
                  color: #fff;
                  text-align: left;
                }
            `}</style>
            <div className="bjc-app-container">
                <div className="bjc-header" ref={deckSelectorRef}>
                    <h1 className="bjc-title">Card Counter</h1>
                    <div className="bjc-header-right">
                       <button className="bjc-header-button" onClick={() => setShowDeckSelector(!showDeckSelector)}>
                           {numDecks}D
                       </button>
                       <button className="bjc-header-button" onClick={onGoBack}>Back</button>
                    </div>
                    {showDeckSelector && (
                        <div className="bjc-deck-popout">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(d => (
                                <button
                                    key={d}
                                    className={`bjc-deck-popout-button ${numDecks === d ? 'active' : ''}`}
                                    onClick={() => handleDeckChange(d)}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bjc-controls-panel">
                    <div className="bjc-utility-buttons">
                        <button className="bjc-utility-button" onClick={undoLastAction}>Undo</button>
                        <button className="bjc-utility-button" onClick={resetAll}>Reset</button>
                    </div>
                </div>

                <div className="bjc-counter-display">
                    <div className="bjc-counter-label">Running Count</div>
                    <div className="bjc-counter">{runningCount}</div>
                    <div className="bjc-true-count" style={{ color: trueCountColor }}>
                        True Count: {trueCount.toFixed(2)}
                    </div>
                </div>

                <div className="bjc-buttons">
                    <button className="bjc-button bjc-plus" onClick={() => handleCard(1)}>+1 <span className="bjc-hint">Cards 2–6</span></button>
                    <button className="bjc-button bjc-zero" onClick={() => handleCard(0)}>0 <span className="bjc-hint">Cards 7–9</span></button>
                    <div className="bjc-minus-group">
                        <button className="bjc-button bjc-minus" style={{flexGrow: 1}} onClick={() => handleCard(-1)}>-1 <span className="bjc-hint">10, J, Q, K</span></button>
                        <button className="bjc-button bjc-ace-button" onClick={() => handleCard(-1, true)}>A</button>
                    </div>
                </div>

                <div className="bjc-stats-container">
                    <div className="bjc-stats-grid">
                        <h4>Remaining Cards</h4>
                        <div className="bjc-stat-item"><div className="bjc-stat-value">{INITIAL_LOW_CARDS - lowCardsPlayed}/{INITIAL_LOW_CARDS}</div><div className="bjc-stat-label">Low (2-6)</div></div>
                        <div className="bjc-stat-item"><div className="bjc-stat-value">{INITIAL_NEUTRAL_CARDS - neutralCardsPlayed}/{INITIAL_NEUTRAL_CARDS}</div><div className="bjc-stat-label">Neutral (7-9)</div></div>
                        <div className="bjc-stat-item"><div className="bjc-stat-value">{INITIAL_HIGH_CARDS - highCardsPlayed}/{INITIAL_HIGH_CARDS}</div><div className="bjc-stat-label">High (10-A)</div></div>
                    </div>
                    <div className="bjc-stats-grid two-col">
                        <h4>Shoe Stats</h4>
                        <div className="bjc-stat-item"><div className="bjc-stat-value">{cardsPlayed} / {TOTAL_CARDS}</div><div className="bjc-stat-label">Cards Played</div></div>
                        <div className="bjc-stat-item"><div className="bjc-stat-value">{TOTAL_ACES - acesPlayed}</div><div className="bjc-stat-label">Aces Left</div></div>
                    </div>
                </div>

                <div className="bjc-data-section">
                    <h4>Count Trends</h4>
                    <canvas ref={chartCanvasRef}></canvas>
                </div>
            </div>
        </>
    );
};


// ===================================================================================
// --- 2. BLACKJACK TRAINER COMPONENT (Your original React App) ---
// ===================================================================================

const BlackjackTrainer = ({ onGoBack }) => {
    const [trainerMode, setTrainerMode] = useState(null);
    const NUM_DECKS = 6;

    const [deck, setDeck] = useState([]);
    const [cutCardPosition, setCutCardPosition] = useState(0);
    const [isCutCardRevealed, setIsCutCardRevealed] = useState(false);
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
    const [isFeedbackCorrect, setIsFeedbackCorrect] = useState(false);
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
    const [showChartModal, setShowChartModal] = useState(false);

    // State for new animations
    const [announcement, setAnnouncement] = useState(null);
    const [burstKey, setBurstKey] = useState(0);
    const [burstAnimClass, setBurstAnimClass] = useState('');
    const [washAwayKey, setWashAwayKey] = useState(0);
    const [showWashAway, setShowWashAway] = useState(false);


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

    const dealCard = useCallback((currentDeck) => {
        if (currentDeck.length === 0) {
            return { card: null, newDeck: [] };
        }
        const newDeck = [...currentDeck];
        if (newDeck.length === cutCardPosition) {
            setIsCutCardRevealed(true);
        }
        const card = newDeck.pop();
        return { card, newDeck };
    }, [cutCardPosition]);

    const dealNewGame = useCallback(() => {
        if (isCutCardRevealed) {
            createShoe();
            setTimeout(() => setGameState('pre-deal'), 100);
            return;
        }

        endOfRoundMessageSet.current = false;
        lastActionFeedback.current = '';
        setMessage('');
        setFeedback('');
        setIsFeedbackCorrect(false);
        setActiveHandIndex(0);

        setDeck(prevDeck => {
            let tempDeck = [...prevDeck];
            if (tempDeck.length < 4) {
                console.error("Not enough cards to deal a new game.");
                return tempDeck;
            }

            const { card: playerCard1, newDeck: deck1 } = dealCard(tempDeck);
            const { card: dealerCard1, newDeck: deck2 } = dealCard(deck1);
            const { card: playerCard2, newDeck: deck3 } = dealCard(deck2);
            const { card: dealerCard2, newDeck: deck4 } = dealCard(deck3);

            const tempPlayerHand = [playerCard1, playerCard2];
            const tempDealerHand = [dealerCard1, { ...dealerCard2, isHidden: true }];
            const playerInitialState = { cards: tempPlayerHand, ...calculateScore(tempPlayerHand), status: 'playing' };

            setPlayerHands([playerInitialState]);
            setDealerHand({ cards: tempDealerHand });
            
            let newRunningCount = runningCount;
            [playerCard1, dealerCard1, playerCard2, dealerCard2].forEach(c => {
                newRunningCount += getCardCountValue(c);
            });
            setRunningCount(newRunningCount);

            const playerHasBj = playerInitialState.score === 21;
            const dealerHasBj = calculateScore([dealerCard1, dealerCard2]).score === 21;
            
            if (playerHasBj || dealerHasBj) {
                setGameState('end');
            } else {
                setGameState('player-turn');
            }
            
            return deck4;
        });
    }, [isCutCardRevealed, createShoe, dealCard, calculateScore, runningCount]);

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
            const newStreak = streakCount + 1;
            setStreakCount(newStreak);
            setCorrectCount(prev => prev + 1);
            setIsFeedbackCorrect(true);
            setFeedback('✅');
            lastActionFeedback.current = "Correct!";

            if ([100, 200, 300].includes(newStreak)) {
                setAnnouncement(newStreak);
            } else if (newStreak === 50) {
                setBurstKey(k => k + 1);
            }
            setShowWashAway(false);
        } else {
            if (streakCount >= 2) {
                setShowWashAway(true);
                setWashAwayKey(k => k + 1);
            }
            setStreakCount(0);
            setIncorrectCount(prev => prev + 1);
            setIsFeedbackCorrect(false);
            setFeedback(`❌ Correct move: ${correctMove}`);
            lastActionFeedback.current = "Incorrect.";
        }
        
        const historyItem = { text: `Hand ${currentHandRef.display}: Your move: ${actionName}. Strategy: ${correctMove}.`, correct: isCorrect };
        setHistory(prevHistory => [historyItem, ...prevHistory]);


        switch(actionCode) {
            case 'H': {
                const { card, newDeck } = dealCard(deck);
                if(card) {
                    setDeck(newDeck);
                    setRunningCount(prev => prev + getCardCountValue(card));
                    handsUpdater(prevHands => {
                        const newHands = JSON.parse(JSON.stringify(prevHands));
                        newHands[handIndex].cards.push(card);
                        Object.assign(newHands[handIndex], calculateScore(newHands[handIndex].cards));
                        return newHands;
                    });
                }
                break;
            }
            case 'D': {
                const { card, newDeck } = dealCard(deck);
                if(card) {
                    setDeck(newDeck);
                    setRunningCount(prev => prev + getCardCountValue(card));
                    handsUpdater(prevHands => {
                        const newHands = JSON.parse(JSON.stringify(prevHands));
                        const currentHand = newHands[handIndex];
                        currentHand.cards.push(card);
                        Object.assign(currentHand, calculateScore(currentHand.cards));
                        currentHand.isDoubled = true;
                        if (currentHand.score > 21) {
                            currentHand.status = 'bust';
                        } else {
                            currentHand.status = 'stood';
                        }
                        return newHands;
                    });
                }
                break;
            }
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
                const { card: card1, newDeck: deck1 } = dealCard(deck);
                const { card: card2, newDeck: deck2 } = dealCard(deck1);
                
                if (card1 && card2) {
                    setDeck(deck2);
                    setRunningCount(prev => prev + getCardCountValue(card1) + getCardCountValue(card2));
                    const handToSplit = hands[handIndex].cards;
                    const isAces = handToSplit[0].rank === 'A';

                    if (isAces) {
                        const hand1 = { cards: [handToSplit[0], card1], status: 'stood' };
                        const hand2 = { cards: [handToSplit[1], card2], status: 'stood' };
                        Object.assign(hand1, calculateScore(hand1.cards));
                        Object.assign(hand2, calculateScore(hand2.cards));
                        setPlayerHands([hand1, hand2]);
                    } else {
                        const newHands = JSON.parse(JSON.stringify(playerHands));
                        newHands.splice(activeHandIndex, 1, 
                            { cards: [handToSplit[0]], status: 'playing' },
                            { cards: [handToSplit[1]], status: 'playing' }
                        );
                        setPlayerHands(newHands);
                    }
                }
                break;
            }
            default: break;
        }
    }, [activeHandIndex, calculateScore, dealCard, dealerHand.cards, playerHands, streakCount, deck]);

    const handlePlayerAction = useCallback((actionCode, actionName) => {
        executePlayerAction(actionCode, actionName);
    }, [executePlayerAction]);

    const canSplit = useMemo(() => {
        if (!playerHands[activeHandIndex]) return false;
        const cards = playerHands[activeHandIndex].cards;
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }, [playerHands, activeHandIndex]);

    const canDouble = useMemo(() => {
        if (!playerHands[activeHandIndex]) return false;
        return playerHands[activeHandIndex].cards.length === 2;
    }, [playerHands, activeHandIndex]);
    
    useEffect(() => {
        if (gameState !== 'player-turn') return;
        const activeHand = playerHands[activeHandIndex];
        if (activeHand && activeHand.cards.length === 1) { // After a split
            setTimeout(() => {
                const { card, newDeck } = dealCard(deck);
                if (card) {
                    setDeck(newDeck);
                    setRunningCount(prev => prev + getCardCountValue(card));
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
                }
            }, 500);
        }
    }, [playerHands, activeHandIndex, gameState, calculateScore, dealCard, deck]);

    useEffect(() => {
        if (gameState !== 'player-turn') {
            setIsActionDisabled(false);
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

    }, [playerHands, gameState, activeHandIndex]);

    useEffect(() => {
        if (gameState !== 'dealer-turn') return;

        let currentDealerHand = JSON.parse(JSON.stringify(dealerHand));
        currentDealerHand.cards = currentDealerHand.cards.map(c => ({...c, isHidden: false}));
        
        let tempDeck = [...deck];
        let tempRunningCount = runningCount;

        const drawLoop = () => {
            const scoreInfo = calculateScore(currentDealerHand.cards);
            if (scoreInfo.score < 17) {
                const { card, newDeck } = dealCard(tempDeck);
                if(card) {
                    currentDealerHand.cards.push(card);
                    tempDeck = newDeck;
                    tempRunningCount += getCardCountValue(card);
                    setTimeout(drawLoop, 300);
                } else {
                    finalize();
                }
            } else {
                finalize();
            }
        };

        const finalize = () => {
            setDealerHand(currentDealerHand);
            setDeck(tempDeck);
            setRunningCount(tempRunningCount);
            setGameState('end');
        };

        drawLoop();

    }, [gameState, calculateScore, dealCard, dealerHand, deck, runningCount]);
    
    useEffect(() => {
        if (gameState === 'end' && !endOfRoundMessageSet.current) {
            endOfRoundMessageSet.current = true;
            
            const revealedDealerHand = dealerHand.cards.map(c => ({...c, isHidden: false}));
            const dealerScoreInfo = calculateScore(revealedDealerHand);
            
            const handsToEvaluate = playerHands;
            
            const playerHasBj = handsToEvaluate.length === 1 && handsToEvaluate[0]?.cards.length === 2 && handsToEvaluate[0]?.score === 21;
            const dealerHasBj = dealerScoreInfo.score === 21 && revealedDealerHand.length === 2;

            let resultMessage = '';
            let handWins = 0;
            let handLosses = 0;
            let pushes = 0;

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
                pushes++;
            } else {
                handsToEvaluate.forEach((hand, index) => {
                    if (!hand) return;
                    const outcomeValue = hand.isDoubled ? 2 : 1;
                    resultMessage += `Hand ${index + 1}: `;
                    if (hand.status === 'bust') {
                        resultMessage += 'You lose (Busted). ';
                        handLosses += outcomeValue;
                    } else if (dealerScoreInfo.score > 21) {
                        resultMessage += 'You win (Dealer Busted). ';
                        handWins += outcomeValue;
                    } else if (hand.score > dealerScoreInfo.score) {
                        resultMessage += 'You win (Higher Score). ';
                        handWins += outcomeValue;
                    } else if (hand.score < dealerScoreInfo.score) {
                        resultMessage += 'You lose (Lower Score). ';
                        handLosses += outcomeValue;
                    } else {
                        resultMessage += 'Push. ';
                        pushes++;
                    }
                });

                setWinCount(prev => prev + handWins);
                setLossCount(prev => prev + handLosses);
                setPushCount(prev => prev + pushes);
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
            if (showCountPrompt) return;

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
    }, [gameState, canDouble, canSplit, dealNewGame, handlePlayerAction, showCountPrompt]);

    useEffect(() => {
        if (burstKey > 0) {
            setBurstAnimClass('animate-long-pulse-burst');
            const timer = setTimeout(() => setBurstAnimClass(''), 1500);
            return () => clearTimeout(timer);
        }
    }, [burstKey]);

    useEffect(() => {
        if (showWashAway) {
            const timer = setTimeout(() => setShowWashAway(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [washAwayKey]);

    useEffect(() => {
        if (announcement) {
            const timer = setTimeout(() => setAnnouncement(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [announcement]);

    useEffect(() => {
        setTrainerMode('solo');
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
        setMessage('Solo Mode: Press Deal to start.');
    }, [createShoe]);


    const activePlayerHand = useMemo(() => {
        if (playerHands.length > activeHandIndex) {
            return playerHands[activeHandIndex].cards;
        }
        return [];
    }, [playerHands, activeHandIndex]);

    const dealerUpCard = useMemo(() => {
        return dealerHand.cards.find(card => !card.isHidden);
    }, [dealerHand.cards]);

    return (
        <>
            <div className={`min-h-screen p-4 flex flex-col items-center transition-colors duration-300 bg-gray-900 text-gray-100`}>
                {announcement && (
                    <div id="fullscreen-announcement" className={`is-active announce-${announcement}`}>
                        <div className="content text-center">
                            <h2 id="announce-number" className={`text-7xl md:text-9xl font-black number ${announcement === 300 ? 'announce-cosmic-text' : ''}`}>{announcement}</h2>
                        </div>
                        <button onClick={() => setAnnouncement(null)} className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
                    </div>
                )}
                <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <header className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-6">
                                <button onClick={onGoBack} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-600 transition">
                                    &larr; Back
                                </button>
                                <h1 className="text-3xl font-bold transition-colors duration-300">Strategy Trainer</h1>
                            </div>
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
                                <h2 className="text-xl font-semibold mb-2">Dealer {gameState !== 'player-turn' && dealerHand.display ? `: ${dealerHand.display}` : ''}</h2>
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

                            <div className="text-center">
                                {(playerHands.length === 0 && (gameState === 'pre-deal' || gameState === 'pre-game')) ? (
                                    <div
                                        onClick={dealNewGame}
                                        className="min-h-[250px] flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <p className="text-2xl font-bold text-gray-400">Tap to Deal</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap justify-center items-start gap-1 sm:gap-2">
                                        {playerHands.map((hand, i) => (
                                            <div key={i} className={`relative p-2 rounded-lg ${i === activeHandIndex && gameState === 'player-turn' ? 'bg-yellow-400 bg-opacity-30' : ''}`}>
                                                <div className="font-bold text-xl text-center h-8 flex flex-col justify-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <span>
                                                            {playerHands.length > 1 ? `Hand ${i + 1}: ` : ''}
                                                            {hand.status === 'bust' ? 'Bust' : hand.display}
                                                        </span>
                                                        {hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && (
                                                            <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded-full">
                                                                SPLIT
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-center items-center flex-wrap gap-x-1 gap-y-2 mt-2">
                                                    {hand.cards.map((card, j) => <Card key={j} {...card} />)}
                                                </div>
                                                {(gameState !== 'pre-deal' && gameState !== 'pre-game') && (
                                                    <button
                                                        onClick={dealNewGame}
                                                        disabled={gameState !== 'end'}
                                                        className={`absolute inset-0 w-full h-full bg-transparent text-transparent border-none shadow-none text-xl font-bold flex items-center justify-center
                                                            ${gameState === 'end' ? 'cursor-pointer' : ''}
                                                            transition-all duration-300`}
                                                    >
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
                                            className={`w-28 md:w-32 text-center py-3 md:py-4 font-bold text-lg rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
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
                    </div>
                    <div className="w-full md:w-72 mt-4 md:mt-0 flex flex-col-reverse md:flex-col flex-shrink-0">
                        <HistoryTracker history={history} correctCount={correctCount} incorrectCount={incorrectCount} winCount={winCount} lossCount={lossCount} playerBjCount={playerBjCount} dealerBjCount={dealerBjCount} pushCount={pushCount} />
                        <div className="md:hidden h-4"></div>
                        {showWashAway ? (
                            <div key={washAwayKey} className="mt-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 rounded-xl shadow-2xl flex items-center justify-center gap-2 animate-wash-away">
                                <span className="text-2xl">💔🥀</span><span className="text-xl font-bold text-gray-400">Streak Lost</span>
                            </div>
                        ) : (
                           <StreakCounter streak={streakCount} burstAnimClass={burstAnimClass} />
                        )}
                    </div>
                </div>
                {showCountPrompt && <CountPromptModal onConfirm={handleCountConfirm} />}
                {showChartModal && (
                    <BasicStrategyChartModal 
                        playerHand={activePlayerHand} 
                        dealerUpCard={dealerUpCard} 
                        onClose={() => setShowChartModal(false)}
                        calculateScore={calculateScore}
                    />
                )}
            </div>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Roboto+Mono&display=swap');
                
                body {
                    font-family: 'Nunito', sans-serif;
                    overflow-x: hidden;
                }
                .font-mono {
                    font-family: 'Roboto Mono', monospace;
                }
                .streak-box {
                    position: relative;
                    z-index: 1;
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
                
                @keyframes long-pulse-burst {
                    0% {
                      transform: scale(1);
                      box-shadow: 0 0 0px 0px rgba(147, 197, 253, 0);
                    }
                    50% {
                      transform: scale(1.15);
                      box-shadow: 0 0 30px 10px rgba(147, 197, 253, 0.7);
                    }
                    100% {
                      transform: scale(1);
                      box-shadow: 0 0 0px 0px rgba(147, 197, 253, 0);
                    }
                }
                .animate-long-pulse-burst {
                    animation: long-pulse-burst 1.5s ease-in-out forwards;
                }

                @keyframes wash-away {
                    from { opacity: 1; transform: translateY(0); filter: blur(0); }
                    to { opacity: 0; transform: translateY(40px); filter: blur(4px); }
                }
                .animate-wash-away {
                    animation: wash-away 1.5s ease-in forwards;
                }

                @keyframes subtle-glow {
                    0%, 100% { text-shadow: 0 0 6px #ffffff55; }
                    50% { text-shadow: 0 0 10px #ffffff88; }
                }
                .animate-subtle-glow {
                    animation: subtle-glow 2.5s ease-in-out infinite;
                }

                @keyframes bright-glow {
                    0%, 100% { text-shadow: 0 0 8px #ffffffaa, 0 0 12px #ffffff88; }
                    50% { text-shadow: 0 0 16px #ffffff, 0 0 24px #ffffffaa; }
                }
                .animate-bright-glow {
                    animation: bright-glow 2s ease-in-out infinite;
                }

                @keyframes blue-aura {
                    0%, 100% { text-shadow: 0 0 10px #60a5fa, 0 0 20px #3b82f6; }
                    50% { text-shadow: 0 0 15px #93c5fd, 0 0 30px #60a5fa; }
                }
                .animate-blue-aura {
                    animation: blue-aura 2s ease-in-out infinite;
                    color: #dbeafe;
                }

                @keyframes energy-flicker {
                    0%   { text-shadow: 0 0 10px #fde047, 0 0 20px #facc15; }
                    25%  { text-shadow: 0 0 12px #fde047, 0 0 25px #facc15; }
                    50%  { text-shadow: 0 0 10px #fde047, 0 0 22px #facc15; }
                    75%  { text-shadow: 0 0 14px #fde047, 0 0 28px #facc15; }
                    100% { text-shadow: 0 0 10px #fde047, 0 0 20px #facc15; }
                }
                .animate-energy-flicker {
                    animation: energy-flicker 1.5s linear infinite;
                    color: #fef9c3;
                }

                @keyframes slow-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-slow-pulse {
                    animation: slow-pulse 2.5s ease-in-out infinite;
                    color: #ede9fe;
                }

                .animate-pulse-flicker {
                    animation: slow-pulse 2.5s ease-in-out infinite, energy-flicker 1.5s linear infinite;
                    color: #fef9c3;
                }

                @keyframes ring-glow-rose {
                    from { box-shadow: 0 0 10px 0px #fecdd3, inset 0 0 10px 0px #fecdd3; }
                    to { box-shadow: 0 0 20px 5px #fecdd3, inset 0 0 20px 2px #fecdd3; }
                }
                .animate-slow-pulse-ring {
                    animation: slow-pulse 2.5s ease-in-out infinite;
                    color: #fecdd3;
                    text-shadow: 0 0 12px #fecdd3;
                }
                .animate-slow-pulse-ring::before {
                    content: '';
                    position: absolute;
                    inset: -8px;
                    border-radius: 1rem;
                    z-index: -1;
                    animation: ring-glow-rose 2.5s ease-in-out infinite alternate;
                }

                @keyframes fast-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                @keyframes text-glow-red {
                    from { text-shadow: 0 0 10px #fca5a5, 0 0 20px #ef4444; }
                    to { text-shadow: 0 0 20px #fca5a5, 0 0 30px #ef4444, 0 0 40px #ef4444; }
                }
                .animate-fast-pulse-ring {
                    animation: fast-pulse 1s ease-in-out infinite, text-glow-red 1.5s ease-in-out infinite alternate;
                    color: #fca5a5;
                }
                .animate-fast-pulse-ring::before {
                    content: '';
                    position: absolute;
                    inset: -8px;
                    border-radius: 1rem;
                    z-index: -1;
                    animation: ring-glow-rose 1s ease-in-out infinite alternate;
                }

                @keyframes cosmic-border-shift {
                    to { background-position: 200% center; }
                }
                @keyframes cosmic-text-glow {
                    from { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff; }
                    to { text-shadow: 0 0 20px #fff, 0 0 30px #60a5fa, 0 0 40px #60a5fa; }
                }
                @keyframes aura-ring-pulse {
                    from { box-shadow: 0 0 20px 5px #ffffff88; opacity: 0.7; }
                    to { box-shadow: 0 0 35px 15px #ffffff00; opacity: 1; }
                }
                .tier-8-box {
                    background-color: #1e1b4b;
                    border: 4px solid transparent;
                    background-clip: padding-box;
                    position: relative;
                }
                .tier-8-box::before {
                    content: '';
                    position: absolute;
                    top: -4px; bottom: -4px; left: -4px; right: -4px;
                    background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #84cc16, #22c55e, #14b8a6, #06b6d4, #3b82f6, #8b5cf6, #d946ef, #ef4444);
                    background-size: 200% 100%;
                    border-radius: 1rem;
                    animation: cosmic-border-shift 4s linear infinite;
                    z-index: -1;
                }
                .tier-8-box::after {
                    content: '';
                    position: absolute;
                    inset: -10px;
                    border-radius: 1.25rem;
                    z-index: -2;
                    animation: aura-ring-pulse 2s ease-in-out infinite alternate;
                }
                .tier-8-box .cosmic-text {
                    color: #fff;
                    animation: cosmic-text-glow 2s ease-in-out infinite alternate;
                }
                
                #fullscreen-announcement {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.8);
                    z-index: 100;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                }
                @keyframes announce-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes announce-text-zoom {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                #fullscreen-announcement.is-active {
                    display: flex;
                    animation: announce-fade-in 0.3s ease-out;
                }
                #fullscreen-announcement .content {
                    animation: announce-text-zoom 0.7s 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                .announce-100 .number {
                    color: #93c5fd;
                    text-shadow: 0 0 15px #60a5fa, 0 0 25px #3b82f6;
                }
                
                @keyframes starfield {
                    from { background-position: 0 0; }
                    to { background-position: -10000px 5000px; }
                }
                .announce-200 {
                    background-image: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/stars.png);
                    animation: starfield 200s linear infinite;
                }
                .announce-200 .number {
                    color: #d8b4fe;
                    text-shadow: 0 0 15px #a855f7, 0 0 30px #a855f7;
                    animation: slow-pulse 2.5s ease-in-out infinite;
                }
                
                @keyframes screen-shake {
                    0%, 100% { transform: translate(0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 2px); }
                    20%, 40%, 60%, 80% { transform: translate(2px, -2px); }
                }
                @keyframes rainbow-shift {
                    to { background-position: 200% center; }
                }
                .announce-300 {
                    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%), url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/stars.png), url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/twinkling.png);
                    animation: starfield 100s linear infinite, screen-shake 0.5s linear;
                }
                .announce-300 .number {
                    background-image: linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e, #14b8a6, #06b6d4, #3b82f6, #8b5cf6, #d946ef, #ef4444);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    animation: rainbow-shift 3s linear infinite;
                }
            `}</style>
        </>
    );
}

// ===================================================================================
// --- 3. MAIN APP COMPONENT (Router) ---
// ===================================================================================

export default function App() {
    const [gameMode, setGameMode] = useState(null); // 'solo', 'counting', or null

    if (gameMode === 'solo') {
        return <BlackjackTrainer onGoBack={() => setGameMode(null)} />;
    }

    if (gameMode === 'counting') {
        return <BlackjackCounter onGoBack={() => setGameMode(null)} />;
    }

    // Default view: Mode Selection
    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 bg-gray-900`}>
            <h1 className="text-4xl font-bold text-gray-100 transition-colors duration-300">Blackjack Trainer</h1>
            <p className="text-gray-400 transition-colors duration-300 mb-8">Select your training mode.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button onClick={() => setGameMode('solo')} className="px-8 py-4 bg-blue-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-blue-600 transition">Strategy Trainer</button>
                <button onClick={() => setGameMode('counting')} className="px-8 py-4 bg-green-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-green-600 transition">Card Counter</button>
            </div>
        </div>
    );
}
