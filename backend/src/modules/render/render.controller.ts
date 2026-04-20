import { FastifyReply, FastifyRequest } from "fastify";
import { RenderService } from "./render.service";
import { startRenderSchema } from "./render.schema";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export class RenderController {
  constructor(private renderService: RenderService) {}

  async start(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const parsed = startRenderSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.format());
    }

    const job = await this.renderService.startRender(parsed.data.projectId, user.id);
    reply.send(success(job, "Render job enqueued"));
  }

  async getStatus(request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) {
    const user = request.user as { id: string };
    const status = await this.renderService.getRenderStatus(request.params.projectId, user.id);
    reply.send(success(status));
  }
}
