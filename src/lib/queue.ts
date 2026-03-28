import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Очередь для email-уведомлений
export const emailQueue = new Queue("email", { connection });

// Очередь для push-уведомлений
export const notificationQueue = new Queue("notifications", { connection });

// Очередь для проверки входящей почты
export const mailCheckQueue = new Queue("mail-check", { connection });

export { connection };
