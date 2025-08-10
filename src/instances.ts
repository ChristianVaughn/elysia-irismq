import Redis from 'ioredis';
import type { Event } from './event';

/** Global map to store registered event classes keyed by their name. */
export const irisEventRegistry = new Map<string, new (payload: any) => Event<any>>();

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
	 * Amount of jobs that a single worker is allowed to work on in parallel.
	 * @default 10
	 */
	concurrency: number;
	/**
	 * Version of IP stack to use (0 for both IPv4 and IPv6, 4 for IPv4, 6 for IPv6)
	 * @default 4
	 */
	keyFamily: number;
};

export const irisConfig = (() => {
	// default options
	let opts: IrisOpts = {
		host: '127.0.0.1',
		port: 6379,
		user: undefined,
		pass: undefined,
		silent: false,
		concurrency: 10,
		keyFamily: 4,
	};

	return {
		quiet() {
			return opts.silent;
		},
		concurrency() {
			return opts.concurrency;
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
})();

/**
 * Singleton that holds the Redis connection used by the queue and workers.
 */
export const irisConnection = (() => {
	let connection: Redis | null = null;

	return {
		/** Initializes the Redis connection if it hasn't been set yet or Returns the active Redis connection. */
		get(): Redis {
			if (!connection) {
				const { host, port, user, pass, keyFamily } = irisConfig.get();
				return new Redis({ host, port, username: user, password: pass, maxRetriesPerRequest: null, family: keyFamily });
			}
			return connection;
		},
	};
})();
