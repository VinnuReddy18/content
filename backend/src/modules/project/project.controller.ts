import { FastifyReply, FastifyRequest } from "fastify";
import { ProjectService } from "./project.service";
import { createProjectSchema } from "./project.schema";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const parsed = createProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.format());
    }

    const project = await this.projectService.create(user.id, parsed.data);
    reply.code(201).send(success(project, "Project created successfully"));
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = request.user as { id: string };
    const project = await this.projectService.getById(request.params.id, user.id);
    reply.send(success(project));
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { id: string };
    const projects = await this.projectService.listByUser(user.id);
    reply.send(success(projects));
  }
}
