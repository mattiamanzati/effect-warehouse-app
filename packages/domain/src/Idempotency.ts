import * as Effect from "effect/Effect"
import type * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import type * as Schema from "effect/Schema"
import * as IdempotencyStorage from "./IdempotencyStorage.js"

export function ensure<A, E>(
  consumerId: string,
  idempotencyKey: string,
  exitSchema: Schema.Schema<Exit.Exit<A, E>, any, never>
) {
  return <R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R | IdempotencyStorage.IdempotencyStorage> =>
    Effect.gen(function*() {
      const storage = yield* IdempotencyStorage.IdempotencyStorage
      const previousExit = yield* storage.check(consumerId, idempotencyKey, exitSchema)
      if (Option.isSome(previousExit)) return yield* previousExit.value
      return yield* effect.pipe(Effect.onExit((exit) => storage.save(consumerId, idempotencyKey, exitSchema, exit)))
    })
}
