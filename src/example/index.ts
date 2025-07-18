import Elysia, { t } from "elysia";
import { queuePlugin } from "../plugin";
import { LogHelloEvent } from "./event";
import { queue } from "../utils";

// you can queue with 'queue' util from another part of the app <b>after server is running</b>
abstract class Service {
  static helloThere(to: string) {
    queue(new LogHelloEvent({ message: to }));
  }
}

const app = new Elysia()
  .use(queuePlugin()) // default host=127.0.0.1 port=6379 no username or password
  .get(
    "/",
    // queue an Event from request Context
    ({ query: { to }, queue }) => {
      queue(new LogHelloEvent({ message: to }));
      return "ok";
    },
    {
      query: t.Object({
        to: t.String(),
      }),
    }
  )
  // queue an Event from a Service outside request Context
  .get("/service", () => {
    Service.helloThere("Florencia");
    return "ok";
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
