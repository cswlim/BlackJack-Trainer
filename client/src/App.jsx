// App.js
import React, { useState } from 'react';
import './App.css';

const initialState = {
  playerHand: [],
  dealerHand: [],
  message: 'Press Deal to start.',
  dealt: false,
};

const App = () => {
  const [state, setState] = useState(initialState);

  const deal = () => {
    const deck = shuffle(createDeck(6));
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    setState({
      ...state,
      playerHand,
      dealerHand,
      message: 'Your move...',
      dealt: true,
    });
  };

  const formatHand = (hand, isDealer = false) => {
    if (!state.dealt) return '?';
    if (isDealer) return `${hand[0]}, ?`;
    return hand.join(', ');
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Blackjack Trainer</h1>
        <button className="deal-button" onClick={deal}>Deal</button>
      </div>

      <div className="hands">
        <div className="hand">
          <strong>Player:</strong> {formatHand(state.playerHand)}
        </div>
        <div className="hand">
          <strong>Dealer:</strong> {formatHand(state.dealerHand, true)}
        </div>
        <p className="message">{state.message}</p>
      </div>

      {state.dealt && (
        <div className="actions">
          <button className="action-button blue">Hit</button>
          <button className="action-button green">Stand</button>
          <button className="action-button yellow">Double</button>
          <button className="action-button red">Split</button>
        </div>
      )}
    </div>
  );
};

const createDeck = (numDecks = 1) => {
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (let d = 0; d < numDecks; d++) {
    for (let v of values) {
      for (let i = 0; i < 4; i++) deck.push(v);
    }
  }
  return deck;
};

const shuffle = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export default App;
