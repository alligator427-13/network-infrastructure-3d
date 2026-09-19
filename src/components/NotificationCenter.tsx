// Notification Center Component

import { useState, useCallback } from 'react';
import type { Notification } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  unreadCount: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onRemove,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  unreadCount,
}) => {
  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

  // Group notifications by date
  const groupedNotifications = sortedNotifications.reduce((acc, notification) => {
    const date = new Date(notification.timestamp);
    const dateKey = date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-600/20 border-green-500 text-green-400';
      case 'warning':
        return 'bg-yellow-600/20 border-yellow-500 text-yellow-400';
      case 'error':
        return 'bg-red-600/20 border-red-500 text-red-400';
      case 'info':
      default:
        return 'bg-blue-600/20 border-blue-500 text-blue-400';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      id="right-panel"
      className="w-96 h-full flex flex-col"
    >
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-lg">🔔 Centre de Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} non lues
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onMarkAllAsRead}
            className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-sm rounded transition-colors"
          >
            Tout marquer comme lu
          </button>
          <button
            onClick={onClearAll}
            className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-sm rounded transition-colors"
          >
            Tout effacer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {Object.entries(groupedNotifications).map(([date, group]) => (
          <div key={date} className="space-y-2">
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wider px-2">
              {date}
            </div>
            <div className="space-y-2">
              {group.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border-l-4 transition-colors ${
                    notification.read ? 'opacity-60' : ''
                  } ${getNotificationColor(notification.type)}`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold truncate">{notification.title}</h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{notification.message}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Marquer comme lu
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(notification.id);
                          }}
                          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🔔</div>
            <p>Aucune notification</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
