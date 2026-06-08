import { io } from "socket.io-client";

const socket = io("https://qualitedelair.onrender.com", {
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("sensor:update", (data) => {
  console.log("Received data:", data);
});

setTimeout(() => {
  console.log("Exiting after 10 seconds");
  process.exit(0);
}, 10000);
