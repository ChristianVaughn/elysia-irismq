import type { Event } from './event';
import { pluginConfig } from './instances';
import { useDefaultQueue } from './plugin';

/**
 * Queues an event using the default queue.
 */
export const queue = <T extends Record<string, any> = any>(event: Event<T>) => {
	const opts = pluginConfig().get();
	useDefaultQueue()
		.add(event.constructor.name, event.getPayload(), {
			removeOnComplete: opts.removeOnComplete,
			removeOnFail: opts.removeOnFail,
			attempts: event.retries,
			backoff: {
				type: 'fixed',
				delay: event.delayOnFailure,
			},
		})
		.then((added) => {
			if (!opts.silent) {
				console.debug({
					event: event.constructor.name,
					message: 'queue added',
					data: added.data,
				});
			}
		})
		.catch((err) => {
			console.error('Error adding job to queue', err);
		});
};
