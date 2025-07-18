import Redis from "ioredis";
import type { Event } from "./event";
import type { RedisOpts } from "./types";

/**
 * Global map to store registered Event classes
 */
export const queueEventRegistry = new Map<
  string,
  new (payload: any) => Event<any>
>();

/**
 * Global Redis connection holder
 * Used to share Redis connection for queueing, workers, caching, etc.
 */
export const queueConnection = (() => {
  let connection: Redis | null = null;

  return {
    set({ host, port, user, pass }: RedisOpts) {
      connection = new Redis({
        host: host ?? "127.0.0.1",
        port: port ?? 6379,
        username: user,
        password: pass,
        maxRetriesPerRequest: null,
      });
    },
    get(): Redis {
      if (!connection) {
        throw new Error(
          "Redis instance has not been set. You did .use(queuePlugin) on your root elysia instance?"
        );
      }
      return connection;
    },
    clear() {
      connection = null;
    },
    isReady(): boolean {
      return connection !== null;
    },
  };
})();
