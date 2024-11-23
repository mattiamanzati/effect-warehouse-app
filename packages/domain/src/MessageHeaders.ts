import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as MessageId from "./MessageId.js"

export class MessageHeaders extends Schema.Class<MessageHeaders>("MessageHeaders")({
  messageId: MessageId.MessageId,
  causationId: Schema.optionalWith(Schema.Option(MessageId.MessageId), { default: () => Option.none() }),
  correlationId: Schema.optionalWith(Schema.Option(MessageId.MessageId), { default: () => Option.none() }),
  expiresIn: Schema.optionalWith(Schema.Option(Schema.Duration), { default: () => Option.none() })
}) {}
