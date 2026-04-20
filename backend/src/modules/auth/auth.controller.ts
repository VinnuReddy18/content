import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.schema";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.format());
    }

    const result = await this.authService.register(parsed.data);
    reply.code(201).send(success(result, "User registered successfully"));
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input", parsed.error.format());
    }

    const result = await this.authService.login(parsed.data);
    reply.send(success(result, "Login successful"));
  }
}
