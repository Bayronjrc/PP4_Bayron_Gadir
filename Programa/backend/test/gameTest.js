// test/gameTest.js
const io = require("socket.io-client");

async function testGame() {
  // Crear dos conexiones de socket para simular dos jugadores
  const socket1 = io("http://localhost:5000");
  const socket2 = io("http://localhost:5000");

  // Crear una partida
  const gameId = "test-game-" + Date.now();

  socket1.emit("joinGame", {
    gameId,
    nickname: "Player1",
  });

  socket2.emit("joinGame", {
    gameId,
    nickname: "Player2",
  });

  // Escuchar eventos
  socket1.on("gameInitialized", (data) => {
    console.log("Juego inicializado:", data);
    socket1.emit("playerReady", { gameId });
  });

  socket2.on("gameInitialized", (data) => {
    console.log("Juego inicializado:", data);
    socket2.emit("playerReady", { gameId });
  });

  socket1.on("gameStarted", (data) => {
    console.log("Juego iniciado:", data);
    // Probar un movimiento
    socket1.emit("getValidMoves", { gameId, position: 4 });
  });

  socket1.on("validMoves", (data) => {
    console.log("Movimientos válidos:", data);
    if (data.moves.length > 0) {
      socket1.emit("movePiece", {
        gameId,
        from: 4,
        to: data.moves[0],
      });
    }
  });

  socket1.on("pieceMove", (data) => {
    console.log("Pieza movida:", data);
  });

  socket1.on("error", (error) => {
    console.error("Error:", error);
  });
}

testGame();
