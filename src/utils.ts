import type { Event } from "./event";
import { useDefaultQueue } from "./plugin";

/**
 * Queues an event using the default queue.
 */
export const queue = <T extends Record<string, any> = any>(event: Event<T>) => {
  useDefaultQueue()
    .add(event.constructor.name, event.getPayload(), {
      removeOnComplete: true,
      removeOnFail: 1000,
      attempts: event.retries,
      backoff: {
        type: "fixed",
        delay: 1000,
      },
    })
    .then((added) => {
      console.debug({
        event: event.constructor.name,
        message: "queue added",
        data: added.data,
      });
    })
    .catch((err) => {
      console.error("Error adding job to queue", err);
    });
};
