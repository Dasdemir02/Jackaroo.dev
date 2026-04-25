"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function Room({ params }) {
  const { id } = params;
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    socket.emit("join_room", id);

    socket.on("room_update", (data) => {
      setPlayers(data.players);
    });

    socket.on("game_move", (data) => {
      console.log("Move:", data);
    });

    return () => {
      socket.off("room_update");
      socket.off("game_move");
    };
  }, [id]);

  const sendMove = () => {
    socket.emit("game_move", {
      roomId: id,
      data: { test: "move from player" },
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl">Room: {id}</h1>

      <h2 className="mt-4">Players:</h2>
      {players.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      <button
        onClick={sendMove}
        className="bg-purple-600 text-white px-4 py-2 mt-4"
      >
        Test Move
      </button>
    </div>
  );
}