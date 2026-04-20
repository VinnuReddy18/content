import { z } from "zod";

export const createProjectSchema = z.object({
  inputText: z.string().min(5, "Input text is too short"),
});

export const projectResponseSchema = z.object({
  id: z.string(),
  inputText: z.string(),
  status: z.string(),
  createdAt: z.date(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
