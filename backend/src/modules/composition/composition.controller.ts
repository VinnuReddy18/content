import { FastifyReply, FastifyRequest } from "fastify";
import { CompositionService } from "./composition.service";
import { composeVideoSchema } from "./composition.schema";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export class CompositionController {
  constructor(private compositionService: CompositionService) {}

  async compose(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const parsed = composeVideoSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.format());
    }

    const job = await this.compositionService.composeVideo(user.id, parsed.data);
    reply.send(success(job, "Composition job enqueued"));
  }
}
