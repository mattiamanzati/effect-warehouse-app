import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import type * as AggregateId from "./AggregateId.js"
import type * as AggregateRoot from "./AggregateRoot.js"
import * as MessageHeaders from "./MessageHeaders.js"
import type * as MessageKind from "./MessageKind.js"

export const MessageAggregateRootNameAnnotationId: unique symbol = Symbol.for("@@MessageAggregateRootNameAnnotationId")
export type MessageAggregateRootNameAnnotationId = typeof MessageAggregateRootNameAnnotationId

export const MessageKindAnnotationId: unique symbol = Symbol.for("@@MessageKindAnnotationId")
export type MessageKindAnnotationId = typeof MessageKindAnnotationId

export type MessagePayload<
  AggregateRootName extends string,
  MessageKind_ extends MessageKind.MessageKind.All
> = {
  [MessageAggregateRootNameAnnotationId]: OnlyOnType<Schema.Literal<[AggregateRootName]>>
  [MessageKindAnnotationId]: OnlyOnType<MessageKind_>
  _aggregateId: typeof AggregateId.AggregateId$
  _headers: typeof MessageHeaders.MessageHeaders
}

export namespace Message {
  export type All = Schema.Struct.Type<MessagePayload<string, MessageKind.MessageKind.All>>

  export type AnyForAggregate<A extends AggregateRoot.AggregateRoot.All> = Schema.Struct.Type<
    MessagePayload<AggregateRoot.AggregateRoot.Name<A>, MessageKind.MessageKind.All>
  >

  export type SchemaAnyForAggregate<A extends AggregateRoot.AggregateRoot.All> = {
    Type: AnyForAggregate<A>
  } & Schema.Schema.AnyNoContext

  export interface PayloadConstructor<
    AggregateRootName extends string,
    MessageKind extends MessageKind.MessageKind.All
  > {
    <Payload extends Schema.Struct.Fields>(
      payload: Payload
    ): Payload & MessagePayload<AggregateRootName, MessageKind>
  }
}

const onlyOnType = <S extends Schema.Schema.AnyNoContext>(schema: S) => (defaultValue: Schema.Schema.Type<S>) =>
  Schema.optionalToRequired(Schema.Never, schema, {
    decode: () => defaultValue,
    encode: () => Option.none()
  }).pipe(Schema.withConstructorDefault(() => defaultValue))

type OnlyOnType<S extends Schema.Schema.AnyNoContext> = Schema.PropertySignature<
  ":",
  Schema.Schema.Type<S>,
  never,
  "?:",
  never,
  true,
  never
>

export const makePayloadConstructor =
  <AggregateRootName extends string, MessageKind extends MessageKind.MessageKind.All>(
    aggregateRootName: AggregateRootName,
    messageKind: MessageKind
  ): Message.PayloadConstructor<AggregateRootName, MessageKind> =>
  (
    messagePayload
  ) => ({
    ...messagePayload,
    [MessageKindAnnotationId]: onlyOnType(messageKind)(messageKind.literals[0] as any),
    [MessageAggregateRootNameAnnotationId]: onlyOnType(Schema.Literal(aggregateRootName))(aggregateRootName),
    _aggregateId: Schema.NonEmptyString,
    _headers: MessageHeaders.MessageHeaders
  })

export function getAggregateRootName(message: Message.All): string {
  return message[MessageAggregateRootNameAnnotationId]
}
