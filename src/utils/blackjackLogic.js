// ===================================================================================
// --- FILE: src/utils/blackjackLogic.js ---
// ===================================================================================
// This file contains the core game logic and can be reused by any component.

export const getBasicStrategy = (playerHand, dealerUpCard) => {
    if (!playerHand || playerHand.length === 0) {
        return 'H'; // Default action if hand is empty
    }
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
            if (!card) return;
            if (card.rank === 'A') {
                aceCount++;
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                score += 10;
            } else {
                score += parseInt(card.rank);
            }
        });

        if (aceCount === 0) {
            return { score: score, isSoft: false, display: `${score}` };
        }

        const lowScore = score + aceCount;
        const highScore = lowScore + 10;
        
        if (highScore === 21 && hand.length === 2) {
            return { score: 21, isSoft: false, display: 'Blackjack' };
        }

        if (highScore > 21) {
            return { score: lowScore, isSoft: false, display: `${lowScore}` };
        } else {
            return { score: highScore, isSoft: true, display: `${lowScore} / ${highScore}` };
        }
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
            case 16:
                if ([4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 15:
                if ([4, 5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 14:
                if ([5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
                return 'H';
            case 13:
                if ([5, 6].includes(dealerValue)) return canDouble ? 'D' : 'H';
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

export const getCardCountValue = (card) => {
    if (!card) return 0;
    const rank = card.rank;
    if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
    if (['10', 'J', 'Q', 'K', 'A'].includes(rank)) return -1;
    return 0;
};
