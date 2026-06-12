import { API_BASE_URL } from "./config";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("lifevault_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  signup: (email: string, password: string, name: string) =>
    request("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  login: (email: string, password: string) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  
  // Tasks
  getTasks: () => request("/api/tasks"),
  createTask: (task: any) => request("/api/tasks", { method: "POST", body: JSON.stringify(task) }),
  
  // Events
  getEvents: () => request("/api/events"),
  createEvent: (event: any) => request("/api/events", { method: "POST", body: JSON.stringify(event) }),
  
  // Expenses
  getExpenses: () => request("/api/expenses"),
  createExpense: (expense: any) => request("/api/expenses", { method: "POST", body: JSON.stringify(expense) }),
  
  // Subscriptions
  getPlan: () => request("/api/subscriptions/my-plan"),
  getConfig: () => request("/api/subscriptions/config"),
  
  // Health
  health: () => request("/health"),
};