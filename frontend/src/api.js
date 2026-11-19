// jedyne miejsce, ktore rozmawia z backendem
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details || [];
  }
}

async function request(method, path, body) {
  const headers = {};
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Brak połączenia z serwerem", []);
  }

  // 204 nie ma tresci
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    // wygasly token: czyscimy go i wracamy do logowania (poza samym logowaniem)
    if (res.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const error = data && data.error ? data.error : {};
    throw new ApiError(res.status, error.code, error.message || "Błąd serwera", error.details);
  }

  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path)
};
