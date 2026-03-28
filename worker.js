const { Worker } = require("bullmq");
const { createTransport } = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Email transporter for outbound notifications
const transporter = createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email queue worker — sends outbound emails
const emailWorker = new Worker(
  "email",
  async (job) => {
    const { to, subject, html, text } = job.data;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
    console.log(`[email] Sent to ${to}: ${subject}`);
  },
  { connection }
);

// Notification queue worker — stores and emits notifications
const notificationWorker = new Worker(
  "notification",
  async (job) => {
    const { userId, title, body, entityType, entityId } = job.data;

    // Use HTTP call to internal API to create notification
    // (avoids circular dependency with Prisma in worker process)
    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-worker-secret": process.env.WORKER_SECRET || "worker-internal",
          },
          body: JSON.stringify({ userId, title, body, entityType, entityId }),
        }
      );
      if (!response.ok) {
        throw new Error(`Notification API error: ${response.status}`);
      }
      console.log(`[notification] Created for user ${userId}: ${title}`);
    } catch (err) {
      console.error("[notification] Failed:", err.message);
      throw err;
    }
  },
  { connection }
);

// Mail check worker — polls IMAP for new website form submissions
const mailCheckWorker = new Worker(
  "mailCheck",
  async (job) => {
    if (!process.env.IMAP_HOST || !process.env.IMAP_USER || !process.env.IMAP_PASS) {
      console.log("[mailCheck] IMAP not configured, skipping");
      return;
    }

    await new Promise((resolve, reject) => {
      const imap = new Imap({
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT || "993"),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once("error", (err) => {
        console.error("[mailCheck] IMAP error:", err.message);
        resolve(null);
      });

      imap.once("end", () => resolve(null));

      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err, box) => {
          if (err) {
            imap.end();
            return;
          }

          imap.search(["UNSEEN"], async (err, results) => {
            if (err || !results || results.length === 0) {
              imap.end();
              return;
            }

            const fetch = imap.fetch(results, { bodies: "" });
            const messages = [];

            fetch.on("message", (msg) => {
              let buffer = "";
              msg.on("body", (stream) => {
                stream.on("data", (chunk) => (buffer += chunk.toString("utf8")));
                stream.once("end", () => messages.push(buffer));
              });
            });

            fetch.once("end", async () => {
              for (const raw of messages) {
                try {
                  const parsed = await simpleParser(raw);
                  await fetch(
                    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/mail`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-worker-secret": process.env.WORKER_SECRET || "worker-internal",
                      },
                      body: JSON.stringify({
                        subject: parsed.subject || "(без темы)",
                        fromEmail: parsed.from?.text || "",
                        fromName: parsed.from?.value?.[0]?.name || "",
                        body: parsed.text || parsed.html || "",
                      }),
                    }
                  );
                } catch (e) {
                  console.error("[mailCheck] Parse/save error:", e.message);
                }
              }

              // Mark all as seen
              if (results.length > 0) {
                imap.setFlags(results, ["\\Seen"], () => imap.end());
              } else {
                imap.end();
              }
            });
          });
        });
      });

      imap.connect();
    });

    console.log("[mailCheck] Check completed");
  },
  { connection }
);

emailWorker.on("completed", (job) => {
  console.log(`[email] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[email] Job ${job?.id} failed:`, err.message);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[notification] Job ${job?.id} failed:`, err.message);
});

mailCheckWorker.on("failed", (job, err) => {
  console.error(`[mailCheck] Job ${job?.id} failed:`, err.message);
});

console.log("Worker started. Listening for jobs...");

process.on("SIGTERM", async () => {
  console.log("Worker shutting down...");
  await emailWorker.close();
  await notificationWorker.close();
  await mailCheckWorker.close();
  process.exit(0);
});
