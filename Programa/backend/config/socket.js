// config/socket.js
const Game = require("../models/Game");
const GameLogic = require("../game/GameLogic");
const GameDebugger = require("../utils/GameDebugger");

class SocketService {
  constructor(io, app) {
    this.io = io;
    this.gameRooms = new Map();
    this.activeGames = new Map();
    this.debugger = new GameDebugger(io);

    // Configurar endpoints de debug
    if (process.env.NODE_ENV === "development") {
      this.debugger.setupDebugEndpoints(app, this.activeGames);
    }
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

          // Inicializar o actualizar información de la sala
          const gameRoom = this.gameRooms.get(gameId) || {
            players: new Map(),
            readyPlayers: new Set(),
          };

          // Almacenar información del jugador
          gameRoom.players.set(socket.id, {
            nickname,
            ready: false,
            playerIndex: game.players.findIndex((p) => p.nickname === nickname),
          });

          this.gameRooms.set(gameId, gameRoom);

          // Notificar a todos en la sala
          this.io.to(gameId).emit("playerJoined", {
            nickname,
            players: game.players,
            message: `${nickname} se unió a la partida`,
          });

          console.log(`${nickname} se unió a la partida ${gameId}`);
        } catch (error) {
          console.error("Error en joinGame:", error);
          socket.emit("error", { message: error.message });
        }
      });

      // Jugador listo para comenzar
      socket.on("playerReady", async ({ gameId, nickname, isHost }) => {
        try {
          const game = await Game.findOne({ gameId });
          if (!game) {
            socket.emit("error", { message: "Partida no encontrada" });
            return;
          }

          const gameRoom = this.gameRooms.get(gameId);
          if (!gameRoom) {
            socket.emit("error", { message: "Sala no encontrada" });
            return;
          }

          // Marcar jugador como listo
          gameRoom.readyPlayers.add(nickname);
          this.gameRooms.set(gameId, gameRoom);

          // Notificar que el jugador está listo
          this.io.to(gameId).emit("playerReady", {
            nickname,
            message: `${nickname} está listo`,
          });

          console.log(`${nickname} está listo en la partida ${gameId}`);
          console.log("Jugadores listos:", [...gameRoom.readyPlayers]);

          // Si es el host y todos están listos, iniciar el juego
          if (isHost && game.creator === nickname) {
            const allPlayersReady = game.players
              .filter((player) => player.nickname !== game.creator)
              .every((player) => gameRoom.readyPlayers.has(player.nickname));

            if (allPlayersReady) {
              console.log("Todos los jugadores están listos, iniciando juego");
              await this.initializeGame(gameId);
            } else {
              console.log("Esperando a que todos los jugadores estén listos");
              socket.emit("error", {
                message: "No todos los jugadores están listos",
              });
            }
          }
        } catch (error) {
          console.error("Error en playerReady:", error);
          socket.emit("error", { message: error.message });
        }
      });

      // Solicitar movimientos válidos
      socket.on("getValidMoves", ({ gameId, position }) => {
        try {
          console.log(
            `Solicitando movimientos válidos para posición ${position} en juego ${gameId}`
          );

          const gameLogic = this.activeGames.get(gameId);
          if (!gameLogic) {
            throw new Error("Juego no encontrado");
          }

          const validMoves = gameLogic.getValidMoves(position);
          console.log(`Movimientos válidos encontrados:`, validMoves);

          socket.emit("validMoves", {
            position,
            moves: validMoves,
          });
        } catch (error) {
          console.error("Error al obtener movimientos válidos:", error);
          socket.emit("error", { message: error.message });
        }
      });

      // Manejar movimiento de ficha
      socket.on("movePiece", async ({ gameId, from, to, playerIndex }) => {
        try {
          const gameLogic = this.activeGames.get(gameId);
          const gameRoom = this.gameRooms.get(gameId);

          if (!gameLogic || !gameRoom?.players.get(socket.id)) {
            socket.emit("error", { message: "Juego no encontrado" });
            return;
          }

          console.log("Procesando movimiento:", {
            gameId,
            from,
            to,
            playerIndex,
            currentPlayer: gameLogic.currentPlayer,
          });

          const result = gameLogic.processTurn(from, to, playerIndex);

          if (result.success) {
            const boardState = gameLogic.getBoardState();

            // Emitir el movimiento a todos los jugadores
            this.io.to(gameId).emit("pieceMove", {
              from,
              to,
              player: playerIndex,
              boardState: {
                board: boardState.board,
                currentPlayer: result.nextPlayer,
              },
            });

            // Verificar si hay un ganador
            if (gameLogic.checkWin(playerIndex)) {
              await this.handleGameOver(gameId, playerIndex);
            } else {
              // Emitir cambio de turno
              this.io.to(gameId).emit("turnChange", {
                currentPlayer: result.nextPlayer,
                message: `Turno del jugador ${result.nextPlayer + 1}`,
              });
            }
          } else {
            socket.emit("error", { message: result.message });
          }
        } catch (error) {
          console.error("Error en movePiece:", error);
          socket.emit("error", { message: error.message });
        }
      });
      // Manejar desconexión
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async processTurn(gameId, from, to, playerIndex) {
    const gameLogic = this.activeGames.get(gameId);
    if (!gameLogic) return false;

    const result = gameLogic.processTurn(from, to, playerIndex);

    if (result.success) {
      this.debugger.logMove(gameId, from, to, playerIndex);
      this.debugger.logBoardState(gameId, gameLogic.getBoardState().board);
    }

    return result;
  }

  // Inicializar el juego
  async initializeGame(gameId) {
    try {
      const game = await Game.findOne({ gameId });
      if (!game) {
        throw new Error("Juego no encontrado");
      }

      // Mapeo de índices de jugadores según el número de jugadores
      const playerConfigurations = {
        2: [
          { index: 0, color: "red" }, // Rojo arriba
          { index: 2, color: "green" }, // Verde abajo
        ],
        3: [
          { index: 0, color: "red" }, // Rojo arriba
          { index: 1, color: "yellow" }, // Amarillo esquina inferior derecha
          { index: 5, color: "orange" }, // Naranja esquina superior derecha
        ],
        4: [
          { index: 0, color: "red" }, // Rojo arriba
          { index: 1, color: "yellow" }, // Amarillo esquina inferior izquierda
          { index: 2, color: "green" }, // Verde abajo
          { index: 4, color: "purple" }, // Morado esquina superior izquierda
        ],
        6: [
          { index: 0, color: "red" }, // Rojo arriba
          { index: 1, color: "yellow" }, // Amarillo esquina inferior derecha
          { index: 2, color: "green" }, // Verde abajo
          { index: 3, color: "blue" }, // Azul esquina inferior izquierda
          { index: 4, color: "purple" }, // Morado esquina superior izquierda
          { index: 5, color: "orange" }, // Naranja esquina superior derecha
        ],
      };

      // Obtener la configuración según el número de jugadores
      const configuration = playerConfigurations[game.players.length];
      if (!configuration) {
        throw new Error(
          `Configuración no válida para ${game.players.length} jugadores`
        );
      }

      // Asignar dados y mapear jugadores a sus posiciones
      const players = game.players.map((player, idx) => ({
        nickname: player.nickname,
        color: configuration[idx].color,
        playerIndex: configuration[idx].index, // Usar el índice de la configuración
        diceRoll: Math.floor(Math.random() * 6) + 1,
      }));

      // Ordenar por valor del dado
      players.sort((a, b) => b.diceRoll - a.diceRoll);

      console.log("Jugadores inicializados:", players);

      // Crear instancia de GameLogic con el modo de juego correcto
      const gameLogic = new GameLogic(game.players.length, game.gameMode);
      this.activeGames.set(gameId, gameLogic);

      // Actualizar el juego en la base de datos
      game.players = players;
      game.status = "playing";
      await game.save();

      // Notificar a todos los jugadores
      this.io.to(gameId).emit("gameStarted", {
        players,
        boardState: gameLogic.getBoardState(),
        currentPlayer: gameLogic.currentPlayer,
        gameId,
        activePlayerIndices: configuration.map((p) => p.index),
      });

      console.log(`Juego ${gameId} iniciado:`, {
        players: players.map((p) => `${p.nickname} (${p.playerIndex})`),
        currentPlayer: gameLogic.currentPlayer,
        configuration: configuration.map((p) => p.index),
      });
    } catch (error) {
      console.error("Error al inicializar el juego:", error);
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

    this.gameRooms.forEach((room, gameId) => {
      const playerInfo = room.players.get(socket.id);
      if (playerInfo) {
        const { nickname } = playerInfo;
        room.players.delete(socket.id);
        room.readyPlayers.delete(nickname);

        if (room.players.size === 0) {
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
