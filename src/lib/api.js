const API_BASE = "";

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const headers =
    method === "GET" || method === "HEAD"
      ? { ...options.headers }
      : { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (path.startsWith("/api") && ct.includes("text/html")) {
    throw new Error(
      "The app received a web page instead of API data. Restart the Flask backend and ensure the Vite proxy target (VITE_API_PROXY_TARGET) matches your server port."
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// Auth
export async function verifyAuth(idToken) {
  return apiFetch("/api/auth/verify", { method: "POST", body: JSON.stringify({ idToken }) });
}
export async function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}
export async function getMe() {
  return apiFetch("/api/auth/me");
}

// Listings
export async function fetchListings() {
  return apiFetch("/api/listings");
}
export async function createListing(data) {
  return apiFetch("/api/listings", { method: "POST", body: JSON.stringify(data) });
}
export async function fetchListing(id) {
  return apiFetch(`/api/listings/${id}`);
}
export async function deleteListing(id) {
  return apiFetch(`/api/listings/${id}`, { method: "DELETE" });
}
export async function fetchUserListings(userId) {
  return apiFetch(`/api/users/${userId}/listings`);
}

/** Public profile (name, email, …) — works even when user has zero listings. */
export async function fetchUserProfile(userId) {
  return apiFetch(`/api/users/${userId}`);
}

/** Search users by name, email / username part, or university (min 2 characters). */
export async function searchUsers(q) {
  const qs = new URLSearchParams({ q: q.trim() });
  return apiFetch(`/api/users/search?${qs}`);
}

// AI
export async function scanImageWithAI(imageUrl) {
  return apiFetch("/api/ai/scan-image", { method: "POST", body: JSON.stringify({ image_url: imageUrl }) });
}
export async function suggestPrice(title, description, category, condition) {
  return apiFetch("/api/ai/suggest-price", {
    method: "POST",
    body: JSON.stringify({ title, description, category, condition }),
  });
}

// Messaging
export async function fetchConversations() {
  return apiFetch("/api/conversations");
}
export async function startConversation(otherUserId) {
  return apiFetch("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ other_user_id: otherUserId }),
  });
}
export async function fetchMessages(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}/messages`);
}
export async function sendMessage(conversationId, text) {
  return apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
export async function fetchUnreadCount() {
  return apiFetch("/api/conversations/unread");
}
export async function markConversationRead(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}/read`, { method: "POST" });
}

// Fetch only messages newer than afterId — used by the real-time poll in ChatThread
export async function fetchNewMessages(conversationId, afterId) {
  return apiFetch(`/api/conversations/${conversationId}/messages?after_id=${afterId}`);
}

// Notifications
export async function fetchNotifications() {
  return apiFetch("/api/notifications");
}
export async function fetchNotificationCount() {
  return apiFetch("/api/notifications/count");
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function placeOrder({ listingIds, buyerNote = "" }) {
  return apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ listing_ids: listingIds, buyer_note: buyerNote }),
  });
}
export async function fetchIncomingOrders(status = null) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch(`/api/orders/incoming${qs}`);
}
export async function fetchOutgoingOrders(status = null) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch(`/api/orders/outgoing${qs}`);
}
export async function fetchOrder(orderId) {
  return apiFetch(`/api/orders/${orderId}`);
}
export async function updateOrder(orderId, { action, sellerNote = "", cancellationReason = "" }) {
  return apiFetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action,
      seller_note: sellerNote,
      cancellation_reason: cancellationReason,
    }),
  });
}
export async function fetchPendingOrderCount() {
  return apiFetch("/api/orders/pending-count");
}
export async function fetchUserAllListings(userId) {
  return apiFetch(`/api/users/${userId}/listings?include_sold=true`);
}