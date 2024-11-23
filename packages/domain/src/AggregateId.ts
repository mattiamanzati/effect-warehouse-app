import * as Schema from "effect/Schema"

export const AggregateId$ = Schema.NonEmptyString.pipe(Schema.annotations({
  identifier: "AggregateId"
}))
export type AggregateId = Schema.Schema.Type<typeof AggregateId$>
