import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const gameManager = new GameManager(io);
const connectedPlayers = new Map();
const chatMessages = [];
const matchmakingQueue = new Set();
const usedNicknames = new Set();
const matchCountdowns = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('checkNickname', (nickname, callback) => {
    const isAvailable = !usedNicknames.has(nickname);
    callback(isAvailable);
  });

  socket.on('joinLobby', ({ nickname, id }) => {
    usedNicknames.add(nickname);
    connectedPlayers.set(socket.id, { id: socket.id, nickname, status: 'online' });
    socket.join('lobby');
    
    io.to('lobby').emit('updatePlayers', Array.from(connectedPlayers.values()));
    socket.emit('chatHistory', chatMessages);
  });

  socket.on('chatMessage', (message) => {
    chatMessages.push(message);
    if (chatMessages.length > 100) chatMessages.shift();
    io.to('lobby').emit('chatMessage', message);
  });

  socket.on('queueJoin', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player) return;

    console.log(`Player ${player.nickname} joined queue`);
    player.status = 'in-queue';
    matchmakingQueue.add(socket.id);
    io.to('lobby').emit('updatePlayers', Array.from(connectedPlayers.values()));

    // Check for match
    if (matchmakingQueue.size >= 2) {
      const players = Array.from(matchmakingQueue).slice(0, 2);
      const [player1Id, player2Id] = players;
      
      console.log('Match found between players:', players);
      
      // Remove players from queue
      matchmakingQueue.delete(player1Id);
      matchmakingQueue.delete(player2Id);
      
      // Get player objects
      const readyPlayers = players
        .map(id => connectedPlayers.get(id))
        .filter(Boolean);
      
      // Notify players about match found
      players.forEach(playerId => {
        io.to(playerId).emit('matchFound');
      });
      
      // Start countdown for both players
      const countdownTimer = setTimeout(() => {
        if (readyPlayers.length === 2) {
          console.log('Starting game with players:', readyPlayers);
          const gameId = gameManager.createGame(readyPlayers);
          
          readyPlayers.forEach(player => {
            const playerSocket = io.sockets.sockets.get(player.id);
            if (playerSocket) {
              playerSocket.leave('lobby');
              playerSocket.join(`game:${gameId}`);
              
              const connectedPlayer = connectedPlayers.get(player.id);
              if (connectedPlayer) {
                connectedPlayer.status = 'in-game';
              }
            }
          });

          io.to('lobby').emit('updatePlayers', Array.from(connectedPlayers.values()));
          
          const game = gameManager.games.get(gameId);
          if (game) {
            io.to(`game:${gameId}`).emit('gameStart', game.state);
            gameManager.startGame(gameId);
          }
        }
        
        matchCountdowns.delete(player1Id);
        matchCountdowns.delete(player2Id);
      }, 10000);

      matchCountdowns.set(player1Id, countdownTimer);
      matchCountdowns.set(player2Id, countdownTimer);
    }
  });

  socket.on('queueLeave', () => {
    const player = connectedPlayers.get(socket.id);
    if (!player) return;

    console.log(`Player ${player.nickname} left queue`);
    player.status = 'online';
    matchmakingQueue.delete(socket.id);
    
    const countdown = matchCountdowns.get(socket.id);
    if (countdown) {
      clearTimeout(countdown);
      matchCountdowns.delete(socket.id);
    }
    
    io.to('lobby').emit('updatePlayers', Array.from(connectedPlayers.values()));
  });

  socket.on('playerMove', ({ direction, playerId }) => {
    console.log(`Received move from player ${playerId}: ${direction}`);
    const game = gameManager.findGameByPlayerId(playerId);
    console.log(game.state);
    if (game) {
      game.handlePlayerMove(playerId, direction);
    }
  });

  socket.on('disconnect', () => {
    const player = connectedPlayers.get(socket.id);
    if (player) {
      console.log(`Player ${player.nickname} disconnected`);
      usedNicknames.delete(player.nickname);
      connectedPlayers.delete(socket.id);
      matchmakingQueue.delete(socket.id);
      
      const countdown = matchCountdowns.get(socket.id);
      if (countdown) {
        clearTimeout(countdown);
        matchCountdowns.delete(socket.id);
      }
      
      const game = gameManager.findGameByPlayerId(socket.id);
      if (game) {
        game.handlePlayerDisconnect(socket.id);
      }
      
      io.to('lobby').emit('updatePlayers', Array.from(connectedPlayers.values()));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});