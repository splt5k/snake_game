import { randomUUID } from 'crypto';

const GRID_SIZE = 30;
const INITIAL_SNAKE_LENGTH = 3;
const GAME_SPEED = 150;
const FOOD_SCORE = 10;

export class GameManager {
  constructor(io) {
    this.games = new Map();
    this.io = io;
  }

  createGame(players) {
    const gameId = randomUUID();
    const game = new Game(gameId, players, this.io);
    this.games.set(gameId, game);
    return gameId;
  }

  startGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      game.start();
      console.log('Starting game:', gameId);
    }
  }

  findGameByPlayerId(playerId) {
    for (const game of this.games.values()) {
      if (game.state.players.some(p => p.id === playerId)) {
        return game;
      }
    }
    return null;
  }

  removeGame(gameId) {
    this.games.delete(gameId);
  }
}

class Game {
  constructor(id, players, io) {
    this.id = id;
    this.io = io;
    this.interval = null;

    this.state = {
      active: false,
      players: players.map((player, index) => ({
        id: player.id,
        nickname: player.nickname,
        snake: this.generateInitialSnake(index),
        direction: index === 0 ? 'right' : 'left',
        score: 0,
        lost: false
      })),
      food: { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }
    };
  }

  generateInitialSnake(playerIndex) {
    const snake = [];
    let startX, startY;

    switch (playerIndex) {
      case 0: // Jogador 1 começa no canto superior esquerdo
        startX = 5;
        startY = 5;
        break;
      case 1: // Jogador 2 começa no canto inferior direito
        startX = GRID_SIZE - 6;
        startY = GRID_SIZE - 6;
        break;
      default:
        startX = 5 + (playerIndex * 10);
        startY = 5 + (playerIndex * 10);
    }

    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      snake.push({
        x: startX - (playerIndex === 0 ? i : -i),
        y: startY
      });
    }

    return snake;
  }

  generateFood() {
    let food;
    let validPosition = false;

    while (!validPosition) {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };

      validPosition = !this.state.players.some(player =>
        player.snake.some(segment =>
          segment.x === food.x && segment.y === food.y
        )
      );
    }

    return food;
  }

  start() {
    console.log('1Starting game with state:', this.state);
    this.state.active = true;
    this.interval = setInterval(() => this.update(), GAME_SPEED);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.state.active = false;
  }

  handlePlayerMove(playerId, direction) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.lost) return;

    const currentDirection = player.direction;
    
    // Previne movimento na direção oposta
    if (
      (currentDirection === 'up' && direction === 'down') ||
      (currentDirection === 'down' && direction === 'up') ||
      (currentDirection === 'left' && direction === 'right') ||
      (currentDirection === 'right' && direction === 'left')
    ) {
      return;
    }

    player.direction = direction;
    console.log(`Player ${player.nickname} moved: ${direction}`);
  }

  update() {
    if (!this.state.active) return;

    // Atualiza cada jogador
    this.state.players.forEach(player => {
      if (player.lost) return;

      const head = { ...player.snake[0] };
      
      // Move a cabeça da cobra
      switch (player.direction) {
        case 'up':
          head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'down':
          head.y = (head.y + 1) % GRID_SIZE;
          break;
        case 'left':
          head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'right':
          head.x = (head.x + 1) % GRID_SIZE;
          break;
      }

      // Verifica colisão
      if (this.checkCollision(head, player.id)) {
        player.lost = true;
        this.io.to(`game:${this.id}`).emit('playerLost', {
          playerId: player.id,
          score: player.score
        });
        return;
      }

      // Adiciona nova cabeça
      player.snake.unshift(head);

      // Verifica se comeu a comida
      if (head.x === this.state.food.x && head.y === this.state.food.y) {
        player.score += FOOD_SCORE;
        this.state.food = this.generateFood();
      } else {
        player.snake.pop();
      }
    });

    // Envia atualização do estado para todos os jogadores
    this.io.to(`game:${this.id}`).emit('gameUpdate', this.state);

    // Verifica se o jogo acabou
    const activePlayers = this.state.players.filter(p => !p.lost);
    if (activePlayers.length <= 1) {
      this.endGame();
    }
  }

  checkCollision(head, playerId) {
    return this.state.players.some(player =>
      player.snake.some((segment, index) => {
        // Ignora a própria cabeça
        if (player.id === playerId && index === 0) return false;
        return segment.x === head.x && segment.y === head.y;
      })
    );
  }

  endGame() {
    this.stop();
    
    const rankings = this.state.players.map(player => ({
      nickname: player.nickname,
      score: player.score
    }));

    this.io.to(`game:${this.id}`).emit('gameOver', rankings);

    // Remove o jogo do GameManager
    const gameManager = this.io.gameManager;
    if (gameManager) {
      gameManager.removeGame(this.id);
    }
  }

  handlePlayerDisconnect(playerId) {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.lost = true;
      const activePlayers = this.state.players.filter(p => !p.lost);
      if (activePlayers.length <= 1) {
        this.endGame();
      }
    }
  }
}