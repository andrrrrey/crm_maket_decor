"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    connectSocket(userId);
    socketRef.current = getSocket();

    return () => {
      // Не отключаем при размонтировании компонента — соединение живёт дольше
    };
  }, [userId]);

  return socketRef.current ?? getSocket();
}
