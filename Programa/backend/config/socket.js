// config/socket.js
const Game = require("../models/Game");

class SocketService {
  constructor(io) {
    this.io = io;
    this.gameRooms = new Map(); // Almacena información de las salas activas
  }

  init() {
    this.io.on("connection", (socket) => {
      console.log("Cliente conectado:", socket.id);

      // Unirse a una sala de juego
      socket.on("joinGame", async ({ gameId, nickname }) => {
        try {
          const game = await Game.findOne({ gameId });
          if (!game) {
            socket.emit("error", { message: "Partida no encontrada" });
            return;
          }

          socket.join(gameId);
          this.gameRooms.set(gameId, {
            ...this.gameRooms.get(gameId),
            [socket.id]: { nickname, ready: false },
          });

          // Notificar a todos en la sala que un nuevo jugador se unió
          this.io.to(gameId).emit("playerJoined", {
            nickname,
            players: game.players,
            message: `${nickname} se unió a la partida`,
          });

          // Si todos los jugadores están conectados, iniciar el proceso de inicio
          if (
            Object.keys(this.gameRooms.get(gameId) || {}).length ===
            game.maxPlayers
          ) {
            this.initializeGame(gameId);
          }
        } catch (error) {
          socket.emit("error", { message: error.message });
        }
      });

      // Jugador listo para comenzar
      socket.on("playerReady", ({ gameId }) => {
        const gameRoom = this.gameRooms.get(gameId);
        if (gameRoom && gameRoom[socket.id]) {
          gameRoom[socket.id].ready = true;
          this.gameRooms.set(gameId, gameRoom);

          // Verificar si todos están listos
          const allReady = Object.values(gameRoom).every(
            (player) => player.ready
          );
          if (allReady) {
            this.startGame(gameId);
          }
        }
      });

      // Manejar movimiento de ficha
      socket.on("movePiece", ({ gameId, from, to, nickname }) => {
        // Validar el movimiento aquí
        if (this.isValidMove(gameId, from, to)) {
          // Actualizar el estado del juego
          this.updateGameState(gameId, from, to);

          // Emitir el movimiento a todos los jugadores
          this.io.to(gameId).emit("pieceMove", {
            from,
            to,
            nickname,
          });

          // Cambiar el turno
          this.nextTurn(gameId);
        } else {
          socket.emit("error", { message: "Movimiento inválido" });
        }
      });

      // Manejar chat del juego
      socket.on("gameMessage", ({ gameId, nickname, message }) => {
        this.io.to(gameId).emit("gameMessage", {
          nickname,
          message,
          timestamp: new Date(),
        });
      });

      // Manejar desconexión
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // Inicializar el juego
  async initializeGame(gameId) {
    try {
      const game = await Game.findOne({ gameId });
      if (!game) return;

      // Asignar turnos aleatoriamente
      const players = game.players.map((player) => ({
        ...player,
        diceRoll: Math.floor(Math.random() * 6) + 1,
      }));

      // Ordenar por valor del dado y nickname en caso de empate
      players.sort((a, b) => {
        if (b.diceRoll === a.diceRoll) {
          return a.nickname.localeCompare(b.nickname);
        }
        return b.diceRoll - a.diceRoll;
      });

      // Actualizar el orden de los jugadores en la base de datos
      game.players = players;
      await game.save();

      // Notificar a todos los jugadores el resultado de los dados
      this.io.to(gameId).emit("gameInitialized", {
        players: players,
        message: "Todos los jugadores han tirado los dados",
      });
    } catch (error) {
      this.io.to(gameId).emit("error", { message: error.message });
    }
  }

  // Iniciar el juego
  startGame(gameId) {
    this.io.to(gameId).emit("gameStarted", {
      message: "¡El juego ha comenzado!",
      currentTurn: this.gameRooms.get(gameId)[0]?.nickname,
    });
  }

  // Validar movimiento
  isValidMove(gameId, from, to) {
    // Implementar la lógica de validación de movimientos aquí
    return true; // Placeholder
  }

  // Actualizar estado del juego
  updateGameState(gameId, from, to) {
    // Implementar la lógica de actualización del estado aquí
  }

  // Cambiar turno
  nextTurn(gameId) {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) return;

    const players = Object.values(gameRoom);
    const currentPlayerIndex = players.findIndex((p) => p.isCurrentTurn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Actualizar turnos
    players.forEach((p, i) => (p.isCurrentTurn = i === nextPlayerIndex));

    this.io.to(gameId).emit("turnChange", {
      currentPlayer: players[nextPlayerIndex].nickname,
    });
  }

  // Manejar desconexión de jugadores
  handleDisconnect(socket) {
    console.log("Cliente desconectado:", socket.id);

    // Buscar y limpiar las salas donde estaba el jugador
    this.gameRooms.forEach((room, gameId) => {
      if (room[socket.id]) {
        const nickname = room[socket.id].nickname;
        delete room[socket.id];

        if (Object.keys(room).length === 0) {
          this.gameRooms.delete(gameId);
        } else {
          this.gameRooms.set(gameId, room);
          this.io.to(gameId).emit("playerLeft", {
            nickname,
            message: `${nickname} ha abandonado la partida`,
          });
        }
      }
    });
  }
}

module.exports = SocketService;
