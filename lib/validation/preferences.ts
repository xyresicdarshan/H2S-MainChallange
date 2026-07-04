import { z } from "zod";
import { INDIAN_REGIONS, INTEREST_OPTIONS, TRAVEL_STYLES } from "@/lib/types";

export const preferencesSchema = z.object({
  interests: z
    .array(z.enum(INTEREST_OPTIONS))
    .max(8, "Choose at most 8 interests."),
  homeRegion: z.enum(INDIAN_REGIONS).nullable().optional(),
  travelStyle: z.enum(TRAVEL_STYLES).nullable().optional(),
});
export type PreferencesInput = z.infer<typeof preferencesSchema>;
