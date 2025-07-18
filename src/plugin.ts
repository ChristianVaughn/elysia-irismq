import Elysia from 'elysia';
import { buildEvent } from './event';
import { Queue, Worker } from 'bullmq';
import { IrisOpts, pluginConfig, queueConnection } from './instances';
import { queue } from './utils';
import type { Job } from 'bullmq';

/** Creates or retrieves the default queue instance. */
export const useDefaultQueue = () => {
	return new Queue('iris-queue', { connection: queueConnection.get() });
};

/**
 * Elysia plugin that starts a BullMQ worker and exposes a `queue` utility.
 */
export const queuePlugin = (opts: Partial<IrisOpts> = {}) => {
	pluginConfig().set(opts);

	return new Elysia({ name: `iris-queue` }).decorate('queue', queue).onStart(() => {
		const worker = new Worker(
			'iris-queue',
			async (job: Job) => {
				const event = buildEvent(job.name, job.data);
				return await event.safeHandle();
			},
			{ connection: queueConnection.get(), autorun: false, concurrency: 20 },
		);

		if (!pluginConfig().quiet()) {
			worker.on('completed', (job, result) => {
				console.info({
					context: 'queue.job-completed',
					event: job.name,
					eventData: job.data,
					attempts: job.attemptsMade,
					failure: job.failedReason,
					result,
				});
			});
		}

		worker.on('failed', (job, err) => {
			console.error({
				context: 'queue.job-failed',
				message: `Job ${job?.name} failed`,
				attempt: job?.attemptsMade ?? 0 + 1,
				exception: err.message,
				payload: job?.data,
			});
		});

		console.log('👷 BullMQ queue worker starts');
		worker.run();
	});
};
