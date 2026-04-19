/** Shared with App (badge) and Notifications (list) — persisted read ids for derived notifications. */
export const NOTIF_READ_KEY = "sellowl_notif_read_ids";

export const NOTIF_READ_EVENT = "sellowl-notifications-read";

export function getNotifReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function saveNotifReadIds(set) {
  try {
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...set]));
    window.dispatchEvent(new CustomEvent(NOTIF_READ_EVENT));
  } catch {}
}

export function isNotificationUnread(n, readIds = getNotifReadIds()) {
  return !readIds.has(n.id) && !n.read;
}

export function countUnreadNotifications(notifications) {
  const readIds = getNotifReadIds();
  return (notifications || []).filter((n) => isNotificationUnread(n, readIds)).length;
}
