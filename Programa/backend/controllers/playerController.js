// controllers/playerController.js
const Player = require("../models/Player");

const playerController = {
  // Registrar o actualizar un jugador
  registerPlayer: async (req, res) => {
    try {
      const { nickname } = req.body;

      if (!nickname) {
        return res.status(400).json({ error: "Nickname es requerido" });
      }

      // Buscar si el jugador ya existe
      let player = await Player.findOne({ nickname });

      if (!player) {
        // Si no existe, crear nuevo jugador
        player = new Player({ nickname });
      }

      player.lastPlayed = new Date();
      await player.save();

      res.json(player);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar estadísticas del jugador
  updateStats: async (req, res) => {
    try {
      const { nickname, won } = req.body;
      const player = await Player.findOne({ nickname });

      if (!player) {
        return res.status(404).json({ error: "Jugador no encontrado" });
      }

      player.gamesPlayed += 1;
      if (won) {
        player.gamesWon += 1;
      }
      player.lastPlayed = new Date();

      await player.save();
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener estadísticas del jugador
  getPlayerStats: async (req, res) => {
    try {
      const { nickname } = req.params;
      const player = await Player.findOne({ nickname });

      if (!player) {
        return res.status(404).json({ error: "Jugador no encontrado" });
      }

      res.json({
        nickname: player.nickname,
        gamesPlayed: player.gamesPlayed,
        gamesWon: player.gamesWon,
        winRate:
          player.gamesPlayed > 0
            ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(2) + "%"
            : "0%",
        lastPlayed: player.lastPlayed,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = playerController;
