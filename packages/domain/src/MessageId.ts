import * as Schema from "effect/Schema"

export class MessageId extends Schema.NonEmptyString.pipe(Schema.annotations({ identifier: "MessageId" })) {}
