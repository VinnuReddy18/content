import { prisma } from "@/services/prisma.service";
import { CreateProjectInput } from "./project.schema";
import { NotFoundError } from "@/utils/errors";

export class ProjectService {
  async create(userId: string, data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        userId,
        inputText: data.inputText,
      },
    });
  }

  async getById(id: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        media: true,
        jobs: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!project) throw new NotFoundError("Project not found");
    return project;
  }

  async listByUser(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: any) {
    return prisma.project.update({
      where: { id },
      data: { status },
    });
  }
}
