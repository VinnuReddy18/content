import { prisma } from "@/services/prisma.service";
import { QueueService } from "@/services/queue.service";
import { NotFoundError } from "@/utils/errors";

export class RenderService {
  async startRender(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundError("Project not found");
    if (!project.uiCode) throw new Error("UI Code must be generated first");

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "RENDERING" },
    });

    const job = await prisma.job.create({
      data: { projectId, type: "RENDER", status: "PENDING" },
    });

    await QueueService.addRenderJob(projectId);

    return job;
  }

  async getRenderStatus(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundError("Project not found");

    const job = await prisma.job.findFirst({
      where: { projectId, type: "RENDER" },
      orderBy: { createdAt: "desc" },
    });

    return job;
  }
}
