/* ================================================
   SW.JS — Service Worker for Push Notifications
   ChatSphere

   This file MUST be at the ROOT of your site
   (same level as index.html) for it to work!

   It handles:
   - Background push notification display
   - Notification click → open app
   ================================================ */

// Cache name for offline support (optional)
const CACHE_NAME = 'chatsphere-v1';

// Install event — runs when service worker first installs
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately without waiting
});

// Activate event — runs when service worker takes control
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Take control of all pages immediately
});

// Push event — triggered by backend push message
// This runs even when the browser tab is closed!
self.addEventListener('push', (event) => {
  let data = {
    title: '💬 ChatSphere',
    body:  'Someone wants to chat with you!',
    icon:  '/assets/images/icon-192.png',
    badge: '/assets/images/badge-72.png',
    url:   '/random-chat.html',
  };

  // Parse the push data if provided
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon,
      badge:   data.badge,
      tag:     'chatsphere-push',       // Replaces previous notification
      renotify: true,
      data:    { url: data.url },
    })
  );
});

// Notification click — opens the app when user clicks notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
