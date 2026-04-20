import { FastifyInstance } from "fastify";
import { CompositionController } from "./composition.controller";
import { CompositionService } from "./composition.service";
import { requireAuth } from "@/middleware/auth.middleware";

export default async function compositionRoutes(app: FastifyInstance) {
  const compositionService = new CompositionService();
  const compositionController = new CompositionController(compositionService);

  app.addHook("preHandler", requireAuth);

  app.post("/video", compositionController.compose.bind(compositionController));
}
