import { createRenderWorker } from "./render.worker";
import { createCompositionWorker } from "./composition.worker";
import { logger } from "@/config/logger";

function main() {
  logger.info("Starting workers...");

  createRenderWorker();
  logger.info("Render worker started");

  createCompositionWorker();
  logger.info("Composition worker started");

  const signals = ["SIGTERM", "SIGINT"];
  signals.forEach((signal) => {
    process.on(signal, () => {
      logger.info(`Received ${signal}, shutting down workers...`);
      // BullMQ workers handle shutdown gracefully normally when you call worker.close()
      // For simplicity in this demo, just exit
      process.exit(0);
    });
  });
}

main();
