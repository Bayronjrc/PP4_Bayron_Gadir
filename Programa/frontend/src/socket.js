import { io } from "socket.io-client";

export const socket = io("https://0c4c-2803-9810-5421-7210-3dde-512f-34eb-5d99.ngrok-free.app", {
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