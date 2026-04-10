import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: unknown;
  created_at: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api<AdminNotification[]>("/api/bell-notifications");
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
    setLoading(false);
  }, []);

  const markAsRead = async (id: string) => {
    await api("/api/bell-notifications/read", {
      method: "PATCH",
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    await api("/api/bell-notifications/read", {
      method: "PATCH",
      body: JSON.stringify({ mark_all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
    const t = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(t);
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
