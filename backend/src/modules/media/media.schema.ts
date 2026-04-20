import { z } from "zod";

export const uploadMediaSchema = z.object({
  projectId: z.string().uuid(),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
