// game/GameLogic.js
const Board = require("./Board");

class GameLogic {
  constructor(numPlayers, gameMode = "individual") {
    this.board = new Board();
    this.numPlayers = numPlayers;
    this.currentPlayer = 0;
    this.gameMode = gameMode;
    this.activePlayerOrder = [];
    this.activePlayers = new Set();

    // Configuración de jugadores según el número de participantes
    this.playerConfigurations = {
      2: {
        players: [
          {
            index: 0, // Rojo (arriba)
            color: "red",
            type: "R",
            initialPositions: this.board.structureToPositions.R,
            targetPositions: this.board.structureToPositions.V,
            moves: "down", // Se mueve hacia abajo
          },
          {
            index: 2, // Verde (abajo)
            color: "green",
            type: "V",
            initialPositions: this.board.structureToPositions.V,
            targetPositions: this.board.structureToPositions.R,
            moves: "up", // Se mueve hacia arriba
          },
        ],
        activeOrder: [0, 2],
      },
      3: {
        players: [
          {
            index: 0, // Rojo (arriba)
            color: "red",
            type: "R",
            initialPositions: this.board.structureToPositions.R,
            targetPositions: this.board.structureToPositions.V,
            moves: "down",
          },
          {
            index: 1, // Amarillo (esquina inferior derecha)
            color: "yellow",
            type: "A",
            initialPositions: this.board.structureToPositions.A,
            targetPositions: this.board.structureToPositions.N,
            moves: "left-and-diagonals",
          },
          {
            index: 5, // Naranja (esquina superior derecha)
            color: "orange",
            type: "C",
            initialPositions: this.board.structureToPositions.C,
            targetPositions: this.board.structureToPositions.B,
            moves: "left-and-diagonals",
          },
        ],
        activeOrder: [0, 1, 5],
      },
      4: {
        players: [
          {
            index: 0, // Rojo (arriba)
            color: "red",
            type: "R",
            initialPositions: this.board.structureToPositions.R,
            targetPositions: this.board.structureToPositions.V,
            moves: "down",
          },
          {
            index: 1, // Amarillo (esquina inferior izquierda)
            color: "yellow",
            type: "A",
            initialPositions: this.board.structureToPositions.A,
            targetPositions: this.board.structureToPositions.N,
            moves: "left-and-diagonals",
          },
          {
            index: 2, // Verde (abajo)
            color: "green",
            type: "V",
            initialPositions: this.board.structureToPositions.V,
            targetPositions: this.board.structureToPositions.R,
            moves: "up",
          },
          {
            index: 4, // Morado (esquina superior izquierda)
            color: "purple",
            type: "N",
            initialPositions: this.board.structureToPositions.N,
            targetPositions: this.board.structureToPositions.A,
            moves: "right-and-diagonals",
          },
        ],
        activeOrder: [0, 1, 2, 4],
      },
      6: {
        players: [
          {
            index: 0, // Rojo (arriba)
            color: "red",
            type: "R",
            initialPositions: this.board.structureToPositions.R,
            targetPositions: this.board.structureToPositions.V,
            moves: "down",
          },
          {
            index: 1, // Amarillo (esquina inferior derecha)
            color: "yellow",
            type: "A",
            initialPositions: this.board.structureToPositions.A,
            targetPositions: this.board.structureToPositions.N,
            moves: "left-and-diagonals",
          },
          {
            index: 2, // Verde (abajo)
            color: "green",
            type: "V",
            initialPositions: this.board.structureToPositions.V,
            targetPositions: this.board.structureToPositions.R,
            moves: "up",
          },
          {
            index: 3, // Azul (esquina inferior izquierda)
            color: "blue",
            type: "B",
            initialPositions: this.board.structureToPositions.B,
            targetPositions: this.board.structureToPositions.C,
            moves: "right-and-diagonals",
          },
          {
            index: 4, // Morado (esquina superior izquierda)
            color: "purple",
            type: "N",
            initialPositions: this.board.structureToPositions.N,
            targetPositions: this.board.structureToPositions.A,
            moves: "right-and-diagonals",
          },
          {
            index: 5, // Naranja (esquina superior derecha)
            color: "orange",
            type: "C",
            initialPositions: this.board.structureToPositions.C,
            targetPositions: this.board.structureToPositions.V,
            moves: "left-and-diagonals",
          },
        ],
        activeOrder: [0, 1, 2, 3, 4, 5],
      },
    };

    // Inicializar configuración según el número de jugadores
    this.initializeGameConfiguration();
  }

  initializeGameConfiguration() {
    const config = this.playerConfigurations[this.numPlayers];
    if (!config) {
      throw new Error(`Número de jugadores no válido: ${this.numPlayers}`);
    }

    this.activePlayerOrder = config.activeOrder;
    this.activePlayers = new Set(this.activePlayerOrder);

    // Crear configuración de jugadores para el tablero
    const playerSetup = {};
    config.players.forEach((player) => {
      playerSetup[player.index] = {
        color: player.color,
        type: player.type,
        initialPositions: player.initialPositions,
        targetPositions: player.targetPositions,
      };
    });

    // Inicializar el tablero con la configuración
    this.board.initializeBoard(playerSetup);
    this.board._numPlayers = this.numPlayers; // Establecer el número de jugadores en el tablero
  }

  initializeGame() {
    // Verificar número de jugadores válido
    if (![2, 3, 4, 6].includes(this.numPlayers)) {
      throw new Error("Número de jugadores inválido");
    }

    // Obtener configuración y determinar jugadores activos
    switch (this.numPlayers) {
      case 2:
        this.activePlayerOrder = [0, 2]; // Rojo y Verde
        break;
      case 3:
        this.activePlayerOrder = [0, 1, 2]; // Rojo, Amarillo, Naranja
        break;
      case 4:
        this.activePlayerOrder = [0, 1, 2, 4]; // Rojo, Amarillo, Verde, Morado
        break;
      case 6:
        this.activePlayerOrder = [0, 1, 2, 3, 4, 5]; // Todos los jugadores
        break;
    }

    // Actualizar conjunto de jugadores activos
    this.activePlayers = new Set(this.activePlayerOrder);
    console.log("Orden de jugadores activos:", this.activePlayerOrder);

    // Inicializar el tablero con las posiciones activas
    this.board.initializeBoard(this.numPlayers, this.activePlayers);
  }

  getOppositeCorner(playerIndex) {
    const config = this.playerConfigurations[this.numPlayers];
    const playerConfig = config.find((c) => c.position === playerIndex);

    if (!playerConfig) return null;

    if (this.numPlayers === 3) {
      // En el caso de 3 jugadores, cada uno apunta a la esquina vacía opuesta
      const emptyCorners = new Set([2, 3, 4]); // Esquinas inferiores
      const usedCorners = new Set(config.map((c) => c.position));
      return [...emptyCorners].find((corner) => !usedCorners.has(corner));
    }

    return playerConfig.opposite;
  }

  initializePlayerFields() {
    const fields = {
      0: {
        // Rojo (arriba)
        initialField: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        targetField: [111, 112, 113, 114, 115, 116, 117, 118, 119, 120],
      },
      1: {
        // Amarillo (arriba-derecha)
        initialField: [19, 20, 21, 22, 32, 33, 34, 44, 45, 55],
        targetField: [65, 66, 67, 75, 76, 77, 85, 86, 87, 98],
      },
      2: {
        // Verde (abajo-derecha)
        initialField: [111, 112, 113, 114, 115, 116, 117, 118, 119, 120],
        targetField: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
      3: {
        // Azul (abajo)
        initialField: [98, 99, 100, 101, 102, 103, 104, 105, 106, 107],
        targetField: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      },
      4: {
        // Morado (abajo-izquierda)
        initialField: [10, 11, 12, 13, 23, 24, 25, 35, 36, 46],
        targetField: [75, 76, 77, 85, 86, 87, 95, 96, 97, 107],
      },
      5: {
        // Naranja (arriba-izquierda)
        initialField: [65, 66, 67, 75, 76, 77, 85, 86, 87, 98],
        targetField: [19, 20, 21, 22, 32, 33, 34, 44, 45, 55],
      },
    };

    return fields;
  }
  initializePlayers() {
    // Registrar jugadores activos basado en el número de jugadores
    for (let i = 0; i < this.numPlayers; i++) {
      this.activePlayers.add(i);
    }
    console.log(`Jugadores activos: ${[...this.activePlayers]}`);
  }

  initializeTeams() {
    if (this.gameMode !== "teams") return null;

    // Para 4 jugadores: equipos de 2
    if (this.numPlayers === 4) {
      return {
        team1: [0, 2], // Jugadores opuestos
        team2: [1, 3],
      };
    }
    // Para 6 jugadores: equipos de 2 o 3
    else if (this.numPlayers === 6) {
      return {
        team1: [0, 3], // Jugadores opuestos
        team2: [1, 4],
        team3: [2, 5],
      };
    }
    return null;
  }

  processTurn(from, to, playerIndex) {
    console.log(`Procesando turno - Jugador ${playerIndex}`, {
      from,
      to,
      currentPlayer: this.currentPlayer,
    });

    if (!this.activePlayers.has(playerIndex)) {
      console.log(`Jugador ${playerIndex} no está activo`);
      return { success: false, message: "Jugador no activo" };
    }

    if (playerIndex !== this.currentPlayer) {
      console.log(`No es el turno del jugador ${playerIndex}`);
      return { success: false, message: "No es tu turno" };
    }

    const validMoves = this.getValidMoves(from);
    if (!validMoves.includes(to)) {
      return { success: false, message: "Movimiento inválido" };
    }

    // Realizar movimiento
    if (!this.board.makeMove(from, to)) {
      return { success: false, message: "Error al mover" };
    }

    // Cambiar al siguiente jugador
    const currentIndex = this.activePlayerOrder.indexOf(this.currentPlayer);
    this.currentPlayer =
      this.activePlayerOrder[
        (currentIndex + 1) % this.activePlayerOrder.length
      ];

    console.log(`Turno cambiado a jugador ${this.currentPlayer}`);

    return {
      success: true,
      message: "Movimiento realizado",
      nextPlayer: this.currentPlayer,
    };
  }

  isActivePlayer(playerIndex) {
    return this.activePlayers.has(playerIndex);
  }

  getNextPlayer() {
    const currentIndex = this.activePlayerOrder.indexOf(this.currentPlayer);
    return this.activePlayerOrder[
      (currentIndex + 1) % this.activePlayerOrder.length
    ];
  }
  getValidMoves(position) {
    const piece = this.board.board[position];
    if (piece === null || !this.activePlayers.has(piece)) {
      return [];
    }

    // Obtener la configuración del jugador actual
    const playerConfig = this.playerConfigurations[
      this.numPlayers
    ].players.find((p) => p.index === piece);

    if (!playerConfig) {
      return [];
    }

    // Obtener todos los movimientos posibles
    const allMoves = this.board.getAllPossibleMoves(position);

    // Filtrar según el tipo de movimiento del jugador
    return allMoves.filter((to) => {
      const fromPos = this.board.positionMap.get(position);
      const toPos = this.board.positionMap.get(to);
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;

      switch (playerConfig.moves) {
        case "down":
          return dy > 0;
        case "up":
          return dy < 0;
        case "left-and-diagonals":
          return dx < 0 || (dx === 0 && dy !== 0);
        case "right-and-diagonals":
          return dx > 0 || (dx === 0 && dy !== 0);
        default:
          return false;
      }
    });
  }

  getBoardState() {
    return {
      board: this.board.board,
      currentPlayer: this.currentPlayer,
      activePlayerOrder: this.activePlayerOrder,
    };
  }

  checkWin(playerIndex) {
    if (this.numPlayers === 3) {
      // Para 3 jugadores, verificar si llegó a la esquina vacía opuesta
      const targetCorner = this.getOppositeCorner(playerIndex);
      return this.checkPlayerWinInCorner(playerIndex, targetCorner);
    } else {
      // Para 2, 4 y 6 jugadores, verificar la esquina opuesta
      const oppositeIndex = this.getOppositeCorner(playerIndex);
      return this.checkPlayerWinInCorner(playerIndex, oppositeIndex);
    }
  }
  checkPlayerWinInCorner(playerIndex, targetCorner) {
    const targetPositions = this.board.getCornerPositions(targetCorner);
    return targetPositions.every(
      (pos) => this.board.board[pos] === playerIndex
    );
  }
  checkPlayerWin(playerIndex) {
    const targetPositions = this.playerFields[playerIndex].targetField;
    console.log(
      `Verificando victoria para jugador ${playerIndex} en posiciones:`,
      targetPositions
    );

    return targetPositions.every((pos) => {
      const piece = this.board.board[pos];
      console.log(
        `Posición ${pos}: ${
          piece === playerIndex ? "ocupada" : "no ocupada"
        } por jugador ${playerIndex}`
      );
      return piece === playerIndex;
    });
  }

  checkTeamWin(teamIndex) {
    const teamPlayers = this.teams[`team${teamIndex + 1}`];
    return teamPlayers.every((playerIndex) => this.checkPlayerWin(playerIndex));
  }

  getTeamForPlayer(playerIndex) {
    if (!this.teams) return null;

    for (
      let teamIndex = 0;
      teamIndex < Object.keys(this.teams).length;
      teamIndex++
    ) {
      if (this.teams[`team${teamIndex + 1}`].includes(playerIndex)) {
        return teamIndex;
      }
    }
    return null;
  }
}

module.exports = GameLogic;
