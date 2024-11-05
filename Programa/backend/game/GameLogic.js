// game/GameLogic.js
const Board = require("./Board");

class GameLogic {
  constructor(numPlayers) {
    this.board = new Board();
    this.numPlayers = numPlayers;
    this.currentPlayer = 0;
    this.board.initializeBoard(numPlayers);
  }

  // Procesar un turno
  processTurn(from, to, playerIndex) {
    // Verificar si es el turno del jugador
    if (playerIndex !== this.currentPlayer) {
      return {
        success: false,
        message: "No es tu turno",
      };
    }

    // Verificar si el movimiento es válido
    if (!this.board.isValidMove(from, to, playerIndex)) {
      return {
        success: false,
        message: "Movimiento inválido",
      };
    }

    // Realizar el movimiento
    this.board.makeMove(from, to);

    // Verificar si hay un ganador
    const hasWon = this.board.checkWin(playerIndex);
    if (hasWon) {
      return {
        success: true,
        message: "Juego terminado",
        winner: playerIndex,
        gameOver: true,
      };
    }

    // Cambiar al siguiente jugador
    this.currentPlayer = (this.currentPlayer + 1) % this.numPlayers;

    return {
      success: true,
      message: "Movimiento realizado",
      nextPlayer: this.currentPlayer,
    };
  }

  // Obtener movimientos válidos para una posición
  getValidMoves(position) {
    return this.board.getValidMoves(position);
  }

  // Obtener el estado actual del tablero
  getBoardState() {
    return {
      board: this.board.board,
      currentPlayer: this.currentPlayer,
    };
  }
}

module.exports = GameLogic;
