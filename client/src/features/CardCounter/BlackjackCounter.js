import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const BlackjackCounter = ({ onGoBack }) => {
    // --- STATE MANAGEMENT ---
    const [numDecks, setNumDecks] = useState(8);
    const [runningCount, setRunningCount] = useState(0);
    const [cardsPlayed, setCardsPlayed] = useState(0);
    const [lowCardsPlayed, setLowCardsPlayed] = useState(0);
    const [neutralCardsPlayed, setNeutralCardsPlayed] = useState(0);
    const [highCardsPlayed, setHighCardsPlayed] = useState(0);
    const [acesPlayed, setAcesPlayed] = useState(0);
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
        setAcesPlayed(0);
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
            acesPlayedBefore: acesPlayed,
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
        setAcesPlayed(lastAction.acesPlayedBefore);
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

export default BlackjackCounter;