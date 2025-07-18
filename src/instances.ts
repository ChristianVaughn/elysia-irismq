import Redis from "ioredis";
import type { Event } from "./event";
import type { RedisOpts } from "./types";

/** Global map to store registered event classes keyed by their name. */
export const queueEventRegistry = new Map<
  string,
  new (payload: any) => Event<any>
>();

/**
 * Singleton that holds the Redis connection used by the queue and workers.
 */
export const queueConnection = (() => {
  let connection: Redis | null = null;

  return {
    /**
     * Initializes the Redis connection if it hasn't been set yet.
     */
    set({ host, port, user, pass }: RedisOpts) {
      connection = new Redis({
        host: host ?? "127.0.0.1",
        port: port ?? 6379,
        username: user,
        password: pass,
        maxRetriesPerRequest: null,
      });
    },
    /** Returns the active Redis connection. */
    get(): Redis {
      if (!connection) {
        throw new Error(
          "Redis instance has not been set. You did .use(queuePlugin) on your root elysia instance?"
        );
      }
      return connection;
    },
    /** Clears the stored Redis connection. */
    clear() {
      connection = null;
    },
    /** Indicates whether the connection has been initialized. */
    isReady(): boolean {
      return connection !== null;
    },
  };
})();
