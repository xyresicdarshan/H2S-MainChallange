/**
 * User-facing messages - all error, success, and info messages
 */

// Validation constants
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_DIGIT: true,
} as const;

export const NAME_RULES = {
  MIN_LENGTH: 2,
} as const;

export const INTEREST_LIMITS = {
  MIN: 1,
  MAX: 5,
} as const;

export const MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Network error — the request did not reach the server.",
  NETWORK_ERROR_PREF: "Network error — preferences were not saved.",

  // Validation errors
  INTERESTS_MIN: "Choose at least one interest.",
  INTERESTS_MAX: "Choose at most five interests.",
  EMAIL_REQUIRED: "Email is required.",
  EMAIL_INVALID: "Please enter a valid email address.",
  PASSWORD_REQUIRED: "Password is required.",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters.",
  PASSWORD_NEEDS_DIGIT: "Password must contain at least one digit.",
  NAME_REQUIRED: "Name is required.",
  NAME_MIN: "Name must be at least 2 characters.",

  // Auth messages
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_TAKEN: "This email is already registered.",
  LOGIN_RATE_LIMITED: (seconds: number) =>
    `Too many login attempts. Try again in ${seconds} seconds.`,
  REGISTER_RATE_LIMITED: (seconds: number) =>
    `Too many registration attempts. Try again in ${seconds} seconds.`,
  SIGNUP_SUCCESS: "Account created successfully! You're now signed in.",
  LOGIN_SUCCESS: "Signed in successfully.",
  LOGOUT_SUCCESS: "Signed out successfully.",

  // AI/Generation messages
  AI_GENERATION_FAILED: (status: number) =>
    `Generation failed (HTTP ${status}).`,
  AI_RATE_LIMITED: (seconds: number) =>
    `Too many AI requests. Please try again in ${seconds} seconds.`,
  AI_SERVICE_UNAVAILABLE:
    "The AI service is temporarily unavailable. Please try again.",
  AI_INVALID_RESPONSE:
    "The AI returned an unexpected response. Please try again.",

  // Preferences
  PREFERENCES_SAVED: "Interests saved to your profile.",
  PREFERENCES_SAVE_FAILED: (status: number) =>
    `Could not save preferences (HTTP ${status}).`,

  // Generic
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  INVALID_REQUEST: "Invalid request. Please check your input.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "You must be signed in to do this.",

  // Hints
  INTERESTS_HINT: "Choose one to five.",
  REGION_OPTIONAL: "(optional)",
  TRAVEL_STYLE_OPTIONAL: "(optional)",
} as const;
