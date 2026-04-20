import { Worker } from "bullmq";
import { redisConnection } from "@/services/queue.service";
import { prisma } from "@/services/prisma.service";
import { ffmpegService } from "@/services/ffmpeg.service";
import { storageService } from "@/services/storage.service";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { logger } from "@/config/logger";

export const createCompositionWorker = () => {
  return new Worker(
    "composition-queue",
    async (job) => {
      const { projectId, options } = job.data;
      
      const dbJob = await prisma.job.findFirst({
        where: { projectId, type: "COMPOSE", status: "PENDING" },
        orderBy: { createdAt: "desc" }
      });

      if (dbJob) {
        await prisma.job.update({ where: { id: dbJob.id }, data: { status: "PROCESSING" } });
      }

      try {
        const project = await prisma.project.findUnique({ 
          where: { id: projectId },
          include: { media: true }
        });
        
        if (!project) throw new Error("Project not found");

        const demoMedia = project.media.find(m => m.type === "DEMO");
        const userMedia = project.media.find(m => m.type === "USER_VIDEO");

        if (!demoMedia || !userMedia) {
          throw new Error("Missing required media for composition");
        }

        const tempDir = path.join(process.cwd(), "storage", "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // Currently, our storage is local so we can just grab the exact path. 
        // If S3, we'd need to download files to tempDir first.
        // Extract filename from URL (hack for LocalStorageProvider)
        const demoFilename = demoMedia.url.split("/").pop()!;
        const userFilename = userMedia.url.split("/").pop()!;

        const demoPath = path.join(process.cwd(), "storage", "projects", projectId, demoFilename);
        const userPath = path.join(process.cwd(), "storage", "projects", projectId, userFilename);

        const outputPath = path.join(tempDir, `final-${randomUUID()}.mp4`);

        logger.info(`Composing video. Demo: ${demoPath}, User: ${userPath}, Output: ${outputPath}`);

        if (options.layout === "pip") {
          await ffmpegService.overlayPiP(demoPath, userPath, outputPath);
        } else {
          await ffmpegService.sideBySide(demoPath, userPath, outputPath);
        }

        // Upload final
        const videoBuffer = fs.readFileSync(outputPath);
        const storageKey = `projects/${projectId}/final-${randomUUID()}.mp4`;
        const url = await storageService.upload(storageKey, videoBuffer, "video/mp4");

        fs.unlinkSync(outputPath);

        await prisma.media.create({
          data: {
            projectId,
            type: "FINAL",
            url,
            filename: path.basename(storageKey),
            mimeType: "video/mp4"
          }
        });

        if (dbJob) await prisma.job.update({ where: { id: dbJob.id }, data: { status: "COMPLETED" } });
        await prisma.project.update({ where: { id: projectId }, data: { status: "COMPLETED" } });

      } catch (error: any) {
        logger.error("Composition worker error", error);
        if (dbJob) await prisma.job.update({ where: { id: dbJob.id }, data: { status: "FAILED", error: error.message } });
        await prisma.project.update({ where: { id: projectId }, data: { status: "FAILED" } });
        throw error;
      }
    },
    { connection: redisConnection }
  );
};
