/**
 * Constants for validation, limits, and configuration
 */

// Interest/preference validation
export const INTEREST_LIMITS = {
  MIN: 1,
  MAX: 5,
} as const;

// Password validation
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_DIGIT: true,
} as const;

// User name validation
export const NAME_RULES = {
  MIN_LENGTH: 2,
} as const;

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API rate limiting
export const RATE_LIMITS = {
  AI_REQUESTS: {
    LIMIT: 5,
    WINDOW_MS: 60_000,
  },
  LOGIN_ATTEMPTS: {
    LIMIT: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  REGISTRATION_ATTEMPTS: {
    LIMIT: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
} as const;

// Timeouts
export const TIMEOUTS = {
  AI_MAX_DURATION_SECONDS: 60,
} as const;

// Database batch sizes and limits
export const DB_LIMITS = {
  MAX_SAVED_ITEMS: 100,
  PAGE_SIZE: 20,
} as const;
