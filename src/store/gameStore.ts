import { create } from 'zustand';
import { socket, SocketEvents } from '../socket';
import { storage } from '../services/storage';
import { Player, Message, Ranking, GameState } from '../types';

interface GameStore {
  nickname: string;
  playerId: string;
  isLoggedIn: boolean;
  inQueue: boolean;
  inGame: boolean;
  matchFound: boolean;
  players: Player[];
  messages: Message[];
  rankings: Ranking[];
  gameState: GameState | null;
  
  initialize: () => void;
  setNickname: (nickname: string) => void;
  login: (nickname: string) => Promise<boolean>;
  logout: () => void;
  sendMessage: (text: string) => void;
  joinQueue: () => void;
  leaveQueue: () => void;
  updateGameState: (state: GameState) => void;
  startGame: (initialState: GameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  nickname: '',
  playerId: '',
  isLoggedIn: false,
  inQueue: false,
  inGame: false,
  matchFound: false,
  players: [],
  messages: [],
  rankings: storage.getRankings() || [],
  gameState: null,

  initialize: () => {
    const session = storage.getSession();
    if (session) {
      set({ 
        nickname: session.nickname,
        playerId: session.id,
        isLoggedIn: true
      });
      
      socket.connect();
      socket.emit(SocketEvents.JOIN_LOBBY, { 
        nickname: session.nickname,
        id: session.id 
      });
    }

    socket.removeAllListeners();

    socket.on(SocketEvents.UPDATE_PLAYERS, (players: Player[]) => {
      set({ players });
    });

    socket.on(SocketEvents.CHAT_MESSAGE, (message: Message) => {
      set(state => ({
        messages: [...state.messages, message]
      }));
    });

    socket.on(SocketEvents.CHAT_HISTORY, (messages: Message[]) => {
      set({ messages });
    });

    socket.on(SocketEvents.MATCH_FOUND, () => {
      console.log('Match found event received');
      set({ matchFound: true });
    });

    socket.on(SocketEvents.GAME_START, (initialState: GameState) => {
      console.log('Game start event received:', initialState);
      set({ 
        inQueue: false, 
        matchFound: false, 
        inGame: true,
        gameState: initialState
      });
    });

    socket.on(SocketEvents.GAME_UPDATE, (gameState: GameState) => {
      //console.log('Game update received:', gameState);
      set({ gameState });
    });

    socket.on(SocketEvents.GAME_OVER, (rankings: Ranking[]) => {
      rankings.forEach(rank => {
        storage.updateRanking(rank.nickname, rank.score);
      });
      set({ 
        inGame: false,
        inQueue: false,
        matchFound: false,
        gameState: null,
        rankings: storage.getRankings()
      });
      
      socket.emit(SocketEvents.JOIN_LOBBY, {
        nickname: get().nickname,
        id: get().playerId
      });
    });

    socket.on('disconnect', () => {
      set({ 
        isLoggedIn: false, 
        inQueue: false, 
        inGame: false, 
        matchFound: false,
        gameState: null
      });
    });
  },

  startGame: (initialState: GameState) => {
    console.log('Starting game with state:', initialState);
    set({ 
      inQueue: false, 
      matchFound: false, 
      inGame: true,
      gameState: initialState
    });
  },

  setNickname: (nickname) => set({ nickname }),

  login: async (nickname) => {
    return new Promise((resolve) => {
      socket.connect();
      socket.emit(SocketEvents.CHECK_NICKNAME, nickname, (isAvailable: boolean) => {
        if (isAvailable) {
          const playerId = socket.id;
          storage.setSession(nickname, playerId);
          
          set({ 
            nickname,
            playerId,
            isLoggedIn: true
          });

          socket.emit(SocketEvents.JOIN_LOBBY, { nickname, id: playerId });
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  },

  logout: () => {
    socket.emit(SocketEvents.LEAVE_LOBBY);
    socket.disconnect();
    storage.clearSession();
    set({
      nickname: '',
      playerId: '',
      isLoggedIn: false,
      inQueue: false,
      inGame: false,
      matchFound: false,
      messages: [],
      gameState: null
    });
  },

  sendMessage: (text) => {
    const message: Message = {
      id: `msg_${Date.now()}`,
      author: get().nickname,
      text,
      timestamp: Date.now(),
    };
    socket.emit(SocketEvents.CHAT_MESSAGE, message);
  },

  joinQueue: () => {
    console.log('Joining queue...');
    socket.emit(SocketEvents.QUEUE_JOIN);
    set({ inQueue: true });
  },

  leaveQueue: () => {
    console.log('Leaving queue...');
    socket.emit(SocketEvents.QUEUE_LEAVE);
    set({ inQueue: false, matchFound: false });
  },

  updateGameState: (gameState) => {
    set({ gameState });
  },
}));