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
    const canDouble = playerHand.length === 2;

    if (playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank) {
        const rank = playerHand[0].rank;
        if (rank === 'A' || rank === '8') return 'P';
        if (rank === '9') {
            if ([7, 10, 11].includes(dealerValue)) return 'S';
            return 'P';
        }
        if (rank === '7') {
            if (dealerValue <= 7) return 'P';
            return 'H';
        }
        if (rank === '6') {
            if (dealerValue <= 6) return 'P';
            return 'H';
        }
        if (rank === '5') {
            if (dealerValue <= 9) return canDouble ? 'D' : 'H';
            return 'H';
        }
        if (rank === '4') {
            if ([5, 6].includes(dealerValue)) return 'P';
            return 'H';
        }
        if (rank === '2' || rank === '3') {
            if (dealerValue <= 7) return 'P';
            return 'H';
        }
        if (['10', 'J', 'Q', 'K'].includes(rank)) return 'S';
    }

    if (player.isSoft) {
        const softTotal = player.score;
        if (softTotal >= 20) return 'S';
        if (softTotal === 19) {
            if (dealerValue === 6) return canDouble ? 'D' : 'S';
            return 'S';
        }
        if (softTotal === 18) {
            if (dealerValue <= 6) return canDouble ? 'D' : 'S';
            if (dealerValue <= 8) return 'S';
            return 'H';
        }
        if (softTotal === 17) {
            if (dealerValue >= 3 && dealerValue <= 6) return canDouble ? 'D' : 'H';
            return 'H';
        }
        if (softTotal === 16 || softTotal === 15) {
            if (dealerValue >= 4 && dealerValue <= 6) return canDouble ? 'D' : 'H';
            return 'H';
        }
        if (softTotal === 14 || softTotal === 13) {
            if (dealerValue >= 5 && dealerValue <= 6) return canDouble ? 'D' : 'H';
            return 'H';
        }
    }

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
    return 'H';
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
        return <div className="w-24 h-36 md:w-32 md:h-44 bg-yellow-400 rounded-lg border-2 border-yellow-600 shadow-lg flex items-center justify-center text-black font-bold">CUT</div>;
    }
    if (isHidden) {
        return <div className="w-24 h-36 md:w-32 md:h-44 bg-gray-700 rounded-lg border-2 border-gray-800 shadow-lg flex items-center justify-center"><div className="w-20 h-32 md:w-28 md:h-40 bg-gray-600 rounded-md"></div></div>;
    }
    const suitColor = ['♥', '♦'].includes(suit) ? 'text-red-600' : 'text-gray-900';
    return (
        <div className="relative w-24 h-36 md:w-32 md:h-44 bg-white rounded-lg border border-gray-200 shadow-md p-2 transition-all transform animate-deal">
            <div className={`absolute top-1 left-2 text-center leading-none ${suitColor}`}>
                <p className="text-2xl font-bold">{rank}</p>
                <p className="text-xl">{suit}</p>
            </div>
            <div className={`absolute inset-0 flex items-center justify-center text-5xl md:text-6xl ${suitColor}`}>
                {suit}
            </div>
            <div className={`absolute bottom-1 right-2 text-center leading-none rotate-180 ${suitColor}`}>
                <p className="text-2xl font-bold">{rank}</p>
                <p className="text-xl">{suit}</p>
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
        const performDeal = () => {
            endOfRoundMessageSet.current = false;
            lastActionFeedback.current = '';
            setMessage('');
            setFeedback('');
            setActiveHandIndex(0);
            
            if (gameMode === 'solo') {
                let cardsToDeal = [];
                let dealtCount = 0;
                const dealInitialSolo = () => {
                    if (dealtCount < 4) {
                        dealCard(card => {
                            cardsToDeal.push(card);
                            dealtCount++;
                            dealInitialSolo();
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
            } else {
                let tempTableHands = Array.from({ length: 7 }, () => ({ cards: [], status: 'playing' }));
                let tempDealerHand = [];
                let cardsToDealCount = 15;
                
                const dealCountingTable = () => {
                    if (cardsToDealCount > 0) {
                        dealCard(card => {
                            if (cardsToDealCount > 8) {
                                tempTableHands[15 - cardsToDealCount].cards.push(card);
                            } else if (cardsToDealCount === 8) {
                                tempDealerHand.push(card);
                            } else {
                                tempTableHands[7 - cardsToDealCount].cards.push(card);
                            }
                            
                            cardsToDealCount--;
                            dealCountingTable();
                        });
                    } else {
                        dealCard(card => {
                            tempDealerHand.push({ ...card, isHidden: true });
                            setTableHands(tempTableHands.map(h => ({...h, ...calculateScore(h.cards)})));
                            setDealerHand({ cards: tempDealerHand });
                            setActiveTableHandIndex(0);
                            setGameState('ai-turn');
                        });
                    }
                };
                
                dealCountingTable();
            }
        };

        if (isCutCardRevealed) {
            createShoe();
            setTimeout(performDeal, 100);
        } else {
            performDeal();
        }
    }, [isCutCardRevealed, gameMode, createShoe, calculateScore, dealCard]);
    
    const executePlayerAction = useCallback((actionCode, actionName) => {
        setIsActionDisabled(true);
        const hands = gameMode === 'solo' ? playerHands : tableHands;
        const handIndex = gameMode === 'solo' ? activeHandIndex : playerSeat;
        const handsUpdater = gameMode === 'solo' ? setPlayerHands : setTableHands;

        const currentHandRef = hands[handIndex];
        const dealerUpCard = dealerHand.cards.find(c => !c.isHidden);
        const correctMove = getBasicStrategy(currentHandRef.cards, dealerUpCard);
        
        const isCorrect = actionCode === correctMove;
        const handInfo = `Hand ${currentHandRef.display}: `;
        const feedbackText = `${handInfo}Your move: ${actionName}. Strategy: ${correctMove}.`;
        const historyItem = { text: feedbackText, correct: isCorrect };

        setHistory(prevHistory => [historyItem, ...prevHistory]);
        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
            setStreakCount(prev => prev + 1);
            lastActionFeedback.current = "Correct!";
        } else {
            setIncorrectCount(prev => prev + 1);
            setStreakCount(0);
            lastActionFeedback.current = "Incorrect.";
        }
        setFeedback(`${feedbackText} ${isCorrect ? '✅' : '❌'}`);

        switch(actionCode) {
            case 'H':
            case 'D':
                dealCard(card => {
                    if(!card) return;
                    handsUpdater(prevHands => {
                        const newHands = JSON.parse(JSON.stringify(prevHands));
                        const currentHand = newHands[handIndex];
                        currentHand.cards.push(card);
                        Object.assign(currentHand, calculateScore(currentHand.cards));
                        if(actionCode === 'D') currentHand.status = 'stood';
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
    }, [activeHandIndex, calculateScore, dealCard, dealerHand.cards, gameMode, playerHands, playerSeat, tableHands]);

    const handlePlayerAction = useCallback((actionCode, actionName) => {
        if (gameMode === 'counting') {
            setPendingPlayerAction({ actionCode, actionName });
            setShowCountPrompt(true);
        } else {
            executePlayerAction(actionCode, actionName);
        }
    }, [gameMode, executePlayerAction]);

    const canSplit = useMemo(() => {
        const hands = gameMode === 'solo' ? playerHands : tableHands;
        const index = gameMode === 'solo' ? activeHandIndex : playerSeat;
        if (!hands[index]) return false;
        const cards = hands[index].cards;
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }, [playerHands, tableHands, activeHandIndex, playerSeat, gameMode]);

    const canDouble = useMemo(() => {
        const hands = gameMode === 'solo' ? playerHands : tableHands;
        const index = gameMode === 'solo' ? activeHandIndex : playerSeat;
        if (!hands[index]) return false;
        return hands[index].cards.length === 2;
    }, [playerHands, tableHands, activeHandIndex, playerSeat, gameMode]);
    
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
            }, 500);
        }
    }, [playerHands, activeHandIndex, gameState, calculateScore, dealCard]);

    useEffect(() => {
        if (gameState !== 'player-turn') {
            setIsActionDisabled(false);
            return;
        }

        const hands = gameMode === 'solo' ? playerHands : tableHands;
        const handsUpdater = gameMode === 'solo' ? setPlayerHands : setTableHands;
        const index = gameMode === 'solo' ? activeHandIndex : playerSeat;

        const newHands = JSON.parse(JSON.stringify(hands));
        const activeHand = newHands[index];

        if (activeHand && activeHand.cards.length >= 2) {
            if (activeHand.status === 'playing') {
                if (activeHand.score > 21) activeHand.status = 'bust';
                else if (activeHand.score === 21) activeHand.status = 'stood';
            }
        }
        
        if (activeHand && activeHand.status !== 'playing') {
             if (gameMode === 'solo') {
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
            } else {
                setActiveTableHandIndex(prev => prev + 1);
                setGameState('ai-turn');
            }
        }
        
        if (JSON.stringify(newHands) !== JSON.stringify(hands)) {
            handsUpdater(newHands);
        }

        setTimeout(() => setIsActionDisabled(false), 500);

    }, [playerHands, tableHands, gameState, activeHandIndex, playerSeat, gameMode]);

    useEffect(() => {
        if (gameState !== 'ai-turn') return;

        if (activeTableHandIndex >= 7) {
            setGameState('dealer-turn');
            return;
        }

        if (activeTableHandIndex === playerSeat) {
            setGameState('player-turn');
            return;
        }

        const currentHand = tableHands[activeTableHandIndex];
        const dealerUpCard = dealerHand.cards.find(c => !c.isHidden);
        
        const playAiHand = (hand) => {
            const move = getBasicStrategy(hand.cards, dealerUpCard);
            if (move === 'S' || hand.score >= 21) {
                setTableHands(prev => {
                    const newHands = [...prev];
                    newHands[activeTableHandIndex].status = 'stood';
                    return newHands;
                });
                setActiveTableHandIndex(prev => prev + 1);
            } else {
                dealCard(card => {
                    if (card) {
                        const newHandCards = [...hand.cards, card];
                        const newHand = {...hand, cards: newHandCards, ...calculateScore(newHandCards) };
                        setTableHands(prev => {
                            const newHands = [...prev];
                            newHands[activeTableHandIndex] = newHand;
                            return newHands;
                        });
                        setTimeout(() => playAiHand(newHand), 1000);
                    }
                });
            }
        };

        playAiHand(currentHand);

    }, [gameState, activeTableHandIndex, playerSeat, tableHands, dealerHand.cards, calculateScore, dealCard]);

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
                            }, 1000);
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
        
        setTimeout(dealerDrawLoop, 1000);

    }, [gameState, calculateScore, dealCard]);
    
    useEffect(() => {
        if (gameState === 'end' && !endOfRoundMessageSet.current) {
            endOfRoundMessageSet.current = true;
            
            const revealedDealerHand = dealerHand.cards.map(c => ({...c, isHidden: false}));
            const dealerScoreInfo = calculateScore(revealedDealerHand);
            
            const handsToEvaluate = gameMode === 'solo' ? playerHands : [tableHands[playerSeat]];
            
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
                        pushes++;
                    }
                });

                if (handWins > handLosses) setWinCount(prev => prev + 1);
                else if (handLosses > handWins) setLossCount(prev => prev + 1);
                else if (pushes > 0) setPushCount(prev => prev + pushes);
            }
            
            setDealerHand(prev => ({...prev, cards: revealedDealerHand, ...dealerScoreInfo}));
            const finalMessage = `${lastActionFeedback.current} ${resultMessage}`;
            setMessage(finalMessage);
            setHistory(prev => [{ text: resultMessage, isResult: true }, ...prev]);
        }
    }, [gameState, playerHands, tableHands, dealerHand.cards, calculateScore, gameMode, playerSeat]);

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
        if (pendingPlayerAction) {
            executePlayerAction(pendingPlayerAction.actionCode, pendingPlayerAction.actionName);
            setPendingPlayerAction(null);
        }
    };

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
                    </header>

                    <div className="bg-slate-800 border-4 border-slate-900 rounded-3xl shadow-xl p-2 md:p-6 text-white flex flex-col justify-between flex-grow">
                        <div className="text-center mb-2">
                            <h2 className="text-xl font-semibold mb-2">Dealer's Hand {gameState !== 'player-turn' && dealerHand.display ? `: ${dealerHand.display}` : ''}</h2>
                            <div className="flex justify-center items-center space-x-2 min-h-[152px] md:min-h-[188px]">
                                {dealerHand.cards.map((card, i) => <Card key={i} {...card} />)}
                            </div>
                        </div>

                        <div className="text-center my-1 h-16 flex items-center justify-center">
                            {(gameState === 'pre-deal' || gameState === 'end') && (
                                <button 
                                    onClick={dealNewGame} 
                                    className="bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg shadow-md hover:bg-blue-600 transition disabled:bg-gray-400 text-xl"
                                >
                                    Deal
                                </button>
                            )}
                            {(feedback || message) && gameState !== 'pre-deal' && gameState !== 'end' && (
                                <p className="text-lg font-semibold bg-black bg-opacity-20 px-4 py-2 rounded-lg animate-fade-in">
                                    {feedback || message}
                                </p>
                            )}
                        </div>

                        {gameMode === 'solo' ? (
                            <div className="text-center">
                                <div className="flex flex-wrap justify-center items-start gap-4">
                                    {playerHands.map((hand, i) => (
                                        <div key={i} className={`p-2 rounded-lg ${i === activeHandIndex && gameState === 'player-turn' ? 'bg-yellow-400 bg-opacity-30' : ''}`}>
                                            <div className="font-bold text-xl mb-1 text-center h-14">
                                                <div className="flex justify-center items-center gap-2">
                                                    <span>
                                                        {playerHands.length > 1 ? `Hand ${i + 1}: ` : ''}
                                                        {hand.display}
                                                    </span>
                                                    {hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && (
                                                        <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded-full">
                                                            SPLIT
                                                        </span>
                                                    )}
                                                </div>
                                                {hand.status !== 'playing' && (
                                                    <p className="text-base text-gray-400 capitalize">{hand.status}</p>
                                                )}
                                            </div>
                                            <div className="flex justify-center items-center space-x-2 mt-2 min-h-[152px] md:min-h-[188px]">
                                                {hand.cards.map((card, j) => <Card key={j} {...card} />)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                             <div className="text-center">
                                <h2 className="text-xl font-semibold mb-2">Table Hands</h2>
                                <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                                    {tableHands.map((hand, i) => (
                                        <div key={i} className={`p-2 rounded-lg ${i === playerSeat ? 'bg-yellow-400 bg-opacity-30' : ''} ${i === activeTableHandIndex && gameState === 'ai-turn' ? 'ring-2 ring-blue-400' : ''}`}>
                                            <h3 className="font-bold text-sm">{i === playerSeat ? 'You' : `Seat ${i+1}`}: {hand.display}</h3>
                                            <div className="flex justify-center items-center -space-x-12 mt-1 min-h-[120px] scale-75">
                                                {hand.cards.map((card, j) => <Card key={j} {...card} />)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 flex justify-center space-x-2 md:space-x-4">
                         {[['Hit', 'H'], ['Stand', 'S'], ['Double', 'D'], ['Split', 'P']].map(([actionName, actionCode]) => (
                             <button
                                 key={actionName}
                                 onClick={() => handlePlayerAction(actionCode, actionName)}
                                 disabled={isActionDisabled || gameState !== 'player-turn' || (actionCode === 'P' && !canSplit) || (actionCode === 'D' && !canDouble)}
                                 className={`px-4 py-3 md:px-6 md:py-4 font-bold text-lg rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
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
                <div className="w-full md:w-72 mt-4 md:mt-0 flex-shrink-0">
                    <HistoryTracker history={history} correctCount={correctCount} incorrectCount={incorrectCount} winCount={winCount} lossCount={lossCount} playerBjCount={playerBjCount} dealerBjCount={dealerBjCount} pushCount={pushCount} />
                    <StreakCounter streak={streakCount} />
                </div>
            </div>
            {showCountPrompt && <CountPromptModal onConfirm={handleCountConfirm} />}
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
