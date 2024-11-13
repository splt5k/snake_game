import { Player, Message, Ranking } from '../types';

const STORAGE_KEYS = {
  SESSION: 'snake_session',
  RANKINGS: 'snake_rankings',
} as const;

export const storage = {
  // Session
  getSession(): { nickname: string; id: string } | null {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  setSession(nickname: string, id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ nickname, id }));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  // Rankings
  getRankings(): Ranking[] {
    try {
      const rankings = localStorage.getItem(STORAGE_KEYS.RANKINGS);
      return rankings ? JSON.parse(rankings) : [];
    } catch {
      return [];
    }
  },

  updateRanking(nickname: string, score: number): void {
    try {
      const rankings = this.getRankings();
      const existingRank = rankings.find(r => r.nickname === nickname);
      
      if (existingRank) {
        existingRank.score = Math.max(existingRank.score, score);
      } else {
        rankings.push({ nickname, score });
      }
      
      rankings.sort((a, b) => b.score - a.score);
      const top10 = rankings.slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.RANKINGS, JSON.stringify(top10));
    } catch (error) {
      console.error('Error updating rankings:', error);
    }
  },
};