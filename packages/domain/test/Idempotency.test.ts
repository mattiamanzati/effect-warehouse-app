import { describe, expect, it } from "@effect/vitest"
import { Effect, pipe, Ref } from "effect"
import * as Schema from "effect/Schema"
import * as Idempotency from "../src/Idempotency.js"
import * as IdempotencyStorage from "../src/IdempotencyStorage.js"

describe("IdempotencyStorage", () => {
  it.effect("should run if never happend before, and do not run again twice", () =>
    Effect.gen(function*() {
      const stateRef = yield* Ref.make(0)
      const exitSchema = Schema.Exit({ success: Schema.Number, failure: Schema.String, defect: Schema.Unknown })

      const run1 = pipe(
        Ref.updateAndGet(stateRef, (_) => _ + 1),
        Idempotency.ensure("consumer", "message1", exitSchema)
      )

      const firstRun = yield* run1
      expect(firstRun).toBe(1)

      const secondRun = yield* run1
      expect(secondRun).toBe(1)

      const run2 = pipe(
        Ref.updateAndGet(stateRef, (_) => _ + 1),
        Idempotency.ensure("consumer", "message2", exitSchema)
      )

      const thirdRun = yield* run2
      expect(thirdRun).toBe(2)
    }).pipe(Effect.provide(IdempotencyStorage.inMemory)))
})
