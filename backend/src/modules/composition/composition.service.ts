import { prisma } from "@/services/prisma.service";
import { QueueService } from "@/services/queue.service";
import { NotFoundError, ValidationError } from "@/utils/errors";
import { ComposeVideoInput } from "./composition.schema";

export class CompositionService {
  async composeVideo(userId: string, data: ComposeVideoInput) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, userId },
      include: { media: true }
    });

    if (!project) throw new NotFoundError("Project not found");
    
    // Validate we have the required media
    const demoMedia = project.media.find(m => m.type === "DEMO");
    const userMedia = project.media.find(m => m.type === "USER_VIDEO");

    if (!demoMedia) throw new ValidationError("Missing demo video. Fast-track render phase first.");
    if (!userMedia) throw new ValidationError("Missing user video. Please upload user video first.");

    await prisma.project.update({
      where: { id: project.id },
      data: { status: "COMPOSING" },
    });

    const job = await prisma.job.create({
      data: {
        projectId: project.id,
        type: "COMPOSE",
        status: "PENDING",
      },
    });

    await QueueService.addCompositionJob(project.id, { layout: data.layout });

    return job;
  }
}
