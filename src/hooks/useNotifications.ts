// Custom hook for notification management

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Notification, NotificationType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface NotificationsState {
  notifications: Notification[];
  toastNotifications: Notification[];
}

export function useNotifications() {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    toastNotifications: [],
  });

  const toastTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const maxNotifications = 100; // Maximum number of notifications to keep
  const maxToasts = 3; // Maximum number of toast notifications to show

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
      toastTimeouts.current.clear();
    };
  }, []);

  // Add a new notification
  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const newNotification: Notification = {
      id: uuidv4(),
      type,
      title,
      message,
      timestamp: Date.now(),
      duration,
      read: false,
    };

    setState(prev => {
      // Limit notifications
      const limitedNotifications = prev.notifications.length >= maxNotifications
        ? [...prev.notifications.slice(1), newNotification]
        : [...prev.notifications, newNotification];

      // Show as toast if duration > 0
      const newToastNotifications = duration > 0
        ? [...prev.toastNotifications.slice(-maxToasts + 1), newNotification]
        : prev.toastNotifications;

      return {
        notifications: limitedNotifications,
        toastNotifications: newToastNotifications.slice(-maxToasts),
      };
    });

    // Auto-remove toast notification after duration
    if (duration > 0) {
      const timeout = setTimeout(() => {
        setState(prev => ({
          ...prev,
          toastNotifications: prev.toastNotifications.filter(t => t.id !== newNotification.id),
        }));
        toastTimeouts.current.delete(newNotification.id);
      }, duration);

      toastTimeouts.current.set(newNotification.id, timeout);
    }

    return newNotification;
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setState(prev => ({
      notifications: prev.notifications.filter(n => n.id !== id),
      toastNotifications: prev.toastNotifications.filter(t => t.id !== id),
    }));

    // Clear timeout if exists
    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      toastNotifications: prev.toastNotifications.map(t =>
        t.id === id ? { ...t, read: true } : t
      ),
    }));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      toastNotifications: prev.toastNotifications.map(t => ({ ...t, read: true })),
    }));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    // Clear all timeouts
    toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
    toastTimeouts.current.clear();

    setState({
      notifications: [],
      toastNotifications: [],
    });
  }, []);

  // Clear only toast notifications
  const clearToasts = useCallback(() => {
    toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
    toastTimeouts.current.clear();

    setState(prev => ({
      ...prev,
      toastNotifications: [],
    }));
  }, []);

  // Get unread count
  const unreadCount = useCallback(
    () => state.notifications.filter(n => !n.read).length,
    [state.notifications]
  );

  // Get toast count
  const toastCount = useCallback(
    () => state.toastNotifications.length,
    [state.toastNotifications]
  );

  // Get notifications by type
  const getByType = useCallback(
    (type: NotificationType) => state.notifications.filter(n => n.type === type),
    [state.notifications]
  );

  // Get recent notifications
  const getRecent = useCallback(
    (limit: number = 10) => [...state.notifications].reverse().slice(0, limit),
    [state.notifications]
  );

  return {
    notifications: state.notifications,
    toastNotifications: state.toastNotifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearToasts,
    unreadCount,
    toastCount,
    getByType,
    getRecent,
  };
}

export default useNotifications;
