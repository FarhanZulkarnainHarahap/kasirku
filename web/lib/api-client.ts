const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

export function getApiUrl() {
  if (!API_URL) {
    throw new ApiError(
      0,
      "Konfigurasi API belum diisi. Set NEXT_PUBLIC_API_URL ke URL API MY-CASHIER.",
      "API_URL_MISSING",
    );
  }
  try {
    return new URL(API_URL).toString().replace(/\/$/, "");
  } catch {
    throw new ApiError(
      0,
      "Konfigurasi API tidak valid. Periksa NEXT_PUBLIC_API_URL.",
      "API_URL_INVALID",
    );
  }
}

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
  const response = await fetch(`${getApiUrl()}/auth/csrf`, {
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
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  if (options.body && !(options.body instanceof FormData))
    headers.set("content-type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && path !== "/auth/login")
    headers.set("x-csrf-token", await ensureCsrf());
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
      cache: "no-store",
      signal: options.signal ?? controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError(
      0,
      aborted
        ? "Permintaan ke MY-CASHIER API melewati batas waktu."
        : "MY-CASHIER sedang mengalami gangguan koneksi. Periksa URL API dan koneksi jaringan.",
      aborted ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
    );
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
  const contentType = response.headers.get("content-type") ?? "";
  const body = (contentType.includes("application/json")
    ? await response.json().catch(() => ({
        message: "Respons server tidak valid",
        code: "INVALID_RESPONSE",
        errors: [],
      }))
    : {
        message:
          (await response.text().catch(() => "")) ||
          "Respons server tidak valid",
        code: "INVALID_RESPONSE",
        errors: [],
      }) as Envelope<T> & { code?: string; errors?: unknown[] };
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
