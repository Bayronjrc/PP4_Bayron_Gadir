// routes/gameRoutes.js
const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// Rutas para gestión de partidas
router.post("/create", gameController.createGame);
router.get("/available", gameController.getAvailableGames);
router.post("/join", gameController.joinGame);
router.get("/ranking", gameController.getRanking);
router.post("/end", gameController.endGame);

module.exports = router;
