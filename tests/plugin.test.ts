import { describe, it, expect } from 'bun:test';
import { IsEvent, Event, buildEvent } from '../src/event';
import { irisEventRegistry } from '../src/instances';

@IsEvent()
class SampleEvent extends Event<{ value: number }> {
	async handle() {
		return this.getPayload().value;
	}
}

describe('event registry', () => {
	it('registers events using the decorator', () => {
		expect(irisEventRegistry.get('SampleEvent')).toBe(SampleEvent);
	});

	it('builds event instances', () => {
		const instance = buildEvent('SampleEvent', { value: 1 }) as SampleEvent;
		expect(instance).toBeInstanceOf(SampleEvent);
		expect(instance.getPayload()).toEqual({ value: 1 });
	});
});

describe('Event.safeHandle', () => {
	it('returns the handle result', async () => {
		const event = new SampleEvent({ value: 2 });
		await expect(event.safeHandle()).resolves.toBe(2);
	});

	it('wraps non-error throws', async () => {
		class BadEvent extends SampleEvent {
			// @ts-ignore
			async handle() {
				throw 'boom';
			}
		}
		await expect(new BadEvent({ value: 0 }).safeHandle()).rejects.toBeInstanceOf(Error);
	});
});
