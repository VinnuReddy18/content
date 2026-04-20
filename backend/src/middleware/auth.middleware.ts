import { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "@/utils/errors";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new UnauthorizedError("Missing or invalid token");
  }
}
