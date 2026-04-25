// Smart Supply Chain AI — Service Worker for Push Notifications
const CACHE_NAME = "ssc-ai-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Listen for push events
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "Supply chain alert from AI",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    tag: data.tag || "ssc-alert",
    renotify: true,
    data: { url: data.url || "/dashboard" },
    actions: [
      { action: "view", title: "View Dashboard" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Smart Supply Chain AI", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || "/dashboard");
    })
  );
});
