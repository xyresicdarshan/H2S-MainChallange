/**
 * Centralized logging system with proper error handling and consistent formatting.
 * Replaces ad-hoc console.error calls with a structured, traceable logging interface.
 */

type LogLevel = "error" | "warn" | "info";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  error?: unknown;
  timestamp: string;
}

/**
 * Log an error with context, avoiding bare console.error calls.
 * Best-effort: logging failures never break application logic.
 */
export function logError(context: string, message: string, error?: unknown): void {
  const entry: LogEntry = {
    level: "error",
    context,
    message,
    error,
    timestamp: new Date().toISOString(),
  };

  try {
    // In production, this could send to an external service.
    // For now, we use console with structured format.
    console.error(`[${entry.context}] ${entry.message}`, error ?? "");
  } catch {
    // If even logging fails, silently fail — never throw in logging code
  }
}

/**
 * Log a warning with context.
 */
export function logWarn(context: string, message: string): void {
  try {
    console.warn(`[${context}] ${message}`);
  } catch {
    // Silent fail
  }
}

/**
 * Log info-level message (rarely needed in production, useful for debugging).
 */
export function logInfo(context: string, message: string): void {
  try {
    console.info(`[${context}] ${message}`);
  } catch {
    // Silent fail
  }
}
