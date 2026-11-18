import test from "node:test";
import assert from "node:assert/strict";
import { submissionQueue } from "../lib/support/concurrency";

test("a queued submission starts after an active failure; excess requests never start work", async () => {
  const run = submissionQueue(1, 1);
  let release!: () => void;
  const hold = new Promise<void>((r) => {
    release = r;
  });
  const order: string[] = [];
  const first = run(async () => {
    order.push("first");
    await hold;
    throw Error("provider failed");
  });
  const second = run(async () => {
    order.push("second");
    return 2;
  });
  const third = await run(async () => {
    throw Error("excess work started");
  });
  assert.equal(third, undefined);
  assert.deepEqual(order, ["first"]);
  release();
  await assert.rejects(first, /provider failed/);
  assert.equal(await second, 2);
  assert.deepEqual(order, ["first", "second"]);
  assert.equal(await run(async () => 3), 3);
});
