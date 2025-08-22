import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Card from '../../components/Card.js';
import HistoryTracker from '../../components/HistoryTracker.js';
import StreakCounter from '../../components/StreakCounter.js';
import BasicStrategyChartModal from '../../components/BasicStrategyModal.js';
import CountPromptModal from '../../components/CountPromptModal.js';
import { getBasicStrategy, getCardCountValue } from '../../utils/blackjackLogic.js';

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
    
    const [runningCount, setRunningCount] = useState(0);
    const [showCountPrompt, setShowCountPrompt] = useState(false);
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

    // Use a timeout to give a moment for the player's last action to register visually
    const turnDelay = setTimeout(() => {
        let currentDealerHand = JSON.parse(JSON.stringify(dealerHand));
        currentDealerHand.cards = currentDealerHand.cards.map(c => ({...c, isHidden: false}));
        
        let tempDeck = [...deck];
        let tempRunningCount = runningCount;

        const drawLoop = () => {
            const scoreInfo = calculateScore(currentDealerHand.cards);
            
            // --- MODIFIED LOGIC ---
            // Dealer hits if score is less than 17, OR if it's a soft 17.
            if (scoreInfo.score < 17 || (scoreInfo.score === 17 && scoreInfo.isSoft)) {
                const { card, newDeck } = dealCard(tempDeck);
                if(card) {
                    currentDealerHand.cards.push(card);
                    tempDeck = newDeck;
                    tempRunningCount += getCardCountValue(card);
                    // Update the hand in real-time for the UI
                    setDealerHand(JSON.parse(JSON.stringify(currentDealerHand))); 
                    setTimeout(drawLoop, 500); // Slower timeout to see the hits
                } else {
                    finalize(); // Out of cards
                }
            } else {
                finalize(); // Stand
            }
        };

        const finalize = () => {
            const finalScoreInfo = calculateScore(currentDealerHand.cards);
            // --- IMPROVED FINALIZE ---
            setDealerHand({ ...currentDealerHand, ...finalScoreInfo });
            setDeck(tempDeck);
            setRunningCount(tempRunningCount);
            setGameState('end');
        };

        drawLoop();
    }, 500); // Initial delay before dealer acts

    return () => clearTimeout(turnDelay); // Cleanup timeout

}, [gameState]); // Simplified dependencies for this effect
    
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
                                <button onClick={onGoBack} className="px-3 py-1.5 text-sm bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-600 transition">
                                    Back
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

                        <div className="bg-gray-900 border-4 border-gray-800 rounded-3xl shadow-xl p-2 md:p-6 text-white flex flex-col justify-between flex-grow min-h-[60vh]">
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

export default BlackjackTrainer;

