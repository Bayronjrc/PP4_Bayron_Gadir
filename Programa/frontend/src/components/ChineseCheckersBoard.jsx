import React, { useState, useEffect } from "react";
import { socket } from "../socket";

const PLAYER_COLORS = {
  0: {
    bg: "bg-red-500",
    text: "text-red-500",
  },
  1: {
    bg: "bg-yellow-500",
    text: "text-yellow-500",
  },
  2: {
    bg: "bg-green-500",
    text: "text-green-500",
  },
  3: {
    bg: "bg-blue-500",
    text: "text-blue-500",
  },
  4: {
    bg: "bg-purple-500",
    text: "text-purple-500",
  },
  5: {
    bg: "bg-orange-500",
    text: "text-orange-500",
  },
};

const PLAYER_CONFIGURATIONS = {
  2: {
    playerMap: {
      R: 0, // Rojo (arriba)
      V: 2, // Verde (abajo)
    },
    players: [
      { index: 0, color: "red", position: "top" },
      { index: 2, color: "green", position: "bottom" },
    ],
  },
  3: {
    playerMap: {
      R: 0, // Rojo (arriba)
      A: 1, // Amarillo (inferior derecha)
      C: 5, // Naranja (superior derecha)
    },
    players: [
      { index: 0, color: "red", position: "top" },
      { index: 1, color: "yellow", position: "bottomRight" },
      { index: 5, color: "orange", position: "topRight" },
    ],
  },
  4: {
    playerMap: {
      R: 0, // Rojo (arriba)
      A: 1, // Amarillo (inferior izquierda)
      V: 2, // Verde (abajo)
      N: 4, // Morado (superior izquierda)
    },
    players: [
      { index: 0, color: "red", position: "top" },
      { index: 1, color: "yellow", position: "bottomLeft" },
      { index: 2, color: "green", position: "bottom" },
      { index: 4, color: "purple", position: "topLeft" },
    ],
  },
  6: {
    playerMap: {
      R: 0, // Rojo (arriba)
      A: 1, // Amarillo (inferior derecha)
      V: 2, // Verde (abajo)
      B: 3, // Azul (inferior izquierda)
      N: 4, // Morado (superior izquierda)
      C: 5, // Naranja (superior derecha)
    },
    players: [
      { index: 0, color: "red", position: "top" },
      { index: 1, color: "yellow", position: "bottomRight" },
      { index: 2, color: "green", position: "bottom" },
      { index: 3, color: "blue", position: "bottomLeft" },
      { index: 4, color: "purple", position: "topLeft" },
      { index: 5, color: "orange", position: "topRight" },
    ],
  },
};

const StartGameModal = ({ players, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 text-center">¡Orden de Juego!</h2>
      <div className="space-y-3">
        {players?.map((player, index) => (
          <div
            key={player.nickname || index}
            className="flex items-center justify-between p-2 rounded bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{index + 1}.</span>
              <span className={`font-medium ${PLAYER_COLORS[index].text}`}>
                {player.nickname || `Jugador ${index + 1}`}
              </span>
            </div>
            <span className="text-gray-600">Dado: {player.diceRoll}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        ¡Empezar!
      </button>
    </div>
  </div>
);

export default function ChineseCheckersBoard({ gameData }) {
  // Inicialización del tablero como un efecto separado
  const [boardState, setBoardState] = useState(new Array(121).fill(null));
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [players, setPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);

  // Efecto para inicializar el tablero
  useEffect(() => {
    if (gameData?.boardState?.board) {
      setBoardState(gameData.boardState.board);
    } else {
      let newBoard = new Array(121).fill(null);
      let index = 0;

      const numPlayers = gameData?.players?.length || 6;
      const configuration = PLAYER_CONFIGURATIONS[numPlayers];

      BOARD_STRUCTURE.forEach((row) => {
        [...row].forEach((cell) => {
          if (cell !== " ") {
            if (cell !== "O" && configuration?.playerMap[cell] !== undefined) {
              newBoard[index] = configuration.playerMap[cell];
            }
            index++;
          }
        });
      });

      setBoardState(newBoard);
    }
  }, [gameData]);

  const getPieceColor = (piece) => {
    if (piece === null) return null;

    const numPlayers = gameData?.players?.length || 6;
    const configuration = PLAYER_CONFIGURATIONS[numPlayers];
    const playerInfo = configuration?.players.find((p) => p.index === piece);

    return playerInfo?.color || "gray";
  };

  // Efecto para manejar la inicialización del juego y eventos
  useEffect(() => {
    // Registrar jugadores
    const registerPlayers = async () => {
      if (gameData?.players) {
        try {
          const registerPromises = gameData.players.map((player) =>
            fetch("http://localhost:5000/api/players/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nickname: player.nickname }),
            }).then((res) => res.json())
          );
          await Promise.all(registerPromises);
        } catch (error) {
          console.error("Error registrando jugadores:", error);
        }
      }
    };

    const initializeGame = () => {
      if (gameData) {
        console.log("Inicializando juego con datos:", gameData);
        setPlayers(gameData.players || []);
        setCurrentPlayer(gameData.currentPlayer || 0);

        // Encontrar mi índice de jugador
        const myNickname = localStorage.getItem("nickname");
        const myPlayer = gameData.players?.find(
          (p) => p.nickname === myNickname
        );

        if (myPlayer) {
          setMyPlayerIndex(myPlayer.playerIndex);
          console.log("Información de jugador:", {
            nickname: myNickname,
            index: myPlayer.playerIndex,
            currentTurn: gameData.currentPlayer,
          });
        }
      }
    };

    registerPlayers();
    initializeGame();

    // Event listeners
    const handlePieceMove = (data) => {
      console.log("Movimiento recibido:", data);
      if (data.boardState?.board) {
        setBoardState(data.boardState.board);
        setCurrentPlayer(data.boardState.currentPlayer);
        setSelectedPosition(null);
        setValidMoves([]);
      }
    };

    const handleTurnChange = (data) => {
      console.log("Cambio de turno:", data);
      setCurrentPlayer(data.currentPlayer);
    };

    const handleValidMoves = (data) => {
      console.log("Movimientos válidos:", data);
      setValidMoves(data.moves || []);
    };

    socket.on("pieceMove", handlePieceMove);
    socket.on("turnChange", handleTurnChange);
    socket.on("validMoves", handleValidMoves);

    return () => {
      socket.off("pieceMove", handlePieceMove);
      socket.off("turnChange", handleTurnChange);
      socket.off("validMoves", handleValidMoves);
    };
  }, [gameData]);

  // Función para verificar si es el turno del jugador actual

  const handlePositionClick = (position) => {
    if (!gameData?.gameId) {
      console.log("No hay ID de juego");
      return;
    }

    console.log("Estado actual:", {
      myPlayerIndex,
      currentPlayer,
      position,
      selectedPosition,
      piezaEnPosicion: boardState[position],
    });

    // Verificar si es nuestro turno
    if (!isMyTurn()) {
      console.log("No es tu turno");
      return;
    }

    if (selectedPosition === null) {
      // Seleccionar pieza
      if (boardState[position] === myPlayerIndex) {
        setSelectedPosition(position);
        socket.emit("getValidMoves", {
          gameId: gameData.gameId,
          position,
          playerIndex: myPlayerIndex,
        });
      }
    } else {
      // Mover pieza
      if (validMoves.includes(position)) {
        socket.emit("movePiece", {
          gameId: gameData.gameId,
          from: selectedPosition,
          to: position,
          playerIndex: myPlayerIndex,
        });
      }
      setSelectedPosition(null);
      setValidMoves([]);
    }
  };
  const getCurrentPlayerName = () => {
    if (!gameData?.players) return "";
    const currentPlayerInfo = gameData.players.find(
      (p) => p.playerIndex === currentPlayer
    );
    return currentPlayerInfo?.nickname || `Jugador ${currentPlayer + 1}`;
  };

  const isMyTurn = () => {
    const isTurn = myPlayerIndex === currentPlayer;
    console.log("Verificación de turno:", {
      myIndex: myPlayerIndex,
      currentTurn: currentPlayer,
      isTurn,
    });
    return isTurn;
  };

  const renderPosition = (cell, index) => {
    if (cell === " ") return <div key={`space-${index}`} className="w-8" />;

    const isSelected = selectedPosition === index;
    const isValidMove = validMoves.includes(index);
    const piece = boardState[index];
    const pieceColor = getPieceColor(piece);
    const isMyTurn = currentPlayer === myPlayerIndex;
    const isClickable =
      isMyTurn &&
      (piece === currentPlayer || (isValidMove && selectedPosition !== null));

    return (
      <div
        key={`pos-${index}`}
        className={`
          w-8 h-8 rounded-full
          flex items-center justify-center
          border-2 
          ${isSelected ? "border-yellow-300" : "border-gray-300"}
          ${isValidMove ? "bg-yellow-100" : "bg-white"}
          ${
            isClickable
              ? "cursor-pointer hover:border-yellow-200"
              : "cursor-not-allowed"
          }
          ${cell === "O" ? "border-gray-200" : ""}
        `}
        onClick={() => (isClickable ? handlePositionClick(index) : null)}
      >
        {piece !== null && (
          <div
            className={`
              w-6 h-6 rounded-full
              bg-${pieceColor}-500
              transform transition-transform
              ${isSelected ? "scale-110" : "scale-100"}
            `}
          />
        )}
      </div>
    );
  };
  const renderBoard = () => {
    let index = 0;
    return BOARD_STRUCTURE.map((row, rowIndex) => {
      const rowCells = [...row].map((cell, colIndex) => {
        return cell === " " ? (
          <div key={`space-${rowIndex}-${colIndex}`} className="w-8" />
        ) : (
          renderPosition(cell, index++)
        );
      });

      return (
        <div
          key={`row-${rowIndex}`}
          className="flex items-center justify-center gap-1"
          style={{
            height: "2.25rem",
          }}
        >
          {rowCells}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-100 rounded-lg">
      {showModal && players.length > 0 && (
        <StartGameModal players={players} onClose={() => setShowModal(false)} />
      )}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold mb-2">
          {isMyTurn() ? "¡Es tu turno!" : `Turno de ${getCurrentPlayerName()}`}
        </h2>
        <div
          className={`text-2xl font-bold ${
            PLAYER_COLORS[currentPlayer]?.text || "text-gray-800"
          }`}
        >
          {players[currentPlayer]?.nickname || `Jugador ${currentPlayer + 1}`}
        </div>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg">{renderBoard()}</div>
    </div>
  );
}

const BOARD_STRUCTURE = [
  "    R    ",
  "   RR   ",
  "  RRR  ",
  " RRRR ",
  "NNNNOOOOOCCCC",
  "NNNOOOOOOCCC",
  "NNOOOOOOOCC",
  "NOOOOOOOOC",
  "OOOOOOOOO",
  "BOOOOOOOOA",
  "BBOOOOOOOAA",
  "BBBOOOOOOAAA",
  "BBBBOOOOOAAAA",
  " VVVV ",
  "  VVV  ",
  "   VV   ",
  "    V    ",
];
