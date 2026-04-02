// Firebase Cloud Messaging service worker for background push notifications
// This file handles FCM push messages when the app is closed or in background.

self.addEventListener("push", function (event) {
  let data = {
    title: "Aditi Electricals",
    body: "You have a new notification",
    icon: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        data.title = payload.notification.title || data.title;
        data.body = payload.notification.body || data.body;
        data.icon = payload.notification.icon || data.icon;
      } else if (payload.data) {
        data.title = payload.data.title || data.title;
        data.body = payload.data.body || data.body;
      }
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
      tag: "fcm-notification",
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      })
  );
});
