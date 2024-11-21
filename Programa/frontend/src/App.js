import React, { useState } from "react";
import { Container, Button, Typography, Paper, Box } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import GameSetup from "./components/GameSetup";
import ChineseCheckersBoard from "./components/ChineseCheckersBoard";
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: "#4caf50",
    },
    secondary: {
      main: "#ff5722",
    },
  },
  typography: {
    fontFamily: "Comic Sans MS, cursive, sans-serif",
  },
});

function App() {
  const [gameState, setGameState] = useState("setup"); // setup, playing
  const [gameData, setGameData] = useState(null);

  const handleGameStart = (data) => {
    console.log("Game starting with data:", data);
    setGameData(data);
    setGameState("playing");
  };

  return (
    <ThemeProvider theme={theme}>
      <Container className="container">
        <Typography variant="h2" align="center" className="header">
          Juego de Damas Chinas
        </Typography>
        <Paper elevation={3} className="paper">
          {gameState === "setup" ? (
            <GameSetup onStart={handleGameStart} />
          ) : (
            <ChineseCheckersBoard gameData={gameData} />
          )}
        </Paper>
        {gameState === "setup" && (
          <Box className="button-container">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleGameStart({ players: 2 })}
            >
              Iniciar Juego
            </Button>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;