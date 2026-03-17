const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const winLine = document.getElementById('winLine');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');

let board = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;

let scores = { X: 0, O: 0 };

const human = "X";
const ai = "O";

let gameMode = "hard"; // pvp | easy | hard
let currentPlayer = "X";

const winConditions = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {

        if(board[index] !== "" || !gameActive) return;

        makeMove(index, currentPlayer);

        if(!gameActive) return;

        if(gameMode === "pvp"){
            currentPlayer = currentPlayer === "X" ? "O" : "X";
        }

        if(gameMode === "easy" && currentPlayer === human){
            setTimeout(aiRandomMove, 300);
        }

        if(gameMode === "hard" && currentPlayer === human){
            setTimeout(aiBestMove, 300);
        }

    });
});

function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());

    // Animatsiyani qayta o‘ynatish uchun
    cell.style.animation = 'none';
    // browser qayta render uchun vaqt kerak
    cell.offsetHeight; 
    cell.style.animation = null;

    checkWinner(player);
}

function checkWinner(player) {
    for(let condition of winConditions) {
        let [a,b,c] = condition;

        if(board[a] && board[a] === board[b] && board[a] === board[c]) {
            gameActive = false;
            scores[player]++;
            updateScore();
            drawWinLine(condition);
            statusText.textContent = player + " yutdi!";

            // 3 sekunddan keyin qayta boshlash
            setTimeout(() => {
                restartGame();
            }, 2000);

            return;
        }
    }

    if(!board.includes("")) {
        gameActive = false;
        statusText.textContent = "Durrang!";

        // 3 sekunddan keyin qayta boshlash
        setTimeout(() => {
            restartGame();
        }, 2000);
    }
}

function updateScore(){

    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
}

function drawWinLine(condition){

    const lineStyles = {

        "0,1,2": { top: 60, left: 0, width: 360, rotate: 0 },
        "3,4,5": { top: 180, left: 0, width: 360, rotate: 0 },
        "6,7,8": { top: 300, left: 0, width: 360, rotate: 0 },

        "0,3,6": { top: 0, left: 60, width: 360, rotate: 90 },
        "1,4,7": { top: 0, left: 180, width: 360, rotate: 90 },
        "2,5,8": { top: 0, left: 300, width: 360, rotate: 90 },

        "0,4,8": { top: 0, left: 0, width: 510, rotate: 45 },
        "2,4,6": { top: 360, left: 0, width: 510, rotate: -45 }
    };

    let key = condition.toString();
    let style = lineStyles[key];

    winLine.style.width = style.width + "px";
    winLine.style.top = style.top + "px";
    winLine.style.left = style.left + "px";
    winLine.style.transform = `rotate(${style.rotate}deg)`;
}

function aiRandomMove(){

    let empty = board
        .map((val, idx) => val === "" ? idx : null)
        .filter(val => val !== null);

    let move = empty[Math.floor(Math.random() * empty.length)];

    makeMove(move, ai);
}

function aiBestMove(){

    let bestMove = minimax(board, ai).index;
    makeMove(bestMove, ai);
}

function minimax(newBoard, player){

    let emptySpots = newBoard
        .map((val, idx) => val === "" ? idx : null)
        .filter(val => val !== null);

    if(checkWin(newBoard, human)) return { score: -10 };
    if(checkWin(newBoard, ai)) return { score: 10 };
    if(emptySpots.length === 0) return { score: 0 };

    let moves = [];

    for(let i = 0; i < emptySpots.length; i++){

        let move = {};
        move.index = emptySpots[i];

        newBoard[emptySpots[i]] = player;

        let result = minimax(newBoard, player === ai ? human : ai);
        move.score = result.score;

        newBoard[emptySpots[i]] = "";

        moves.push(move);
    }

    let bestMove;

    if(player === ai){

        let bestScore = -10000;

        for(let i = 0; i < moves.length; i++){
            if(moves[i].score > bestScore){
                bestScore = moves[i].score;
                bestMove = i;
            }
        }

    } else {

        let bestScore = 10000;

        for(let i = 0; i < moves.length; i++){
            if(moves[i].score < bestScore){
                bestScore = moves[i].score;
                bestMove = i;
            }
        }

    }

    return moves[bestMove];
}

function checkWin(board, player){

    return winConditions.some(condition =>
        condition.every(index => board[index] === player)
    );
}

function restartGame(){

    board = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";

    winLine.style.width = "0";

    statusText.textContent = "";

    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("x","o");
    });
}

function setMode(mode){
    gameMode = mode;
    restartGame();

    // Statusni yangilash
    if(mode === "pvp"){
        statusText.textContent = "Player vs Player";
    } else if(mode === "easy"){
        statusText.textContent = "Player vs Easy AI";
    } else if(mode === "hard"){
        statusText.textContent = "Player vs Hard AI";
    }

    // Aktiv tugmani yangilash
    document.querySelectorAll('.mode-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById('btn-' + mode).classList.add('active');
}
// script.js
const socket = io(); // server.js bilan ulanish

// O‘zgarishlarni yuborish
function sendMove(index, player){
    socket.emit('move', { index, player });
}

// Boshqa o‘yinchidan kelgan yurishni olish
socket.on('move', data => {
    makeMove(data.index, data.player);
});