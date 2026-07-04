import { z } from "zod";
import { SAVED_ITEM_TYPES } from "@/lib/types";

export const savedItemInputSchema = z.object({
  itemType: z.enum(SAVED_ITEM_TYPES),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be at most 200 characters."),
  region: z.string().max(100, "Region must be at most 100 characters.").optional(),
  summary: z.string().max(2000, "Summary must be at most 2000 characters.").optional(),
  payload: z
    .record(z.unknown())
    .optional()
    // Storage-abuse guard: payloads hold one AI result object; 20 KB is ample.
    .refine((v) => v === undefined || JSON.stringify(v).length <= 20_000, {
      message: "Payload too large (max 20 KB).",
    }),
});
export type SavedItemInputParsed = z.infer<typeof savedItemInputSchema>;
