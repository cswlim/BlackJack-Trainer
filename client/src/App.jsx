import React, { useState } from 'react';
import './App.css';

function App() {
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [status, setStatus] = useState("Press Deal to Start");

  const deck = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const drawCard = () => deck[Math.floor(Math.random() * deck.length)];

  const deal = () => {
    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    setPlayerHand(player);
    setDealerHand(dealer);
    setStatus("Your move...");
  };

  return (
    <div className="App">
      <h1>Blackjack Trainer</h1>
      <button onClick={deal}>Deal</button>
      <div><strong>Player:</strong> {playerHand.join(', ')}</div>
      <div><strong>Dealer:</strong> {dealerHand.length > 0 ? dealerHand[0] + ', ?' : ''}</div>
      <div>{status}</div>
    </div>
  );
}

export default App;
