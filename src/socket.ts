import { io } from 'socket.io-client';

// Pega o IP do servidor atual
const serverIP = window.location.hostname;
const serverPort = 3001;

export const socket = io(`http://${serverIP}:${serverPort}`, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

export const SocketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  JOIN_LOBBY: 'joinLobby',
  LEAVE_LOBBY: 'leaveLobby',
  UPDATE_PLAYERS: 'updatePlayers',
  CHAT_MESSAGE: 'chatMessage',
  CHAT_HISTORY: 'chatHistory',
  GAME_START: 'gameStart',
  GAME_UPDATE: 'gameUpdate',
  PLAYER_MOVE: 'playerMove',
  GAME_OVER: 'gameOver',
  QUEUE_JOIN: 'queueJoin',
  QUEUE_LEAVE: 'queueLeave',
  MATCH_FOUND: 'matchFound',
  MATCH_ACCEPTED: 'matchAccepted',
  MATCH_DECLINED: 'matchDeclined',
  CHECK_NICKNAME: 'checkNickname',
};