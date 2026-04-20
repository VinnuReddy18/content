import { z } from "zod";

export const creativeOptionsSchema = z.object({
  platform: z.enum(["instagram_reels", "tiktok", "youtube_shorts"]).default("youtube_shorts"),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
  tone: z.enum(["premium", "bold", "playful", "crazy"]).default("crazy"),
  durationSec: z.number().int().min(15).max(90).default(45),
  audience: z.string().min(3).max(120).default("founders and product teams"),
});

export const defaultCreativeOptions = {
  platform: "youtube_shorts",
  aspectRatio: "16:9",
  tone: "crazy",
  durationSec: 45,
  audience: "founders and product teams",
} as const;

export const generateRequestSchema = z.object({
  projectId: z.string().uuid(),
  creative: creativeOptionsSchema.default(defaultCreativeOptions),
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;
export type CreativeOptionsInput = z.infer<typeof creativeOptionsSchema>;
