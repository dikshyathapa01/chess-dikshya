import express from 'express';
import { Chess } from 'chess.js';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './src/routes/router.js';

const app = express();
const chess = new Chess();
let lastMove = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/users', router);

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
const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other server process and try again.`);
        process.exit(1);
    }

    console.error('Failed to start server:', error.message);
    process.exit(1);
});
