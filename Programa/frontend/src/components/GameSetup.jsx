import React, { useState, useEffect } from "react";
import { socket } from "../socket";

const PLAYER_COLORS = {
  0: "text-red-500",
  1: "text-yellow-500",
  2: "text-green-500",
  3: "text-blue-500",
  4: "text-purple-500",
  5: "text-orange-500",
};

const GAME_CONFIGURATIONS = {
  2: {
    minPlayers: 2,
    positions: ["Rojo (arriba)", "Verde (abajo)"],
  },
  3: {
    minPlayers: 3,
    positions: [
      "Rojo (arriba)",
      "Amarillo (inferior derecha)",
      "Naranja (superior derecha)",
    ],
  },
  4: {
    minPlayers: 4,
    positions: [
      "Rojo (arriba)",
      "Amarillo (inferior izquierda)",
      "Verde (abajo)",
      "Morado (superior izquierda)",
    ],
  },
  6: {
    minPlayers: 6,
    positions: [
      "Rojo (arriba)",
      "Amarillo (inferior derecha)",
      "Verde (abajo)",
      "Azul (inferior izquierda)",
      "Morado (superior izquierda)",
      "Naranja (superior derecha)",
    ],
  },
};

const GameSetup = ({ onGameStart }) => {
  const [gameState, setGameState] = useState("login");
  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [gameInfo, setGameInfo] = useState(null);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [readyPlayers, setReadyPlayers] = useState(new Set());

  useEffect(() => {
    socket.on("playerJoined", (data) => {
      console.log("Jugador unido:", data);
      if (data.players) {
        setPlayers(data.players);
      }
    });

    socket.on("playerReady", (data) => {
      console.log("Jugador listo:", data);
      if (data.nickname) {
        setReadyPlayers((prev) => new Set([...prev, data.nickname]));
      }
    });

    socket.on("gameStarted", (data) => {
      console.log("Juego iniciado:", data);
      if (data) {
        setGameState("game");
        if (onGameStart) {
          onGameStart(data);
        }
      }
    });

    socket.on("error", (data) => {
      console.error("Error:", data);
      setError(data.message || "Error desconocido");
    });

    return () => {
      socket.off("playerJoined");
      socket.off("playerReady");
      socket.off("gameStarted");
      socket.off("error");
    };
  }, [onGameStart]);

  const handleCreateGame = async () => {
    try {
      console.log("Creando partida...");
      localStorage.setItem("nickname", nickname);
      const response = await fetch(" https://0c4c-2803-9810-5421-7210-3dde-512f-34eb-5d99.ngrok-free.app/api/games/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creator: nickname,
          maxPlayers: 6,
        }),
      });

      const data = await response.json();
      console.log("Respuesta crear partida:", data);

      if (data.error) {
        setError(data.error);
        return;
      }

      setGameInfo(data);
      socket.emit("joinGame", { gameId: data.gameId, nickname });
      setGameState("lobby");
    } catch (error) {
      console.error("Error al crear partida:", error);
      setError("Error al crear la partida");
    }
  };

  const handleJoinGame = async () => {
    try {
      console.log("Uniéndose a partida...");
      localStorage.setItem("nickname", nickname);
      const response = await fetch("https://0c4c-2803-9810-5421-7210-3dde-512f-34eb-5d99.ngrok-free.app/api/games/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId,
          nickname,
        }),
      });

      const data = await response.json();
      console.log("Respuesta unirse a partida:", data);

      if (data.error) {
        setError(data.error);
        return;
      }

      setGameInfo(data);
      socket.emit("joinGame", { gameId, nickname });
      setGameState("lobby");
    } catch (error) {
      console.error("Error al unirse a partida:", error);
      setError("Error al unirse a la partida");
    }
  };

  const handleReady = () => {
    console.log("Marcando jugador como listo...");
    socket.emit("playerReady", {
      gameId: gameInfo?.gameId,
      nickname: nickname,
    });
  };

  const handleStartGame = () => {
    console.log("Host iniciando juego...");
    socket.emit("playerReady", {
      gameId: gameInfo?.gameId,
      nickname: nickname,
      isHost: true,
    });
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
      <div className="flex gap-4">
        <button
          onClick={handleCreateGame}
          disabled={!nickname}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Crear Partida
        </button>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ID de la partida"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoinGame}
            disabled={!nickname || !gameId}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Unirse
          </button>
        </div>
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );

  const LobbyScreen = () => (
    <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800">Sala de Espera</h2>
      <p className="text-gray-600">ID de la partida: {gameInfo?.gameId}</p>
      <div className="w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Jugadores:</h3>
        <div className="space-y-2">
          {players.map((player, index) => {
            const numPlayers = gameInfo?.maxPlayers || 6;
            const positions = GAME_CONFIGURATIONS[numPlayers].positions;
            const position = positions[index] || "Esperando...";

            return (
              <div
                key={player.nickname}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div className="flex flex-col">
                  <span className={`${PLAYER_COLORS[index]} font-medium`}>
                    {player.nickname}
                    {player.diceRoll && ` - Dado: ${player.diceRoll}`}
                    {gameInfo?.creator === player.nickname && " (Host)"}
                  </span>
                  <span className="text-sm text-gray-500">{position}</span>
                </div>
                <div>
                  {player.nickname === nickname &&
                  gameInfo?.creator !== nickname &&
                  !readyPlayers.has(nickname) ? (
                    <button
                      onClick={handleReady}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Listo
                    </button>
                  ) : (
                    <span
                      className={`text-sm ${
                        readyPlayers.has(player.nickname)
                          ? "text-green-500"
                          : "text-gray-400"
                      }`}
                    >
                      {readyPlayers.has(player.nickname)
                        ? "✓ Listo"
                        : "Esperando..."}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {gameInfo?.creator === nickname && (
        <button
          onClick={handleStartGame}
          disabled={
            players.length < 2 || readyPlayers.size < players.length - 1
          }
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 mt-4"
        >
          {players.length < 2
            ? "Esperando jugadores..."
            : readyPlayers.size < players.length - 1
            ? `Esperando que los jugadores estén listos (${readyPlayers.size}/${
                players.length - 1
              })`
            : "Iniciar Juego"}
        </button>
      )}
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
