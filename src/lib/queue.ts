import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Очередь для email-уведомлений
export const emailQueue = new Queue("email", { connection });

// Очередь для push-уведомлений (имя должно совпадать с worker.js)
export const notificationQueue = new Queue("notification", { connection });

// Очередь для проверки входящей почты (имя должно совпадать с worker.js)
export const mailCheckQueue = new Queue("mailCheck", { connection });

export { connection };
