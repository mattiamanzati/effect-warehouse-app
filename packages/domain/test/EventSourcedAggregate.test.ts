import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import * as AggregateRoot from "../src/AggregateRoot.js"
import * as EventJournalStorage from "../src/EventJournalStorage.js"
import * as EventSourcedAggregate from "../src/EventSourcedAggregate.js"
import * as MessageHeaders from "../src/MessageHeaders.js"

class ProductAggregate extends AggregateRoot.AggregateRoot({
  aggregateRootName: "products"
}) {}

export class ProductCreated extends Schema.TaggedClass<ProductCreated>()(
  "ProductCreated",
  ProductAggregate.Event({
    name: Schema.NonEmptyString,
    uom: Schema.NonEmptyString
  })
) {
}

export class ProductNameChanged extends Schema.TaggedClass<ProductNameChanged>()(
  "ProductNameChanged",
  ProductAggregate.Event({
    oldName: Schema.NonEmptyString,
    newName: Schema.NonEmptyString
  })
) {
}

const ProductEventJournal = EventSourcedAggregate.make({
  aggregateRoot: ProductAggregate,
  eventTypes: [ProductCreated, ProductNameChanged],
  state: Schema.Option(Schema.Struct({
    productName: Schema.NonEmptyString,
    uom: Schema.NonEmptyString,
    createdAt: Schema.Date,
    updatedAt: Schema.Date
  })),
  reduce: (state, journalEntry) => {
    const product = Option.flatten(state)
    switch (journalEntry.event._tag) {
      case "ProductCreated":
        return Option.some({
          productName: journalEntry.event.name,
          uom: journalEntry.event.uom,
          createdAt: journalEntry.createdAt,
          updatedAt: journalEntry.createdAt
        })
      case "ProductNameChanged": {
        const productName = journalEntry.event.newName
        return Option.map(product, (oldProduct) => ({ ...oldProduct, productName, updatedAt: journalEntry.createdAt }))
      }
    }
  }
})

describe("EventJournalStorage", () => {
  it.effect("Journal should persist then read events", () =>
    Effect.gen(function*() {
      yield* ProductEventJournal.produce("product-1")(({ append }) =>
        Effect.gen(function*() {
          const _headers = MessageHeaders.MessageHeaders.make({
            messageId: "message-id"
          })
          const productCreatedEvent = ProductCreated.make({
            _headers,
            _aggregateId: "product-1",
            uom: "PCS",
            name: "Pizza"
          })
          yield* append(productCreatedEvent)
        })
      )

      const eventJournal = yield* EventJournalStorage.EventJournalStorage
      const journalEventsCount = yield* Stream.runCount(
        eventJournal.read(ProductAggregate.aggregateRootName, "product-1", [ProductCreated, ProductNameChanged], 0)
      )
      expect(journalEventsCount).toEqual(1)

      const currentState = yield* ProductEventJournal.read("product-1")
      expect(Option.isSome(Option.flatten(currentState))).toBe(true)

      yield* ProductEventJournal.produce("product-1")(({ append, read }) =>
        Effect.gen(function*() {
          const product = Option.flatten(yield* read)
          const _headers = MessageHeaders.MessageHeaders.make({
            messageId: "message-id-2"
          })
          const productNameChangedEvent = ProductNameChanged.make({
            _headers,
            _aggregateId: "product-1",
            newName: "Fancy Pizza!",
            oldName: product.pipe(Option.map((_) => _.productName), Option.getOrElse(() => "???"))
          })
          yield* append(productNameChangedEvent)
        })
      )

      const journalEventsCount2 = yield* Stream.runCount(
        eventJournal.read(ProductAggregate.aggregateRootName, "product-1", [ProductCreated, ProductNameChanged], 0)
      )
      expect(journalEventsCount2).toEqual(2)

      const currentState2 = Option.flatten(yield* ProductEventJournal.read("product-1"))
      expect(Option.isSome(currentState)).toBe(true)
      if (currentState2._tag === "Some") {
        expect(currentState2.value.productName).toEqual("Fancy Pizza!")
      }
    }).pipe(
      Effect.provide(EventJournalStorage.inMemory)
    ))
})
