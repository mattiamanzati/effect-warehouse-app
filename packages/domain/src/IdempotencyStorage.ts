import * as SqlClient from "@effect/sql/SqlClient"
import type * as SqlError from "@effect/sql/SqlError"
import type { Exit } from "effect"
import { Context, Data, Effect, HashMap, Layer, Option, Ref } from "effect"
import * as Schema from "effect/Schema"

export class IdempotencyStorage extends Context.Tag("@@IdempotencyStorage")<IdempotencyStorage, {
  /**
   * Checks if the given idempotencyKey has already been processed for a specific consumer.
   * If it has, it will return Some with the previous execution exit.
   * @param consumerId
   * @param idempotencyKey
   * @param exitSchema
   */
  check<A, E>(
    consumerId: string,
    idempotencyKey: string,
    exitSchema: Schema.Schema<Exit.Exit<A, E>, any, never>
  ): Effect.Effect<Option.Option<Exit.Exit<A, E>>>
  /**
   * This will persist into the storage the result of the execution of the command.
   * @param consumerId
   * @param idempotencyKey
   * @param exitSchema
   * @param exit
   */
  save<A, E>(
    consumerId: string,
    idempotencyKey: string,
    exitSchema: Schema.Schema<Exit.Exit<A, E>, any, never>,
    exit: Exit.Exit<A, E>
  ): Effect.Effect<void>
}>() {}

export namespace IdempotencyStorage {
  export interface Args {
    idempotencyTableName: string
  }
}

class InMemoryIdempotencyIndex extends Data.Class<{
  consumerId: string
  idempotencyKey: string
}> {}

export const inMemory = Effect.gen(function*() {
  const state = yield* Ref.make(HashMap.empty<InMemoryIdempotencyIndex, Exit.Exit<any, any>>())

  const check: IdempotencyStorage["Type"]["check"] = (consumerId, idempotencyKey) =>
    Ref.get(state).pipe(Effect.map(HashMap.get(new InMemoryIdempotencyIndex({ consumerId, idempotencyKey }))))

  const save: IdempotencyStorage["Type"]["save"] = (consumerId, idempotencyKey, _, exit) =>
    Ref.update(state, HashMap.set(new InMemoryIdempotencyIndex({ consumerId, idempotencyKey }), exit))

  return { check, save }
}).pipe(Layer.effect(IdempotencyStorage))

interface IdempotencyStorageSqlliteRow {
  consumer_id: string
  idempotency_key: string
  exit_payload: string
}

export const sqllite = (args: IdempotencyStorage.Args) =>
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    // create the idempotency table if not exists
    yield* sql`CREATE TABLE IF NOT EXISTS ${sql.literal(args.idempotencyTableName)} (
      consumer_id TEXT NOT NULL, 
      idempotency_key TEXT NOT NULL, 
      exit_payload TEXT,
      PRIMARY KEY(consumer_id, idempotency_key)
    )`

    const save: IdempotencyStorage["Type"]["save"] = (
      consumerId,
      idempotencyKey,
      exitSchema,
      exit
    ) =>
      Effect.gen(function*() {
        const exit_payload = yield* Schema.encode(Schema.parseJson(exitSchema))(exit)
        const { changes } = yield* sql`INSERT INTO ${
          sql.literal(args.idempotencyTableName)
        } (consumer_id, idempotency_key, exit_payload) 
          SELECT ${consumerId}, ${idempotencyKey}, ${exit_payload}
          WHERE NOT EXISTS (
            SELECT 1 FROM ${sql.literal(args.idempotencyTableName)} 
            WHERE 
              consumer_id = ${consumerId} 
              AND idempotency_key = ${idempotencyKey})`.raw as Effect.Effect<{ changes: number }, SqlError.SqlError>

        return changes
      }).pipe(
        Effect.orDie
      )

    const check: IdempotencyStorage["Type"]["check"] = (consumerId, idempotencyKey, exitSchema) =>
      Effect.gen(function*() {
        const raw_data = yield* sql`SELECT * FROM ${
          sql.literal(args.idempotencyTableName)
        } WHERE consumer_id = ${consumerId} AND idempotency_key = ${idempotencyKey}`
          .raw as Effect.Effect<Array<IdempotencyStorageSqlliteRow>, SqlError.SqlError>

        if (raw_data.length < 1) return Option.none()
        const exit = yield* Schema.decode(Schema.parseJson(exitSchema))(
          raw_data[0].exit_payload
        )

        return Option.some(exit)
      }).pipe(Effect.orDie)

    return { save, check }
  }).pipe(Layer.effect(IdempotencyStorage))
