import { SqlClient } from "@effect/sql"
import * as SqlliteClientNode from "@effect/sql-sqlite-node/SqliteClient"
import { describe, expect, it } from "@effect/vitest"
import { Cause, Effect, Exit, Option } from "effect"
import * as Chunk from "effect/Chunk"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import * as EventJournalStorage from "../src/EventJournalStorage.js"

class SampleEvent1 extends Schema.TaggedClass<SampleEvent1>()("SampleEvent1", {}) {}
class SampleEvent2 extends Schema.TaggedClass<SampleEvent2>()("SampleEvent2", {}) {}

const EventUnion = [SampleEvent1, SampleEvent2] as const

describe("EventJournalStorage", () => {
  it.effect("Journal should persist then read events", () =>
    Effect.gen(function*() {
      const journal = yield* EventJournalStorage.EventJournalStorage
      yield* journal.append(
        "products",
        "product-1",
        EventUnion,
        new EventJournalStorage.EventJournalStorageEntry({
          createdAt: (new Date()),
          sequence: 1,
          event: new SampleEvent2()
        })
      )
      const events = yield* Stream.runCollect(journal.read("products", "product-1", EventUnion, 0))

      expect(Chunk.size(events)).toEqual(1)
    }).pipe(Effect.provide(EventJournalStorage.inMemory)))

  it.effect("Journal should differentiate entities", () =>
    Effect.gen(function*() {
      const journal = yield* EventJournalStorage.EventJournalStorage
      yield* journal.append(
        "products",
        "product-1",
        EventUnion,
        new EventJournalStorage.EventJournalStorageEntry({
          createdAt: new Date(0),
          sequence: 1,
          event: new SampleEvent2()
        })
      )
      const events = yield* Stream.runCollect(journal.read("products", "product-2", EventUnion, 0))

      expect(Chunk.size(events)).toEqual(0)
    }).pipe(Effect.provide(EventJournalStorage.inMemory)))

  it.effect("creates sqlite events", () =>
    Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM event_journal`

      const journal = yield* EventJournalStorage.EventJournalStorage
      yield* journal.append(
        "products",
        "product-1",
        EventUnion,
        new EventJournalStorage.EventJournalStorageEntry({
          createdAt: new Date(0),
          sequence: 0,
          event: new SampleEvent2()
        })
      )
      const events = yield* Stream.runCollect(journal.read("products", "product-1", EventUnion, 0))

      expect(Chunk.size(events)).toEqual(1)
    }).pipe(
      Effect.provide(EventJournalStorage.sqllite({
        journalTableName: "event_journal"
      })),
      Effect.provide(SqlliteClientNode.layer({ filename: "test.db" }))
    ))

  it.effect("fails sqllite append if already exists", () =>
    Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM event_journal_fail`

      const journal = yield* EventJournalStorage.EventJournalStorage
      yield* journal.append(
        "products",
        "product-1",
        EventUnion,
        new EventJournalStorage.EventJournalStorageEntry({
          createdAt: new Date(0),
          sequence: 0,
          event: new SampleEvent2()
        })
      )
      const appendResult = yield* journal.append(
        "products",
        "product-1",
        EventUnion,
        new EventJournalStorage.EventJournalStorageEntry({
          createdAt: new Date(0),
          sequence: 0,
          event: new SampleEvent2()
        })
      ).pipe(Effect.exit)
      expect(Exit.isFailure(appendResult)).toEqual(true)
      if (appendResult._tag === "Failure") {
        expect(Option.isSome(Cause.failureOption(appendResult.cause))).toEqual(true)
      }
    }).pipe(
      Effect.provide(EventJournalStorage.sqllite({
        journalTableName: "event_journal_fail"
      })),
      Effect.provide(SqlliteClientNode.layer({ filename: "test.db" }))
    ))
})
