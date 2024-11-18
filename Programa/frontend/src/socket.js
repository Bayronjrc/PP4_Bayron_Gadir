// src/socket.js
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  autoConnect: true,
});

// Debugging listeners
socket.on("connect", () => {
  console.log("Connected to Socket.IO server");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.IO server");
});
