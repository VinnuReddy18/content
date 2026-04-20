import bcrypt from "bcrypt";
import { prisma } from "@/services/prisma.service";
import { RegisterInput, LoginInput } from "./auth.schema";
import { ConflictError, UnauthorizedError } from "@/utils/errors";
import { FastifyInstance } from "fastify";

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
      },
    });

    const token = this.app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: "7d" });

    return {
      user: { id: user.id, email: user.email },
      token,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this.app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: "7d" });

    return {
      user: { id: user.id, email: user.email },
      token,
    };
  }
}
