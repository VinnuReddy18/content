import { z } from "zod";

export const generateRequestSchema = z.object({
  projectId: z.string().uuid(),
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;
