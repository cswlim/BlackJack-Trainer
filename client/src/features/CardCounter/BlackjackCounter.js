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
    const [lowCardsPlayed, setLowCardsPlayed] = useState(0);
    const [neutralCardsPlayed, setNeutralCardsPlayed] = useState(0);
    const [highCardsPlayed, setHighCardsPlayed] = useState(0);
    const [acesPlayed, setAcesPlayed] = useState(0);
    const [history, setHistory] = useState([]);
    const [chartData, setChartData] = useState([]); // State specifically for the chart
    const [showDeckSelector, setShowDeckSelector] = useState(false);
    const [tableMinBet, setTableMinBet] = useState(10);
    const [activeKey, setActiveKey] = useState(null);
    const [inputMode, setInputMode] = useState('simple'); // Default to simple mode

    // --- REFS ---
    const chartCanvasRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const deckSelectorRef = useRef(null);

    // --- DERIVED CONSTANTS & CALCULATIONS ---
    const { TOTAL_CARDS, CARDS_PER_RANK, TOTAL_ACES, INITIAL_LOW_CARDS, INITIAL_NEUTRAL_CARDS, INITIAL_HIGH_CARDS } = useMemo(() => {
        const CARDS_PER_DECK = 52;
        return {
            TOTAL_CARDS: numDecks * CARDS_PER_DECK,
            CARDS_PER_RANK: {
                '2': 4 * numDecks, '3': 4 * numDecks, '4': 4 * numDecks, '5': 4 * numDecks, '6': 4 * numDecks, '7': 4 * numDecks, '8': 4 * numDecks, '9': 4 * numDecks, 'T': 16 * numDecks, 'A': 4 * numDecks
            },
            TOTAL_ACES: 4 * numDecks,
            INITIAL_LOW_CARDS: 20 * numDecks,
            INITIAL_NEUTRAL_CARDS: 12 * numDecks,
            INITIAL_HIGH_CARDS: 20 * numDecks,
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
        setLowCardsPlayed(0);
        setNeutralCardsPlayed(0);
        setHighCardsPlayed(0);
        setAcesPlayed(0);
        setHistory([]);
        setChartData([]);
    }, []);

    const handleDeckChange = (newDeckCount) => {
        setNumDecks(newDeckCount);
        resetAll();
        setShowDeckSelector(false);
    };

    const handleCard = useCallback((value, isAce = false) => {
        if (cardsPlayed >= TOTAL_CARDS) return;
    
        let countValue;
        let rank = null;
        let group = null;
    
        if (inputMode === 'advanced') {
            const countValueMap = { '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, 'T': -1, 'A': -1 };
            countValue = countValueMap[value];
            rank = value;
        } else { // Simple Mode
            countValue = value;
            if (value === 1) group = 'low';
            else if (value === 0) group = 'neutral';
            else if (value === -1) group = 'high';
        }
    
        const newRunningCount = runningCount + countValue;
        const newCardsPlayed = cardsPlayed + 1;
        
        const cardsRemaining = (numDecks * 52) - newCardsPlayed;
        const decksRemaining = cardsRemaining > 0 ? cardsRemaining / 52 : 1;
        const newTrueCount = newRunningCount / decksRemaining;
    
        setHistory(prev => [...prev, { rank, group, isAce, countValue, runningCount, cardsPlayed, cardsPlayedByRank, lowCardsPlayed, neutralCardsPlayed, highCardsPlayed, acesPlayed }]);
        setChartData(prev => [...prev, { rc: newRunningCount, tc: newTrueCount }]);
        setRunningCount(newRunningCount);
        setCardsPlayed(newCardsPlayed);
    
        if (inputMode === 'advanced' && rank) {
            setCardsPlayedByRank(prev => ({ ...prev, [rank]: prev[rank] + 1 }));
        } 
        
        // Always track groups in the background for seamless mode switching
        if (rank) { // Advanced mode tracks groups via rank
             if (['2','3','4','5','6'].includes(rank)) setLowCardsPlayed(p => p + 1);
             else if (['7','8','9'].includes(rank)) setNeutralCardsPlayed(p => p + 1);
             else if (['T', 'A'].includes(rank)) {
                setHighCardsPlayed(p => p + 1);
                if (rank === 'A') setAcesPlayed(p => p + 1);
             }
        } else { // Simple mode tracks groups directly
            if (group === 'low') setLowCardsPlayed(p => p + 1);
            else if (group === 'neutral') setNeutralCardsPlayed(p => p + 1);
            else if (group === 'high') {
                setHighCardsPlayed(p => p + 1);
                if (isAce) {
                    setAcesPlayed(p => p + 1);
                }
            }
        }
    
    }, [cardsPlayed, TOTAL_CARDS, runningCount, numDecks, inputMode, cardsPlayedByRank, lowCardsPlayed, neutralCardsPlayed, highCardsPlayed, acesPlayed]);

    const undoLastAction = useCallback(() => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        
        setRunningCount(lastState.runningCount);
        setCardsPlayed(lastState.cardsPlayed);
        setCardsPlayedByRank(lastState.cardsPlayedByRank);
        setLowCardsPlayed(lastState.lowCardsPlayed);
        setNeutralCardsPlayed(lastState.neutralCardsPlayed);
        setHighCardsPlayed(lastState.highCardsPlayed);
        setAcesPlayed(lastState.acesPlayed);
        setHistory(prev => prev.slice(0, -1));
        setChartData(prev => prev.slice(0, -1));
    }, [history]);

    // --- BET SPREAD LOGIC ---
    const { recommendedBet, advantage } = useMemo(() => {
        const playerAdvantage = (trueCount - 1) * 0.005;

        if (playerAdvantage <= 0) {
            return { recommendedBet: 0, advantage: 0 };
        }
        
        const betAmount = (trueCount - 1) * tableMinBet;
        
        return { recommendedBet: Math.max(tableMinBet, betAmount), advantage: playerAdvantage };
    }, [trueCount, tableMinBet]);

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

            if (inputMode === 'advanced') {
                const keyMap = {
                    '1': 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': 'T'
                };
                const rank = keyMap[e.key];
                if (rank) {
                    handleCard(rank);
                    setActiveKey(rank);
                    setTimeout(() => setActiveKey(null), 150);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleCard, undoLastAction, inputMode]);

    // --- Chart Logic ---
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
            chartInstanceRef.current.data.labels = chartData.map((_, index) => index + 1);
            chartInstanceRef.current.data.datasets[0].data = chartData.map(d => d.rc);
            chartInstanceRef.current.data.datasets[1].data = chartData.map(d => d.tc);
            chartInstanceRef.current.update('none');
        }
    }, [chartData]);

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
                .bjc-header-left, .bjc-header-right { display: flex; gap: 0.5rem; align-items: center; }
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
                .bjc-reset-button { background-color: #c53030 !important; }
                .bjc-reset-button:hover { background-color: #a02828 !important; }
                
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
                .bjc-panel-title-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 1rem;
                }
                .bjc-panel-title {
                    font-size: 1rem;
                    color: #8e8e93;
                    margin-bottom: 0;
                    text-align: left;
                    font-weight: 600;
                }
                .bjc-panel-subtitle {
                    font-size: 0.8rem;
                    color: #8e8e93;
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
                .bjc-bet-value.no-bet { color: #ff443a; }

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
                 .bjc-simple-buttons {
                    display: grid;
                    grid-template-columns: .7fr .5fr 1fr;
                    gap: 0.75rem;
                }
                .bjc-simple-buttons .bjc-keypad-button {
                    font-size: 1.5rem;
                    padding: 1.25rem;
                }
                .bjc-minus-group {
                    display: flex;
                    gap: 0.75rem;
                }
                .bjc-minus-button {
                    flex: 3.5;
                    background-color: #ff3b30;
                }
                .bjc-ace-button {
                    flex: 1;
                    background-color: #ff9500;
                }


                .bjc-remaining-cards { grid-column: 1 / 2; }
                .bjc-deviations { grid-column: 2 / 3; }
                
                .bjc-rank-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem 1.5rem;
                }
                .bjc-rank-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.9rem;
                    padding: 0.2rem;
                }
                .bjc-rank-info {
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                }
                .bjc-rank-percent {
                    font-size: 0.8rem;
                    color: #8e8e93;
                    width: 50px;
                    text-align: right;
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
                
                .bjc-header-input-group {
                  display: flex;
                  align-items: center;
                  background-color: #3a3a3c;
                  border-radius: 10px;
                  padding: 0 0.25rem;
                  color: #8e8e93;
                  overflow: hidden;
                }
                .bjc-header-input {
                  background-color: transparent;
                  border: none;
                  color: white;
                  width: 40px;
                  text-align: center;
                  font-weight: 600;
                  padding: 0.5rem 0.2rem;
                  font-size: 1rem;
                }
                .bjc-header-input::-webkit-outer-spin-button,
                .bjc-header-input::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                .bjc-header-input[type=number] {
                  -moz-appearance: textfield;
                }
                .bjc-deck-selector-button {
                    background-color: transparent;
                    border-radius: 0;
                    border-left: 1px solid #555;
                }
                
                .bjc-chart-panel {
                    grid-column: 1 / -1;
                }
                
                .bjc-input-toggle {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .bjc-toggle-label {
                    font-size: 0.8rem;
                    color: #8e8e93;
                }
                .bjc-toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 22px;
                }
                .bjc-toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .bjc-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #3a3a3c;
                    transition: .4s;
                    border-radius: 22px;
                }
                .bjc-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .bjc-slider {
                    background-color: #34c759;
                }
                input:checked + .bjc-slider:before {
                    transform: translateX(18px);
                }

                @media (max-width: 640px) {
                    .bjc-main-grid { grid-template-columns: 1fr; }
                    .bjc-counts-display { flex-direction: column; gap: 1rem; }
                    .bjc-remaining-cards, .bjc-deviations { grid-column: 1 / -1; }
                    .bjc-title { display: none; }
                    .bjc-header { justify-content: center; }
                }
            `}</style>
            <div className="bjc-app-container">
                <div className="bjc-header" ref={deckSelectorRef}>
                    <div className="bjc-header-left">
                        <h1 className="bjc-title">Pro Counter</h1>
                    </div>
                    <div className="bjc-header-right">
                       <button className="bjc-header-button" onClick={onGoBack}>Back</button>
                       <div className="bjc-header-input-group">
                           <span>$</span>
                           <input 
                               type="text"
                               pattern="[0-9]*"
                               inputMode="numeric"
                               value={tableMinBet} 
                               onChange={(e) => {
                                   const value = e.target.value;
                                   if (/^\d*$/.test(value)) {
                                       setTableMinBet(value === '' ? 0 : parseInt(value, 10));
                                   }
                               }}
                               className="bjc-header-input"
                           />
                           <button className="bjc-header-button bjc-deck-selector-button" onClick={() => setShowDeckSelector(!showDeckSelector)}>
                               {numDecks}D
                           </button>
                       </div>
                       <button className="bjc-header-button" onClick={undoLastAction}>Undo</button>
                       <button className="bjc-header-button bjc-reset-button" onClick={resetAll}>Reset</button>
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
                        <div className="bjc-count-label">Recommended Bet (Advantage: {(advantage * 100).toFixed(2)}%)</div>
                        {recommendedBet > 0 ? (
                            <div className="bjc-bet-value">${recommendedBet.toFixed(2)}</div>
                        ) : (
                            <div className="bjc-bet-value no-bet">Don't Bet</div>
                        )}
                    </div>
                    
                    <div className="bjc-panel bjc-card-input">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div className="bjc-panel-title" style={{marginBottom: 0}}>Card Input</div>
                            <div className="bjc-input-toggle">
                                <span className="bjc-toggle-label">Simple</span>
                                <label className="bjc-toggle-switch">
                                    <input type="checkbox" checked={inputMode === 'advanced'} onChange={() => setInputMode(prev => prev === 'simple' ? 'advanced' : 'simple')} />
                                    <span className="bjc-slider"></span>
                                </label>
                                <span className="bjc-toggle-label">Advanced</span>
                            </div>
                        </div>
                        <hr style={{borderColor: '#3a3a3c', margin: '0.75rem 0'}} />

                        {inputMode === 'advanced' ? (
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
                        ) : (
                            <div className="bjc-simple-buttons">
                                <button className="bjc-keypad-button" style={{backgroundColor: '#34c759'}} onClick={() => handleCard(1)}>+1</button>
                                <button className="bjc-keypad-button" style={{backgroundColor: '#5856d6'}} onClick={() => handleCard(0)}>0</button>
                                <div className="bjc-minus-group">
                                    <button className="bjc-keypad-button bjc-minus-button" onClick={() => handleCard(-1)}>-1</button>
                                    <button className="bjc-keypad-button bjc-ace-button" onClick={() => handleCard(-1, true)}>A</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bjc-panel bjc-remaining-cards">
                        <div className="bjc-panel-title-container">
                            <div className="bjc-panel-title">Remaining Cards</div>
                            <div className="bjc-panel-subtitle">{cardsPlayed} / {TOTAL_CARDS} Played</div>
                        </div>
                        {inputMode === 'advanced' ? (
                            <div className="bjc-rank-grid">
                                {cardRanks.map(rank => {
                                    const remaining = CARDS_PER_RANK[rank] - cardsPlayedByRank[rank];
                                    const totalRemaining = TOTAL_CARDS - cardsPlayed;
                                    const percentage = totalRemaining > 0 ? (remaining / totalRemaining) * 100 : 0;
                                    return (
                                        <div key={rank} className="bjc-rank-item">
                                            <div className="bjc-rank-info">
                                                <span>{rank}:</span>
                                                <span>{remaining}/{CARDS_PER_RANK[rank]}</span>
                                            </div>
                                            <span className="bjc-rank-percent">{percentage.toFixed(1)}%</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                           <div className="bjc-rank-grid" style={{gridTemplateColumns: '1fr'}}>
                               <div className="bjc-rank-item"><span>Low (2-6):</span> <span>{INITIAL_LOW_CARDS - lowCardsPlayed}/{INITIAL_LOW_CARDS}</span></div>
                               <div className="bjc-rank-item"><span>Neutral (7-9):</span> <span>{INITIAL_NEUTRAL_CARDS - neutralCardsPlayed}/{INITIAL_NEUTRAL_CARDS}</span></div>
                               <div className="bjc-rank-item"><span>High (10-A):</span> <span>{INITIAL_HIGH_CARDS - highCardsPlayed}/{INITIAL_HIGH_CARDS}</span></div>
                               <div className="bjc-rank-item" style={{marginTop: '0.5rem'}}><span>Aces Left:</span> <span>{TOTAL_ACES - acesPlayed}</span></div>
                           </div>
                        )}
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

                    <div className="bjc-panel bjc-chart-panel">
                        <div className="bjc-panel-title">Count Trends</div>
                        <canvas ref={chartCanvasRef}></canvas>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BlackjackCounter;
