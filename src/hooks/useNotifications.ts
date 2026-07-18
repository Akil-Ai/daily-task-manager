import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return false;
    }
    
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    const defaultOptions: any = {
      icon: '/icon-192.png',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      tag: 'task-reminder',
      renotify: true,
      ...options,
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions as NotificationOptions);
      }).catch(() => {
        
        try {
          new Notification(title, defaultOptions as NotificationOptions);
        } catch (e) {
          console.warn('Standard notification fallback failed:', e);
        }
      });
    } else {
      try {
        new Notification(title, defaultOptions);
      } catch (e) {
        console.warn('Standard notification failed:', e);
      }
    }
  };

  return { permission, requestPermission, sendNotification };
}
