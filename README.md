# elysia-irismq - BullMQ Plugin for Elysia queues

[Github](https://github.com/tuplescompany/elysia-irismq)

A small plugin for the [Elysia](https://elysiajs.com) framework that provides a
Redis backed job queue using [BullMQ](https://docs.bullmq.io/).

The plugin exposes a decorator for declaring events, utilities for queuing them
and an Elysia plugin that starts a worker.

## Installation

```bash
bun install elysia-irismq
```

Peer dependencies `elysia`, `bullmq`, `ioredis` and `typescript` must also be
available in your project.

## Defining a new event

Create a class that extends `Event` and decorate it with `@IsEvent()`:

```ts
import { IsEvent, Event } from "elysia-irismq";

@IsEvent()
class SendEmail extends Event<{ to: string }> {
  async handle() {
    console.log(`Email to ${this.getPayload().to}`);
  }
}
```

## Using the plugin with Elysia

```ts
import Elysia from "elysia";
import { queuePlugin } from "elysia-irismq";

const app = new Elysia().use(queuePlugin(options /* optional */)).listen(3000);
```

The plugin will start a BullMQ worker using the provided Redis connection (default host=localhost, port=6379, no user, no password).
It also decorates the Elysia context with a `queue` function so you can enqueue jobs inside route handlers.

See `src/example` for a complete usage example.

### Options avaiable

```ts
// Options
type IrisOpts = {
  /** Redis HOST @default '127.0.0.1' */
  host: string;
  /** Redis PORT @default 6379 */
  port: number;
  /** Redis USERNAME @default undefined */
  user?: string;
  /** Redis PASSWORD @default undefined */
  pass?: string;
  /**
   * If true, only log errors
   * If false, logs when a job is queued or completed
   * @default false
   */
  silent: boolean;
  /**
   * If true, removes the job when it successfully completes When given a number,
   * it specifies the maximum amount of jobs to keep, or you can provide an object specifying max age and/or count to keep.
   * @default true (delete job after complete)
   */
  removeOnComplete: boolean;
  /**
   * If true, removes the job when it fails after all attempts. When given a number,
   * it specifies the maximum amount of jobs to keep, or you can provide an object specifying max age and/or count to keep.
   * @default 100 (keep 100 failed attempts in redis)
   */
  removeOnFail: boolean | number;
};
```

## Queueing an event

```ts
import { queue } from "elysia-irismq";

queue(new SendEmail({ to: "alice@example.com" }));
```

## Development

```bash
bun test
```

This project uses Bun's test runner and TypeScript.
