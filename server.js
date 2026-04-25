const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Jackaroo Server Running 🚀");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

/* ---------------- DATA ---------------- */

const rooms = {};
const shopItems = [
  { id: 1, name: "Golden Dice", price: 50 },
  { id: 2, name: "VIP Avatar", price: 100 },
  { id: 3, name: "Legend Badge", price: 200 },
];

/* ---------------- HELPERS ---------------- */

function createRoom(roomId) {
  rooms[roomId] = {
    id: roomId,
    players: [],
    turn: 0,
    dice: null,
    started: false,
    chat: [],
  };
}

function getPlayer(roomId, socketId) {
  const room = rooms[roomId];
  if (!room) return null;

  return room.players.find((p) => p.id === socketId);
}

function emitRoom(roomId) {
  io.to(roomId).emit("roomUpdate", rooms[roomId]);
}

/* ---------------- SOCKET ---------------- */

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create Room
  socket.on("create_room", ({ roomId, username }) => {
    if (!rooms[roomId]) createRoom(roomId);

    socket.join(roomId);

    rooms[roomId].players.push({
      id: socket.id,
      name: username || "Host",
      coins: 100,
      inventory: [],
      position: 0,
      avatar: "default",
    });

    emitRoom(roomId);
  });

  // Join Room
  socket.on("joinRoom", ({ roomId, username }) => {
    if (!rooms[roomId]) createRoom(roomId);

    const room = rooms[roomId];

    if (room.players.length >= 4) {
      socket.emit("roomFull");
      return;
    }

    socket.join(roomId);

    room.players.push({
      id: socket.id,
      name: username || "Guest",
      coins: 100,
      inventory: [],
      position: 0,
      avatar: "default",
    });

    emitRoom(roomId);

    io.to(roomId).emit("systemMessage", `${username} joined room`);
  });

  // Start Game
  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.started = true;
    room.turn = 0;

    io.to(roomId).emit("gameStarted", room);
  });

  // Chat
  socket.on("message", ({ roomId, username, message }) => {
    const room = rooms[roomId];
    if (!room) return;

    const msg = {
      username,
      message,
      time: Date.now(),
    };

    room.chat.push(msg);

    io.to(roomId).emit("message", msg);
  });

  // Dice
  socket.on("rollDice", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const current = room.players[room.turn];
    if (!current || current.id !== socket.id) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    room.dice = dice;

    io.to(roomId).emit("diceRolled", {
      playerId: socket.id,
      value: dice,
    });
  });

  // Move Piece
  socket.on("movePiece", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players[room.turn];
    if (!player || player.id !== socket.id) return;
    if (!room.dice) return;

    player.position += room.dice;

    if (player.position >= 24) {
      player.position = 24;
      player.coins += 50;

      io.to(roomId).emit("winner", {
        player: player.name,
        coins: player.coins,
      });
    }

    io.to(roomId).emit("pieceMoved", {
      playerId: socket.id,
      position: player.position,
    });

    room.dice = null;
    room.turn = (room.turn + 1) % room.players.length;

    emitRoom(roomId);
  });

  // Buy Shop Item
  socket.on("buyItem", ({ roomId, itemId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = getPlayer(roomId, socket.id);
    if (!player) return;

    const item = shopItems.find((x) => x.id === itemId);
    if (!item) return;

    if (player.coins >= item.price) {
      player.coins -= item.price;
      player.inventory.push(item);

      socket.emit("buySuccess", {
        coins: player.coins,
        inventory: player.inventory,
      });
    } else {
      socket.emit("buyFail");
    }

    emitRoom(roomId);
  });

  // Voice Chat Signaling
  socket.on("voice-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("voice-offer", {
      from: socket.id,
      offer,
    });
  });

  socket.on("voice-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("voice-answer", {
      from: socket.id,
      answer,
    });
  });

  socket.on("voice-ice", ({ roomId, candidate }) => {
    socket.to(roomId).emit("voice-ice", {
      from: socket.id,
      candidate,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];

      room.players = room.players.filter((p) => p.id !== socket.id);

      if (room.players.length === 0) {
        delete rooms[roomId];
      } else {
        room.turn = 0;
        emitRoom(roomId);
      }
    }
  });
});

/* ---------------- START ---------------- */

server.listen(PORT, () => {
  console.log("🚀 Jackaroo Server Running On Port", PORT);
});