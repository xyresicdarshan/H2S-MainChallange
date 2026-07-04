/**
 * Centralized API utilities for consistent headers, request building, and response handling
 */

export const API_HEADERS = {
  JSON: {
    "Content-Type": "application/json",
  },
} as const;

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

/**
 * Build a JSON request with standard headers
 */
export function buildJsonRequest(
  url: string,
  body: unknown,
  method: "POST" | "PUT" = "POST",
): Request {
  return new Request(url, {
    method,
    headers: API_HEADERS.JSON,
    body: JSON.stringify(body),
  });
}

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Determine if response is success (2xx status)
 */
export function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Determine if response is client error (4xx status)
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Determine if response is server error (5xx status)
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}
