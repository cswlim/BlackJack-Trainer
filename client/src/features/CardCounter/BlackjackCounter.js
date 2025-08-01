import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ===================================================================================
// --- Professional Blackjack Counter Component ---
// ===================================================================================

const BlackjackCounter = ({ onGoBack }) => {
    // --- STATE MANAGEMENT ---
    const [numDecks, setNumDecks] = useState(8);
    const [runningCount, setRunningCount] = useState(0);
    const [cardsPlayed, setCardsPlayed] = useState(0);
    const [cardsPlayedByRank, setCardsPlayedByRank] = useState({ '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, 'T': 0, 'A': 0 });
    const [history, setHistory] = useState([]);
    const [showDeckSelector, setShowDeckSelector] = useState(false);
    const [betUnit, setBetUnit] = useState(10);
    const [activeKey, setActiveKey] = useState(null); // For keyboard feedback

    // --- REFS ---
    const deckSelectorRef = useRef(null);

    // --- DERIVED CONSTANTS & CALCULATIONS ---
    const { TOTAL_CARDS, CARDS_PER_RANK, TOTAL_ACES } = useMemo(() => {
        const CARDS_PER_DECK = 52;
        return {
            TOTAL_CARDS: numDecks * CARDS_PER_DECK,
            CARDS_PER_RANK: {
                '2': 4 * numDecks, '3': 4 * numDecks, '4': 4 * numDecks, '5': 4 * numDecks, '6': 4 * numDecks, '7': 4 * numDecks, '8': 4 * numDecks, '9': 4 * numDecks, 'T': 16 * numDecks, 'A': 4 * numDecks
            },
            TOTAL_ACES: 4 * numDecks,
        };
    }, [numDecks]);

    const trueCount = useMemo(() => {
        const CARDS_PER_DECK = 52;
        const cardsRemaining = TOTAL_CARDS - cardsPlayed;
        if (cardsRemaining === 0) return 0;
        const decksRemaining = cardsRemaining / CARDS_PER_DECK;
        return runningCount / decksRemaining;
    }, [runningCount, cardsPlayed, TOTAL_CARDS]);

    // --- CORE LOGIC ---
    const resetAll = useCallback(() => {
        setRunningCount(0);
        setCardsPlayed(0);
        setCardsPlayedByRank({ '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, 'T': 0, 'A': 0 });
        setHistory([]);
    }, []);

    const handleDeckChange = (newDeckCount) => {
        setNumDecks(newDeckCount);
        resetAll();
        setShowDeckSelector(false);
    };

    const handleCard = (rank) => {
        if (cardsPlayed >= TOTAL_CARDS) return;

        const countValueMap = { '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, 'T': -1, 'A': -1 };
        const countValue = countValueMap[rank];

        setHistory(prev => [...prev, { rank, countValue }]);
        setRunningCount(prev => prev + countValue);
        setCardsPlayed(prev => prev + 1);
        setCardsPlayedByRank(prev => ({ ...prev, [rank]: prev[rank] + 1 }));
    };

    const undoLastAction = () => {
        if (history.length === 0) return;
        const lastAction = history[history.length - 1];
        
        setRunningCount(prev => prev - lastAction.countValue);
        setCardsPlayed(prev => prev - 1);
        setCardsPlayedByRank(prev => ({ ...prev, [lastAction.rank]: prev[lastAction.rank] - 1 }));
        setHistory(prev => prev.slice(0, -1));
    };

    // --- BET SPREAD LOGIC ---
    const recommendedBet = useMemo(() => {
        const tc = Math.round(trueCount);
        let units = 1;
        if (tc <= 1) {
            units = 1;
        } else if (tc === 2) {
            units = 2;
        } else if (tc === 3) {
            units = 4;
        } else if (tc === 4) {
            units = 8;
        } else if (tc >= 5) {
            units = 12;
        }
        return units * betUnit;
    }, [trueCount, betUnit]);

    const recommendedBankroll = useMemo(() => {
        const maxBet = 12 * betUnit;
        return maxBet * 100; // Standard is 100 max bets to withstand variance
    }, [betUnit]);

    // --- PLAYING DEVIATIONS (ILLUSTRIOUS 18) ---
    const playingDeviations = useMemo(() => {
        const tc = trueCount;
        const deviations = [];
        const deviationChart = {
            'Insurance': { index: 3, play: 'Take Insurance' },
            '16v10': { index: 0, play: 'Stand' },
            '15v10': { index: 4, play: 'Stand' },
            '10v10': { index: 4, play: 'Double' },
            '12v3': { index: 2, play: 'Stand' },
            '12v2': { index: 3, play: 'Stand' },
            '13v2': { index: -1, play: 'Stand' },
            '11vA': { index: 1, play: 'Double' },
            '9v2': { index: 1, play: 'Double' },
            '10vA': { index: 4, play: 'Double' },
            '9v7': { index: 3, play: 'Double' },
            '16v9': { index: 5, play: 'Stand' },
            '13v3': { index: -2, play: 'Stand' },
        };

        if (tc >= deviationChart['Insurance'].index) deviations.push(deviationChart['Insurance'].play);
        if (tc >= deviationChart['16v10'].index) deviations.push('Stand 16 vs 10');
        if (tc >= deviationChart['15v10'].index) deviations.push('Stand 15 vs 10');
        if (tc >= deviationChart['10v10'].index) deviations.push('Double 10 vs 10');
        if (tc >= deviationChart['12v3'].index) deviations.push('Stand 12 vs 3');
        if (tc >= deviationChart['12v2'].index) deviations.push('Stand 12 vs 2');
        if (tc <= deviationChart['13v2'].index) deviations.push('Stand 13 vs 2');
        if (tc >= deviationChart['11vA'].index) deviations.push('Double 11 vs A');
        if (tc >= deviationChart['9v2'].index) deviations.push('Double 9 vs 2');
        if (tc >= deviationChart['10vA'].index) deviations.push('Double 10 vs A');
        if (tc >= deviationChart['9v7'].index) deviations.push('Double 9 vs 7');
        if (tc >= deviationChart['16v9'].index) deviations.push('Stand 16 vs 9');
        if (tc <= deviationChart['13v3'].index) deviations.push('Stand 13 vs 3');

        return deviations;
    }, [trueCount]);


    // --- Event Listeners ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (deckSelectorRef.current && !deckSelectorRef.current.contains(event.target)) {
                setShowDeckSelector(false);
            }
        };

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undoLastAction();
                return;
            }

            const keyMap = {
                '1': 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': 'T'
            };
            const rank = keyMap[e.key];
            if (rank) {
                handleCard(rank);
                setActiveKey(rank);
                setTimeout(() => setActiveKey(null), 150);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deck, history]); // Add dependencies to ensure functions have latest state

    const trueCountColor = trueCount >= 2 ? '#34c759' : trueCount <= -1 ? '#ff3b30' : '#e0e0e0';
    const cardRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T'];

    return (
        <>
            <style>{`
                .bjc-app-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  min-height: 100vh;
                  padding: 1rem;
                  box-sizing: border-box;
                  background-color: #121212;
                  color: #e0e0e0;
                }
                .bjc-header {
                    width: 100%;
                    max-width: 600px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    position: relative;
                }
                .bjc-header-right { display: flex; gap: 0.5rem; }
                .bjc-title { font-size: 1.5rem; font-weight: 700; color: #ffffff; }
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
                .bjc-deck-popout-button.active {
                    background-color: #007aff;
                    color: white;
                }

                .bjc-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    width: 100%;
                    max-width: 600px;
                }

                .bjc-panel {
                    background-color: #1c1c1e;
                    border-radius: 20px;
                    padding: 1rem;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .bjc-panel-title {
                    font-size: 1rem;
                    color: #8e8e93;
                    margin-bottom: 1rem;
                    text-align: left;
                    font-weight: 600;
                }

                .bjc-counts-display {
                    grid-column: 1 / -1;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                }
                .bjc-count-item { text-align: center; }
                .bjc-count-label { font-size: 1rem; color: #8e8e93; }
                .bjc-running-count { font-size: 4rem; font-weight: bold; line-height: 1; }
                .bjc-true-count { font-size: 2rem; font-weight: 600; }
                
                .bjc-bet-display {
                    grid-column: 1 / -1;
                    text-align: center;
                }
                .bjc-bet-value { font-size: 2.5rem; font-weight: bold; color: #34c759; }

                .bjc-card-input { grid-column: 1 / -1; }
                .bjc-card-keypad {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 0.5rem;
                }
                .bjc-keypad-button {
                    padding: 1rem 0.5rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                    border-radius: 10px;
                    border: none;
                    background-color: #3a3a3c;
                    color: white;
                    cursor: pointer;
                    transition: background-color 0.2s, transform 0.1s;
                }
                .bjc-keypad-button:hover { background-color: #555; }
                .bjc-keypad-button.active {
                    transform: scale(0.9);
                    background-color: #007aff;
                }

                .bjc-remaining-cards { grid-column: 1 / 2; }
                .bjc-deviations { grid-column: 2 / 3; }
                
                .bjc-rank-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                }
                .bjc-rank-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    padding: 0.2rem;
                }
                
                .bjc-deviation-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    text-align: left;
                    font-size: 0.9rem;
                }
                .bjc-deviation-list li {
                    padding: 0.3rem 0;
                    color: #ff9500;
                    font-weight: 600;
                }

                .bjc-bankroll-panel {
                    grid-column: 1 / -1;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                }
                .bjc-bankroll-input-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                .bjc-bankroll-input {
                    background-color: #3a3a3c;
                    border: 1px solid #555;
                    color: white;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 8px;
                    width: 100px;
                    padding: 0.5rem;
                    text-align: center;
                }
                .bjc-bankroll-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                @media (max-width: 640px) {
                    .bjc-main-grid { grid-template-columns: 1fr; }
                    .bjc-counts-display { flex-direction: column; gap: 1rem; }
                    .bjc-remaining-cards, .bjc-deviations { grid-column: 1 / -1; }
                    .bjc-bankroll-panel { flex-direction: column; gap: 1rem; }
                }
            `}</style>
            <div className="bjc-app-container">
                <div className="bjc-header" ref={deckSelectorRef}>
                    <h1 className="bjc-title">Pro Counter</h1>
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

                <div className="bjc-main-grid">
                    <div className="bjc-panel bjc-counts-display">
                        <div className="bjc-count-item">
                            <div className="bjc-count-label">Running Count</div>
                            <div className="bjc-running-count">{runningCount}</div>
                        </div>
                        <div className="bjc-count-item">
                            <div className="bjc-count-label">True Count</div>
                            <div className="bjc-true-count" style={{ color: trueCountColor }}>{trueCount.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="bjc-panel bjc-bet-display">
                        <div className="bjc-count-label">Recommended Bet</div>
                        <div className="bjc-bet-value">${recommendedBet}</div>
                    </div>
                    
                    <div className="bjc-panel bjc-bankroll-panel">
                        <div className="bjc-bankroll-input-group">
                            <label className="bjc-count-label">Table Min / Bet Unit</label>
                            <input 
                                type="number" 
                                value={betUnit} 
                                onChange={(e) => setBetUnit(parseInt(e.target.value) || 0)} 
                                className="bjc-bankroll-input"
                            />
                        </div>
                        <div className="bjc-count-item">
                            <div className="bjc-count-label">Rec. Bankroll</div>
                            <div className="bjc-bankroll-value">${recommendedBankroll.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="bjc-panel bjc-card-input">
                        <div className="bjc-panel-title">Card Input</div>
                        <div className="bjc-card-keypad">
                            {cardRanks.map(rank => (
                                <button 
                                    key={rank} 
                                    className={`bjc-keypad-button ${activeKey === rank ? 'active' : ''}`} 
                                    onClick={() => handleCard(rank)}
                                >
                                    {rank}
                                </button>
                            ))}
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                            <button className="bjc-keypad-button" style={{flexGrow: 1}} onClick={undoLastAction}>Undo</button>
                            <button className="bjc-keypad-button" style={{flexGrow: 1}} onClick={resetAll}>Reset</button>
                        </div>
                    </div>

                    <div className="bjc-panel bjc-remaining-cards">
                        <div className="bjc-panel-title">Remaining Cards</div>
                        <div className="bjc-rank-grid">
                            {cardRanks.map(rank => (
                                <div key={rank} className="bjc-rank-item">
                                    <span>{rank}:</span>
                                    <span>{CARDS_PER_RANK[rank] - cardsPlayedByRank[rank]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bjc-panel bjc-deviations">
                        <div className="bjc-panel-title">Active Deviations</div>
                        {playingDeviations.length > 0 ? (
                            <ul className="bjc-deviation-list">
                                {playingDeviations.map(dev => <li key={dev}>{dev}</li>)}
                            </ul>
                        ) : (
                            <p style={{fontSize: '0.9rem', color: '#8e8e93'}}>None</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default BlackjackCounter;
