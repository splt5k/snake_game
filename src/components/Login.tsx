import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Gamepad2 } from 'lucide-react';

export const Login = () => {
  const [inputNickname, setInputNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useGameStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (inputNickname.length < 3) {
      setError('O apelido deve ter pelo menos 3 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(inputNickname);
      if (!success) {
        setError('Este apelido já está em uso');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Gamepad2 className="w-12 h-12 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Cobra Multiplayer
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seu Apelido
            </label>
            <input
              type="text"
              value={inputNickname}
              onChange={(e) => setInputNickname(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Digite seu apelido..."
              autoFocus
              maxLength={15}
              disabled={isLoading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className={`w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};