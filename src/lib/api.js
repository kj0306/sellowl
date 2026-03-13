const API_BASE = "";

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
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
