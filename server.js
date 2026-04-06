const express = require('express');
const { Chess } = require('chess.js');

const app = express();
const chess = new Chess();
let lastMove = null;

app.use(express.static('public'));
app.use(express.json());

app.get('/gameState', (req, res) => {
    res.json({
        fen: chess.fen(),
        turn: chess.turn(),
        isGameOver: chess.isGameOver(),
        inCheck: chess.inCheck(),
        lastMove: lastMove
    });
});

app.post('/move', (req, res) => {
    try {
        const move = req.body;
        const result = chess.move(move);
        if (result) {
            lastMove = result;
            res.json({ success: true, state: getGameState() });
        } else {
            res.status(400).json({ success: false, error: 'Invalid move' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/reset', (req, res) => {
    chess.reset();
    lastMove = null;
    res.json({ success: true, state: getGameState() });
});

function getGameState() {
    return {
        fen: chess.fen(),
        turn: chess.turn(),
        isGameOver: chess.isGameOver(),
        inCheck: chess.inCheck(),
        lastMove: lastMove
    };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
