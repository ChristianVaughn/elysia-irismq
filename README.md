# Elysia BullMQ Plugin

A small plugin for the [Elysia](https://elysiajs.com) framework that provides a
Redis backed job queue using [BullMQ](https://docs.bullmq.io/).

The plugin exposes a decorator for declaring events, utilities for queuing them
and an Elysia plugin that starts a worker.

## Installation

```bash
bun install elysia-bullmq
```

Peer dependencies `elysia`, `bullmq`, `ioredis` and `typescript` must also be
available in your project.

## Defining a new event

Create a class that extends `Event` and decorate it with `@IsEvent()`:

```ts
import { IsEvent, Event } from "elysia-bullmq";

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
import { queuePlugin } from "elysia-bullmq";

const app = new Elysia().use(queuePlugin()).listen(3000);
```

The plugin will start a BullMQ worker using the provided Redis connection. It
also decorates the Elysia context with a `queue` function so you can enqueue
jobs inside route handlers.

See `src/example` for a complete usage example.

## Queueing an event

```ts
import { queue } from "elysia-bullmq";

queue(new SendEmail({ to: "alice@example.com" }));
```

## Development

```bash
bun test
```

This project uses Bun's test runner and TypeScript.
