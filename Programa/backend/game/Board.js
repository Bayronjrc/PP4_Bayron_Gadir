// game/Board.js
class Board {
  constructor() {
    this.size = 121; // Tablero de 121 posiciones (hexagonal)
    this.board = new Array(this.size).fill(null);
    this.initialized = false;
  }

  // Inicializar el tablero según el número de jugadores
  initializeBoard(numPlayers) {
    // Definir las posiciones iniciales para cada número de jugadores
    const startingPositions = {
      2: ["top", "bottom"],
      3: ["top", "bottomRight", "bottomLeft"],
      4: ["top", "bottomRight", "bottomLeft", "bottom"],
      6: ["top", "topRight", "bottomRight", "bottom", "bottomLeft", "topLeft"],
    };

    // Limpiar el tablero
    this.board = new Array(this.size).fill(null);

    // Colocar las fichas según las posiciones iniciales
    const positions = startingPositions[numPlayers];
    positions.forEach((position, index) => {
      this.setupPlayerPieces(position, index);
    });

    this.initialized = true;
    return this.board;
  }

  // Configurar las piezas iniciales para un jugador
  setupPlayerPieces(position, playerIndex) {
    const positions = this.getStartingPositions(position);
    positions.forEach((pos) => {
      this.board[pos] = playerIndex;
    });
  }

  // Obtener las posiciones iniciales según la ubicación
  getStartingPositions(position) {
    const positions = {
      top: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      topRight: [11, 12, 13, 14, 25, 26, 27, 39, 40],
      bottomRight: [81, 82, 83, 94, 95, 96, 97, 107, 108, 109],
      bottom: [111, 112, 113, 114, 115, 116, 117, 118, 119, 120],
      bottomLeft: [71, 72, 73, 84, 85, 86, 87, 97, 98, 99],
      topLeft: [21, 22, 23, 34, 35, 36, 37, 47, 48, 49],
    };
    return positions[position];
  }

  // Verificar si un movimiento es válido
  isValidMove(from, to, currentPlayer) {
    // Verificar si las posiciones están dentro del tablero
    if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
      return false;
    }

    // Verificar si la posición de origen tiene una ficha del jugador actual
    if (this.board[from] !== currentPlayer) {
      return false;
    }

    // Verificar si la posición de destino está vacía
    if (this.board[to] !== null) {
      return false;
    }

    // Obtener todos los movimientos válidos para la posición actual
    const validMoves = this.getValidMoves(from);
    return validMoves.includes(to);
  }

  // Obtener todos los movimientos válidos para una posición
  getValidMoves(position) {
    const moves = [];

    // Obtener movimientos adyacentes
    const adjacentMoves = this.getAdjacentMoves(position);
    moves.push(...adjacentMoves.filter((pos) => this.board[pos] === null));

    // Obtener movimientos de salto
    const jumpMoves = this.getJumpMoves(position, new Set());
    moves.push(...jumpMoves);

    return [...new Set(moves)]; // Eliminar duplicados
  }

  // Obtener posiciones adyacentes
  getAdjacentMoves(position) {
    const x = position % 13;
    const y = Math.floor(position / 13);
    const adjacent = [];

    // Direcciones posibles (6 direcciones en un hexágono)
    const directions = [
      [-1, 0],
      [1, 0], // Izquierda, Derecha
      [-1, -1],
      [0, -1], // Diagonal superior izquierda, superior
      [-1, 1],
      [0, 1], // Diagonal inferior izquierda, inferior
    ];

    directions.forEach(([dx, dy]) => {
      const newX = x + dx;
      const newY = y + dy;
      const newPos = newY * 13 + newX;

      if (this.isValidPosition(newPos)) {
        adjacent.push(newPos);
      }
    });

    return adjacent;
  }

  // Obtener movimientos de salto recursivamente
  getJumpMoves(position, visited) {
    const jumps = new Set();
    visited.add(position);

    const adjacentPositions = this.getAdjacentMoves(position);

    adjacentPositions.forEach((adjacent) => {
      if (this.board[adjacent] !== null) {
        // Si hay una ficha en la posición adyacente
        const jumpPosition = this.getJumpPosition(position, adjacent);

        if (
          jumpPosition !== null &&
          !visited.has(jumpPosition) &&
          this.board[jumpPosition] === null
        ) {
          jumps.add(jumpPosition);

          // Buscar saltos adicionales desde la nueva posición
          const nextJumps = this.getJumpMoves(
            jumpPosition,
            new Set([...visited])
          );
          nextJumps.forEach((jump) => jumps.add(jump));
        }
      }
    });

    return Array.from(jumps);
  }

  // Calcular la posición después de un salto
  getJumpPosition(from, over) {
    const fromX = from % 13;
    const fromY = Math.floor(from / 13);
    const overX = over % 13;
    const overY = Math.floor(over / 13);

    const jumpX = overX + (overX - fromX);
    const jumpY = overY + (overY - fromY);
    const jumpPos = jumpY * 13 + jumpX;

    return this.isValidPosition(jumpPos) ? jumpPos : null;
  }

  // Verificar si una posición está dentro del tablero
  isValidPosition(position) {
    if (position < 0 || position >= this.size) return false;

    // Verificar si la posición está dentro del patrón de estrella
    const x = position % 13;
    const y = Math.floor(position / 13);

    // Implementar la lógica para verificar si está dentro del patrón de estrella
    // Esta es una simplificación - necesitarías definir el patrón exacto
    return true; // Placeholder
  }

  // Realizar un movimiento
  makeMove(from, to) {
    if (!this.initialized) return false;

    const piece = this.board[from];
    this.board[from] = null;
    this.board[to] = piece;
    return true;
  }

  // Verificar si un jugador ha ganado
  checkWin(playerIndex) {
    const targetPositions = this.getOppositeCorner(playerIndex);
    return targetPositions.every((pos) => this.board[pos] === playerIndex);
  }

  // Obtener el rincón opuesto para un jugador
  getOppositeCorner(playerIndex) {
    const oppositeCorners = {
      0: this.getStartingPositions("bottom"), // top -> bottom
      1: this.getStartingPositions("bottomLeft"), // topRight -> bottomLeft
      2: this.getStartingPositions("topLeft"), // bottomRight -> topLeft
      3: this.getStartingPositions("top"), // bottom -> top
      4: this.getStartingPositions("topRight"), // bottomLeft -> topRight
      5: this.getStartingPositions("bottomRight"), // topLeft -> bottomRight
    };
    return oppositeCorners[playerIndex];
  }
}

module.exports = Board;
