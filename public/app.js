const game = new Chess();
const chessboardEl = document.getElementById('chessboard');
const turnIndicator = document.getElementById('turnIndicator');
const gameStatus = document.getElementById('gameStatus');
const connIndicator = document.getElementById('connIndicator');
const connText = document.getElementById('connText');
const resetBtn = document.getElementById('resetBtn');
const currentUserName = document.getElementById('currentUserName');
const logoutBtn = document.getElementById('logoutBtn');

let draggedPieceSquare = null;
let serverGameState = null;

function loadSession() {
    const raw = localStorage.getItem('chessAuth');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem('chessAuth');
        return null;
    }
}

function clearSession() {
    localStorage.removeItem('chessAuth');
}

const session = loadSession();
if (!session?.token || !session?.user) {
    window.location.replace('/login.html');
    throw new Error('Unauthorized access to game page');
}

if (currentUserName) {
    currentUserName.textContent = session.user.name || session.user.email || 'Player';
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        clearSession();
        window.location.replace('/login.html');
    });
}

const pieceMap = {
    'p': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'n': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'b': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'r': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'q': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'k': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    'P': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'N': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'B': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'R': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'Q': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'K': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
};

const pieceFallbackMap = {
    'p': '♟',
    'n': '♞',
    'b': '♝',
    'r': '♜',
    'q': '♛',
    'k': '♚',
    'P': '♙',
    'N': '♘',
    'B': '♗',
    'R': '♖',
    'Q': '♕',
    'K': '♔'
};

function setPieceVisual(pieceEl, pieceClass) {
    const imgUrl = pieceMap[pieceClass];
    pieceEl.classList.add('piece-fallback');
    pieceEl.textContent = pieceFallbackMap[pieceClass] || '';

    const probe = new Image();
    probe.onload = () => {
        pieceEl.classList.remove('piece-fallback');
        pieceEl.textContent = '';
        pieceEl.style.backgroundImage = `url(${imgUrl})`;
    };
    probe.onerror = () => {
        pieceEl.style.backgroundImage = 'none';
    };
    // Cache-busting helps when a previous failed request got cached.
    probe.src = `${imgUrl}?v=2`;
}

function createBoard() {
    chessboardEl.innerHTML = '';
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    // Rows 8 to 1 internally
    for (let i = 0; i < 8; i++) {
        let rank = 8 - i;
        for (let j = 0; j < 8; j++) {
            let file = files[j];
            let squareId = file + rank;

            const square = document.createElement('div');
            square.className = `square ${(i + j) % 2 === 0 ? 'light' : 'dark'}`;
            square.setAttribute('data-square', squareId);
            
            if (j === 0) {
                const rankLbl = document.createElement('span');
                rankLbl.className = 'coord coord-rank';
                rankLbl.textContent = rank;
                square.appendChild(rankLbl);
            }
            if (i === 7) {
                const fileLbl = document.createElement('span');
                fileLbl.className = 'coord coord-file';
                fileLbl.textContent = file;
                square.appendChild(fileLbl);
            }

            square.addEventListener('dragover', handleDragOver);
            square.addEventListener('drop', handleDrop);
            square.addEventListener('click', handleSquareClick);

            chessboardEl.appendChild(square);
        }
    }
}

function renderBoard() {
    if (serverGameState?.fen) {
        if (game.fen() !== serverGameState.fen) {
            game.load(serverGameState.fen);
        }
    }

    const board = game.board(); 
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let i = 0; i < 8; i++) {
        let rank = 8 - i;
        for (let j = 0; j < 8; j++) {
            let file = files[j];
            let squareId = file + rank;
            let pieceInfo = board[i][j];

            const squareEl = document.querySelector(`[data-square="${squareId}"]`);
            const existingPiece = squareEl.querySelector('.piece');
            if (existingPiece) {
                existingPiece.remove();
            }

            if (pieceInfo) {
                const pieceClass = pieceInfo.color === 'w' ? pieceInfo.type.toUpperCase() : pieceInfo.type;
                
                const pieceEl = document.createElement('div');
                pieceEl.className = 'piece';
                pieceEl.setAttribute('draggable', true);
                pieceEl.setAttribute('data-square', squareId);
                setPieceVisual(pieceEl, pieceClass);
                
                pieceEl.addEventListener('dragstart', handleDragStart);
                pieceEl.addEventListener('dragend', handleDragEnd);

                squareEl.appendChild(pieceEl);
            }
        }
    }

    updateStatus();
}

function updateStatus() {
    if (!serverGameState) return;

    let turnText = serverGameState.turn === 'w' ? "White's Turn" : "Black's Turn";
    turnIndicator.textContent = turnText;

    if (serverGameState.isGameOver) {
        if (serverGameState.inCheck) {
            gameStatus.textContent = `Checkmate - ${serverGameState.turn === 'w' ? 'Black' : 'White'} wins!`;
            gameStatus.style.color = '#ef4444';
        } else {
            gameStatus.textContent = "Game Over - Draw";
            gameStatus.style.color = '#eab308';
        }
    } else if (serverGameState.inCheck) {
        gameStatus.textContent = "Check!";
        gameStatus.style.color = '#ef4444';
    } else {
        gameStatus.textContent = "Game is active";
        gameStatus.style.color = 'var(--text-secondary)';
    }

    clearHighlights();
    if (serverGameState.lastMove) {
        highlightSquare(serverGameState.lastMove.from, 'highlight');
        highlightSquare(serverGameState.lastMove.to, 'highlight');
    }
}

function handleDragStart(e) {
    draggedPieceSquare = e.target.getAttribute('data-square');
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedPieceSquare);
    showPossibleMoves(draggedPieceSquare);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    clearHighlights('possible');
    draggedPieceSquare = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const sourceSq = e.dataTransfer.getData('text/plain');
    let targetEl = e.target;
    
    if (targetEl.classList.contains('piece')) {
        targetEl = targetEl.parentElement;
    }
    const targetSq = targetEl.getAttribute('data-square');

    if (sourceSq && targetSq && sourceSq !== targetSq) {
        attemptMove(sourceSq, targetSq);
    }
}

let selectedSquare = null;
function handleSquareClick(e) {
    let targetEl = e.target;
    if (targetEl.classList.contains('coord')) {
        targetEl = targetEl.parentElement;
    }
    if (targetEl.classList.contains('piece')) {
        targetEl = targetEl.parentElement;
    }

    const clickedSq = targetEl.getAttribute('data-square');

    if (selectedSquare) {
        if (selectedSquare !== clickedSq) {
            attemptMove(selectedSquare, clickedSq);
        }
        selectedSquare = null;
        clearHighlights('possible');
        clearHighlights('selected');
    } else {
        const hasPiece = game.get(clickedSq);
        if (hasPiece && hasPiece.color === game.turn()) {
            selectedSquare = clickedSq;
            highlightSquare(clickedSq, 'selected');
            showPossibleMoves(clickedSq);
        }
    }
}

function attemptMove(from, to) {
    let moves = game.moves({ verbose: true });
    let moveObj = moves.find(m => m.from === from && m.to === to);
    
    if (moveObj) {
        fetch('/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: moveObj.from,
                to: moveObj.to,
                promotion: moveObj.promotion || 'q'
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                serverGameState = data.state;
                renderBoard();
            } else {
                fetchGameState(); // sync if error
            }
        });
    }
}

function highlightSquare(sq, type) {
    const el = document.querySelector(`[data-square="${sq}"]`);
    if (el) el.classList.add(type);
}

function clearHighlights(type = null) {
    if (!type) {
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('highlight', 'selected', 'possible-move', 'possible-capture');
        });
    } else if (type === 'possible') {
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('possible-move', 'possible-capture');
        });
    } else {
        document.querySelectorAll(`.square.${type}`).forEach(sq => {
            sq.classList.remove(type);
        });
    }
}

function showPossibleMoves(sq) {
    const moves = game.moves({ square: sq, verbose: true });
    moves.forEach(m => {
        const el = document.querySelector(`[data-square="${m.to}"]`);
        if (el) {
            if (m.captured) {
                el.classList.add('possible-capture');
            } else {
                el.classList.add('possible-move');
            }
        }
    });
}

function isSameLastMove(a, b) {
    if (a === b) return true;
    if (!a || !b) return !a && !b;

    return (
        a.from === b.from &&
        a.to === b.to &&
        a.piece === b.piece &&
        a.color === b.color &&
        a.captured === b.captured &&
        a.promotion === b.promotion &&
        a.san === b.san
    );
}

function shouldRenderBoard(prevState, nextState) {
    if (!prevState) return true;
    if (nextState.fen !== prevState.fen) return true;
    if (!isSameLastMove(nextState.lastMove, prevState.lastMove)) return true;
    return false;
}


function fetchGameState() {
    fetch('/gameState')
        .then(res => res.json())
        .then(state => {
            setConnectionStatus(true);
            
            if (shouldRenderBoard(serverGameState, state)) {
                serverGameState = state;
                renderBoard();
            }
        })
        .catch(err => {
            console.error('Network Error', err);
            setConnectionStatus(false);
        });
}

function setConnectionStatus(isOnline) {
    if (isOnline) {
        if (!connIndicator.classList.contains('online')) {
            connIndicator.classList.add('online');
            connText.textContent = 'Connected (Polling)';
        }
    } else {
        if (connIndicator.classList.contains('online')) {
            connIndicator.classList.remove('online');
            connText.textContent = 'Disconnected';
        }
    }
}


resetBtn.addEventListener('click', () => {
    fetch('/reset', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                serverGameState = data.state;
                renderBoard();
            }
        });
});

// Initialization
createBoard();
fetchGameState();
setInterval(fetchGameState, 1000); // Poll every second
