// Notification scheduling and permission management for Aditi Electricals PWA

export const NOTIF_PERMISSION_KEY = "aditi_notif_permission_asked";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function msUntilTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

let notifTimeouts: ReturnType<typeof setTimeout>[] = [];

export function clearNotificationSchedules() {
  for (const t of notifTimeouts) clearTimeout(t);
  notifTimeouts = [];
}

export function scheduleLocalNotifications() {
  clearNotificationSchedules();
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  if (!("serviceWorker" in navigator)) return;

  // 9:30 AM - attendance reminder
  const ms930 = msUntilTime(9, 30);
  const t1 = setTimeout(() => {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification("Attendance Reminder", {
        body: "Please mark your attendance for today.",
        icon: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
        badge: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
        tag: "attendance-reminder",
        requireInteraction: false,
      } as NotificationOptions);
    });
    // Reschedule for next day
    scheduleLocalNotifications();
  }, ms930);
  notifTimeouts.push(t1);

  // 2:00 PM - work update reminder
  const ms200 = msUntilTime(14, 0);
  const t2 = setTimeout(() => {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification("Work Update Reminder", {
        body: "Please confirm your afternoon work status.",
        icon: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
        badge: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
        tag: "work-reminder",
        requireInteraction: false,
      } as NotificationOptions);
    });
  }, ms200);
  notifTimeouts.push(t2);
}

export async function initNotifications() {
  if (!("Notification" in window)) return;
  const alreadyAsked = localStorage.getItem(NOTIF_PERMISSION_KEY);
  if (!alreadyAsked) {
    localStorage.setItem(NOTIF_PERMISSION_KEY, "asked");
    const granted = await requestNotificationPermission();
    if (granted) scheduleLocalNotifications();
  } else if (Notification.permission === "granted") {
    scheduleLocalNotifications();
  }
}
