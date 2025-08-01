import { Rx } from "@effect-rx/rx"
import { useRxValue } from "@effect-rx/rx-react"
import type { RxRegistry } from "@effect-rx/rx/Registry"
import { Effect, ParseResult, pipe, Record } from "effect"
import * as React from "react"
import { FormFieldHelper } from "../components"

export interface MessageBag<R extends Record<string, Array<string>>> {
  useErrors: () => { [K in keyof R]: React.ReactNode | null }
  useUnmatchedErrors: () => React.ReactNode | null
  catchParseIssues: <A, E, R>(
    fa: Effect.Effect<A, E | ParseResult.ParseError, R>
  ) => Effect.Effect<A | void, E, R | RxRegistry>
}

export function createUiMessageBag<R extends Record<string, Array<string>>>(expectedPaths: R): MessageBag<R> {
  const errorsRx = Rx.make<Array<ParseResult.ArrayFormatterIssue>>([])

  return {
    useUnmatchedErrors: () => {
      const expectedPathNames = Record.values(expectedPaths).map((_) => _.join("."))
      const errors = useRxValue(errorsRx)
      const unmatchedErrors = errors.filter((error) => !expectedPathNames.includes(error.path.join(".")))
      return React.createElement(
        React.Fragment,
        {},
        ...unmatchedErrors.map((error) => <FormFieldHelper type="error">{error.message}</FormFieldHelper>)
      )
    },
    useErrors: () => {
      const errors = useRxValue(errorsRx)
      return pipe(
        expectedPaths,
        Record.map((path) => {
          const filteredErrors = errors.filter((error) => error.path.join(".") === path.join("."))
          return React.createElement(
            React.Fragment,
            {},
            ...filteredErrors.map((error) => <FormFieldHelper type="error">{error.message}</FormFieldHelper>)
          )
        })
      ) as { [K in keyof R]: React.ReactNode | null }
    },
    catchParseIssues: <A, E, R>(fa: Effect.Effect<A, E | ParseResult.ParseError, R>) =>
      fa.pipe(
        Effect.ensuring(Effect.sync(() => Rx.set(errorsRx, []))),
        Effect.catchIf(ParseResult.isParseError, (error) =>
          Rx.set(errorsRx, ParseResult.ArrayFormatter.formatErrorSync(error)))
      )
  }
}
