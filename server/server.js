const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for games
const games = {};

// Create a new game
app.post('/api/create-game', (req, res) => {
  const { fieldSize } = req.body;
  const gameId = uuidv4();
  
  games[gameId] = {
    id: gameId,
    fieldSize: fieldSize || 3,
    board: Array((fieldSize || 3) * (fieldSize || 3)).fill(null),
    currentPlayer: 'X',
    winner: null,
    players: [],
  };

  console.log(`New game created: ${gameId}`);
  res.json({ gameId });
});

// Join a game
app.post('/api/join-game/:gameId', (req, res) => {
    const { gameId } = req.params;
    const game = games[gameId];
  
    if (!game) {
      console.log(`Failed to join game: ${gameId} - Game not found`);
      return res.status(404).json({ error: 'Game not found' });
    }
  
    // Check if the player is already in the game
    const existingPlayer = game.players.find(p => p.id === req.body.playerId);
    if (existingPlayer) {
      console.log(`Player already in game: ${gameId} - Player ID: ${existingPlayer.id}`);
      return res.json({ playerId: existingPlayer.id, symbol: existingPlayer.symbol });
    }

    if (game.players.length >= 2) {
        console.log(`Failed to join game: ${gameId} - Game is full`);
        return res.status(400).json({ error: 'Game is full' });
      }
  
    const player = {
      id: uuidv4(),
      symbol: game.players.length === 0 ? 'X' : 'O',
    };
  
    game.players.push(player);
  
    console.log(`Player joined game: ${gameId} - Player ID: ${player.id}, Symbol: ${player.symbol}`);
    res.json({ playerId: player.id, symbol: player.symbol });
  });

// Make a move
app.post('/api/make-move/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { playerId, position } = req.body;
  const game = games[gameId];

  console.log(`Attempt to make move: Game ${gameId}, Player ${playerId}, Position ${position}`);

  if (!game) {
    console.log(`Failed to make move: Game ${gameId} not found`);
    return res.status(404).json({ error: 'Game not found' });
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    console.log(`Failed to make move: Player ${playerId} not found in game ${gameId}`);
    return res.status(400).json({ error: 'Player not found' });
  }

  if (game.currentPlayer !== player.symbol) {
    console.log(`Failed to make move: Not player ${playerId}'s turn in game ${gameId}`);
    return res.status(400).json({ error: 'Not your turn' });
  }

  if (game.board[position] !== null) {
    console.log(`Failed to make move: Invalid move by player ${playerId} in game ${gameId}`);
    return res.status(400).json({ error: 'Invalid move' });
  }

  game.board[position] = player.symbol;
  game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

  console.log(`Move made: Game ${gameId}, Player ${playerId}, Symbol ${player.symbol}, Position ${position}`);
  console.log(`Current board state: ${game.board.join(', ')}`);

  game.winner = checkWinner(game.board, game.fieldSize);

  if (game.winner) {
    console.log(`Game ${gameId} ended. Winner: ${game.winner}`);
  }

  res.json({ board: game.board, currentPlayer: game.currentPlayer, winner: game.winner });
});

// Get game state
app.get('/api/game/:gameId', (req, res) => {
  const { gameId } = req.params;
  const game = games[gameId];

  if (!game) {
    console.log(`Failed to get game state: Game ${gameId} not found`);
    return res.status(404).json({ error: 'Game not found' });
  }

  
  res.json(game);
});

app.get('/api/clear/:gameId', (req, res) => {
    const { gameId } = req.params;
    const game = games[gameId];
    
    if (!game) {
      console.log(`Failed to get game state: Game ${gameId} not found`);
      return res.status(404).json({ error: 'Game not found' });
    }

    game.board = Array(game.fieldSize * game.fieldSize).fill(null);
  });

function checkWinner(board, fieldSize) {
    const requiredToWin = fieldSize === 16 ? 5 : 3;
  
    // Check rows
    for (let row = 0; row < fieldSize; row++) {
      for (let col = 0; col <= fieldSize - requiredToWin; col++) {
        const symbol = board[row * fieldSize + col];
        if (symbol && Array.from({ length: requiredToWin }, (_, i) => board[row * fieldSize + col + i]).every(cell => cell === symbol)) {
          return symbol;
        }
      }
    }
  
    // Check columns
    for (let col = 0; col < fieldSize; col++) {
      for (let row = 0; row <= fieldSize - requiredToWin; row++) {
        const symbol = board[row * fieldSize + col];
        if (symbol && Array.from({ length: requiredToWin }, (_, i) => board[(row + i) * fieldSize + col]).every(cell => cell === symbol)) {
          return symbol;
        }
      }
    }
  
    // Check diagonals (top-left to bottom-right)
    for (let row = 0; row <= fieldSize - requiredToWin; row++) {
      for (let col = 0; col <= fieldSize - requiredToWin; col++) {
        const symbol = board[row * fieldSize + col];
        if (symbol && Array.from({ length: requiredToWin }, (_, i) => board[(row + i) * fieldSize + (col + i)]).every(cell => cell === symbol)) {
          return symbol;
        }
      }
    }
  
    // Check diagonals (top-right to bottom-left)
    for (let row = 0; row <= fieldSize - requiredToWin; row++) {
      for (let col = requiredToWin - 1; col < fieldSize; col++) {
        const symbol = board[row * fieldSize + col];
        if (symbol && Array.from({ length: requiredToWin }, (_, i) => board[(row + i) * fieldSize + (col - i)]).every(cell => cell === symbol)) {
          return symbol;
        }
      }
    }
  
    // Check for draw
    if (board.every(cell => cell !== null)) {
      return 'draw';
    }
  
    return null;
  }

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});