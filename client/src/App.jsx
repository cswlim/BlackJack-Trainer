import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- HELPER FUNCTIONS & DATA ---

// Basic Strategy Chart based on provided image.
// Returns the optimal move: 'H' (Hit), 'S' (Stand), 'D' (Double), 'P' (Split)
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
            if (card.rank === 'A') aceCount++;
            score += handValue(card);
        });
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return { score, isSoft: aceCount > 0 && (score - 10) < 11 };
    };

    const player = calculateScore(playerHand);
    const dealerValue = handValue(dealerUpCard);

    // PAIR SPLITTING LOGIC from the chart
    if (playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank) {
        const rank = playerHand[0].rank;
        if (rank === 'A' || rank === '8') return 'P'; // Always split Aces and 8s
        if (rank === '9') {
            if ([7, 10, 11].includes(dealerValue)) return 'S'; // Stand against 7, 10, A
            return 'P'; // Split against 2-6, 8, 9
        }
        if (rank === '7') {
            if (dealerValue <= 7) return 'P'; // Split against 2-7
            return 'H'; // Hit against 8, 9, 10, A
        }
        if (rank === '6') {
            if (dealerValue <= 6) return 'P'; // Split against 2-6
            return 'H'; // Hit against 7-A
        }
        if (rank === '5') { // This is treated as a hard 10
            if (dealerValue <= 9) return 'D';
            return 'H';
        }
        if (rank === '4') {
            if ([5, 6].includes(dealerValue)) return 'P'; // Split against 5, 6
            return 'H'; // Hit against others
        }
        if (rank === '3' || rank === '2') {
            if (dealerValue <= 7) return 'P'; // Split against 2-7
            return 'H'; // Hit against 8-A
        }
        if (['10', 'J', 'Q', 'K'].includes(rank)) return 'S'; // Never split 10s
    }

    // SOFT HANDS LOGIC from the chart
    if (player.isSoft) {
        const softTotal = player.score;
        if (softTotal >= 19) return 'S'; // A-8, A-9, A-10 always stand
        if (softTotal === 18) { // A-7
            if (dealerValue >= 9) return 'H'; // Hit against 9, 10, A
            return 'S'; // Stand against 2-8
        }
        if (softTotal === 17) return 'H'; // A-6 always hits
        if (softTotal === 16 || softTotal === 15) { // A-5, A-4
             if ([4,5,6].includes(dealerValue)) return 'D';
             return 'H';
        }
        if (softTotal === 14 || softTotal === 13) { // A-3, A-2
             if ([5,6].includes(dealerValue)) return 'D';
             return 'H';
        }
    }

    // HARD HANDS LOGIC from the chart
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
    if (hardTotal === 11) return 'D';
    if (hardTotal === 10) {
        if (dealerValue <= 9) return 'D';
        return 'H';
    }
    if (hardTotal === 9) {
        if (dealerValue >= 3 && dealerValue <= 6) return 'D';
        return 'H';
    }
    // 5-8
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
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl shadow-2xl w-80 text-center transition-colors duration-300">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-300">What's the Running Count?</h3>
                <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full p-3 text-center text-2xl font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-300"
                    autoFocus
                />
                <button onClick={() => onConfirm(parseInt(count))} className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition">Confirm</button>
            </div>
        </div>
    );
};

const HistoryTracker = ({ history, correctCount, incorrectCount, winCount, lossCount, playerBjCount, dealerBjCount }) => {
    const opacities = ['opacity-100', 'opacity-75', 'opacity-60', 'opacity-40', 'opacity-25'];
    
    return (
        <div className="fixed top-4 right-4 w-64 bg-gray-800 bg-opacity-80 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl z-20">
            <h3 className="text-lg font-bold border-b border-gray-600 pb-2 mb-2 flex justify-between">
                <span>History</span>
                <span className="flex items-center gap-2 text-base flex-wrap justify-end">
                    <span className="text-blue-400">W:{winCount}</span>
                    <span className="text-orange-400">L:{lossCount}</span>
                    <span className="text-green-400">✅{correctCount}</span>
                    <span className="text-red-400">❌{incorrectCount}</span>
                    <span className="text-yellow-400">P-BJ:{playerBjCount}</span>
                    <span className="text-purple-400">D-BJ:{dealerBjCount}</span>
                </span>
            </h3>
            <ul className="space-y-2">
                {history.slice(0, 5).map((item, index) => (
                    <li key={index} className={`text-sm transition-opacity duration-300 ${opacities[index] || 'opacity-0'}`}>
                        <span className={item.correct ? 'text-green-400' : 'text-red-400'}>{item.correct ? '✅' : '❌'}</span> {item.text}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Toggle = ({ isEnabled, onToggle, labelOn, labelOff }) => (
    <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-300">{isEnabled ? labelOn : labelOff}</span>
        <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ${isEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);


// --- MAIN APP COMPONENT ---

export default function App() {
    // Game settings
    const [gameMode, setGameMode] = useState(null); // 'solo', 'counting'
    const [theme, setTheme] = useState('light');
    const [autoDeal, setAutoDeal] = useState(true);
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
    const [history, setHistory] = useState([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [winCount, setWinCount] = useState(0);
    const [lossCount, setLossCount] = useState(0);
    const [playerBjCount, setPlayerBjCount] = useState(0);
    const [dealerBjCount, setDealerBjCount] = useState(0);
    const lastActionFeedback = useRef('');
    const endOfRoundMessageSet = useRef(false);

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
        // A hand is soft if an Ace is counted as 11
        return { score, isSoft: aceCount > 0 && score <= 21 };
    }, []);

    // --- ATOMIC CARD DEALING ---
    const dealCard = useCallback((callback) => {
        setDeck(prevDeck => {
            if (prevDeck.length === 0) {
                callback(null); // No card to deal
                return [];
            }
            const newDeck = [...prevDeck];
            const card = newDeck.pop();
            callback(card);
            return newDeck;
        });
    }, []);

    const dealNewGame = useCallback(() => {
        endOfRoundMessageSet.current = false;
        lastActionFeedback.current = '';

        if (deck.length < 52 || isCutCardRevealed) {
            createShoe();
            setHistory([]);
            setCorrectCount(0);
            setIncorrectCount(0);
            setWinCount(0);
            setLossCount(0);
            setPlayerBjCount(0);
            setDealerBjCount(0);
            setTimeout(() => setGameState('pre-deal'), 100);
            return;
        }

        let cardsToDeal = [];
        let dealtCount = 0;
        
        const dealInitialCards = () => {
            if(dealtCount < 4) {
                dealCard(card => {
                    cardsToDeal.push(card);
                    dealtCount++;
                    dealInitialCards();
                });
            } else {
                // All 4 cards have been dealt, now set the state
                const [playerCard1, dealerCard1, playerCard2, dealerCard2] = cardsToDeal;

                setMessage('');
                setFeedback('');
                setActiveHandIndex(0);

                const tempPlayerHand = [playerCard1, playerCard2];
                const tempDealerHand = [dealerCard1, { ...dealerCard2, isHidden: true }];

                const playerInitialState = { cards: tempPlayerHand, ...calculateScore(tempPlayerHand), status: 'playing' };
                setPlayerHands([playerInitialState]);
                setDealerHand({ cards: tempDealerHand, ...calculateScore(tempDealerHand) });
                
                const playerHasBj = playerInitialState.score === 21;
                const dealerHasBj = calculateScore([dealerCard1, dealerCard2]).score === 21;

                if (playerHasBj || dealerHasBj) {
                    setGameState('end');
                } else {
                    setGameState('player-turn');
                }
            }
        };
        
        dealInitialCards();

    }, [deck.length, isCutCardRevealed, createShoe, calculateScore, dealCard]);
    
    // Player Actions
    const handlePlayerAction = (action) => {
        if (gameState !== 'player-turn') return;

        const currentHandRef = playerHands[activeHandIndex];
        const dealerUpCard = dealerHand.cards.find(c => !c.isHidden);
        const correctMove = getBasicStrategy(currentHandRef.cards, dealerUpCard);
        
        const isCorrect = action.charAt(0) === correctMove;
        const feedbackText = `Your move: ${action}. Strategy: ${correctMove}.`;
        const historyItem = { text: feedbackText, correct: isCorrect };

        setHistory(prevHistory => [historyItem, ...prevHistory]);
        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
            lastActionFeedback.current = "Correct!";
        } else {
            setIncorrectCount(prev => prev + 1);
            lastActionFeedback.current = "Incorrect.";
        }
        setFeedback(`${feedbackText} ${isCorrect ? '✅' : '❌'}`);

        switch(action) {
            case 'Hit':
            case 'Double':
                dealCard(card => {
                    if(!card) return;
                    setPlayerHands(prevHands => {
                        const newHands = JSON.parse(JSON.stringify(prevHands));
                        const currentHand = newHands[activeHandIndex];
                        currentHand.cards.push(card);
                        Object.assign(currentHand, calculateScore(currentHand.cards));
                        if(action === 'Double') currentHand.status = 'stood';
                        return newHands;
                    });
                });
                break;
            case 'Stand': {
                setPlayerHands(prevHands => {
                    const newHands = JSON.parse(JSON.stringify(prevHands));
                    const currentHand = newHands[activeHandIndex];
                    currentHand.status = 'stood';
                    return newHands;
                });
                break;
            }
            case 'Split': {
                const handToSplit = playerHands[activeHandIndex].cards;
                const hand1 = { cards: [handToSplit[0]], status: 'playing' };
                const hand2 = { cards: [handToSplit[1]], status: 'playing' };
                setPlayerHands([hand1, hand2]);
                break;
            }
            default: break;
        }
    };

    // --- USEEFFECT HOOKS FOR GAME LOGIC ---
    
    // Automatically deal a second card to a newly split hand
    useEffect(() => {
        if (gameState !== 'player-turn') return;

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
            }, 500); // Small delay to make the split visible
        }
    }, [playerHands, activeHandIndex, gameState, calculateScore, dealCard]);


    // Check player hand status (busts, 21, or all hands stood) after an action
    useEffect(() => {
        if (gameState !== 'player-turn' || playerHands.some(h => h.cards.length < 2)) return;

        const newHands = JSON.parse(JSON.stringify(playerHands));
        const activeHand = newHands[activeHandIndex];

        // Check for bust or 21 on the active hand
        if (activeHand.status === 'playing') {
            if (activeHand.score > 21) activeHand.status = 'bust';
            else if (activeHand.score === 21) activeHand.status = 'stood';
        }
        
        // If the active hand just finished, decide what to do next
        if (activeHand.status !== 'playing') {
            const nextHandIndex = newHands.findIndex((hand, index) => index > activeHandIndex && hand.status === 'playing');
            
            if (nextHandIndex !== -1) {
                // There's another split hand to play
                setActiveHandIndex(nextHandIndex);
            } else {
                // All player hands are finished, check if all busted
                const allBusted = newHands.every(h => h.status === 'bust');
                if (allBusted) {
                    setDealerHand(prev => ({...prev, cards: prev.cards.map(c => ({...c, isHidden: false}))}));
                    setTimeout(() => setGameState('end'), 500);
                } else {
                    setGameState('dealer-turn');
                }
            }
        }
        
        // Update state if it has changed
        if (JSON.stringify(newHands) !== JSON.stringify(playerHands)) {
            setPlayerHands(newHands);
        }

    }, [playerHands, gameState, activeHandIndex]);

    // Dealer's Turn Logic
    useEffect(() => {
        if (gameState !== 'dealer-turn') return;

        // Reveal dealer's hole card first
        setDealerHand(prev => ({
            ...prev,
            cards: prev.cards.map(c => ({...c, isHidden: false}))
        }));

        const dealerDrawLoop = () => {
            setDealerHand(currentDealerHand => {
                const scoreInfo = calculateScore(currentDealerHand.cards);
                
                if (scoreInfo.score < 17 || (scoreInfo.score === 17 && scoreInfo.isSoft)) {
                    dealCard(card => {
                        if (card) {
                            // Use timeout to create a delay for the next draw
                            setTimeout(() => {
                                setDealerHand(prev => ({
                                    ...prev,
                                    cards: [...prev.cards, card],
                                    ...calculateScore([...prev.cards, card])
                                }));
                                dealerDrawLoop(); // Continue the loop
                            }, 1000);
                        } else {
                            // No more cards, end turn
                            setGameState('end');
                        }
                    });
                    return currentDealerHand; // Return current hand while waiting for async card
                } else {
                    // Dealer stands, end the turn
                    setGameState('end');
                    return currentDealerHand;
                }
            });
        };
        
        // Start the drawing loop with a small delay after revealing the card
        setTimeout(dealerDrawLoop, 1000);

    }, [gameState, calculateScore, dealCard]);
    
    // Determine winner at the end of the round
    useEffect(() => {
        if (gameState === 'end' && playerHands[0].cards.length > 0 && !endOfRoundMessageSet.current) {
            endOfRoundMessageSet.current = true; // Lock this effect
            
            const revealedDealerHand = dealerHand.cards.map(c => ({...c, isHidden: false}));
            const dealerScoreInfo = calculateScore(revealedDealerHand);
            
            const playerHasBj = playerHands.length === 1 && playerHands[0].cards.length === 2 && playerHands[0].score === 21;
            const dealerHasBj = dealerScoreInfo.score === 21 && revealedDealerHand.length === 2;

            let resultMessage = '';
            let handWins = 0;
            let handLosses = 0;

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
            } else {
                 playerHands.forEach((hand, index) => {
                    resultMessage += `Hand ${index + 1}: `;
                    if (hand.status === 'bust') {
                        resultMessage += 'You lose (Busted). ';
                        handLosses++;
                    } else if (dealerScoreInfo.score > 21) {
                        resultMessage += 'You win (Dealer Busted). ';
                        handWins++;
                    } else if (hand.score > dealerScoreInfo.score) {
                        resultMessage += 'You win (Higher Score). ';
                        handWins++;
                    } else if (hand.score < dealerScoreInfo.score) {
                        resultMessage += 'You lose (Lower Score). ';
                        handLosses++;
                    } else {
                        resultMessage += 'Push. ';
                    }
                });

                if (handWins > handLosses) setWinCount(prev => prev + 1);
                else if (handLosses > handWins) setLossCount(prev => prev + 1);
            }
            
            setDealerHand(prev => ({...prev, cards: revealedDealerHand, ...dealerScoreInfo}));
            const finalMessage = `${lastActionFeedback.current} ${resultMessage}`;
            setMessage(finalMessage);
        }
    }, [gameState, playerHands, dealerHand.cards, calculateScore]);

    // Auto-deal timer logic
    const dealCallback = useRef(dealNewGame);
    useEffect(() => { dealCallback.current = dealNewGame; });

    useEffect(() => {
        let timerId;
        if (gameState === 'end' && autoDeal) {
            timerId = setTimeout(() => dealCallback.current(), 2500);
        }
        return () => clearTimeout(timerId);
    }, [gameState, autoDeal]);

    // Auto-clear feedback message
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => { setFeedback(''); }, 1500);
            return () => clearTimeout(timer);
        }
    }, [feedback]);


    // --- RENDER LOGIC ---
    const selectMode = (mode) => {
        setGameMode(mode);
        createShoe();
        setHistory([]);
        setCorrectCount(0);
        setIncorrectCount(0);
        setWinCount(0);
        setLossCount(0);
        setPlayerBjCount(0);
        setDealerBjCount(0);
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
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''} bg-gray-100 dark:bg-gray-900`}>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Blackjack Trainer</h1>
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300 mb-8">Select your training mode.</p>
                <div className="flex space-x-4">
                    <button onClick={() => selectMode('solo')} className="px-8 py-4 bg-blue-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-blue-600 transition">Solo Mode</button>
                    <button onClick={() => selectMode('counting')} className="px-8 py-4 bg-green-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-green-600 transition">Card Counting</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen font-sans p-4 flex flex-col items-center transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
            {gameMode === 'solo' && <HistoryTracker history={history} correctCount={correctCount} incorrectCount={incorrectCount} winCount={winCount} lossCount={lossCount} playerBjCount={playerBjCount} dealerBjCount={dealerBjCount} />}
            {showCountPrompt && <CountPromptModal onConfirm={handleCountConfirm} />}
            <div className="w-full max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-6">
                        <h1 className="text-3xl font-bold transition-colors duration-300">{gameMode === 'solo' ? 'Solo Mode' : 'Card Counting Mode'}</h1>
                        <div className="flex items-center gap-4">
                           <Toggle isEnabled={autoDeal} onToggle={() => setAutoDeal(!autoDeal)} labelOn="Auto" labelOff="Manual"/>
                           <Toggle isEnabled={theme === 'dark'} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} labelOn="Dark" labelOff="Light"/>
                        </div>
                    </div>
                    {gameState === 'pre-deal' || gameState === 'end' ? (
                        <button 
                            onClick={dealNewGame} 
                            className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition disabled:bg-gray-400"
                            disabled={gameState === 'end' && autoDeal}
                        >
                            {gameState === 'end' && autoDeal ? 'Dealing...' : 'Deal'}
                        </button>
                    ) : <div className="w-28 h-12"></div>}
                </header>

                {/* Game Table */}
                <div className="bg-green-700 border-4 border-green-800 rounded-3xl shadow-xl p-4 md:p-6 text-white">
                    {/* Dealer's Hand */}
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-semibold mb-2">Dealer's Hand ({gameState === 'player-turn' || (gameState === 'end' && playerHands.some(h => h.status === 'bust')) ? '?' : dealerHand.score})</h2>
                        <div className="flex justify-center items-center space-x-2 min-h-[160px] md:min-h-[176px]">
                            {dealerHand.cards.map((card, i) => <Card key={i} {...card} />)}
                        </div>
                    </div>

                    {/* Feedback Area */}
                    <div className="text-center my-2 h-16 flex items-center justify-center">
                        {(feedback || message) &&
                            <p className="text-lg font-semibold bg-black bg-opacity-20 px-4 py-2 rounded-lg animate-fade-in">
                                {feedback || message}
                            </p>
                        }
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
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}
