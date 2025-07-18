import Elysia from "elysia";
import { buildEvent } from "./event";
import { Queue, Worker } from "bullmq";
import { queueConnection } from "./instances";
import type { RedisOpts } from "./types";
import { queue } from "./utils";
import type { Job } from "bullmq";

/** Creates or retrieves the default queue instance. */
export const useDefaultQueue = () => {
  return new Queue("queue", { connection: queueConnection.get() });
};

/**
 * Elysia plugin that starts a BullMQ worker and exposes a `queue` utility.
 */
export const queuePlugin = ({ host, port, user, pass }: RedisOpts = {}) =>
  new Elysia({ name: `queue` }).decorate("queue", queue).onStart(() => {
    if (!queueConnection.isReady()) {
      queueConnection.set({ host, port, user, pass });
    }

    const worker = new Worker(
      "queue",
      async (job: Job) => {
        const event = buildEvent(job.name, job.data);
        return await event.safeHandle();
      },
      { connection: queueConnection.get(), autorun: false, concurrency: 20 }
    );

    worker.on("completed", (job, result) => {
      console.info({
        context: "queue.job-completed",
        event: job.name,
        eventData: job.data,
        attempts: job.attemptsMade,
        failure: job.failedReason,
        result,
      });
    });

    worker.on("failed", (job, err) => {
      console.error({
        context: "queue.job-failed",
        message: `Job ${job?.name} failed`,
        attempt: job?.attemptsMade ?? 0 + 1,
        exception: err.message,
        payload: job?.data,
      });
    });

    console.log("👷 BullMQ queue worker starts");
    worker.run();
  });
