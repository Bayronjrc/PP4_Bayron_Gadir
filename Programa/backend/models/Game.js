const mongoose = require("mongoose");

// models/Game.js
const playerSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
  },
  color: String,
  order: Number,
  diceRoll: Number,
  playerIndex: Number,
});

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
  },
  creator: {
    type: String,
    required: true,
  },
  maxPlayers: {
    type: Number,
    required: true,
    enum: [2, 3, 4, 6],
  },
  players: [playerSchema],
  status: {
    type: String,
    enum: ["waiting", "playing", "finished"],
    default: "waiting",
  },
  winner: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Game", gameSchema);
