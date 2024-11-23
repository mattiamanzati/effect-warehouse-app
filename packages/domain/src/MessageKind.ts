import * as AST from "@effect/schema/AST"
import * as Array from "effect/Array"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"

export const MessageKindTypeId: unique symbol = Symbol.for("@@MessageKindTypeId")
export type MessageKindTypeId = typeof MessageKindTypeId

export class MessageKindCommand extends Schema.Literal("Command").pipe(Schema.annotations({
  [MessageKindTypeId]: "Command"
})) {}

export class MessageKindQuery extends Schema.Literal("Query").pipe(Schema.annotations({
  [MessageKindTypeId]: "Query"
})) {}

export class MessageKindEvent extends Schema.Literal("Event").pipe(Schema.annotations({
  [MessageKindTypeId]: "Event"
})) {}

export type MessageKind = Schema.Schema.Type<MessageKind.All>

export namespace MessageKind {
  export type All = typeof MessageKindCommand | typeof MessageKindQuery | typeof MessageKindEvent
}

export function getMessageKind<A extends Schema.Schema.All>(schema: A) {
  return getMessageKindFromAST(schema.ast)
}

function getMessageKindFromAST(ast: AST.AST): Option.Option<MessageKind> {
  const maybeValue = AST.getAnnotation<MessageKind>(MessageKindTypeId)(ast)
  if (Option.isSome(maybeValue)) return maybeValue

  switch (ast._tag) {
    case "Transformation":
      return getMessageKindFromAST(ast.to).pipe(Option.orElse(() => getMessageKindFromAST(ast.from)))
    case "TypeLiteral":
      return pipe(
        ast.propertySignatures,
        Array.map((_) => getMessageKindFromAST(_.type)),
        Array.reduce(Option.none(), (_, __) => Option.orElse(_, () => __))
      )
    case "Refinement":
      return getMessageKindFromAST(ast.from)
  }

  return Option.none()
}
