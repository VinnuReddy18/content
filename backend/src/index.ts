import { buildApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./services/prisma.service";
import { logger } from "./config/logger";

async function main() {
  await prisma.$connect();
  logger.info("Database connected");

  const app = await buildApp();

  app.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
    logger.info(`Server listening on ${address}`);
  });

  // Graceful shutdown
  const signals = ["SIGTERM", "SIGINT"];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down...`);
      await app.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
