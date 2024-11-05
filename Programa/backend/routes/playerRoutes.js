// routes/playerRoutes.js
const express = require("express");
const router = express.Router();
const playerController = require("../controllers/playerController");

// Rutas para gestión de jugadores
router.post("/register", playerController.registerPlayer);
router.post("/stats/update", playerController.updateStats);
router.get("/stats/:nickname", playerController.getPlayerStats);

module.exports = router;
