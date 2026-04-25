const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("Jackaroo running");
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("create_room", () => {
    socket.emit("created", "room ok");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});

server.listen(PORT, () => {
  console.log("Server running on", PORT);
});