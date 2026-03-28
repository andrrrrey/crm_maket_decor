"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import type { NotificationItem } from "@/types";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket(userId);

  useEffect(() => {
    if (!userId) return;

    // Загрузить начальные уведомления
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setNotifications(data.data);
          setUnreadCount(data.data.filter((n: NotificationItem) => !n.isRead).length);
        }
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [socket]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
