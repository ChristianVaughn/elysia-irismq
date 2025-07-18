import { IsEvent, Event } from '../event';

@IsEvent()
/** Simple event that logs a greeting message. */
export class LogHelloEvent extends Event<{ message: string }> {
	public override retries: number = 5;
	/** Delay before retrying failed jobs in milliseconds. */
	public override delayOnFailure: number = 10000;

	/** Writes a greeting to stdout. */
	async handle() {
		console.log(`Hello ${this.payload.message} from Event`);
		return { success: true };
	}
}
