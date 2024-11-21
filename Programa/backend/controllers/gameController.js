const Game = require("../models/Game");
const { v4: uuidv4 } = require("uuid");

const gameController = {
  // Crear una nueva partida
  createGame: async (req, res) => {
    try {
      const { creator, maxPlayers } = req.body;

      // Validar número de jugadores
      if (![2, 3, 4, 6].includes(maxPlayers)) {
        return res.status(400).json({ error: "Número de jugadores inválido" });
      }

      const game = new Game({
        gameId: uuidv4(),
        creator,
        maxPlayers,
        players: [
          {
            nickname: creator,
            color: "red", // El primer color por defecto
            order: 0,
          },
        ],
      });

      await game.save();
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener lista de partidas disponibles
  getAvailableGames: async (req, res) => {
    try {
      const games = await Game.find(
        {
          status: "waiting",
          createdAt: { $gte: new Date(Date.now() - 180000) },
        }
      ).select("gameId"); // Solo devuelve el campo gameId

      res.json(games); // Enviamos los datos filtrados
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },



  // Unirse a una partida
  joinGame: async (req, res) => {
    try {
      const { gameId, nickname } = req.body;
      const game = await Game.findOne({ gameId });

      if (!game) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }

      if (game.status !== "waiting") {
        return res.status(400).json({ error: "La partida ya ha comenzado" });
      }

      if (game.players.length >= game.maxPlayers) {
        return res.status(400).json({ error: "La partida está llena" });
      }

      if (game.players.some((p) => p.nickname === nickname)) {
        return res.status(400).json({ error: "Ya estás en esta partida" });
      }

      // Asignar color según el orden de llegada
      const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
      const newPlayer = {
        nickname,
        color: colors[game.players.length],
        order: game.players.length,
      };

      game.players.push(newPlayer);

      // Si se completó el número de jugadores, cambiar estado
      if (game.players.length === game.maxPlayers) {
        game.status = "playing";
      }

      await game.save();
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener ranking
  getRanking: async (req, res) => {
    try {
      const games = await Game.find({
        status: "finished",
        winner: { $ne: null },
      })
        .sort({ createdAt: -1 })
        .limit(10);

      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Finalizar partida
  endGame: async (req, res) => {
    try {
      const { gameId, winner } = req.body;
      const game = await Game.findOne({ gameId });

      if (!game) {
        return res.status(404).json({ error: "Partida no encontrada" });
      }

      game.status = "finished";
      game.winner = winner;
      await game.save();

      res.json(game);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = gameController;
