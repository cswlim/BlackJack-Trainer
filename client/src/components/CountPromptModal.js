// ===================================================================================
// --- FILE: src/components/CountPromptModal.js ---
// ===================================================================================
import React, { useState } from 'react';

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

export default CountPromptModal;