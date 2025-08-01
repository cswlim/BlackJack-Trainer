// ===================================================================================
// --- FILE: src/components/BasicStrategyChartModal.js ---
// ===================================================================================
import React, { useCallback } from 'react';

const BasicStrategyModal = ({ playerHand, dealerUpCard, onClose, calculateScore }) => {
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


export default BasicStrategyModal;
