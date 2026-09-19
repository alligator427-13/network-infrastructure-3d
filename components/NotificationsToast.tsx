// Notifications Toast Component

import { useEffect, useState, useCallback } from 'react';
import type { Notification } from '../types';

interface NotificationsToastProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationsToast: React.FC<NotificationsToastProps> = ({
  notifications,
  onRemove,
  onMarkAsRead,
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  // Animation for slide-in effect
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());

  // Update visible notifications when props change
  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  // Handle notification removal with animation
  const handleRemove = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimatingOut(prev => new Set(prev).add(id));
    
    // Remove after animation completes
    setTimeout(() => {
      onRemove(id);
      setAnimatingOut(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  }, [onRemove]);

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

  if (notifications.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed top-20 right-4 z-200 flex flex-col gap-2 max-w-md w-full"
    >
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`notification-toast p-3 rounded-lg border-l-4 shadow-lg transition-all duration-300 ${
            animatingOut.has(notification.id) ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
          } ${getNotificationColor(notification.type)}`}
          style={{
            animation: animatingOut.has(notification.id) ? 'none' : `slideIn 0.3s ease-out ${index * 0.1}s forwards`,
          }}
          onClick={() => {
            onMarkAsRead(notification.id);
            handleRemove(notification.id, { stopPropagation: () => {}, preventDefault: () => {}, ...{} } as React.MouseEvent);
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-xl">{getNotificationIcon(notification.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold truncate">{notification.title}</h4>
                <button
                  onClick={(e) => handleRemove(notification.id, e)}
                  className="text-lg hover:opacity-70 transition-opacity ml-2"
                  title="Fermer"
                >
                  ×
                </button>
              </div>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      ))}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsToast;
