import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Login } from './components/Login';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { MatchFound } from './components/MatchFound';

function App() {
  const { isLoggedIn, inGame, matchFound, initialize } = useGameStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isLoggedIn) return <Login />;
  if (inGame) return <Game />;
  
  return (
    <>
      <Lobby />
      {matchFound && <MatchFound />}
    </>
  );
}

export default App;