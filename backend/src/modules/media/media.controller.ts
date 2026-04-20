import { FastifyReply, FastifyRequest } from "fastify";
import { MediaService } from "./media.service";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export class MediaController {
  constructor(private mediaService: MediaService) {}

  async uploadUserVideo(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const data = await request.file();

    if (!data) {
      throw new ValidationError("No file uploaded");
    }

    const projectId = (data.fields.projectId as any)?.value;
    if (!projectId) {
      throw new ValidationError("projectId is required");
    }

    const media = await this.mediaService.uploadUserVideo(
      projectId,
      data.file,
      data.filename,
      data.mimetype,
      user.id
    );

    reply.send(success(media, "Video uploaded successfully"));
  }

  async getMedia(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as { id: string };
    const media = await this.mediaService.getMedia(request.params.id, user.id);
    reply.send(success(media));
  }
}
