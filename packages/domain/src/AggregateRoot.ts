import * as Message from "./Message.js"
import * as MessageKind from "./MessageKind.js"

const AggregateRootTypeId = Symbol.for("@rsp-app/domain/AggregateRoot")
export type AggregateRootTypeId = typeof AggregateRootTypeId

export interface AggregateRoot<AggregateRootName extends string> {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  new(_: never): {}
  [AggregateRootTypeId]: AggregateRootTypeId
  aggregateRootName: AggregateRootName
  Query: Message.Message.PayloadConstructor<AggregateRootName, typeof MessageKind.MessageKindCommand>
  Command: Message.Message.PayloadConstructor<AggregateRootName, typeof MessageKind.MessageKindQuery>
  Event: Message.Message.PayloadConstructor<AggregateRootName, typeof MessageKind.MessageKindEvent>
}

export namespace AggregateRoot {
  export type All = AggregateRoot<string>
  export type Name<A extends All> = [A] extends [AggregateRoot<infer Name>] ? Name : never
}

export interface AggregateRootArgs<AggregateRootName extends string> {
  aggregateRootName: AggregateRootName
}

export function AggregateRoot<AggregateRootName extends string>(
  args: AggregateRootArgs<AggregateRootName>
): AggregateRoot<AggregateRootName> {
  return class {
    static [AggregateRootTypeId]: AggregateRootTypeId = AggregateRootTypeId
    static aggregateRootName = args.aggregateRootName
    static Query = Message.makePayloadConstructor(args.aggregateRootName, MessageKind.MessageKindQuery)
    static Command = Message.makePayloadConstructor(args.aggregateRootName, MessageKind.MessageKindCommand)
    static Event = Message.makePayloadConstructor(args.aggregateRootName, MessageKind.MessageKindEvent)
  }
}
