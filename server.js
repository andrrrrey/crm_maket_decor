const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { execFileSync } = require("child_process");

// Синхронизировать схему БД перед стартом
try {
  console.log("> Applying database schema (prisma db push)...");
  execFileSync(
    "node",
    ["node_modules/.bin/prisma", "db", "push", "--skip-generate"],
    { stdio: "inherit", env: process.env }
  );
  console.log("> Database schema is up to date");
} catch (err) {
  console.error("> prisma db push failed:", err.message);
}

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Инициализировать Socket.io
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: process.env.NEXTAUTH_URL || "*",
      credentials: true,
    },
  });

  // Redis adapter для масштабирования
  try {
    const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.io Redis adapter connected");
  } catch (err) {
    console.warn("Redis adapter failed, using in-memory:", err.message);
  }

  // Socket.io обработчики
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    // Подписка на личную комнату пользователя
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Подписка на общий чат
    socket.on("general:join", () => {
      socket.join("general");
    });

    // Присоединиться к чату проекта
    socket.on("project:join", (projectId) => {
      socket.join(`project:${projectId}`);
    });

    // Покинуть чат проекта
    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Сообщение в общий чат
    socket.on("general:message", async (data) => {
      // Сохранить в БД через API и транслировать
      io.to("general").emit("general:message", {
        ...data,
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Отметить уведомление как прочитанное
    socket.on("notification:read", (notificationId) => {
      // Логика обработки
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Сделать io доступным для API routes
  global.io = io;

  const PORT = parseInt(process.env.PORT || "3000");
  server.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
    console.log(`> Socket.io ready on /socket.io`);
  });
});
