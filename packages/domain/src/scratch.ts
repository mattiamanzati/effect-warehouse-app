import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as AggregateRoot from "./AggregateRoot.js"
import * as EventSourcedAggregate from "./EventSourcedAggregate.js"

class ProductAggregate extends AggregateRoot.AggregateRoot({
  aggregateRootName: "products"
}) {}

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

export class ReadProductName extends Schema.TaggedRequest<ReadProductName>()(
  "ReadProductName",
  {
    payload: ProductAggregate.Query({}),
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

export class ProductDiscontinued extends Schema.TaggedClass<ProductDiscontinued>()(
  "ProductDiscontinued",
  ProductAggregate.Event({
    reason: Schema.String
  })
) {
}

const MemberAggregate = AggregateRoot.AggregateRoot({
  aggregateRootName: "members"
})

export class MemberJoined extends Schema.TaggedClass<MemberJoined>()(
  "MemberJoined",
  MemberAggregate.Event({})
) {
}

const ProductEventJournal = EventSourcedAggregate.make({
  aggregateRoot: ProductAggregate,
  eventTypes: [ProductNameChanged, ProductDiscontinued],
  state: Schema.Option(Schema.String),
  reduce: (state, { event }) => {
    switch (event._tag) {
      case "ProductNameChanged":
        return Option.some(event.newName)
      case "ProductDiscontinued":
        return Option.none()
    }
  }
})

ProductEventJournal.produce("product-1")(({ append }) =>
  pipe(
    append(new ProductNameChanged({}))
  )
)
