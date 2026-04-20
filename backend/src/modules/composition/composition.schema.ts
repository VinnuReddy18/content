import { z } from "zod";

export const composeVideoSchema = z.object({
  projectId: z.string().uuid(),
  layout: z.enum(["pip", "side-by-side"]).default("pip"),
});

export type ComposeVideoInput = z.infer<typeof composeVideoSchema>;
