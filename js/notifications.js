/* ================================================
   NOTIFICATIONS.JS — ChatSphere
   Browser Push Notifications

   WHAT THIS FILE DOES:
   - Shows a friendly notification permission prompt UI
   - Requests browser notification permission
   - Registers a Service Worker (needed for push)
   - Shows in-app notifications when user is chatting
   - Handles notification permission states:
     * Default → show our custom prompt
     * Granted → register Service Worker
     * Denied  → hide prompt silently
   ================================================ */

// ================================================
// CONFIG — Adjust timing and behavior
// ================================================
const NOTIF_CONFIG = {
  promptDelay:  8000,          // Show prompt after 8 seconds on page
  promptKey:    'cs_notif_shown', // localStorage: don't show again if dismissed
  swPath:       '/sw.js',      // Service Worker file path
};

// ================================================
// INITIALIZE — Runs on page load
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  // Only run if browser supports notifications
  if (!('Notification' in window)) return;

  // If already granted, just register service worker
  if (Notification.permission === 'granted') {
    registerServiceWorker();
    return;
  }

  // If explicitly denied by user, don't bother
  if (Notification.permission === 'denied') return;

  // Show our custom prompt after delay (less intrusive than browser prompt)
  const alreadyShown = localStorage.getItem(NOTIF_CONFIG.promptKey);
  if (!alreadyShown) {
    setTimeout(showNotifPrompt, NOTIF_CONFIG.promptDelay);
  }
});

// ================================================
// SHOW CUSTOM NOTIFICATION PROMPT
// Our styled UI prompt before triggering browser dialog
// ================================================
function showNotifPrompt() {
  const prompt = document.getElementById('notif-prompt');
  if (!prompt) return;

  // Slide in the prompt
  prompt.classList.add('show');

  // "Enable Notifications" button
  const allowBtn = document.getElementById('notif-allow-btn');
  if (allowBtn) {
    allowBtn.addEventListener('click', async () => {
      hideNotifPrompt();
      await requestNotificationPermission();
    });
  }

  // "No Thanks" button
  const denyBtn = document.getElementById('notif-deny-btn');
  if (denyBtn) {
    denyBtn.addEventListener('click', () => {
      hideNotifPrompt();
      localStorage.setItem(NOTIF_CONFIG.promptKey, 'dismissed');
    });
  }
}

function hideNotifPrompt() {
  const prompt = document.getElementById('notif-prompt');
  if (prompt) {
    prompt.classList.remove('show');
  }
}

// ================================================
// REQUEST BROWSER NOTIFICATION PERMISSION
// Triggers the browser's native permission dialog
// ================================================
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // User said yes! Register service worker
      localStorage.setItem(NOTIF_CONFIG.promptKey, 'granted');
      await registerServiceWorker();
      // Show a welcome notification
      showLocalNotification(
        '🎉 Notifications Enabled!',
        'You\'ll now be notified when strangers want to chat.'
      );
    } else {
      // User said no or dismissed
      localStorage.setItem(NOTIF_CONFIG.promptKey, 'denied');
    }
  } catch (err) {
    console.warn('Notification permission error:', err);
  }
}

// ================================================
// REGISTER SERVICE WORKER
// Required for background push notifications
// ================================================
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return; // Browser doesn't support SW

  try {
    const registration = await navigator.serviceWorker.register(NOTIF_CONFIG.swPath);
    console.log('✅ Service Worker registered:', registration.scope);

    // Store registration for later push notification use
    window._swRegistration = registration;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
  }
}

// ================================================
// SHOW LOCAL NOTIFICATION
// Shows a notification immediately (no backend needed)
// Used for in-app events like new stranger message
//
// Usage:
//   showLocalNotification('New Message', 'Stranger: Hey how are you?')
// ================================================
function showLocalNotification(title, body, icon = '/assets/images/icon-192.png') {
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon,
    badge: '/assets/images/badge-72.png',
    tag:   'chatsphere-notif',    // Replace previous notification with same tag
    renotify: true,
  });

  // Auto-close notification after 5 seconds
  setTimeout(() => notification.close(), 5000);

  // Focus window when notification is clicked
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

// ================================================
// NOTIFY ON NEW MESSAGE (when tab is not active)
// Call this from chat.js when a stranger sends a message
//
// Usage in chat.js:
//   if (document.hidden) {
//     notifyNewMessage('Hey! How are you?');
//   }
// ================================================
function notifyNewMessage(messageText) {
  if (document.hidden && Notification.permission === 'granted') {
    showLocalNotification(
      '💬 New message from Stranger',
      messageText.substring(0, 80) + (messageText.length > 80 ? '...' : ''),
    );
  }
}

// ================================================
// PAGE VISIBILITY — Manage notifications when tab switches
// ================================================
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // User came back to tab — clear any notification badge
    if (window._swRegistration) {
      window._swRegistration.getNotifications().then(notifications => {
        notifications.forEach(n => n.close());
      });
    }
  }
});

// ================================================
// EXPORT for use in chat.js
// ================================================
window.ChatNotif = {
  showLocalNotification,
  notifyNewMessage,
};
