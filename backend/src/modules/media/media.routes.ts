import { FastifyInstance } from "fastify";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { requireAuth } from "@/middleware/auth.middleware";

export default async function mediaRoutes(app: FastifyInstance) {
  const mediaService = new MediaService();
  const mediaController = new MediaController(mediaService);

  app.addHook("preHandler", requireAuth);

  app.post("/upload/user-video", mediaController.uploadUserVideo.bind(mediaController));
  app.get("/:id", mediaController.getMedia.bind(mediaController));
}
