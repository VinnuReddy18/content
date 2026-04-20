import { prisma } from "@/services/prisma.service";
import { OpenAIService } from "@/services/openai.service";
import { NotFoundError } from "@/utils/errors";
import { GenerateRequestInput } from "./generation.schema";

export class GenerationService {
  constructor(private openaiService: OpenAIService) {}

  async generateScript(userId: string, data: GenerateRequestInput) {
    const project = await prisma.project.findFirst({ where: { id: data.projectId, userId } });
    if (!project) throw new NotFoundError("Project not found");

    await prisma.project.update({
      where: { id: project.id },
      data: { status: "GENERATING" },
    });

    const job = await prisma.job.create({
      data: { projectId: project.id, type: "SCRIPT_GENERATION", status: "PROCESSING" },
    });

    try {
      const script = await this.openaiService.generateScript(project.inputText, data.creative);
      await prisma.project.update({
        where: { id: project.id },
        data: { script },
      });
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "COMPLETED", result: script },
      });
      return script;
    } catch (error: any) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "FAILED", error: error.message },
      });
      await prisma.project.update({
        where: { id: project.id },
        data: { status: "FAILED" },
      });
      throw error;
    }
  }

  async generateUI(userId: string, data: GenerateRequestInput) {
    const project = await prisma.project.findFirst({ where: { id: data.projectId, userId } });
    if (!project) throw new NotFoundError("Project not found");
    if (!project.script) throw new Error("Script must be generated first");

    const job = await prisma.job.create({
      data: { projectId: project.id, type: "UI_GENERATION", status: "PROCESSING" },
    });

    try {
      const uiCode = await this.openaiService.generateUICode(project.script);
      await prisma.project.update({
        where: { id: project.id },
        data: { uiCode },
      });
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "COMPLETED" },
      });
      return { success: true };
    } catch (error: any) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "FAILED", error: error.message },
      });
      throw error;
    }
  }
}
