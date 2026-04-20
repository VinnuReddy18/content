import { Queue } from "bullmq";
import { env } from "@/config/env";
import * as Redis from "ioredis";

export const redisConnection = new Redis.Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const renderQueue = new Queue("render-queue", { connection: redisConnection });
export const compositionQueue = new Queue("composition-queue", { connection: redisConnection });

export class QueueService {
  static async addRenderJob(projectId: string) {
    await renderQueue.add("render", { projectId });
  }

  static async addCompositionJob(projectId: string, options: any) {
    await compositionQueue.add("compose", { projectId, options });
  }
}
