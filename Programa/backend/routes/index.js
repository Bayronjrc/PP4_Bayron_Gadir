// routes/index.js
const express = require("express");
const router = express.Router();
const gameRoutes = require("./gameRoutes");
const playerRoutes = require("./playerRoutes");

router.use("/games", gameRoutes);
router.use("/players", playerRoutes);

// Ruta de prueba/salud
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});
module.exports = router;
