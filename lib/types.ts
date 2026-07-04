/**
 * Shared domain types and constants — the single contract used by API routes,
 * UI components, and tests. Keep request/response shapes here so client and
 * server never drift apart.
 */

// ── Curated option lists (form choices only — all content is AI-generated) ──

export const INTEREST_OPTIONS = [
  "Heritage & Monuments",
  "Festivals & Fairs",
  "Food & Cuisine",
  "Art & Handicrafts",
  "Music & Dance",
  "Spirituality & Temples",
  "Nature & Rural Life",
  "Textiles & Weaves",
] as const;
export type Interest = (typeof INTEREST_OPTIONS)[number];

export const TRAVEL_STYLES = [
  "Immersive slow travel",
  "Family friendly",
  "Budget backpacking",
  "Comfort & curated",
  "Offbeat explorer",
] as const;
export type TravelStyle = (typeof TRAVEL_STYLES)[number];

export const INDIAN_REGIONS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;
export type IndianRegion = (typeof INDIAN_REGIONS)[number];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
export type Month = (typeof MONTHS)[number];

export const STORY_THEMES = [
  "History & origins",
  "Legends & folklore",
  "Art & architecture",
  "Food traditions",
  "Living culture today",
] as const;
export type StoryTheme = (typeof STORY_THEMES)[number];

// ── AI feature: personalized recommendations ────────────────────────────────

export interface RecommendationsRequest {
  interests: string[]; // 1..5 of INTEREST_OPTIONS
  region?: string; // optional INDIAN_REGIONS entry; omit for pan-India
  travelStyle?: string; // optional TRAVEL_STYLES entry
}

export interface Recommendation {
  name: string;
  location: string; // city / district
  state: string;
  category: string; // e.g. "Living heritage village", "Temple complex"
  description: string; // 2-3 sentences
  whyRecommended: string; // ties back to the user's stated interests
  bestTimeToVisit: string;
  culturalSignificance: string;
}

// ── AI feature: hidden gems ─────────────────────────────────────────────────

export interface HiddenGemsRequest {
  state: string; // INDIAN_REGIONS entry
  interests?: string[]; // optional focus
}

export interface HiddenGem {
  name: string;
  location: string;
  state: string;
  description: string;
  culturalContext: string;
  howToReach: string;
  localTip: string; // an authentic, practical local insight
}

// ── AI feature: cultural events & festivals ─────────────────────────────────

export interface EventsRequest {
  month: string; // MONTHS entry
  region?: string; // optional INDIAN_REGIONS entry
}

export interface CulturalEvent {
  name: string;
  location: string;
  state: string;
  timeframe: string; // e.g. "Second week of January (Makar Sankranti)"
  description: string;
  culturalSignificance: string;
  travelerTips: string;
}

// ── AI feature: storytelling (streamed) ─────────────────────────────────────

export interface StoryRequest {
  siteName: string; // free text, 2..120 chars
  state?: string; // optional INDIAN_REGIONS entry
  theme?: string; // optional STORY_THEMES entry
}

// ── Response envelopes ──────────────────────────────────────────────────────

export interface AiMeta {
  model: string;
  latencyMs: number;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  meta: AiMeta;
}

export interface HiddenGemsResponse {
  gems: HiddenGem[];
  meta: AiMeta;
}

export interface EventsResponse {
  events: CulturalEvent[];
  meta: AiMeta;
}

export interface ApiErrorBody {
  error: string; // human-readable, honest (no fabricated fallback content)
  code?: string;
}

// ── Saved items (database-backed) ───────────────────────────────────────────

export const SAVED_ITEM_TYPES = ["attraction", "hidden-gem", "event", "story"] as const;
export type SavedItemType = (typeof SAVED_ITEM_TYPES)[number];

export interface SavedItemInput {
  itemType: SavedItemType;
  title: string;
  region?: string;
  summary?: string;
  payload?: Record<string, unknown>; // full AI object for re-display
}

export interface SavedItemRecord extends SavedItemInput {
  id: string;
  createdAt: string; // ISO timestamp
}

// ── User preferences (database-backed) ──────────────────────────────────────

export interface PreferencesPayload {
  interests: string[];
  homeRegion?: string | null;
  travelStyle?: string | null;
}
