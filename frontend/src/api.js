const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (name, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ name, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  getSubmissions: () => request("/submissions"),
  setDecision: (rowNumber, decision) =>
    request(`/submissions/${rowNumber}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),
};
