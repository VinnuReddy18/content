import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { logger } from "@/config/logger";
import { env } from "@/config/env";
import path from "path";
import fastifyStatic from "@fastify/static";
import { AppError } from "@/utils/errors";

import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/project/project.routes";
import generationRoutes from "./modules/generation/generation.routes";
import renderRoutes from "./modules/render/render.routes";
import compositionRoutes from "./modules/composition/composition.routes";
import mediaRoutes from "./modules/media/media.routes";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger,
  });

  // Plugins
  await app.register(cors);
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(multipart, {
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  });
  await app.register(websocket);

  // Serve storage directory for LocalStorageProvider
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "storage"),
    prefix: "/storage/",
  });

  // Routes
  app.register(authRoutes, { prefix: "/auth" });
  app.register(projectRoutes, { prefix: "/projects" });
  app.register(generationRoutes, { prefix: "/generate" });
  app.register(renderRoutes, { prefix: "/render" });
  app.register(compositionRoutes, { prefix: "/compose" });
  app.register(mediaRoutes, { prefix: "/media" });

  // Error Handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        success: false,
        message: error.message,
        details: (error as any).details || null,
      });
      return;
    }

    request.log.error(error);
    reply.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  });

  return app;
}
