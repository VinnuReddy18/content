import { Worker } from "bullmq";
import { redisConnection } from "@/services/queue.service";
import { prisma } from "@/services/prisma.service";
import { playwrightService } from "@/services/playwright.service";
import { storageService } from "@/services/storage.service";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

export const createRenderWorker = () => {
  return new Worker(
    "render-queue",
    async (job) => {
      const { projectId } = job.data;
      
      const dbJob = await prisma.job.findFirst({
        where: { projectId, type: "RENDER", status: "PENDING" },
        orderBy: { createdAt: "desc" }
      });

      if (dbJob) {
        await prisma.job.update({ where: { id: dbJob.id }, data: { status: "PROCESSING" } });
      }

      try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || !project.uiCode) throw new Error("Project or UI Code not found");

        const interactions = (project.script as any)?.interactions || [];
        
        // Ensure storage directory exists
        const tempDir = path.join(process.cwd(), "storage", "temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const rawVideoPath = path.join(tempDir, `raw-render-${randomUUID()}.webm`);
        
        await playwrightService.renderAndRecord(projectId, project.uiCode, interactions, rawVideoPath);

        // Read recorded video and upload to storage via service
        const videoBuffer = fs.readFileSync(rawVideoPath);
        const storageKey = `projects/${projectId}/demo-${randomUUID()}.webm`;
        const url = await storageService.upload(storageKey, videoBuffer, "video/webm");

        // Clean up temp file
        fs.unlinkSync(rawVideoPath);

        await prisma.media.create({
          data: {
            projectId,
            type: "DEMO",
            url,
            filename: path.basename(storageKey),
            mimeType: "video/webm"
          }
        });

        if (dbJob) await prisma.job.update({ where: { id: dbJob.id }, data: { status: "COMPLETED" } });
        await prisma.project.update({ where: { id: projectId }, data: { status: "RECORDING" } }); // Using RECORDING as next phase loosely

      } catch (error: any) {
        if (dbJob) await prisma.job.update({ where: { id: dbJob.id }, data: { status: "FAILED", error: error.message } });
        await prisma.project.update({ where: { id: projectId }, data: { status: "FAILED" } });
        throw error;
      }
    },
    { connection: redisConnection }
  );
};
