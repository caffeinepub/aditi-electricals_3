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

function showNotification(title: string, body: string, tag: string) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
        badge: "/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png",
        tag,
        requireInteraction: false,
      } as NotificationOptions);
    });
  }
}

export function scheduleLocalNotifications(userRole?: string) {
  clearNotificationSchedules();
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  if (!("serviceWorker" in navigator)) return;

  // 8:55 AM - attendance window opens in 5 minutes
  const ms855 = msUntilTime(8, 55);
  const t855 = setTimeout(() => {
    showNotification(
      "Attendance Opening Soon",
      "Attendance will open in 5 minutes (9:00 AM – 9:30 AM).",
      "attendance-open-reminder",
    );
    scheduleLocalNotifications(userRole);
  }, ms855);
  notifTimeouts.push(t855);

  // 9:30 AM - attendance reminder
  const ms930 = msUntilTime(9, 30);
  const t930 = setTimeout(() => {
    showNotification(
      "Attendance Reminder",
      "Please mark your attendance for today.",
      "attendance-reminder",
    );
  }, ms930);
  notifTimeouts.push(t930);

  // 2:00 PM - work update reminder
  const ms200 = msUntilTime(14, 0);
  const t200 = setTimeout(() => {
    showNotification(
      "Work Update Reminder",
      "Please confirm your afternoon work status.",
      "work-reminder",
    );
  }, ms200);
  notifTimeouts.push(t200);

  // 3:55 PM - owner: time to check worker locations
  if (!userRole || userRole === "owner") {
    const ms355 = msUntilTime(15, 55);
    const t355 = setTimeout(() => {
      showNotification(
        "Worker Location Check",
        "It's time to check worker locations.",
        "location-check-reminder",
      );
    }, ms355);
    notifTimeouts.push(t355);
  }
}

export async function initNotifications(userRole?: string) {
  if (!("Notification" in window)) return;
  const alreadyAsked = localStorage.getItem(NOTIF_PERMISSION_KEY);
  if (!alreadyAsked) {
    localStorage.setItem(NOTIF_PERMISSION_KEY, "asked");
    const granted = await requestNotificationPermission();
    if (granted) scheduleLocalNotifications(userRole);
  } else if (Notification.permission === "granted") {
    scheduleLocalNotifications(userRole);
  }
}
