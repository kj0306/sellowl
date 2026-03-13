const API_BASE = "";

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export async function verifyAuth(idToken) {
  return apiFetch("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export async function getMe() {
  return apiFetch("/api/auth/me");
}

export async function fetchListings() {
  return apiFetch("/api/listings");
}

export async function createListing(data) {
  return apiFetch("/api/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
