// config/socket.js
const Game = require("../models/Game");
const GameLogic = require("../game/GameLogic");

class SocketService {
  constructor(io) {
    this.io = io;
    this.gameRooms = new Map(); // Almacena información de las salas activas
    this.activeGames = new Map(); // Almacena las instancias de GameLogic
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

          // Almacenar información del jugador en la sala
          const gameRoom = this.gameRooms.get(gameId) || {};
          gameRoom[socket.id] = {
            nickname,
            ready: false,
            playerIndex: game.players.findIndex((p) => p.nickname === nickname),
          };
          this.gameRooms.set(gameId, gameRoom);

          // Notificar a todos en la sala
          this.io.to(gameId).emit("playerJoined", {
            nickname,
            players: game.players,
            message: `${nickname} se unió a la partida`,
          });

          // Si todos los jugadores están conectados, iniciar proceso
          if (Object.keys(gameRoom).length === game.maxPlayers) {
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

      // Solicitar movimientos válidos
      socket.on("getValidMoves", ({ gameId, position }) => {
        const gameLogic = this.activeGames.get(gameId);
        const gameRoom = this.gameRooms.get(gameId);

        if (gameLogic && gameRoom[socket.id]) {
          const playerIndex = gameRoom[socket.id].playerIndex;
          const validMoves = gameLogic.getValidMoves(position);

          socket.emit("validMoves", {
            position,
            moves: validMoves,
          });
        }
      });

      // Manejar movimiento de ficha
      socket.on("movePiece", ({ gameId, from, to }) => {
        const gameLogic = this.activeGames.get(gameId);
        const gameRoom = this.gameRooms.get(gameId);

        if (!gameLogic || !gameRoom[socket.id]) {
          socket.emit("error", { message: "Juego no encontrado" });
          return;
        }

        const playerIndex = gameRoom[socket.id].playerIndex;
        const result = gameLogic.processTurn(from, to, playerIndex);

        if (result.success) {
          // Emitir el movimiento a todos los jugadores
          this.io.to(gameId).emit("pieceMove", {
            from,
            to,
            player: playerIndex,
            boardState: gameLogic.getBoardState(),
          });

          if (result.gameOver) {
            // Manejar victoria
            this.handleGameOver(gameId, result.winner);
          } else {
            // Cambiar turno
            this.io.to(gameId).emit("turnChange", {
              currentPlayer: result.nextPlayer,
              message: `Turno del jugador ${result.nextPlayer + 1}`,
            });
          }
        } else {
          socket.emit("error", { message: result.message });
        }
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

      // Crear instancia de GameLogic
      const gameLogic = new GameLogic(game.maxPlayers);
      this.activeGames.set(gameId, gameLogic);

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

      // Actualizar el orden de los jugadores
      game.players = players;
      await game.save();

      // Notificar a todos los jugadores
      this.io.to(gameId).emit("gameInitialized", {
        players: players,
        boardState: gameLogic.getBoardState(),
        message: "Todos los jugadores han tirado los dados",
      });
    } catch (error) {
      this.io.to(gameId).emit("error", { message: error.message });
    }
  }

  // Iniciar el juego
  startGame(gameId) {
    const gameLogic = this.activeGames.get(gameId);
    const initialState = gameLogic.getBoardState();

    this.io.to(gameId).emit("gameStarted", {
      message: "¡El juego ha comenzado!",
      boardState: initialState,
      currentPlayer: initialState.currentPlayer,
    });
  }

  // Manejar fin del juego
  async handleGameOver(gameId, winner) {
    try {
      const game = await Game.findOne({ gameId });
      if (!game) return;

      game.status = "finished";
      game.winner = game.players[winner].nickname;
      await game.save();

      this.io.to(gameId).emit("gameOver", {
        winner: game.players[winner].nickname,
        message: `¡${game.players[winner].nickname} ha ganado!`,
      });

      // Limpiar recursos
      this.activeGames.delete(gameId);
      this.gameRooms.delete(gameId);
    } catch (error) {
      this.io.to(gameId).emit("error", { message: error.message });
    }
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
          this.activeGames.delete(gameId);
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
