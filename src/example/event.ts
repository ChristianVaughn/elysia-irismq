import { IsEvent, Event } from "../event";

@IsEvent()
export class LogHelloEvent extends Event<{ message: string }> {
  public override retries: number = 5;
  public override delayOnFailure: number = 10000; // milis

  async handle() {
    console.log(`Hello ${this.payload.message} from Event`);
    return { success: true };
  }
}
