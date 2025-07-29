import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- HELPER FUNCTIONS & DATA ---

const getBasicStrategy = (playerHand, dealerUpCard, calculateScore) => {
    const handValue = card => {
        if (!card) return 0;
        if (['J', 'Q', 'K'].includes(card.rank)) return 10;
        if (card.rank === 'A') return 11;
        return parseInt(card.rank);
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
            case 16: case 15: case 14: case 13:
                if ([4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
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

// --- UI COMPONENTS ---

const Card = ({ suit, rank, isHidden }) => {
    if (isHidden) {
        return <div className="flex-shrink-0 w-[clamp(5rem,18vw,8rem)] h-[clamp(7.5rem,27vw,12rem)] bg-gray-700 rounded-lg border-2 border-gray-800 shadow-lg flex items-center justify-center"><div className="w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] bg-gray-600 rounded-md"></div></div>;
    }
    const suitColor = ['♥', '♦'].includes(suit) ? 'text-red-600' : 'text-gray-900';
    return (
        <div className="relative flex-shrink-0 w-[clamp(5rem,18vw,8rem)] h-[clamp(7.5rem,27vw,12rem)] bg-white rounded-lg border border-gray-200 shadow-md p-1 sm:p-2 transition-all transform animate-deal">
            <div className={`absolute top-1 left-2 text-center leading-none ${suitColor}`}><p className="text-lg sm:text-2xl font-bold">{rank}</p></div>
            <div className={`absolute inset-0 flex items-center justify-center text-[clamp(2.5rem,10vw,4rem)] sm:text-5xl md:text-6xl ${suitColor}`}>{suit}</div>
            <div className={`absolute bottom-1 right-2 text-center leading-none rotate-180 ${suitColor}`}><p className="text-lg sm:text-2xl font-bold">{rank}</p></div>
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
                    <div className="flex gap-3"><span className="text-blue-400">W: {winCount}</span><span className="text-orange-400">L: {lossCount}</span><span className="text-gray-400">P: {pushCount}</span></div>
                    <div className="flex gap-3"><span className="text-green-400">✅ {correctCount}</span><span className="text-red-400">❌ {incorrectCount}</span></div>
                    <div className="flex gap-3"><span className="text-yellow-400">P-BJ: {playerBjCount}</span><span className="text-purple-400">D-BJ: {dealerBjCount}</span></div>
                </div>
            </div>
            <ul className="space-y-2 max-h-28 overflow-hidden transition-all duration-300 group-hover:max-h-96 group-hover:overflow-y-auto">
                {history.slice(0, 25).map((item, index) => (
                    <li key={index} className={`text-sm transition-opacity duration-300 ${index < 5 ? opacities[index] : 'opacity-25'}`}>
                        {item.isResult ? <span className="font-bold text-yellow-300">{item.text}</span> : <><span className={item.correct ? 'text-green-400' : 'text-red-400'}>{item.correct ? '✅' : '❌'}</span> {item.text}</>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const StreakCounter = ({ streak }) => {
    const [displayStreak, setDisplayStreak] = useState(streak);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [milestoneKey, setMilestoneKey] = useState(0);
    const prevStreakRef = useRef(streak);

    useEffect(() => {
        const prevStreak = prevStreakRef.current;
        if (streak === 0 && prevStreak >= 2) {
            setDisplayStreak(prevStreak);
            setIsFadingOut(true);
            const timer = setTimeout(() => setIsFadingOut(false), 1500);
            return () => clearTimeout(timer);
        }
        if (streak > 0) setDisplayStreak(streak);
        const prevMilestone = Math.floor(prevStreak / 50);
        const currentMilestone = Math.floor(streak / 50);
        if (currentMilestone > prevMilestone) setMilestoneKey(prevKey => prevKey + 1);
        prevStreakRef.current = streak;
    }, [streak]);

    if (streak < 2) {
        if (isFadingOut) {
            return (
                <div className="mt-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 rounded-xl shadow-2xl z-20 flex items-center justify-center gap-2 animate-wash-away">
                    <span className="text-2xl">💔</span><span className="text-xl font-bold text-gray-400">{displayStreak} Streak Lost</span>
                </div>
            );
        }
        return null;
    }
    
    const getContinuousStreakClass = () => {
        if (streak >= 300) return 'tier-8-box';
        if (streak >= 250) return 'animate-fast-pulse-ring';
        if (streak >= 200) return 'animate-slow-pulse-ring';
        if (streak >= 150) return 'animate-slow-pulse';
        if (streak >= 100) return 'animate-energy-flicker';
        if (streak >= 50) return 'animate-blue-aura';
        if (streak >= 25) return 'animate-bright-glow';
        if (streak >= 10) return 'animate-subtle-glow';
        return '';
    };

    const isMilestone = streak > 0 && streak % 50 === 0 && prevStreakRef.current < streak;

    return (
        <div 
            key={milestoneKey}
            className={`streak-box mt-4 bg-gray-900 p-4 rounded-xl shadow-2xl flex items-center justify-center gap-2 text-white ${getContinuousStreakClass()} ${isMilestone ? 'animate-milestone-burst' : ''}`}
        >
            <span className={`text-2xl ${streak >= 300 ? 'cosmic-text' : ''}`}>🔥</span>
            <span className={`text-xl font-bold ${streak >= 300 ? 'cosmic-text' : ''}`}>{displayStreak} Streak!</span>
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
    const [gameState, setGameState] = useState('pre-game');
    const [playerHands, setPlayerHands] = useState([]);
    const [activeHandIndex, setActiveHandIndex] = useState(0);
    const [dealerHand, setDealerHand] = useState({ cards: [] });
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
    const [announcement, setAnnouncement] = useState(null);
    const prevStreakForAnnounceRef = useRef(0);

    const createShoe = useCallback(() => {
        const suits = ['♠', '♣', '♥', '♦'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        let newDeck = Array.from({ length: NUM_DECKS }, () => suits.flatMap(suit => ranks.map(rank => ({ suit, rank })))).flat();
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        const min = Math.floor(newDeck.length * 0.72);
        const max = Math.floor(newDeck.length * 0.78);
        setCutCardPosition(Math.floor(Math.random() * (max - min + 1)) + min);
        setDeck(newDeck);
        setIsCutCardRevealed(false);
    }, []);

    const calculateScore = useCallback((hand) => {
        let scoreWithoutAces = 0;
        let aceCount = 0;
        hand.forEach(card => {
            if (!card) return;
            if (card.rank === 'A') aceCount++;
            else if (['J', 'Q', 'K'].includes(card.rank)) scoreWithoutAces += 10;
            else scoreWithoutAces += parseInt(card.rank);
        });
        if (aceCount === 0) return { score: scoreWithoutAces, isSoft: false, display: `${scoreWithoutAces}` };
        const lowScore = scoreWithoutAces + aceCount;
        const highScore = lowScore + 10;
        if (highScore === 21 && hand.length === 2) return { score: 21, isSoft: false, display: 'Blackjack' };
        if (highScore > 21) return { score: lowScore, isSoft: false, display: `${lowScore}` };
        return { score: highScore, isSoft: true, display: `${lowScore} / ${highScore}` };
    }, []);

    const dealCard = useCallback((callback) => {
        setDeck(prevDeck => {
            if (prevDeck.length === 0) { callback(null); return []; }
            const newDeck = [...prevDeck];
            if (newDeck.length === cutCardPosition) setIsCutCardRevealed(true);
            const card = newDeck.pop();
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
            setIsFeedbackCorrect(false);
            setActiveHandIndex(0);
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
                    if (playerHasBj || dealerHasBj) setGameState('end');
                    else setGameState('player-turn');
                }
            };
            dealInitialSolo();
        };
        if (isCutCardRevealed) {
            createShoe();
            setTimeout(performDeal, 100);
        } else {
            performDeal();
        }
    }, [isCutCardRevealed, createShoe, calculateScore, dealCard]);
    
    const executePlayerAction = useCallback((actionCode, actionName) => {
        setIsActionDisabled(true);
        const currentHandRef = playerHands[activeHandIndex];
        const dealerUpCard = dealerHand.cards.find(c => !c.isHidden);
        const correctMove = getBasicStrategy(currentHandRef.cards, dealerUpCard, calculateScore);
        const isCorrect = actionCode === correctMove;
        if (isCorrect) {
            setFeedback('✅');
            setIsFeedbackCorrect(true);
            setCorrectCount(prev => prev + 1);
            setStreakCount(prev => prev + 1);
            lastActionFeedback.current = "Correct!";
        } else {
            setFeedback(`❌ Correct move: ${correctMove}`);
            setIsFeedbackCorrect(false);
            setIncorrectCount(prev => prev + 1);
            setStreakCount(0);
            lastActionFeedback.current = "Incorrect.";
        }
        setHistory(prevHistory => [{ text: `Hand ${currentHandRef.display}: Your move: ${actionName}. Strategy: ${correctMove}.`, correct: isCorrect }, ...prevHistory]);

        switch(actionCode) {
            case 'H':
                dealCard(card => {
                    if(!card) return;
                    setPlayerHands(prev => {
                        const newHands = JSON.parse(JSON.stringify(prev));
                        newHands[activeHandIndex].cards.push(card);
                        Object.assign(newHands[activeHandIndex], calculateScore(newHands[activeHandIndex].cards));
                        return newHands;
                    });
                });
                break;
            case 'D':
                dealCard(card => {
                    if(!card) return;
                    setPlayerHands(prev => {
                        const newHands = JSON.parse(JSON.stringify(prev));
                        const currentHand = newHands[activeHandIndex];
                        currentHand.cards.push(card);
                        Object.assign(currentHand, calculateScore(currentHand.cards));
                        currentHand.isDoubled = true;
                        currentHand.status = currentHand.score > 21 ? 'bust' : 'stood';
                        return newHands;
                    });
                });
                break;
            case 'S':
                setPlayerHands(prev => {
                    const newHands = JSON.parse(JSON.stringify(prev));
                    newHands[activeHandIndex].status = 'stood';
                    return newHands;
                });
                break;
            case 'P':
                const handToSplit = playerHands[activeHandIndex].cards;
                const isAces = handToSplit[0].rank === 'A';
                if (isAces) {
                    dealCard(card1 => dealCard(card2 => {
                        const hand1 = { cards: [handToSplit[0], card1], status: 'stood', ...calculateScore([handToSplit[0], card1]) };
                        const hand2 = { cards: [handToSplit[1], card2], status: 'stood', ...calculateScore([handToSplit[1], card2]) };
                        setPlayerHands([hand1, hand2]);
                    }));
                } else {
                    setPlayerHands(prev => {
                        const newHands = JSON.parse(JSON.stringify(prev));
                        newHands.splice(activeHandIndex, 1, { cards: [handToSplit[0]], status: 'playing' }, { cards: [handToSplit[1]], status: 'playing' });
                        return newHands;
                    });
                }
                break;
            default: break;
        }
    }, [activeHandIndex, calculateScore, dealCard, dealerHand.cards, playerHands]);

    const canSplit = useMemo(() => {
        if (!playerHands[activeHandIndex]) return false;
        const cards = playerHands[activeHandIndex].cards;
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }, [playerHands, activeHandIndex]);

    const canDouble = useMemo(() => playerHands[activeHandIndex] && playerHands[activeHandIndex].cards.length === 2, [playerHands, activeHandIndex]);
    
    useEffect(() => {
        if (gameState !== 'player-turn') return;
        const activeHand = playerHands[activeHandIndex];
        if (activeHand && activeHand.cards.length === 1) {
            setTimeout(() => dealCard(card => {
                if (!card) return;
                setPlayerHands(prev => {
                    const newHands = JSON.parse(JSON.stringify(prev));
                    const currentHand = newHands[activeHandIndex];
                    currentHand.cards.push(card);
                    Object.assign(currentHand, calculateScore(currentHand.cards));
                    if (currentHand.score === 21) currentHand.status = 'stood';
                    return newHands;
                });
            }), 500);
        }
    }, [playerHands, activeHandIndex, gameState, calculateScore, dealCard]);

    useEffect(() => {
        if (gameState !== 'player-turn') { setIsActionDisabled(false); return; }
        const newHands = JSON.parse(JSON.stringify(playerHands));
        const activeHand = newHands[activeHandIndex];
        if (activeHand && activeHand.cards.length >= 2 && activeHand.status === 'playing') {
            if (activeHand.score > 21) activeHand.status = 'bust';
            else if (activeHand.score === 21) activeHand.status = 'stood';
        }
        if (activeHand && activeHand.status !== 'playing') {
            const nextHandIndex = newHands.findIndex((hand, i) => i > activeHandIndex && hand.status === 'playing');
            if (nextHandIndex !== -1) setActiveHandIndex(nextHandIndex);
            else {
                const allBusted = newHands.every(h => h.status === 'bust');
                if (allBusted) {
                    setDealerHand(prev => ({...prev, cards: prev.cards.map(c => ({...c, isHidden: false}))}));
                    setTimeout(() => setGameState('end'), 500);
                } else setGameState('dealer-turn');
            }
        }
        if (JSON.stringify(newHands) !== JSON.stringify(playerHands)) setPlayerHands(newHands);
        setTimeout(() => setIsActionDisabled(false), 500);
    }, [playerHands, gameState, activeHandIndex]);

    useEffect(() => {
        if (gameState !== 'dealer-turn') return;
        setDealerHand(prev => ({...prev, cards: prev.cards.map(c => ({...c, isHidden: false}))}));
        const dealerDrawLoop = () => {
            setDealerHand(currentDealerHand => {
                const scoreInfo = calculateScore(currentDealerHand.cards);
                if (scoreInfo.score < 17) {
                    dealCard(card => {
                        if (card) {
                            setTimeout(() => {
                                setDealerHand(prev => ({...prev, cards: [...prev.cards, card], ...calculateScore([...prev.cards, card])}));
                                dealerDrawLoop();
                            }, 300);
                        } else setGameState('end');
                    });
                    return currentDealerHand;
                } else { setGameState('end'); return currentDealerHand; }
            });
        };
        dealerDrawLoop(); 
    }, [gameState, calculateScore, dealCard]);
    
    useEffect(() => {
        if (gameState === 'end' && !endOfRoundMessageSet.current) {
            endOfRoundMessageSet.current = true;
            const revealedDealerHand = dealerHand.cards.map(c => ({...c, isHidden: false}));
            const dealerScoreInfo = calculateScore(revealedDealerHand);
            const playerHasBj = playerHands.length === 1 && playerHands[0]?.cards.length === 2 && playerHands[0]?.score === 21;
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
                let handWins = 0, handLosses = 0, pushes = 0;
                playerHands.forEach((hand, index) => {
                    const outcomeValue = hand.isDoubled ? 2 : 1;
                    resultMessage += `Hand ${index + 1}: `;
                    if (hand.status === 'bust') { resultMessage += 'You lose (Busted). '; handLosses += outcomeValue; }
                    else if (dealerScoreInfo.score > 21) { resultMessage += 'You win (Dealer Busted). '; handWins += outcomeValue; }
                    else if (hand.score > dealerScoreInfo.score) { resultMessage += 'You win (Higher Score). '; handWins += outcomeValue; }
                    else if (hand.score < dealerScoreInfo.score) { resultMessage += 'You lose (Lower Score). '; handLosses += outcomeValue; }
                    else { resultMessage += 'Push. '; pushes++; }
                });
                setWinCount(prev => prev + handWins);
                setLossCount(prev => prev + handLosses);
                setPushCount(prev => prev + pushes);
            }
            setDealerHand(prev => ({...prev, cards: revealedDealerHand, ...dealerScoreInfo}));
            setMessage(`${lastActionFeedback.current} ${resultMessage}`);
            setHistory(prev => [{ text: resultMessage, isResult: true }, ...prev]);
        }
    }, [gameState, playerHands, dealerHand.cards, calculateScore]);

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(''), 1500);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (gameState === 'player-turn') {
                if (event.key.toLowerCase() === 'a') executePlayerAction('H', 'Hit');
                if (event.key.toLowerCase() === 's') executePlayerAction('S', 'Stand');
                if (event.key.toLowerCase() === 'd' && canDouble) executePlayerAction('D', 'Double');
                if (event.key.toLowerCase() === 'f' && canSplit) executePlayerAction('P', 'Split');
            }
            if ((gameState === 'pre-deal' || gameState === 'end') && event.key === ' ') {
                event.preventDefault();
                dealNewGame();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, canDouble, canSplit, dealNewGame, executePlayerAction]);

    useEffect(() => {
        const prevStreak = prevStreakForAnnounceRef.current;
        if ([100, 200, 300].includes(streakCount) && streakCount > prevStreak) {
            setAnnouncement(streakCount);
            const timer = setTimeout(() => setAnnouncement(null), 2500);
            return () => clearTimeout(timer);
        }
        prevStreakForAnnounceRef.current = streakCount;
    }, [streakCount]);

    const selectMode = (mode) => {
        setGameMode(mode);
        createShoe();
        setHistory([]); setCorrectCount(0); setIncorrectCount(0); setWinCount(0); setLossCount(0); setPushCount(0); setPlayerBjCount(0); setDealerBjCount(0); setStreakCount(0);
        setGameState('pre-deal');
        setMessage('Solo Mode: Press Deal to start.');
    };

    if (!gameMode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900">
                <h1 className="text-4xl font-bold text-gray-100">Blackjack Trainer</h1>
                <p className="text-gray-400 mb-8">Select your training mode.</p>
                <button onClick={() => selectMode('solo')} className="px-8 py-4 bg-blue-500 text-white font-semibold text-xl rounded-xl shadow-lg hover:bg-blue-600 transition">Solo Mode</button>
            </div>
        );
    }

    return (
        <>
            {announcement && (
                <div id="fullscreen-announcement" className={`is-active announce-${announcement}`}>
                    <div className="content text-center">
                        <h2 id="announce-number" className={`text-7xl md:text-9xl font-black number ${announcement === 300 ? 'announce-cosmic-text' : ''}`}>{announcement}</h2>
                    </div>
                </div>
            )}
            <div className="min-h-screen p-4 flex flex-col items-center bg-gray-900 text-gray-100">
                <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <header className="flex justify-between items-center mb-4"><h1 className="text-3xl font-bold">Solo Mode</h1></header>
                        <div className="bg-slate-800 border-4 border-slate-900 rounded-3xl shadow-xl p-2 md:p-6 text-white flex flex-col justify-between flex-grow min-h-[60vh]">
                            <div className="text-center mb-2">
                                <h2 className="text-xl font-semibold mb-2">Dealer {gameState !== 'player-turn' && dealerHand.display ? `: ${dealerHand.display}` : ''}</h2>
                                <div className="flex justify-center items-center gap-x-1 gap-y-2 flex-wrap">{dealerHand.cards.map((card, i) => <Card key={i} {...card} />)}</div>
                            </div>
                            <div className="text-center my-0 h-10 flex items-center justify-center">
                                {feedback && gameState !== 'pre-deal' && gameState !== 'pre-game' && <p className={`text-2xl font-bold animate-fade-in ${isFeedbackCorrect ? 'text-green-400' : 'text-red-400'}`}>{feedback}</p>}
                            </div>
                            <div className="text-center">
                                {(playerHands.length === 0 && (gameState === 'pre-deal' || gameState === 'pre-game')) ? (
                                    <div onClick={dealNewGame} className="min-h-[250px] flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"><p className="text-2xl font-bold text-gray-400">Tap to Deal</p></div>
                                ) : (
                                    <div className="flex flex-wrap justify-center items-start gap-1 sm:gap-2">
                                        {playerHands.map((hand, i) => (
                                            <div key={i} className={`relative p-2 rounded-lg ${i === activeHandIndex && gameState === 'player-turn' ? 'bg-yellow-400 bg-opacity-30' : ''}`}>
                                                <div className="font-bold text-xl text-center h-8 flex flex-col justify-center">
                                                    <span>{playerHands.length > 1 ? `Hand ${i + 1}: ` : ''}{hand.status === 'bust' ? 'Bust' : hand.display}</span>
                                                </div>
                                                <div className="flex justify-center items-center flex-wrap gap-x-1 gap-y-2 mt-2">{hand.cards.map((card, j) => <Card key={j} {...card} />)}</div>
                                                {(gameState !== 'pre-deal' && gameState !== 'pre-game') && <button onClick={dealNewGame} disabled={gameState !== 'end'} className={`absolute inset-0 w-full h-full bg-transparent ${gameState === 'end' ? 'cursor-pointer' : ''}`}></button>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center space-x-2 md:space-x-4">
                            {[ ['Hit', 'H'], ['Stand', 'S'], ['Double', 'D'], ['Split', 'P'] ].map(([actionName, actionCode]) => (
                                <button key={actionName} onClick={() => executePlayerAction(actionCode, actionName)} disabled={isActionDisabled || gameState !== 'player-turn' || (actionCode === 'P' && !canSplit) || (actionCode === 'D' && !canDouble)}
                                    className={`w-28 md:w-32 text-center py-3 md:py-4 font-bold text-lg rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${actionCode === 'H' ? 'bg-green-500' : actionCode === 'S' ? 'bg-red-500' : actionCode === 'D' ? 'bg-orange-400' : 'bg-blue-500'} text-white`}>
                                    {actionName}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="w-full md:w-72 mt-4 md:mt-0 flex flex-col-reverse md:flex-col flex-shrink-0">
                        <HistoryTracker history={history} correctCount={correctCount} incorrectCount={incorrectCount} winCount={winCount} lossCount={lossCount} playerBjCount={playerBjCount} dealerBjCount={dealerBjCount} pushCount={pushCount} />
                        <div className="md:hidden h-4"></div>
                        <StreakCounter streak={streakCount} />
                    </div>
                </div>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Roboto+Mono&display=swap');
                    body { font-family: 'Nunito', sans-serif; overflow-x: hidden; }
                    .streak-box { position: relative; z-index: 1; }
                    @keyframes deal { from { opacity: 0; transform: translateY(-20px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    .animate-deal { animation: deal 0.4s ease-out forwards; }
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                    @keyframes milestone-burst { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 80% { transform: scale(0.95); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                    .animate-milestone-burst { animation: milestone-burst 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                    @keyframes wash-away { from { opacity: 1; transform: translateY(0); filter: blur(0); } to { opacity: 0; transform: translateY(40px); filter: blur(4px); } }
                    .animate-wash-away { animation: wash-away 1.5s ease-in forwards; }
                    @keyframes subtle-glow { 0%, 100% { text-shadow: 0 0 6px #ffffff55; } 50% { text-shadow: 0 0 10px #ffffff88; } }
                    .animate-subtle-glow { animation: subtle-glow 2.5s ease-in-out infinite; }
                    @keyframes bright-glow { 0%, 100% { text-shadow: 0 0 8px #ffffffaa, 0 0 12px #ffffff88; } 50% { text-shadow: 0 0 16px #ffffff, 0 0 24px #ffffffaa; } }
                    .animate-bright-glow { animation: bright-glow 2s ease-in-out infinite; }
                    @keyframes blue-aura { 0%, 100% { text-shadow: 0 0 10px #60a5fa, 0 0 20px #3b82f6; } 50% { text-shadow: 0 0 15px #93c5fd, 0 0 30px #60a5fa; } }
                    .animate-blue-aura { animation: blue-aura 2s ease-in-out infinite; color: #dbeafe; }
                    @keyframes energy-flicker { 0% { text-shadow: 0 0 10px #fde047, 0 0 20px #facc15; } 25% { text-shadow: 0 0 12px #fde047, 0 0 25px #facc15; } 50% { text-shadow: 0 0 10px #fde047, 0 0 22px #facc15; } 75% { text-shadow: 0 0 14px #fde047, 0 0 28px #facc15; } 100% { text-shadow: 0 0 10px #fde047, 0 0 20px #facc15; } }
                    .animate-energy-flicker { animation: energy-flicker 1.5s linear infinite; color: #fef9c3; }
                    @keyframes slow-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                    .animate-slow-pulse { animation: slow-pulse 2.5s ease-in-out infinite; color: #ede9fe; }
                    @keyframes ring-glow-rose { from { box-shadow: 0 0 10px 0px #fecdd3, inset 0 0 10px 0px #fecdd3; } to { box-shadow: 0 0 20px 5px #fecdd3, inset 0 0 20px 2px #fecdd3; } }
                    .animate-slow-pulse-ring { animation: slow-pulse 2.5s ease-in-out infinite; color: #fecdd3; text-shadow: 0 0 12px #fecdd3; }
                    .animate-slow-pulse-ring::before { content: ''; position: absolute; inset: -8px; border-radius: 1rem; z-index: -1; animation: ring-glow-rose 2.5s ease-in-out infinite alternate; }
                    @keyframes fast-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
                    @keyframes text-glow-red { from { text-shadow: 0 0 10px #fca5a5, 0 0 20px #ef4444; } to { text-shadow: 0 0 20px #fca5a5, 0 0 30px #ef4444, 0 0 40px #ef4444; } }
                    .animate-fast-pulse-ring { animation: fast-pulse 1s ease-in-out infinite, text-glow-red 1.5s ease-in-out infinite alternate; color: #fca5a5; }
                    .animate-fast-pulse-ring::before { content: ''; position: absolute; inset: -8px; border-radius: 1rem; z-index: -1; animation: ring-glow-rose 1s ease-in-out infinite alternate; }
                    @keyframes cosmic-border-shift { to { background-position: 200% center; } }
                    @keyframes cosmic-text-glow { from { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff; } to { text-shadow: 0 0 20px #fff, 0 0 30px #60a5fa, 0 0 40px #60a5fa; } }
                    @keyframes aura-ring-pulse { from { box-shadow: 0 0 20px 5px #ffffff88; opacity: 0.7; } to { box-shadow: 0 0 35px 15px #ffffff00; opacity: 1; } }
                    .tier-8-box { background-color: #1e1b4b; border: 4px solid transparent; background-clip: padding-box; position: relative; }
                    .tier-8-box::before { content: ''; position: absolute; top: -4px; bottom: -4px; left: -4px; right: -4px; background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #84cc16, #22c55e, #14b8a6, #06b6d4, #3b82f6, #8b5cf6, #d946ef, #ef4444); background-size: 200% 100%; border-radius: 1rem; animation: cosmic-border-shift 4s linear infinite; z-index: -1; }
                    .tier-8-box::after { content: ''; position: absolute; inset: -10px; border-radius: 1.25rem; z-index: -2; animation: aura-ring-pulse 2s ease-in-out infinite alternate; }
                    .tier-8-box .cosmic-text { color: #fff; animation: cosmic-text-glow 2s ease-in-out infinite alternate; }
                    #fullscreen-announcement { display: none; position: fixed; inset: 0; background-color: rgba(0,0,0,0.8); z-index: 100; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
                    @keyframes announce-fade-in { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes announce-text-zoom { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    #fullscreen-announcement.is-active { display: flex; animation: announce-fade-in 0.3s ease-out; }
                    #fullscreen-announcement .content { animation: announce-text-zoom 0.7s 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
                    .announce-100 .number { color: #93c5fd; text-shadow: 0 0 15px #60a5fa, 0 0 25px #3b82f6; }
                    @keyframes starfield { from { background-position: 0 0; } to { background-position: -10000px 5000px; } }
                    .announce-200 { background-image: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/stars.png); animation: starfield 200s linear infinite; }
                    .announce-200 .number { color: #d8b4fe; text-shadow: 0 0 15px #a855f7, 0 0 30px #a855f7; animation: slow-pulse 2.5s ease-in-out infinite; }
                    @keyframes screen-shake { 0%, 100% { transform: translate(0, 0); } 10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 2px); } 20%, 40%, 60%, 80% { transform: translate(2px, -2px); } }
                    @keyframes rainbow-shift { to { background-position: 200% center; } }
                    .announce-300 { background-image: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%), url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/stars.png), url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/twinkling.png); animation: starfield 100s linear infinite, screen-shake 0.5s linear; }
                    .announce-300 .number { background-image: linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e, #14b8a6, #06b6d4, #3b82f6, #8b5cf6, #d946ef, #ef4444); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: rainbow-shift 3s linear infinite; }
                `}</style>
            </div>
        </>
    );
}
