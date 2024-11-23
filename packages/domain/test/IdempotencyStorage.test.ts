import { SqlClient } from "@effect/sql"
import * as SqlliteClientNode from "@effect/sql-sqlite-node/SqliteClient"
import { describe, expect, it } from "@effect/vitest"
import { Effect, Exit, Option } from "effect"
import * as Schema from "effect/Schema"
import * as IdempotencyStorage from "../src/IdempotencyStorage.js"

describe("IdempotencyStorage", () => {
  it.effect("should persist then read results", () =>
    Effect.gen(function*() {
      const storage = yield* IdempotencyStorage.IdempotencyStorage
      const exitSchema = Schema.Exit({ success: Schema.Number, failure: Schema.String, defect: Schema.Unknown })

      yield* storage.save(
        "products/products-1",
        "message-1",
        exitSchema,
        Exit.succeed(42)
      )
      const previousResult = yield* (storage.check("products/products-1", "message-1", exitSchema))

      expect(Option.isSome(previousResult)).toEqual(true)
      if (previousResult._tag === "Some") {
        expect(Exit.isSuccess(previousResult.value)).toBe(true)
      }
    }).pipe(Effect.provide(IdempotencyStorage.inMemory)))

  it.effect("should differentiate different consumers", () =>
    Effect.gen(function*() {
      const storage = yield* IdempotencyStorage.IdempotencyStorage
      const exitSchema = Schema.Exit({ success: Schema.Number, failure: Schema.String, defect: Schema.Unknown })

      yield* storage.save(
        "products/products-1",
        "message-1",
        exitSchema,
        Exit.succeed(42)
      )
      const previousResult = yield* (storage.check("products/products-2", "message-1", exitSchema))

      expect(Option.isNone(previousResult)).toEqual(true)
    }).pipe(Effect.provide(IdempotencyStorage.inMemory)))

  it.effect("creates sqlite events", () =>
    Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM idempotency`

      const storage = yield* IdempotencyStorage.IdempotencyStorage
      const exitSchema = Schema.Exit({ success: Schema.Number, failure: Schema.String, defect: Schema.Unknown })
      yield* storage.save(
        "products/products-1",
        "message-1",
        exitSchema,
        Exit.succeed(42)
      )
      const previousResult = yield* (storage.check("products/products-1", "message-1", exitSchema))

      expect(Option.isSome(previousResult)).toEqual(true)
    }).pipe(
      Effect.provide(IdempotencyStorage.sqllite({
        idempotencyTableName: "idempotency"
      })),
      Effect.provide(SqlliteClientNode.layer({ filename: "test.db" }))
    ))
})
