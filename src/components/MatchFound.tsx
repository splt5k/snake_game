import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const MatchFound = () => {
  const [timeLeft, setTimeLeft] = useState(10);
  const { gameState } = useGameStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-4">Partida Encontrada!</h2>
        <p className="text-center text-gray-600 mb-6">
          Preparando o jogo...
        </p>
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold animate-pulse">
            {timeLeft}
          </div>
        </div>
      </div>
    </div>
  );
};