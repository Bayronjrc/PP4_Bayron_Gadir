// test/gameTest.js
const io = require("socket.io-client");
const axios = require("axios");

async function testGame() {
  try {
    console.log("Iniciando prueba del juego...");

    // 1. Crear la partida mediante la API REST
    console.log("Creando partida...");
    const createGameResponse = await axios.post(
      "http://localhost:5000/api/games/create",
      {
        creator: "Player1",
        maxPlayers: 2,
      }
    );

    const gameId = createGameResponse.data.gameId;
    console.log("Partida creada con ID:", gameId);

    // 2. Conectar los sockets
    const socket1 = io("http://localhost:5000");
    const socket2 = io("http://localhost:5000");

    // Socket 1 (Player1) eventos
    socket1.on("connect", () => {
      console.log("Player1 conectado");
    });

    socket1.on("error", (error) => {
      console.error("Error Player1:", error);
    });

    socket1.on("playerJoined", (data) => {
      console.log("Jugador se unió a la partida:", data);
    });

    socket1.on("gameInitialized", (data) => {
      console.log("Juego inicializado:", data);
      socket1.emit("playerReady", { gameId });
    });

    socket1.on("gameStarted", (data) => {
      console.log("Juego iniciado:", data);
    });

    // Socket 2 (Player2) eventos
    socket2.on("connect", () => {
      console.log("Player2 conectado");
    });

    socket2.on("error", (error) => {
      console.error("Error Player2:", error);
    });

    socket2.on("gameInitialized", (data) => {
      console.log("Juego inicializado para Player2:", data);
      socket2.emit("playerReady", { gameId });
    });

    // Esperar un momento para asegurar las conexiones
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Unir jugadores a la partida
    console.log("Uniendo jugadores a la partida...");
    socket1.emit("joinGame", {
      gameId,
      nickname: "Player1",
    });

    // Esperar un momento antes de unir al segundo jugador
    await new Promise((resolve) => setTimeout(resolve, 1000));

    socket2.emit("joinGame", {
      gameId,
      nickname: "Player2",
    });

    // Mantener el script ejecutándose por un tiempo
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Limpiar las conexiones
    socket1.close();
    socket2.close();
    console.log("Prueba completada");
  } catch (error) {
    console.error("Error en la prueba:", error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testGame();
