"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { useRouter } from "next/navigation";

export default function Lobby() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8);
    socket.emit("create_room", id);
    router.push(`/room/${id}`);
  };

  const joinRoom = () => {
    socket.emit("join_room", roomId);
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl">Lobby</h1>

      <button
        onClick={createRoom}
        className="bg-green-600 text-white px-4 py-2 mt-4"
      >
        Create Room
      </button>

      <div className="mt-6">
        <input
          className="border p-2"
          placeholder="Room ID"
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          onClick={joinRoom}
          className="bg-blue-600 text-white px-4 py-2 ml-2"
        >
          Join
        </button>
      </div>
    </div>
  );
}