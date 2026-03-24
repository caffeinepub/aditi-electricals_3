export async function registerServiceWorker(): Promise<void> {
  if ("serviceWorker" in navigator) {
    try {
      const registration =
        await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", registration.scope);
    } catch (error) {
      console.warn("Service Worker registration failed:", error);
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function scheduleNotification(
  title: string,
  body: string,
  delay: number,
): void {
  setTimeout(() => {
    if (Notification.permission === "granted") {
      try {
        navigator.serviceWorker.ready.then((reg) => {
          // Use any cast to allow vibrate in service worker notification options
          const options: NotificationOptions & { vibrate?: number[] } = {
            body,
            icon: "/assets/generated/aditi-icon-192.dim_192x192.png",
            badge: "/assets/generated/aditi-icon-192.dim_192x192.png",
            tag: title,
          };
          reg.showNotification(title, options as NotificationOptions);
          // Vibrate separately via navigator API
          if ("vibrate" in navigator) {
            (
              navigator as Navigator & { vibrate: (pattern: number[]) => void }
            ).vibrate([200, 100, 200]);
          }
        });
      } catch {
        new Notification(title, { body });
      }
    }
  }, delay);
}

export function scheduleDailyNotifications(): void {
  const now = new Date();

  const schedule = [
    {
      hour: 9,
      minute: 0,
      title: "Aditi Electricals",
      body: "⏰ Time to mark your attendance!",
    },
    {
      hour: 9,
      minute: 15,
      title: "Aditi Electricals",
      body: "🔔 Start work reminder - Have you marked attendance?",
    },
    {
      hour: 14,
      minute: 0,
      title: "Aditi Electricals",
      body: "🕑 2PM Check-in - Please confirm you resumed work!",
    },
  ];

  for (const { hour, minute, title, body } of schedule) {
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target > now) {
      const delay = target.getTime() - now.getTime();
      scheduleNotification(title, body, delay);
    }
  }
}
