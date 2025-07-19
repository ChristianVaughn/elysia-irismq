import type { Event } from './event';
import { irisConfig } from './instances';
import { useDefaultQueue } from './plugin';

/**
 * Queues an event using the default queue.
 */
export const dispatch = <T extends Record<string, any> = any>(event: Event<T>) => {
	const opts = irisConfig.get();

	useDefaultQueue()
		.add(event.constructor.name, event.getPayload(), {
			removeOnComplete: event.removeOnComplete,
			removeOnFail: event.removeOnFail,
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
