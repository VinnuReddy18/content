import { z } from "zod";

export const startRenderSchema = z.object({
  projectId: z.string().uuid(),
});

export type StartRenderInput = z.infer<typeof startRenderSchema>;
