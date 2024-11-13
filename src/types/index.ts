export interface Player {
  id: string;
  nickname: string;
  status: 'online' | 'in-queue' | 'in-game';
}

export interface Message {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface Ranking {
  nickname: string;
  score: number;
}

export interface GameState {
  players: {
    id: string;
    nickname: string;
    snake: { x: number; y: number }[];
    direction: string;
    score: number;
  }[];
  food: { x: number; y: number };
}