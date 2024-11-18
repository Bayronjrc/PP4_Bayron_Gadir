// game/Board.js
class Board {
  constructor() {
    this.size = 121;
    this.board = new Array(this.size).fill(null);
    this.initialized = false;
    this.positionMap = null;
    this.structureToPositions = null;
    this.initializeStructure();
  }

  initializeStructure() {
    const BOARD_STRUCTURE = [
      "    R    ", // 4 espacios -> 1 R
      "    RR   ", // 4 espacios -> 2 R
      "    RRR  ", // 4 espacios -> 3 R
      "    RRRR ", // 4 espacios -> 4 R para alinear con NNNN
      "NNNNOOOOOCCCC", // Sin espacios -> línea completa
      "NNNOOOOOOCCC",
      "NNOOOOOOOCC",
      "NOOOOOOOOC",
      "OOOOOOOOO",
      "BOOOOOOOOA",
      "BBOOOOOOOAA",
      "BBBOOOOOOAAA",
      "BBBBOOOOOAAAA",
      "    VVVV ", // 4 espacios -> 4 V alineada con BBBB
      "    VVV  ", // 4 espacios -> 3 V
      "    VV   ", // 4 espacios -> 2 V
      "    V    ", // 4 espacios -> 1 V
    ];

    let positions = new Map();
    let index = 0;
    let playerPositions = {
      R: [], // Top (Rojo - 0)
      A: [], // Top-Right (Amarillo - 1)
      V: [], // Bottom-Right (Verde - 2)
      B: [], // Bottom (Azul - 3)
      N: [], // Bottom-Left (Morado - 4)
      C: [], // Top-Left (Naranja - 5)
      O: [], // Espacios vacíos
    };

    // Mapear posiciones manteniendo el alineamiento correcto
    BOARD_STRUCTURE.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell !== " ") {
          positions.set(index, { x, y, type: cell });
          playerPositions[cell].push(index);
          index++;
        }
      });
    });

    console.log("Mapa de posiciones:");
    positions.forEach((pos, idx) => {
      console.log(`${idx}: (${pos.x}, ${pos.y}) - ${pos.type}`);
    });

    this.positionMap = positions;
    this.structureToPositions = playerPositions;

    // Las direcciones de movimiento permanecen igual

    this.validDirectionsByPlayerCount = {
      2: {
        R: [
          // Rojo (arriba) - se mantiene igual
          { dx: 0, dy: 1 }, // Abajo
          { dx: 1, dy: 1 }, // Abajo-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        V: [
          // Verde (abajo) - movimientos hacia arriba
          { dx: 0, dy: -1 }, // Arriba
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: -1 }, // Arriba-izquierda
        ],
      },
      3: {
        R: [
          // Rojo (arriba) - se mantiene igual
          { dx: 0, dy: 1 }, // Abajo
          { dx: 1, dy: 1 }, // Abajo-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        A: [
          // Amarillo (esquina inferior derecha)
          { dx: -1, dy: 0 }, // Izquierda
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        C: [
          // Naranja (esquina superior derecha)
          { dx: -1, dy: 0 }, // Izquierda
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
      },
      4: {
        R: [
          // Rojo (arriba) - se mantiene igual
          { dx: 0, dy: 1 }, // Abajo
          { dx: 1, dy: 1 }, // Abajo-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        A: [
          // Amarillo (esquina inferior izquierda)
          { dx: -1, dy: 0 }, // Izquierda
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        V: [
          // Verde (abajo)
          { dx: 0, dy: -1 }, // Arriba
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: -1 }, // Arriba-izquierda
        ],
        N: [
          // Morado (esquina superior izquierda)
          { dx: 1, dy: 0 }, // Derecha
          { dx: 1, dy: 1 }, // Abajo-derecha
          { dx: 1, dy: -1 }, // Arriba-derecha
        ],
      },
      6: {
        R: [
          // Rojo (arriba)
          { dx: 0, dy: 1 }, // Abajo
          { dx: 1, dy: 1 }, // Abajo-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        A: [
          // Amarillo (esquina inferior derecha)
          { dx: -1, dy: 0 }, // Izquierda
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        V: [
          // Verde (abajo)
          { dx: 0, dy: -1 }, // Arriba
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: -1 }, // Arriba-izquierda
        ],
        N: [
          // Morado (esquina superior izquierda)
          { dx: 1, dy: 0 }, // Derecha
          { dx: 1, dy: 1 }, // Abajo-derecha
          { dx: 1, dy: -1 }, // Arriba-derecha
        ],
        C: [
          // Naranja (esquina superior derecha)
          { dx: -1, dy: 0 }, // Izquierda
          { dx: 1, dy: -1 }, // Arriba-derecha
          { dx: -1, dy: 1 }, // Abajo-izquierda
        ],
        B: [
          // Azul (esquina inferior izquierda)
          { dx: 1, dy: 0 }, // Derecha
          { dx: 1, dy: 1 }, // Abajo-derecha
          { dx: 1, dy: -1 }, // Arriba-derecha
        ],
      },
    };

    // Método para obtener las direcciones válidas según el número de jugadores
    this.getValidDirectionsForPlayer = (playerType, numPlayers) => {
      return this.validDirectionsByPlayerCount[numPlayers]?.[playerType] || [];
    };
  }

  isValidPosition(position) {
    if (!this.positionMap.has(position)) {
      return false;
    }

    const { x, y } = this.positionMap.get(position);

    // Comprobar si la posición está dentro del patrón hexagonal del tablero
    const dx = Math.abs(x - 6); // Centro en x
    const dy = Math.abs(y - 8); // Centro en y
    const maxDistance = 8;

    return dx + dy <= maxDistance && Math.abs(dx - dy) <= maxDistance / 2;
  }

  getAllPossibleMoves(position) {
    if (!this.initialized || !this.positionMap.has(position)) {
      console.log("Posición inválida o tablero no inicializado");
      return [];
    }

    const { x, y } = this.positionMap.get(position);
    console.log(`Calculando movimientos desde (${x}, ${y})`);

    // 1. Obtener movimientos adyacentes
    const adjacentMoves = this.getAdjacentMoves(position).filter(
      (pos) => this.board[pos] === null
    );
    console.log("Movimientos adyacentes:", adjacentMoves);

    // 2. Obtener saltos
    const jumpMoves = this.calculateJumpMoves(position);
    console.log("Movimientos de salto:", jumpMoves);

    return [...new Set([...adjacentMoves, ...jumpMoves])];
  }

  getAdjacentMoves(position) {
    const { x, y } = this.positionMap.get(position);

    // Direcciones en patrón hexagonal
    const directions = [
      { dx: 0, dy: -1 }, // Arriba
      { dx: 1, dy: -1 }, // Arriba-derecha
      { dx: 1, dy: 0 }, // Derecha
      { dx: 0, dy: 1 }, // Abajo
      { dx: -1, dy: 1 }, // Abajo-izquierda
      { dx: -1, dy: 0 }, // Izquierda
      { dx: -1, dy: -1 }, // Arriba-izquierda
      { dx: 1, dy: 1 }, // Abajo-derecha
    ];

    const adjacentPositions = directions
      .map(({ dx, dy }) => {
        const newX = x + dx;
        const newY = y + dy;

        // Encontrar la posición en el mapa
        const newPos = Array.from(this.positionMap.entries()).find(
          ([_, pos]) => pos.x === newX && pos.y === newY
        );

        return newPos ? newPos[0] : undefined;
      })
      .filter((pos) => pos !== undefined && this.isValidPosition(pos));

    console.log(`Posiciones adyacentes para (${x},${y}):`, adjacentPositions);
    return adjacentPositions;
  }

  calculateJumpMoves(position, visited = new Set()) {
    const jumps = new Set();
    visited.add(position);

    const { x, y } = this.positionMap.get(position);

    // Direcciones de salto
    const directions = [
      { dx: 0, dy: -2 }, // Salto arriba
      { dx: 2, dy: -2 }, // Salto arriba-derecha
      { dx: 2, dy: 0 }, // Salto derecha
      { dx: 0, dy: 2 }, // Salto abajo
      { dx: -2, dy: 2 }, // Salto abajo-izquierda
      { dx: -2, dy: 0 }, // Salto izquierda
    ];

    directions.forEach(({ dx, dy }) => {
      const midX = x + dx / 2;
      const midY = y + dy / 2;
      const jumpX = x + dx;
      const jumpY = y + dy;

      // Encontrar posiciones en el mapa
      const midPos = this.findPositionByCoords(midX, midY);
      const jumpPos = this.findPositionByCoords(jumpX, jumpY);

      if (
        midPos !== undefined &&
        jumpPos !== undefined &&
        this.board[midPos] !== null &&
        this.board[jumpPos] === null &&
        !visited.has(jumpPos)
      ) {
        jumps.add(jumpPos);
        // Buscar saltos adicionales desde la nueva posición
        const nextJumps = this.calculateJumpMoves(jumpPos, new Set(visited));
        nextJumps.forEach((jump) => jumps.add(jump));
      }
    });

    return [...jumps];
  }

  findPositionByCoords(x, y) {
    return Array.from(this.positionMap.entries()).find(
      ([_, pos]) => pos.x === x && pos.y === y
    )?.[0];
  }

  getValidMoves(position) {
    const piece = this.board[position];
    const { type } = this.positionMap.get(position);
    console.log(
      `Calculando movimientos válidos para pieza ${piece} tipo ${type} en posición ${position}`
    );

    const allMoves = this.getAllPossibleMoves(position);

    // Filtrar por dirección válida
    const validMoves = allMoves.filter((move) =>
      this.isValidDirection(position, move, type)
    );

    console.log(`Movimientos válidos filtrados:`, validMoves);
    return validMoves;
  }
  isValidDirection(from, to, pieceType) {
    const numPlayers = this.getNumPlayers(); // Necesitarás implementar este método
    const fromPos = this.positionMap.get(from);
    const toPos = this.positionMap.get(to);

    if (!fromPos || !toPos) return false;

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;

    // Obtener las direcciones válidas para este tipo de pieza y número de jugadores
    const validDirs = this.getValidDirectionsForPlayer(pieceType, numPlayers);
    if (!validDirs) return false;

    // Verificar si el movimiento sigue una dirección válida
    return validDirs.some((dir) => {
      // Para movimientos simples
      if (dir.dx === dx && dir.dy === dy) return true;

      // Para saltos (el doble de la dirección)
      if (dir.dx * 2 === dx && dir.dy * 2 === dy) {
        // Verificar que hay una pieza en medio
        const midX = fromPos.x + dir.dx;
        const midY = fromPos.y + dir.dy;
        const midPos = Array.from(this.positionMap.entries()).find(
          ([_, pos]) => pos.x === midX && pos.y === midY
        )?.[0];
        return midPos !== undefined && this.board[midPos] !== null;
      }
      return false;
    });
  }

  getNumPlayers() {
    // Este método debería ser implementado para devolver el número actual de jugadores
    // Puedes pasarlo como parámetro en el constructor o mantenerlo como una propiedad de la clase
    return this._numPlayers || 6; // Por defecto 6 jugadores
  }

  getJumpMoves(position, visited = new Set()) {
    const jumps = new Set();
    visited.add(position);

    const { x: startX, y: startY } = this.positionMap.get(position);
    const adjacentMoves = this.getAdjacentMoves(position);

    for (const adjacent of adjacentMoves) {
      if (this.board[adjacent] !== null) {
        const { x: midX, y: midY } = this.positionMap.get(adjacent);

        // Calcular la posición del salto
        const jumpX = midX + (midX - startX);
        const jumpY = midY + (midY - startY);

        // Buscar la posición de salto en el mapa
        const jumpPos = Array.from(this.positionMap.entries()).find(
          ([_, pos]) => pos.x === jumpX && pos.y === jumpY
        )?.[0];

        if (
          jumpPos !== undefined &&
          !visited.has(jumpPos) &&
          this.board[jumpPos] === null
        ) {
          jumps.add(jumpPos);
          const nextJumps = this.getJumpMoves(jumpPos, new Set(visited));
          nextJumps.forEach((jump) => jumps.add(jump));
        }
      }
    }

    return [...jumps];
  }

  // Inicializar el tablero según el número de jugadores
  initializeBoard(playerSetup) {
    this.board = new Array(this.size).fill(null);
    console.log("Inicializando tablero con configuración:", playerSetup);

    // Colocar piezas para cada jugador activo
    Object.entries(playerSetup).forEach(([playerIndex, setup]) => {
      setup.initialPositions.forEach((pos) => {
        this.board[pos] = parseInt(playerIndex);
      });
    });

    this.initialized = true;
    console.log("Estado inicial del tablero:", this.board);
    return this.board;
  }

  getInitialPositionsForPlayer(playerIndex) {
    const positionMap = {
      0: this.structureToPositions.R, // Rojo (arriba)
      1: this.structureToPositions.A, // Amarillo (superior-derecha)
      2: this.structureToPositions.V, // Verde (abajo)
      3: this.structureToPositions.B, // Azul (inferior-derecha)
      4: this.structureToPositions.N, // Morado (inferior-izquierda)
      5: this.structureToPositions.C, // Naranja (superior-izquierda)
    };
    return positionMap[playerIndex] || [];
  }

  getCornerPositions(playerIndex) {
    // Definir las posiciones para cada esquina
    const cornerPositions = {
      0: this.structureToPositions.R, // Rojo (arriba)
      1: this.structureToPositions.A, // Amarillo (superior-derecha)
      2: this.structureToPositions.V, // Verde (abajo)
      3: this.structureToPositions.B, // Azul (inferior-derecha)
      4: this.structureToPositions.N, // Morado (inferior-izquierda)
      5: this.structureToPositions.C, // Naranja (superior-izquierda)
    };

    return cornerPositions[playerIndex] || [];
  }

  // Método para obtener las posiciones extra en juegos de 2 jugadores
  getExtraPositionsFor2Players(position) {
    const extraPositions = {
      top: [4, 5, 15, 28, 41],
      bottom: [79, 92, 105, 115, 116],
    };
    return extraPositions[position] || [];
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
    // Posiciones base para 10 fichas
    const basePositions = {
      top: [0, 1, 2, 3, 13, 14, 26, 27, 39, 40],
      topRight: [11, 12, 13, 25, 26, 27, 38, 39, 40, 41],
      bottomRight: [79, 80, 81, 93, 94, 95, 107, 108, 109, 110],
      bottom: [80, 81, 82, 83, 94, 95, 107, 108, 120, 121],
      bottomLeft: [71, 72, 73, 85, 86, 87, 99, 100, 101, 102],
      topLeft: [19, 20, 21, 33, 34, 35, 47, 48, 49, 50],
    };

    // Posiciones adicionales para 2 jugadores (5 fichas más)
    const extraPositionsFor2Players = {
      top: [4, 5, 15, 28, 41],
      bottom: [79, 92, 105, 115, 116],
    };

    return basePositions[position];
  }

  isValidMove(from, to, pieceType) {
    const fromPos = this.positionMap.get(from);
    const toPos = this.positionMap.get(to);

    if (!fromPos || !toPos) return false;

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;

    // Obtener las direcciones válidas para este tipo de pieza
    const validDirs = this.validDirections[pieceType];
    if (!validDirs) return false;

    // Verificar si el movimiento sigue una dirección válida
    return validDirs.some((dir) => {
      // Para movimientos simples
      if (dir.dx === dx && dir.dy === dy) return true;

      // Para saltos (el doble de la dirección)
      if (dir.dx * 2 === dx && dir.dy * 2 === dy) {
        // Verificar que hay una pieza en medio
        const midX = fromPos.x + dir.dx;
        const midY = fromPos.y + dir.dy;
        const midPos = Array.from(this.positionMap.entries()).find(
          ([_, pos]) => pos.x === midX && pos.y === midY
        )?.[0];
        return midPos !== undefined && this.board[midPos] !== null;
      }
      return false;
    });
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

    // Verificar que el salto está dentro del tablero físico y es una posición válida
    if (!this.isOnBoard(jumpX, jumpY) || !this.isValidPosition(jumpPos)) {
      return null;
    }

    return jumpPos;
  }

  // Realizar un movimiento
  makeMove(from, to) {
    if (!this.initialized) return false;

    console.log(`Moviendo pieza de ${from} a ${to}`, {
      piezaEnOrigen: this.board[from],
      piezaEnDestino: this.board[to],
    });

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

  isOnBoard(x, y) {
    return x >= 0 && x < 13 && y >= 0 && y < 17;
  }

  // Verificar si una pieza está en su campo inicial
  isPieceInInitialField(position, playerIndex, playerFields) {
    return playerFields[playerIndex].initialField.includes(position);
  }

  // Verificar si quedan piezas en el campo inicial
  hasRemainingPiecesInInitialField(playerIndex, playerFields) {
    return playerFields[playerIndex].initialField.some(
      (pos) => this.board[pos] === playerIndex
    );
  }

  // Verificar si una pieza está en su campo objetivo
  isPieceInTargetField(position, playerIndex, playerFields) {
    return playerFields[playerIndex].targetField.includes(position);
  }
}

module.exports = Board;
