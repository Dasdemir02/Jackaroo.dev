const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ================= ROOMS =================
let rooms = {};

// ================= CONNECTION =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ================= JOIN ROOM =================
  socket.on("join_room", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        turn: 0,
      };
    }

    if (!rooms[roomId].players.includes(socket.id)) {
      rooms[roomId].players.push(socket.id);
    }

    io.to(roomId).emit("room_update", rooms[roomId]);
  });

  // ================= DICE =================
  socket.on("roll_dice", (roomId) => {
    const dice = Math.floor(Math.random() * 6) + 1;

    io.to(roomId).emit("dice_rolled", {
      player: socket.id,
      value: dice,
    });
  });

  // ================= TURN =================
  socket.on("next_turn", (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    room.turn = (room.turn + 1) % room.players.length;

    io.to(roomId).emit("turn_update", {
      turn: room.turn,
      currentPlayer: room.players[room.turn],
    });
  });

  // ================= MOVE PIECE =================
  socket.on("move_piece", ({ roomId, data }) => {
    socket.to(roomId).emit("opponent_move", data);
  });

  // ================= CHAT =================
  socket.on("send_message", ({ roomId, message, user }) => {
    io.to(roomId).emit("receive_message", {
      user,
      message,
      time: Date.now(),
    });
  });

  // ================= VOICE CHAT (WEBRTC SIGNALING) =================

  socket.on("voice_join", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user_joined_voice", socket.id);
  });

  socket.on("voice_offer", (data) => {
    socket.to(data.roomId).emit("voice_offer", {
      offer: data.offer,
      sender: socket.id,
    });
  });

  socket.on("voice_answer", (data) => {
    socket.to(data.roomId).emit("voice_answer", {
      answer: data.answer,
      sender: socket.id,
    });
  });

  socket.on("voice_ice", (data) => {
    socket.to(data.roomId).emit("voice_ice", {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(
        (p) => p !== socket.id
      );
    }
  });
});

// ================= START SERVER =================
server.listen(3001, () => {
  console.log("🚀 Jackaroo server running on port 3001");
});
socket.on("create_room", () => {
  const roomId = Math.random().toString(36).substring(2, 8);

  rooms[roomId] = {
    players: [],
    turn: 0,
  };

  socket.join(roomId);
  rooms[roomId].players.push(socket.id);

  socket.emit("room_created", roomId);
});
socket.on("join_room", (roomId) => {
  socket.join(roomId);

  if (!rooms[roomId]) {
    rooms[roomId] = { players: [], turn: 0 };
  }

  rooms[roomId].players.push(socket.id);

  io.to(roomId).emit("room_update", rooms[roomId]);
});
let gameState = {};
socket.on("join_room", (roomId) => {
  socket.join(roomId);

  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: [],
      turn: 0,
    };
  }

  if (!gameState[roomId]) {
    gameState[roomId] = {};
  }

  if (!rooms[roomId].players.includes(socket.id)) {
    rooms[roomId].players.push(socket.id);
  }

  io.to(roomId).emit("room_update", rooms[roomId]);
});
socket.on("check_win", ({ roomId, playerId, finishedPieces }) => {
  if (finishedPieces === 4) {
    io.to(roomId).emit("game_over", {
      winner: playerId,
    });

    // reset room
    rooms[roomId] = {
      players: rooms[roomId].players,
      turn: 0,
    };
  }
});
const finished = {};
if (piece.index === 0 && steps <= 0) {
  finished[piece.playerId] = (finished[piece.playerId] || 0) + 1;

  socket.emit("check_win", {
    roomId: "test123",
    playerId: piece.playerId,
    finishedPieces: finished[piece.playerId],
  });
}
socket.on("game_over", (data) => {
  alert("🏆 Winner: Player " + data.winner);

  // oyunu restart et
  window.location.href = "/lobby";
});
let coins = {};
socket.on("join_room", (roomId) => {
  socket.join(roomId);

  if (!coins[socket.id]) {
    coins[socket.id] = 100; // 🔥 start coin
  }

  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: [],
      turn: 0,
    };
  }

  if (!rooms[roomId].players.includes(socket.id)) {
    rooms[roomId].players.push(socket.id);
  }

  io.to(socket.id).emit("coin_update", coins[socket.id]);

  io.to(roomId).emit("room_update", rooms[roomId]);
});
socket.on("check_win", ({ roomId, playerId, finishedPieces }) => {
  if (finishedPieces === 4) {

    // 💰 reward
    coins[playerId] += 50;

    io.to(roomId).emit("game_over", {
      winner: playerId,
      reward: 50
    });

    io.to(playerId).emit("coin_update", coins[playerId]);

    // reset room
    rooms[roomId] = {
      players: rooms[roomId].players,
      turn: 0,
    };
  }
});
let profiles = {};
socket.on("join_room", (roomId) => {
  socket.join(roomId);

  // 👤 PROFILE CREATE
  if (!profiles[socket.id]) {
    profiles[socket.id] = {
      name: "Player-" + socket.id.slice(0, 4),
      avatar: 1,
      coins: 100,
    };
  }

  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: [],
      turn: 0,
    };
  }

  if (!rooms[roomId].players.includes(socket.id)) {
    rooms[roomId].players.push(socket.id);
  }

  io.to(roomId).emit("room_update", {
    players: rooms[roomId].players.map((id) => profiles[id]),
  });
});
socket.on("update_profile", (data) => {
  if (!profiles[socket.id]) return;

  profiles[socket.id] = {
    ...profiles[socket.id],
    ...data,
  };

  socket.emit("profile_update", profiles[socket.id]);
});
let shopItems = [
  { id: 1, name: "Red Avatar", price: 50 },
  { id: 2, name: "Blue Avatar", price: 50 },
  { id: 3, name: "Golden Skin", price: 100 },
];

let inventory = {};
socket.on("get_shop", () => {
  socket.emit("shop_data", shopItems);
});
socket.on("buy_item", ({ itemId }) => {
  const item = shopItems.find((i) => i.id === itemId);
  if (!item) return;

  if (!coins[socket.id]) coins[socket.id] = 100;

  if (coins[socket.id] < item.price) {
    socket.emit("buy_result", { success: false });
    return;
  }

  coins[socket.id] -= item.price;

  if (!inventory[socket.id]) inventory[socket.id] = [];

  inventory[socket.id].push(item);

  socket.emit("buy_result", {
    success: true,
    coins: coins[socket.id],
    inventory: inventory[socket.id],
  });
});