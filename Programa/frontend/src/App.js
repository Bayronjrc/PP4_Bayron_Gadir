import React, { useState } from "react";
import GameSetup from "./components/GameSetup";
import ChineseCheckersBoard from "./components/ChineseCheckersBoard";

function App() {
  const [gameState, setGameState] = useState("setup"); // setup, playing
  const [gameData, setGameData] = useState(null);

  const handleGameStart = (data) => {
    console.log("Game starting with data:", data);
    setGameData(data);
    setGameState("playing");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {gameState === "setup" ? (
        <GameSetup onGameStart={handleGameStart} />
      ) : (
        <ChineseCheckersBoard
          gameData={gameData}
          players={gameData?.players}
          initialBoard={gameData?.boardState}
        />
      )}
    </div>
  );
}

export default App;
