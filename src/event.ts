import { queueEventRegistry } from "./instances";
/**
 * Registers an event class in the global registry so it can be resolved later.
 */
export function IsEvent() {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    queueEventRegistry.set(constructor.name, constructor as any);
    console.log(`⚡️ ${constructor.name} registered`);
  };
}

/**
 * Instantiates an event from its registered name.
 * @param name Event class name.
 * @param payload Data passed to the event constructor.
 */
export function buildEvent(name: string, payload: any): Event<any> {
  const EventClass = queueEventRegistry.get(name);
  if (!EventClass) throw new Error(`Event ${name} not registered`);
  return new EventClass(payload);
}

/**
 * Base class that every queue event should extend.
 * @template T Payload shape for the event.
 */
export abstract class Event<T extends Record<string, any> = any> {
  /** How many times the job will be retried on failure. */
  public retries: number = 5;
  /** Delay in milliseconds before retrying a failed job. */
  public delayOnFailure: number = 15000;

  constructor(protected readonly payload: T) {}

  /**
   * Executes the event logic.
   * @returns A value that will be stored as the job result.
   */
  abstract handle(): Promise<any>;

  /**
   * Executes {@link handle} and makes sure thrown values are `Error` objects.
   */
  async safeHandle() {
    try {
      return await this.handle();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        typeof error === "string"
          ? error
          : `Unexpected error: ${JSON.stringify(error)}`
      );
    }
  }

  /** Returns the original event payload. */
  getPayload(): T {
    return this.payload;
  }
}
