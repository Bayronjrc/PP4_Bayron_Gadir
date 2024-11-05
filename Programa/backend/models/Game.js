const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
  },
  creator: {
    type: String,
    required: true,
  },
  players: [
    {
      nickname: String,
      color: String,
      order: Number,
    },
  ],
  maxPlayers: {
    type: Number,
    required: true,
    enum: [2, 3, 4, 6],
  },
  status: {
    type: String,
    enum: ["waiting", "playing", "finished", "cancelled"],
    default: "waiting",
  },
  winner: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180, // El documento se eliminará después de 3 minutos si no se inicia
  },
});

module.exports = mongoose.model("Game", GameSchema);
