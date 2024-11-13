import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket, SocketEvents } from '../socket';

const GRID_SIZE = 30;

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameState, playerId } = useGameStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState?.active) return;

      let idjogador = socket.id;

      const currentPlayer = gameState.players.find(p => p.id === idjogador);
      if (!currentPlayer) return;

      let direction = '';
      switch (e.key) {
        case 'ArrowUp':
          direction = 'up';
          break;
        case 'ArrowDown':
          direction = 'down';
          break;
        case 'ArrowLeft':
          direction = 'left';
          break;
        case 'ArrowRight':
          direction = 'right';
          break;
        default:
          return;
      }

      // Console log para debug do idjogador e do direction
      console.log('idjogador:', idjogador, 'direction:', direction);

      socket.emit(SocketEvents.PLAYER_MOVE, { direction, playerId: idjogador });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, playerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 600;
    const cellSize = canvas.width / GRID_SIZE;

    const drawGrid = () => {
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.5;

      for (let i = 0; i <= canvas.width; i += cellSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      for (let i = 0; i <= canvas.height; i += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    };

    const drawFood = () => {
      if (!gameState.food) return;
      
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(
        gameState.food.x * cellSize + cellSize / 2,
        gameState.food.y * cellSize + cellSize / 2,
        cellSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const drawSnakes = () => {
      gameState.players.forEach((player, index) => {
        const isCurrentPlayer = player.id === playerId;
        const color = isCurrentPlayer ? '#8A2BE2' : ['#FF0000', '#00FF00'][index];
        
        player.snake.forEach((segment, i) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(
            segment.x * cellSize,
            segment.y * cellSize,
            cellSize - 1,
            cellSize - 1,
            3
          );
          ctx.fill();

          if (i === 0) {
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            const eyeOffset = cellSize / 4;
            
            let eye1X, eye1Y, eye2X, eye2Y;
            switch (player.direction) {
              case 'right':
                eye1X = segment.x * cellSize + cellSize - eyeOffset;
                eye1Y = segment.y * cellSize + eyeOffset;
                eye2X = segment.x * cellSize + cellSize - eyeOffset;
                eye2Y = segment.y * cellSize + cellSize - eyeOffset;
                break;
              case 'left':
                eye1X = segment.x * cellSize + eyeOffset;
                eye1Y = segment.y * cellSize + eyeOffset;
                eye2X = segment.x * cellSize + eyeOffset;
                eye2Y = segment.y * cellSize + cellSize - eyeOffset;
                break;
              case 'up':
                eye1X = segment.x * cellSize + eyeOffset;
                eye1Y = segment.y * cellSize + eyeOffset;
                eye2X = segment.x * cellSize + cellSize - eyeOffset;
                eye2Y = segment.y * cellSize + eyeOffset;
                break;
              case 'down':
                eye1X = segment.x * cellSize + eyeOffset;
                eye1Y = segment.y * cellSize + cellSize - eyeOffset;
                eye2X = segment.x * cellSize + cellSize - eyeOffset;
                eye2Y = segment.y * cellSize + cellSize - eyeOffset;
                break;
              default:
                eye1X = segment.x * cellSize + eyeOffset;
                eye1Y = segment.y * cellSize + eyeOffset;
                eye2X = segment.x * cellSize + cellSize - eyeOffset;
                eye2Y = segment.y * cellSize + eyeOffset;
            }
            
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.fillStyle = isCurrentPlayer ? '#8B5CF6' : '#000';
        ctx.font = `${isCurrentPlayer ? 'bold ' : ''}12px Arial`;
        const head = player.snake[0];
        ctx.fillText(
          `${player.nickname} (${player.score}) - Length: ${player.snake.length}`,
          head.x * cellSize,
          head.y * cellSize - 5
        );
      });
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      drawFood();
      drawSnakes();
      requestAnimationFrame(render);
    };

    render();
  }, [gameState, playerId]);

  if (!gameState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded"
        ></canvas>
        <div className="mt-4 flex justify-between text-gray-800">
          {gameState.players.map((player, index) => (
            <div key={player.id} className="text-center">
              <div
                className="w-4 h-4 rounded-full inline-block mr-2"
                style={{ backgroundColor: player.id === playerId ? '#8A2BE2' : ['#FF0000', '#00FF00'][index] }}
              ></div>
              <span className={`${player.id === playerId ? 'font-bold text-purple-600' : ''}`}>
                {player.nickname}: {player.score} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};