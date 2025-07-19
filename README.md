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

Create a class that extends `Event` and decorate it with `@IsEvent()` and define how to handle it:

```ts
import { IsEvent, Event } from 'elysia-irismq';

@IsEvent()
class WelcomeEvent extends Event<{ clientId: string }> {
	// default options

	// void
	async handle() {
		await EmailService.sendWelcome(this.payload.clientId);
	}
}

@IsEvent()
class SendEmail extends Event<{ to: string }> {
	/**
	 * How many times the job will be retried on failure.
	 * @optional @default 5
	 */
	public override retries: number = 5;
	/**
	 * Delay in milliseconds before retrying a failed job.
	 * @optional @default 15000
	 */
	public override delayOnFailure: number = 15000;
	/**
	 * If true, removes the job when it successfully completes When given a number,
	 * it specifies the maximum amount of jobs to keep, or you can provide an object specifying max age and/or count to keep.
	 * @optional @default true (delete job after complete)
	 */
	public override removeOnComplete: boolean | number = true;
	/**
	 * If true, removes the job when it fails after all attempts. When given a number,
	 * it specifies the maximum amount of jobs to keep, or you can provide an object specifying max age and/or count to keep.
	 * @optional @default 100 (keep 100 failed attempts in redis)
	 */
	public override removeOnFail: boolean | number = 100;

	async handle() {
		console.log(`Email to ${this.getPayload().to}`);
	}
}
```

## Using the plugin with Elysia

```ts
import Elysia from 'elysia';
import { queuePlugin } from 'elysia-irismq';

const app = new Elysia().use(queuePlugin(options /* optional */)).listen(3000);
```

The plugin will start a BullMQ worker using the provided Redis connection (default host=localhost, port=6379, no user, no password).
It also decorates the Elysia context with a `dispatch` function so you can enqueue jobs inside route handlers.

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
	 * Amount of jobs that a single worker is allowed to work on in parallel.
	 * @default 10
	 */
	concurrency: number;
};
```

## Queueing an event within handlers

```ts
import Elysia from 'elysia';

const app = new Elysia()
	.use(queuePlugin()) // default host=127.0.0.1 port=6379 no username or password
	.get(
		'/',
		// dispatch an Event from request Context
		({ query: { to }, dispatch /* decorated context */ }) => {
			// the Event is dispatched in the background; does not block request handling
			dispatch(new SendEmail({ to: 'alice@example.com' }));
			return 'ok';
		},
	)
	.listen(3000);
```

## Queueing an event outside handlers

```ts
import { dispatch } from 'elysia-irismq';

dispatch(new SendEmail({ to: 'alice@example.com' }));
```

## Development

```bash
bun test
```

This project uses Bun's test runner and TypeScript.

## ⚠️ Design Scope & Limitations

This plugin is designed for a single Redis-backed job queue, where each job can represent a self-defined events types.
While it supports multiple event types, all jobs are pushed into the same queue, which makes it a good fit for simple use cases such as:

- Single-purpose background workers
- medium-scale job processing pipelines
- Microservice-only scope

Can scale horizontal thanks too BullMQ, but for large-scale pipelines other solutions are better.
