const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "API_ERROR",
    public errors: unknown[] = [],
  ) {
    super(message);
  }
}
type Envelope<T> = {
  success: true;
  message: string;
  data: T;
  meta: Record<string, unknown>;
};
let csrfToken: string | null = null;

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${API_URL}/auth/csrf`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok)
    throw new ApiError(response.status, "Tidak dapat memulai sesi aman");
  const body = (await response.json()) as Envelope<{ csrfToken: string }>;
  csrfToken = body.data.csrfToken;
  return csrfToken;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<Envelope<T>> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("content-type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && path !== "/auth/login")
    headers.set("x-csrf-token", await ensureCsrf());
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "API tidak dapat dijangkau. Pastikan Express berjalan di port 4000.",
      "NETWORK_ERROR",
    );
  }
  const body = (await response.json().catch(() => ({
    message: "Respons server tidak valid",
    code: "INVALID_RESPONSE",
    errors: [],
  }))) as Envelope<T> & { code?: string; errors?: unknown[] };
  if (!response.ok) {
    if (response.status === 403 && body.code === "CSRF_INVALID")
      csrfToken = null;
    throw new ApiError(
      response.status,
      body.message || "Permintaan gagal",
      body.code,
      body.errors,
    );
  }
  return body;
}

export const apiUrl = API_URL;
