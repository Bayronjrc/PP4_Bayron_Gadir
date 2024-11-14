import React, { useState, useEffect } from "react";
import io from "socket.io-client";

// Inicializar socket
const socket = io("http://localhost:5000");

export default function GameDemo() {
  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [messages, setMessages] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [view, setView] = useState("login"); // login, create, join, game

  // Escuchar eventos del socket
  useEffect(() => {
    // Cuando un jugador se une
    socket.on("playerJoined", ({ nickname, players, message }) => {
      addMessage("info", `${nickname} se unió al juego`);
      console.log("Jugadores actuales:", players);
    });

    // Cuando el juego se inicializa
    socket.on("gameInitialized", ({ players, boardState, message }) => {
      addMessage("success", "Juego inicializado");
      setGameState(boardState);
      socket.emit("playerReady", { gameId });
    });

    // Cuando el juego comienza
    socket.on("gameStarted", ({ boardState, currentPlayer, message }) => {
      addMessage("success", "¡El juego ha comenzado!");
      setGameState(boardState);
      setView("game");
    });

    // Manejo de errores
    socket.on("error", ({ message }) => {
      addMessage("error", message);
    });

    return () => {
      socket.off("playerJoined");
      socket.off("gameInitialized");
      socket.off("gameStarted");
      socket.off("error");
    };
  }, [gameId]);

  // Agregar mensajes al log
  const addMessage = (type, text) => {
    setMessages((prev) => [...prev, { type, text, id: Date.now() }]);
  };

  // Crear una nueva partida
  const handleCreateGame = async () => {
    try {
      // Crear partida a través de la API
      const response = await fetch("http://localhost:5000/api/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator: nickname, maxPlayers: 2 }),
      });

      const data = await response.json();
      setGameId(data.gameId);

      // Unirse a la partida a través de socket
      socket.emit("joinGame", { gameId: data.gameId, nickname });
      addMessage("info", `Partida creada con ID: ${data.gameId}`);
      setView("game");
    } catch (error) {
      addMessage("error", "Error al crear la partida");
    }
  };

  // Unirse a una partida existente
  const handleJoinGame = () => {
    socket.emit("joinGame", { gameId, nickname });
    setView("game");
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Pantalla de login */}
      {view === "login" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Bienvenido a Damas Chinas</h2>
          <div>
            <input
              type="text"
              placeholder="Ingresa tu nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setView("create")}
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Crear Partida
            </button>
            <button
              onClick={() => setView("join")}
              className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Unirse a Partida
            </button>
          </div>
        </div>
      )}

      {/* Crear partida */}
      {view === "create" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Crear Nueva Partida</h3>
          <button
            onClick={handleCreateGame}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Crear Partida
          </button>
          <button
            onClick={() => setView("login")}
            className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Volver
          </button>
        </div>
      )}

      {/* Unirse a partida */}
      {view === "join" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Unirse a Partida</h3>
          <input
            type="text"
            placeholder="ID de la partida"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleJoinGame}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Unirse
          </button>
          <button
            onClick={() => setView("login")}
            className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Volver
          </button>
        </div>
      )}

      {/* Vista del juego */}
      {view === "game" && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold">Información del Juego</h3>
            <p>Nickname: {nickname}</p>
            <p>Game ID: {gameId}</p>
            {gameState && (
              <p>
                Estado:{" "}
                {gameState.currentPlayer === null
                  ? "Esperando jugadores"
                  : `Turno del jugador ${gameState.currentPlayer}`}
              </p>
            )}
          </div>

          {/* Log de mensajes */}
          <div className="h-48 overflow-y-auto bg-gray-50 p-4 rounded">
            <h4 className="font-bold mb-2">Eventos:</h4>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 mb-2 rounded ${
                  msg.type === "error"
                    ? "bg-red-100"
                    : msg.type === "success"
                    ? "bg-green-100"
                    : "bg-blue-100"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
