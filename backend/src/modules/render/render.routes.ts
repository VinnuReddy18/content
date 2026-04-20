import { FastifyInstance } from "fastify";
import { RenderController } from "./render.controller";
import { RenderService } from "./render.service";
import { requireAuth } from "@/middleware/auth.middleware";

export default async function renderRoutes(app: FastifyInstance) {
  const renderService = new RenderService();
  const renderController = new RenderController(renderService);

  app.addHook("preHandler", requireAuth);

  app.post("/start", renderController.start.bind(renderController));
  app.get("/status/:projectId", renderController.getStatus.bind(renderController));
}
