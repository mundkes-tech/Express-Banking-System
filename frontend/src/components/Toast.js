import React from 'react';
import { useNotification } from '../context/NotificationContext';
import './Toast.css';

const Toast = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
          role="status"
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
        >
          <div className="toast-content">{notification.message}</div>
          <button
            className="toast-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
