import React, { useState, useEffect } from "react";
import { socket } from "../socket";

const GameSetup = ({ onGameStart }) => {
  const [gameState, setGameState] = useState("login");
  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [gameInfo, setGameInfo] = useState(null);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [readyPlayers, setReadyPlayers] = useState(new Set());
  const [availableGames, setAvailableGames] = useState([]); // Partidas disponibles

  useEffect(() => {
    socket.on("playerJoined", (data) => {
      if (data.players) setPlayers(data.players);
    });

    socket.on("playerReady", (data) => {
      if (data.nickname) setReadyPlayers((prev) => new Set([...prev, data.nickname]));
    });

    socket.on("gameStarted", (data) => {
      if (data) {
        setGameState("game");
        if (onGameStart) onGameStart(data);
      }
    });

    socket.on("error", (data) => setError(data.message || "Error desconocido"));

    return () => {
      socket.off("playerJoined");
      socket.off("playerReady");
      socket.off("gameStarted");
      socket.off("error");
    };
  }, [onGameStart]);

  useEffect(() => {
    fetchAvailableGames(); // Obtener partidas al cargar
  }, []);

  const fetchAvailableGames = async () => {
    try {
      const response = await fetch(
        "https://0c4c-2803-9810-5421-7210-3dde-512f-34eb-5d99.ngrok-free.app/api/games"
      );
      const data = await response.json();
      if (!data.error) setAvailableGames(data.games || []); // Suponiendo que el endpoint devuelve un arreglo llamado `games`
    } catch (error) {
      console.error("Error al obtener partidas:", error);
    }
  };

  const handleCreateGame = async () => {
    try {
      localStorage.setItem("nickname", nickname);
      const response = await fetch(
        "https://0c4c-2803-9810-5421-7210-3dde-512f-34eb-5d99.ngrok-free.app/api/games/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creator: nickname, maxPlayers: 6 }),
        }
      );
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setGameInfo(data);
      socket.emit("joinGame", { gameId: data.gameId, nickname });
      setGameState("lobby");
    } catch (error) {
      setError("Error al crear la partida");
    }
  };

  const handleJoinGame = async (selectedGameId) => {
    try {
      localStorage.setItem("nickname", nickname);
      const response = await fetch(
        "https://0c4c-2803-9810-5421-7210-3dde-512f-34eb-5d99.ngrok-free.app/api/games/join",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: selectedGameId, nickname }),
        }
      );
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setGameInfo(data);
      socket.emit("joinGame", { gameId: selectedGameId, nickname });
      setGameState("lobby");
    } catch (error) {
      setError("Error al unirse a la partida");
    }
  };

  const LoginScreen = () => (
    <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">Damas Chinas</h2>
      <input
        type="text"
        placeholder="Ingresa tu nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleCreateGame}
        disabled={!nickname}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Crear Partida
      </button>
      <div className="w-full max-w-md">
        <h3 className="text-lg font-semibold mt-4 mb-2">Partidas Disponibles:</h3>
        <div className="space-y-2">
          {availableGames.map((game) => (
            <div
              key={game.gameId}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span className="text-gray-700 font-medium">
                {`ID: ${game.gameId} - Creador: ${game.creator}`}
              </span>
              <button
                onClick={() => handleJoinGame(game.gameId)}
                disabled={!nickname}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
              >
                Unirse
              </button>
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {gameState === "login" && <LoginScreen />}
      {gameState === "lobby" && <LobbyScreen />}
      {gameState === "game" && <p>Cargando juego...</p>}
    </div>
  );
};

export default GameSetup;
