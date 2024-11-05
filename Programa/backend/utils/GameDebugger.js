// utils/GameDebugger.js
class GameDebugger {
  constructor(io) {
    this.io = io;
    this.debugMode = process.env.NODE_ENV === "development";
  }

  // Visualizar el estado del tablero en consola
  logBoardState(gameId, board) {
    if (!this.debugMode) return;

    console.log(`\n=== Estado del tablero (Game: ${gameId}) ===`);

    // Crear una representación visual del tablero
    let boardVisual = this.createBoardVisualization(board);
    console.log(boardVisual);

    // Estadísticas básicas
    const stats = this.getBoardStats(board);
    console.log("\nEstadísticas:");
    Object.entries(stats).forEach(([player, count]) => {
      console.log(`Jugador ${player}: ${count} fichas`);
    });
  }

  // Crear visualización ASCII del tablero
  createBoardVisualization(board) {
    const symbols = [" 1 ", " 2 ", " 3 ", " 4 ", " 5 ", " 6 "];
    const empty = " · ";
    let visual = "";
    let currentRow = 0;
    let spaces = 12;

    for (let i = 0; i < board.length; i++) {
      if (i % 13 === 0) {
        visual += "\n" + " ".repeat(spaces);
        currentRow++;
        if (currentRow <= 6) spaces -= 2;
        else if (currentRow > 6) spaces += 2;
      }

      if (board[i] === null) {
        visual += empty;
      } else if (board[i] >= 0 && board[i] < symbols.length) {
        visual += symbols[board[i]];
      } else {
        visual += " x ";
      }
    }

    return visual;
  }

  // Obtener estadísticas del tablero
  getBoardStats(board) {
    const stats = {};
    board.forEach((cell) => {
      if (cell !== null) {
        stats[cell] = (stats[cell] || 0) + 1;
      }
    });
    return stats;
  }

  // Registrar movimientos
  logMove(gameId, from, to, player) {
    if (!this.debugMode) return;
    console.log(
      `\n[Movimiento] Game ${gameId}: Jugador ${player} movió de ${from} a ${to}`
    );
  }

  // Registrar eventos importantes
  logEvent(gameId, event, data) {
    if (!this.debugMode) return;
    console.log(`\n[Evento ${event}] Game ${gameId}:`, data);
  }

  // Crear endpoint de debug para el estado del juego
  setupDebugEndpoints(app, activeGames) {
    if (!this.debugMode) return;

    app.get("/debug/games", (req, res) => {
      const gamesDebugInfo = {};
      activeGames.forEach((gameLogic, gameId) => {
        gamesDebugInfo[gameId] = {
          boardState: gameLogic.getBoardState(),
          currentPlayer: gameLogic.currentPlayer,
          numPlayers: gameLogic.numPlayers,
        };
      });
      res.json(gamesDebugInfo);
    });

    app.get("/debug/game/:gameId", (req, res) => {
      const gameLogic = activeGames.get(req.params.gameId);
      if (!gameLogic) {
        return res.status(404).json({ error: "Juego no encontrado" });
      }
      res.json({
        boardState: gameLogic.getBoardState(),
        currentPlayer: gameLogic.currentPlayer,
        numPlayers: gameLogic.numPlayers,
      });
    });
  }
}

module.exports = GameDebugger;
