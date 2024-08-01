const socket = io();

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const from = `${String.fromCharCode(source.col + 97)}${8 - source.row}`;
    const to = `${String.fromCharCode(target.col + 97)}${8 - target.row}`;

    const move = {
        from: from,
        to: to,
        promotion: 'q'  // Promotion to a Queen 
    };

    // Emit the move to the server
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        'p': '♟', // Black Pawn
        'r': '♜', // Black Rook
        'n': '♞', // Black Knight
        'b': '♝', // Black Bishop
        'q': '♛', // Black Queen
        'k': '♚', // Black King
        'P': '♙', // White Pawn
        'R': '♖', // White Rook
        'N': '♘', // White Knight
        'B': '♗', // White Bishop
        'Q': '♕', // White Queen
        'K': '♔', // White King
    };
    return unicodePieces[piece.type] || "";
};

// Handle player role event
socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

// Handle spectator role event
socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

// Update the board state based on the FEN string
socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

// Handle incoming moves from the server
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

// Initialize the board
renderBoard();
