import Elysia, { t } from 'elysia';

import { LogHelloEvent } from './event';
// import { queuePlugin, queue } from 'elysia-irismq' for you
import { queuePlugin } from '../plugin';
import { queue } from '../utils';

// You can queue with 'queue' util from another part of the app after the server is running
/** Utility service demonstrating how to queue events from anywhere. */
abstract class Service {
	/** Queues a greeting event. */
	static helloThere(to: string) {
		queue(new LogHelloEvent({ message: to }));
	}
}

const app = new Elysia()
	.use(queuePlugin()) // default host=127.0.0.1 port=6379 no username or password
	.get(
		'/',
		// queue an Event from request Context
		({ query: { to }, queue }) => {
			queue(new LogHelloEvent({ message: to }));
			return 'ok';
		},
		{
			query: t.Object({
				to: t.String(),
			}),
		},
	)
	// queue an Event from a Service outside request Context
	.get('/service', () => {
		Service.helloThere('Florencia');
		return 'ok';
	})
	.listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
