import { FastifyInstance } from "fastify";
import { GenerationController } from "./generation.controller";
import { GenerationService } from "./generation.service";
import { OpenAIService } from "@/services/openai.service";
import { requireAuth } from "@/middleware/auth.middleware";

export default async function generationRoutes(app: FastifyInstance) {
  const openaiService = new OpenAIService();
  const generationService = new GenerationService(openaiService);
  const generationController = new GenerationController(generationService);

  app.addHook("preHandler", requireAuth);

  app.post("/script", generationController.generateScript.bind(generationController));
  app.post("/ui", generationController.generateUI.bind(generationController));
}
