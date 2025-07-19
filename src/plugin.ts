import Elysia from 'elysia';
import { buildEvent } from './event';
import { Queue, Worker } from 'bullmq';
import { IrisOpts, irisConfig, irisConnection } from './instances';
import { dispatch } from './utils';
import type { Job } from 'bullmq';

/** Creates or retrieves the default queue instance. */
export const useDefaultQueue = () => {
	return new Queue('iris-queue', { connection: irisConnection.get() });
};

/**
 * Elysia plugin that starts a BullMQ worker and exposes a `queue` utility.
 */
export const queuePlugin = (opts: Partial<IrisOpts> = {}) => {
	irisConfig.set(opts); // set user preferences on startup

	return new Elysia({ name: `iris-queue` }).decorate('dispatch', dispatch).onStart(() => {
		const worker = new Worker(
			'iris-queue',
			async (job: Job) => {
				const event = buildEvent(job.name, job.data);
				const result = await event.safeHandle();

				return result ?? {};
			},
			{ connection: irisConnection.get(), autorun: false, concurrency: irisConfig.concurrency() },
		);

		if (!irisConfig.quiet()) {
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
