import { queueEventRegistry } from "./instances";

/**
 * Decorator
 * registra el evento en `evenRegistry` globalmente
 */
export function IsEvent() {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    queueEventRegistry.set(constructor.name, constructor as any);
    console.log(`⚡️ ${constructor.name} registered`);
  };
}

export function buildEvent(name: string, payload: any): Event<any> {
  const EventClass = queueEventRegistry.get(name);
  if (!EventClass) throw new Error(`Event ${name} not registered`);
  return new EventClass(payload);
}

export abstract class Event<T extends Record<string, any> = any> {
  public retries: number = 5;
  public delayOnFailure: number = 15000;

  constructor(protected readonly payload: T) {}

  abstract handle(): Promise<any>;

  /**
   * Se asegura que el error durante handle() sea del tipo `Error`
   * bullmq puede tener problemas con errores de otros tipos.
   */
  async safeHandle() {
    try {
      return await this.handle();
    } catch (error) {
      // Ensure it always throws an Error instance
      if (error instanceof Error) {
        throw error;
      }

      // Wrap non-Error values in a generic Error
      throw new Error(
        typeof error === "string"
          ? error
          : `Unexpected error: ${JSON.stringify(error)}`
      );
    }
  }

  getPayload(): T {
    return this.payload;
  }
}
