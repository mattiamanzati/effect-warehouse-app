import { describe, expect, it } from "@effect/vitest"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as AggregateRoot from "../src/AggregateRoot.js"
import * as Message from "../src/Message.js"
import * as MessageHeaders from "../src/MessageHeaders.js"
import * as MessageKind from "../src/MessageKind.js"

const ProductAggregate = AggregateRoot.AggregateRoot({
  aggregateRootName: "products"
})

export class ReadProductName extends Schema.TaggedRequest<ReadProductName>()(
  "ReadProductName",
  {
    payload: ProductAggregate.Query({}),
    success: Schema.Boolean,
    failure: Schema.Never
  }
) {
}

export class ChangeProductName extends Schema.TaggedRequest<ChangeProductName>()(
  "ChangeProductNameWithSchema",
  {
    payload: ProductAggregate.Command({
      newName: Schema.NonEmptyString
    }),
    success: Schema.Boolean,
    failure: Schema.Never
  }
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

describe("Message", () => {
  it("Query - it should check the type of a message", () => {
    const messageKind = MessageKind.getMessageKind(ReadProductName)
    expect(Option.isSome(messageKind)).toBe(true)
    expect(messageKind).toEqual(Option.some("Query"))
  })
  it("Command - it should check the type of a message", () => {
    const messageKind = MessageKind.getMessageKind(ChangeProductName)
    expect(Option.isSome(messageKind)).toBe(true)
    expect(messageKind).toEqual(Option.some("Command"))
  })
  it("Event - it should check the type of a message", () => {
    const messageKind = MessageKind.getMessageKind(ProductNameChanged)
    expect(Option.isSome(messageKind)).toBe(true)
    expect(messageKind).toEqual(Option.some("Event"))
  })
  it("Command - by default, the aggregate root should be filled", () => {
    const _headers = MessageHeaders.MessageHeaders.make({ messageId: "aaaa" })
    const message = ChangeProductName.make({
      newName: "New product",
      _aggregateId: "product-1",
      _headers
    })
    expect(Message.getAggregateRootName(message)).toEqual(ProductAggregate.aggregateRootName)
  })
})
