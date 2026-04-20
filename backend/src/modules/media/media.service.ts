import { prisma } from "@/services/prisma.service";
import { storageService } from "@/services/storage.service";
import { randomUUID } from "crypto";
import path from "path";

export class MediaService {
  async uploadUserVideo(projectId: string, stream: NodeJS.ReadableStream, filename: string, mimeType: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new Error("Project not found");

    const ext = path.extname(filename);
    const key = `projects/${projectId}/user-video-${randomUUID()}${ext}`;

    const url = await storageService.upload(key, stream, mimeType);

    const media = await prisma.media.create({
      data: {
        projectId,
        type: "USER_VIDEO",
        url,
        filename,
        mimeType,
      },
    });

    return media;
  }

  async getMedia(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { project: true },
    });

    if (!media || media.project.userId !== userId) {
      throw new Error("Media not found");
    }

    return media;
  }
}
