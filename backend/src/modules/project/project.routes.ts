import { FastifyInstance } from "fastify";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { requireAuth } from "@/middleware/auth.middleware";

export default async function projectRoutes(app: FastifyInstance) {
  const projectService = new ProjectService();
  const projectController = new ProjectController(projectService);

  app.addHook("preHandler", requireAuth);

  app.post("/", projectController.create.bind(projectController));
  app.get("/:id", projectController.getById.bind(projectController));
  app.get("/", projectController.list.bind(projectController));
}
