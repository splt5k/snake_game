import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Users, MessageSquare, Trophy, Search, Crown } from 'lucide-react';
import { MatchFound } from './MatchFound';

export const Lobby = () => {
  const {
    nickname,
    players,
    messages,
    rankings,
    inQueue,
    matchFound,
    sendMessage,
    joinQueue,
    leaveQueue,
  } = useGameStore();
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {matchFound && <MatchFound />}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de Jogadores */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-purple-600" />
            <h2 className="text-xl font-semibold">Jogadores Online</h2>
          </div>
          <ul className="space-y-2">
            {players.map((player) => {
              const isCurrentPlayer = player.nickname === nickname;
              return (
                <li
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded transition-colors ${
                    isCurrentPlayer
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        player.status === 'online'
                          ? 'bg-green-500'
                          : player.status === 'in-queue'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    ></span>
                    <span className={`${isCurrentPlayer ? 'font-semibold text-purple-700' : ''}`}>
                      {player.nickname}
                    </span>
                    {isCurrentPlayer && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Você
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${isCurrentPlayer ? 'text-purple-600' : 'text-gray-500'}`}>
                    {player.status === 'in-queue' ? 'Em fila' : 
                     player.status === 'in-game' ? 'Em partida' : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="text-purple-600" />
            <h2 className="text-xl font-semibold">Chat</h2>
          </div>
          <div className="h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded ${
                    msg.author === nickname
                      ? 'bg-purple-100 ml-auto'
                      : 'bg-gray-100'
                  } max-w-[80%]`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">
                      {msg.author}
                      {msg.author === nickname && (
                        <span className="ml-2 text-xs bg-purple-200 text-purple-700 px-1.5 rounded-full">
                          Você
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Digite sua mensagem..."
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

        {/* Ranking e Botão de Partida */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-purple-600" />
              <h2 className="text-xl font-semibold">Ranking</h2>
            </div>
            <div className="space-y-2">
              {rankings.map((rank, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    rank.nickname === nickname
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {index + 1}. {rank.nickname}
                    </span>
                    {rank.nickname === nickname && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Você
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${
                    rank.nickname === nickname ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {rank.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => (inQueue ? leaveQueue() : joinQueue())}
            className={`w-full p-4 rounded-lg shadow-md flex items-center justify-center gap-2 text-white font-semibold transition-colors ${
              inQueue
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Search className="w-5 h-5" />
            {inQueue ? 'Cancelar Busca' : 'Procurar Partida'}
          </button>
        </div>
      </div>
    </div>
  );
};