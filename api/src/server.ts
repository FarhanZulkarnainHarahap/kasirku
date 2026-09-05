import { createServer } from "node:http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { allowedOrigins, env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
io.on("connection", (socket) => {
  logger.debug({ socketId: socket.id }, "socket connected");
});

server.listen(env.PORT, () =>
  logger.info({ port: env.PORT }, "MY-CASHIER API running"),
);

async function shutdown(signal: string) {
  logger.info({ signal }, "graceful shutdown");
  io.close();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("uncaughtException", (error) => {
  logger.fatal(error);
  void shutdown("uncaughtException");
});
process.on("unhandledRejection", (error) => {
  logger.fatal(error);
  void shutdown("unhandledRejection");
});
