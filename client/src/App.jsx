import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- HELPER FUNCTIONS & DATA ---

// Basic Strategy Chart (simplified for clarity, can be expanded)
// Returns the optimal move: 'H' (Hit), 'S' (Stand), 'D' (Double), 'P' (Split)
const getBasicStrategy = (playerHand, dealerUpCardRank) => {
    const handValue = card => {
        if (['J', 'Q', 'K'].includes(card.rank)) return 10;
        if (card.rank === 'A') return 11;
        return parseInt(card.rank);
    };

    const calculateScore = (hand) => {
        let score = 0;
        let aceCount = 0;
        hand.forEach(card => {
            if (card.rank === 'A') aceCount++;
            score += handValue(card);
        });
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return { score, isSoft: aceCount > 0 && score - 10 <= 10 };
    };

    const player = calculateScore(playerHand);
    const dealerValue = handValue(dealerUpCardRank);

    // Check for splitting pairs
    if (playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank) {
        const rank = playerHand[0].rank;
        if (rank === 'A' || rank === '8') return 'P';
        if (rank === '5' || rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K') return 'S'; // Never split 5s or 10s
        if (rank === '9' && ![7, 10, 11].includes(dealerValue)) return 'P';
        if (rank === '7' && dealerValue <= 7) return 'P';
        if (rank === '6' && dealerValue <= 6) return 'P';
        if (rank === '4' && [5, 6].includes(dealerValue)) return 'P';
        if ((rank === '2' || rank === '3') && dealerValue <= 7) return 'P';
    }

    // Soft hands
    if (player.isSoft) {
        if (player.score >= 19) return 'S';
        if (player.score === 18) return dealerValue <= 8 ? 'S' : 'H';
        return 'H'; // A2-A6
    }

    // Hard hands
    if (player.score >= 17) return 'S';
    if (player.score >= 13 && player.score <= 16) return dealerValue <= 6 ? 'S' : 'H';
    if (player.score === 12) return [4, 5, 6].includes(dealerValue) ? 'S' : 'H';
    if (player.score === 11) return 'D';
    if (player.score === 10) return dealerValue <= 9 ? 'D' : 'H';
    if (player.score === 9) return dealerValue >= 3 && dealerValue <= 6 ? 'D' : 'H';
    return 'H';
};


// Hi-Lo Card Counting Value
const getCardCountValue = (card) => {
    const rank = card.rank;
    if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
    if (['10', 'J', 'Q', 'K', 'A'].includes(rank)) return -1;
    return 0;
};

// --- UI COMPONENTS ---

const Card = ({ suit, rank, isHidden, isCutCard }) => {
    if (isCutCard) {
        return <div className="w-24 h-36 md:w-28 md:h-40 bg-yellow-400 rounded-lg border-2 border-yellow-600 shadow-lg flex items-center justify-center text-black font-bold">CUT</div>;
    }
    if (isHidden) {
        return <div className="w-24 h-36 md:w-28 md:h-40 bg-gray-700 rounded-lg border-2 border-gray-800 shadow-lg flex items-center justify-center"><div className="w-20 h-32 md:w-24 md:h-36 bg-gray-600 rounded-md"></div></div>;
    }
    const suitColor = ['♥', '♦'].includes(suit) ? 'text-red-600' : 'text-gray-900';
    return (
        <div className="w-24 h-36 md:w-28 md:h-40 bg-white rounded-lg border border-gray-200 shadow-md p-2 flex flex-col justify-between transition-all transform animate-deal">
            <div className={`text-2xl font-bold ${suitColor}`}>{rank}{suit}</div>
            <div className={`text-4xl font-bold self-center ${suitColor}`}>{suit}</div>
            <div className={`text-2xl font-bold self-end rotate-180 ${suitColor}`}>{rank}{suit}</div>
        </div>
    );
};

const CountPromptModal = ({ onConfirm, onCancel }) => {
    const [count, setCount] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-100 p-6 rounded-xl shadow-2xl w-80 text-center">
                <h3 className="text-xl font-bold mb-4 text-gray-800">What's the Running Count?</h3>
                <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full p-3 text-center text-2xl font-mono bg-white border border-gray-300 rounded-lg mb-4"
                    autoFocus
                />
                <button onClick={() => onConfirm(parseInt(count))} className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition">Confirm</button>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

export default function App() {
    // Game settings
    const [gameMode, setGameMode] = useState(null); // 'solo', 'counting'
    const NUM_DECKS = 6;

    // Game state
    const [deck, setDeck] = useState([]);
    const [cutCardPosition, setCutCardPosition] = useState(0);
    const [isCutCardRevealed, setIsCutCardRevealed] = useState(false);
    const [gameState, setGameState] = useState('pre-game'); // 'pre-game', 'pre-deal', 'player-turn', 'dealer-turn', 'end'
    
    // Player & Dealer state
    const [playerHands, setPlayerHands] = useState([ { cards: [], score: 0, isSoft: false, status: 'playing' } ]);
    const [activeHandIndex, setActiveHandIndex] = useState(0);
    const [dealerHand, setDealerHand] = useState({ cards: [], score: 0, isSoft: false });
    
    // Counting mode state
    const [tableHands, setTableHands] = useState([]);
    const [playerSeat, setPlayerSeat] = useState(null);
    const [runningCount, setRunningCount] = useState(0);
    const [showCountPrompt, setShowCountPrompt] = useState(false);

    // UI state
    const [message, setMessage] = useState('Select a game mode to start.');
    const [feedback, setFeedback] = useState('');
    const [autoDealTimer, setAutoDealTimer] = useState(null);

    // --- DECK & SHOE LOGIC ---
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
        // Shuffle
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        
        // Set cut card position (between 72% and 78% of the shoe)
        const min = Math.floor(newDeck.length * 0.72);
        const max = Math.floor(newDeck.length * 0.78);
        setCutCardPosition(Math.floor(Math.random() * (max - min + 1)) + min);

        setDeck(newDeck);
        setRunningCount(0);
        setIsCutCardRevealed(false);
    }, []);

    // --- HAND SCORE CALCULATION ---
    const calculateScore = useCallback((hand) => {
        let score = 0;
        let aceCount = 0;
        hand.forEach(card => {
            if (card.rank === 'A') {
                aceCount++;
                score += 11;
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                score += 10;
            } else {
                score += parseInt(card.rank);
            }
        });
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return { score, isSoft: aceCount > 0 && score + 10 <= 21 };
    }, []);

    // --- GAME ACTIONS ---
    const dealCard = useCallback((targetHand, isHidden = false) => {
        if (deck.length === 0) return null;
        if (deck.length === (52 * NUM_DECKS) - cutCardPosition && gameMode === 'counting') {
            setIsCutCardRevealed(true);
            setMessage("Cut card revealed! Reshuffling after this round.");
        }
        const card = deck.pop();
        setDeck([...deck]);
        if (gameMode === 'counting' && !isHidden) {
            setRunningCount(prev => prev + getCardCountValue(card));
        }
        targetHand.push({ ...card, isHidden });
        return card;
    }, [deck, cutCardPosition, gameMode]);

    const dealNewGame = useCallback(() => {
        if (autoDealTimer) clearTimeout(autoDealTimer);
        setAutoDealTimer(null);

        if (deck.length < 52 || isCutCardRevealed) { // Reshuffle if deck is low or cut card was shown
            createShoe();
            setTimeout(() => setGameState('pre-deal'), 100);
            return;
        }

        setGameState('player-turn');
        setMessage('');
        setFeedback('');
        setPlayerHands([{ cards: [], score: 0, isSoft: false, status: 'playing' }]);
        setActiveHandIndex(0);

        let tempPlayerHand = [];
        let tempDealerHand = [];
        let tempTableHands = Array.from({ length: 7 }, () => []);

        if (gameMode === 'solo') {
            dealCard(tempPlayerHand);
            dealCard(tempDealerHand, true);
            dealCard(tempPlayerHand);
            dealCard(tempDealerHand);
        } else { // Counting mode
            for(let i = 0; i < 2; i++) {
                for(let j = 0; j < 7; j++) { dealCard(tempTableHands[j]); }
                dealCard(tempDealerHand, i === 0);
            }
            setTableHands(tempTableHands.map(h => ({cards: h, ...calculateScore(h)})));
            tempPlayerHand = tempTableHands[playerSeat];
        }

        const playerInitialState = { cards: tempPlayerHand, ...calculateScore(tempPlayerHand), status: 'playing' };
        const dealerInitialState = { cards: tempDealerHand, ...calculateScore(tempDealerHand) };
        setPlayerHands([playerInitialState]);
        setDealerHand(dealerInitialState);

        if (playerInitialState.score === 21) {
            setMessage('Blackjack! You win!');
            setGameState('end');
        } else if (calculateScore(dealerInitialState.cards.map(c => ({...c, isHidden: false}))).score === 21) {
            setDealerHand(prev => ({...prev, cards: prev.cards.map(c => ({...c, isHidden: false}))}));
            setMessage('Dealer has Blackjack. You lose.');
            setGameState('end');
        } else if (gameMode === 'counting') {
            setShowCountPrompt(true);
        }

    }, [deck, gameMode, playerSeat, isCutCardRevealed, createShoe, dealCard, calculateScore, autoDealTimer]);
    
    // Player Actions
    const handlePlayerAction = (action) => {
        if (gameState !== 'player-turn') return;

        const currentHandRef = playerHands[activeHandIndex];
        const dealerUpCard = dealerHand.cards.find(c => !c.isHidden);
        const correctMove = getBasicStrategy(currentHandRef.cards, dealerUpCard);
        
        let feedbackMsg = `Your move: ${action}. Basic strategy: ${correctMove}. `;
        if (action.charAt(0) === correctMove) {
            feedbackMsg += "✅ Correct!";
        } else {
            feedbackMsg += "❌ Incorrect.";
        }
        setFeedback(feedbackMsg);

        const newHands = [...playerHands];

        switch(action) {
            case 'Hit': {
                const currentHand = newHands[activeHandIndex];
                dealCard(currentHand.cards);
                Object.assign(currentHand, calculateScore(currentHand.cards)); // Update score immediately
                setPlayerHands(newHands);
                break;
            }
            case 'Stand': {
                const currentHand = newHands[activeHandIndex];
                currentHand.status = 'stood';
                if (activeHandIndex < newHands.length - 1) {
                    setActiveHandIndex(activeHandIndex + 1);
                } else {
                    setGameState('dealer-turn');
                }
                setPlayerHands(newHands);
                break;
            }
            case 'Double': {
                const currentHand = newHands[activeHandIndex];
                dealCard(currentHand.cards);
                Object.assign(currentHand, calculateScore(currentHand.cards)); // Update score immediately
                currentHand.status = 'stood';
                if (activeHandIndex < newHands.length - 1) {
                    setActiveHandIndex(activeHandIndex + 1);
                } else {
                    setGameState('dealer-turn');
                }
                setPlayerHands(newHands);
                break;
            }
            case 'Split': {
                const handToSplit = newHands[activeHandIndex].cards;
                const hand1 = { cards: [handToSplit[0]], status: 'playing' };
                const hand2 = { cards: [handToSplit[1]], status: 'playing' };
                
                dealCard(hand1.cards);
                Object.assign(hand1, calculateScore(hand1.cards));

                dealCard(hand2.cards);
                Object.assign(hand2, calculateScore(hand2.cards));

                newHands.splice(activeHandIndex, 1, hand1, hand2);
                setPlayerHands(newHands);
                break;
            }
            default: break;
        }
    };

    // --- USEEFFECT HOOKS FOR GAME LOGIC ---

    // Check player hand status (busts, 21) after an action
    useEffect(() => {
        if(gameState !== 'player-turn') return;

        const newHands = [...playerHands];
        let allHandsDone = true;
        
        newHands.forEach((hand) => {
            if (hand.status === 'playing') {
                if (hand.score > 21) {
                    hand.status = 'bust';
                    setFeedback(prev => prev + " Your hand busted.");
                } else if (hand.score === 21) {
                    hand.status = 'stood';
                }
            }
            if (hand.status === 'playing') {
                allHandsDone = false;
            }
        });

        // Only update state if there was a change in status
        if (JSON.stringify(newHands) !== JSON.stringify(playerHands)) {
            setPlayerHands(newHands);
        }
        
        if (allHandsDone) {
            const nextActiveHand = newHands.findIndex(h => h.status === 'playing');
            if (nextActiveHand === -1) {
                setGameState('dealer-turn');
            } else {
                setActiveHandIndex(nextActiveHand);
            }
        }

    }, [playerHands, gameState]);
    
    // Dealer's turn logic
    useEffect(() => {
        if (gameState !== 'dealer-turn') return;
        
        let revealedDealerHand = { ...dealerHand, cards: dealerHand.cards.map(c => ({...c, isHidden: false})) };
        if (gameMode === 'counting') {
            const hiddenCard = dealerHand.cards.find(c => c.isHidden);
            if(hiddenCard) setRunningCount(prev => prev + getCardCountValue(hiddenCard));
        }
        setDealerHand(revealedDealerHand);
        
        let currentHand = revealedDealerHand.cards;
        
        const playDealerHand = () => {
            let scoreInfo = calculateScore(currentHand);
            if (scoreInfo.score < 17 || (scoreInfo.score === 17 && scoreInfo.isSoft)) {
                dealCard(currentHand);
                setDealerHand({ cards: [...currentHand], ...calculateScore(currentHand) });
                setTimeout(playDealerHand, 1000);
            } else {
                const finalDealerScore = scoreInfo.score;
                let finalMessage = '';
                playerHands.forEach((hand, index) => {
                    finalMessage += `Hand ${index + 1}: `;
                    if (hand.status === 'bust') {
                        finalMessage += 'Busted. Dealer wins. ';
                    } else if (finalDealerScore > 21 || hand.score > finalDealerScore) {
                        finalMessage += 'You win! ';
                    } else if (hand.score < finalDealerScore) {
                        finalMessage += 'Dealer wins. ';
                    } else {
                        finalMessage += 'Push. ';
                    }
                });
                setMessage(finalMessage);
                setGameState('end');
            }
        };

        setTimeout(playDealerHand, 1000);

    }, [gameState, dealCard, calculateScore, gameMode]);

    // Auto-deal after round ends
    useEffect(() => {
        if (gameState === 'end') {
            setMessage(prev => prev + "Next round in 5 seconds...");
            const timerId = setTimeout(() => {
                dealNewGame();
            }, 5000);
            setAutoDealTimer(timerId);
            return () => clearTimeout(timerId);
        }
    }, [gameState, dealNewGame]);

    // --- RENDER LOGIC ---

    const selectMode = (mode) => {
        setGameMode(mode);
        createShoe();
        if (mode === 'solo') {
            setGameState('pre-deal');
            setMessage('Solo Mode: Press Deal to start.');
        } else {
            const seat = Math.floor(Math.random() * 7);
            setPlayerSeat(seat);
            setGameState('pre-deal');
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
    };

    const canSplit = useMemo(() => {
        if (!playerHands[activeHandIndex]) return false;
        const cards = playerHands[activeHandIndex].cards;
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }, [playerHands, activeHandIndex]);

    const canDouble = useMemo(() => {
        if (!playerHands[activeHandIndex]) return false;
        return playerHands[activeHandIndex].cards.length === 2;
    }, [playerHands, activeHandIndex]);

    if (!gameMode) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Blackjack Trainer</h1>
                <p className="text-gray-600 mb-8">Select your training mode.</p>
                <div className="flex space-x-4">
                    <button onClick={() => selectMode('solo')} className="px-8 py-4 bg-blue-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-blue-600 transition">Solo Mode</button>
                    <button onClick={() => selectMode('counting')} className="px-8 py-4 bg-green-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-green-600 transition">Card Counting</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4 flex flex-col items-center">
            {showCountPrompt && <CountPromptModal onConfirm={handleCountConfirm} />}
            <div className="w-full max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">{gameMode === 'solo' ? 'Solo Mode' : 'Card Counting Mode'}</h1>
                        {gameMode === 'counting' && <p className="text-gray-600">Running Count: {runningCount} | Decks Left: {(deck.length / 52).toFixed(1)}</p>}
                    </div>
                    {gameState === 'pre-deal' || gameState === 'end' ? (
                        <button 
                            onClick={dealNewGame} 
                            className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition disabled:bg-gray-400"
                            disabled={autoDealTimer !== null}
                        >
                            {autoDealTimer !== null ? 'Dealing...' : 'Deal'}
                        </button>
                    ) : <div className="w-28 h-12"></div>}
                </header>

                {/* Game Table */}
                <div className="bg-green-700 border-4 border-green-800 rounded-3xl shadow-xl p-4 md:p-6 text-white">
                    {/* Dealer's Hand */}
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-semibold mb-2">Dealer's Hand ({gameState === 'player-turn' ? '?' : dealerHand.score})</h2>
                        <div className="flex justify-center items-center space-x-2 min-h-[160px] md:min-h-[176px]">
                            {dealerHand.cards.map((card, i) => <Card key={i} {...card} />)}
                        </div>
                    </div>

                    {/* Feedback Area */}
                    <div className="text-center my-2 h-16 flex items-center justify-center">
                        <p className="text-lg font-semibold bg-black bg-opacity-20 px-4 py-2 rounded-lg">{message || feedback}</p>
                    </div>

                    {/* Player Area */}
                    {gameMode === 'solo' ? (
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">Your Hand(s)</h2>
                            <div className="flex justify-center items-start space-x-4">
                                {playerHands.map((hand, i) => (
                                    <div key={i} className={`p-2 rounded-lg ${i === activeHandIndex && gameState === 'player-turn' ? 'bg-yellow-400 bg-opacity-30' : ''}`}>
                                        <h3 className="font-bold">Hand {i+1}: {hand.score} {hand.status !== 'playing' && `(${hand.status})`}</h3>
                                        <div className="flex justify-center items-center space-x-2 mt-2 min-h-[160px] md:min-h-[176px]">
                                            {hand.cards.map((card, j) => <Card key={j} {...card} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">Table Hands</h2>
                            <div className="grid grid-cols-4 gap-4">
                                {tableHands.map((hand, i) => (
                                    <div key={i} className={`p-2 rounded-lg ${i === playerSeat ? 'bg-yellow-400 bg-opacity-30' : ''}`}>
                                        <h3 className="font-bold">{i === playerSeat ? 'You' : `Seat ${i+1}`}: {hand.score}</h3>
                                        <div className="flex justify-center items-center space-x-1 mt-1">
                                            {hand.cards.map((card, j) => <div key={j} className="transform scale-75"><Card {...card} /></div>)}
                                        </div>
                                    </div>
                                ))}
                                <div className={`p-2 rounded-lg col-start-4`}>
                                    {isCutCardRevealed && <div className="transform scale-75"><Card isCutCard={true} /></div>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex justify-center space-x-2 md:space-x-4">
                     {['Hit', 'Stand', 'Double', 'Split'].map(action => (
                         <button
                             key={action}
                             onClick={() => {
                                 if (gameMode === 'counting' && action !== 'Stand') {
                                     setShowCountPrompt(true);
                                 }
                                 handlePlayerAction(action);
                             }}
                             disabled={gameState !== 'player-turn' || (action === 'Split' && !canSplit) || (action === 'Double' && !canDouble)}
                             className={`px-4 py-3 md:px-6 md:py-4 font-bold text-lg rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                                 ${action === 'Hit' && 'bg-green-500 text-white'}
                                 ${action === 'Stand' && 'bg-red-500 text-white'}
                                 ${action === 'Double' && 'bg-orange-400 text-white'}
                                 ${action === 'Split' && 'bg-blue-500 text-white'}`}
                         >
                             {action}
                         </button>
                     ))}
                </div>
            </div>
            <style>{`
                @keyframes deal {
                    from { opacity: 0; transform: translateY(-20px) scale(0.8); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-deal { animation: deal 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}
