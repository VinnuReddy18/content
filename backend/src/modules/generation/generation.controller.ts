import { FastifyReply, FastifyRequest } from "fastify";
import { GenerationService } from "./generation.service";
import { generateRequestSchema } from "./generation.schema";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export class GenerationController {
  constructor(private generationService: GenerationService) {}

  async generateScript(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const parsed = generateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.format());
    }

    const script = await this.generationService.generateScript(user.id, parsed.data);
    reply.send(success(script, "Script generated and saved"));
  }

  async generateUI(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const parsed = generateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.format());
    }

    await this.generationService.generateUI(user.id, parsed.data);
    reply.send(success(null, "UI code generated and saved"));
  }
}
