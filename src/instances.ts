import Redis from 'ioredis';
import type { Event } from './event';

/** Global map to store registered event classes keyed by their name. */
export const queueEventRegistry = new Map<string, new (payload: any) => Event<any>>();

export type IrisOpts = {
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

export const pluginConfig = () => {
	// default options
	let opts: IrisOpts = {
		host: '127.0.0.1',
		port: 6379,
		user: undefined,
		pass: undefined,
		silent: false,
		removeOnComplete: true,
		removeOnFail: 100,
	};

	return {
		quiet() {
			return opts.silent;
		},
		set(options: Partial<IrisOpts>) {
			const cleaned = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined));
			opts = {
				...opts,
				...cleaned,
			};
		},
		get() {
			return opts;
		},
	};
};

/**
 * Singleton that holds the Redis connection used by the queue and workers.
 */
export const queueConnection = (() => {
	let connection: Redis | null = null;

	return {
		/** Initializes the Redis connection if it hasn't been set yet or Returns the active Redis connection. */
		get(): Redis {
			if (!connection) {
				const { host, port, user, pass } = pluginConfig().get();
				return new Redis({ host, port, username: user, password: pass });
			}
			return connection;
		},
	};
})();
