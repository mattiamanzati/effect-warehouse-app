import { Clock } from "effect"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Ref from "effect/Ref"
import type * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import type * as AggregateId from "./AggregateId.js"
import type * as AggregateRoot from "./AggregateRoot.js"
import * as EventJournalStorage from "./EventJournalStorage.js"
import type * as Message from "./Message.js"

export interface EventSourcedAggregate<
  Aggregate extends AggregateRoot.AggregateRoot.All,
  State,
  Events extends Message.Message.AnyForAggregate<Aggregate>
> {
  read: (
    aggregateId: AggregateId.AggregateId
  ) => EventSourcedAggregate.Reader<State>
  produce: (
    aggregateId: AggregateId.AggregateId
  ) => EventSourcedAggregate.Producer<State, Events>
}

export namespace EventSourcedAggregate {
  export interface Args<
    Aggregate extends AggregateRoot.AggregateRoot.All,
    StateSchema extends Schema.Schema.All,
    EventsSchema extends ReadonlyArray<Message.Message.SchemaAnyForAggregate<Aggregate>>
  > {
    aggregateRoot: Aggregate
    eventTypes: EventsSchema
    state: StateSchema
    reduce: Reducer<Schema.Schema.Type<StateSchema>, Schema.Schema.Type<EventsSchema[number]>>
  }

  export type Reader<State> = Effect.Effect<
    Option.Option<State>,
    never,
    EventJournalStorage.EventJournalStorage
  >

  export interface Producer<
    State,
    Events
  > {
    (
      fn: (
        draft: Draft<State, Events>
      ) => Effect.Effect<void, EventJournalStorage.EventJournalAppendEntryFailed>
    ): Effect.Effect<void, EventJournalStorage.EventJournalAppendEntryFailed, EventJournalStorage.EventJournalStorage>
  }

  export interface Draft<
    State,
    Events
  > {
    read: Effect.Effect<Option.Option<State>>
    append: (event: Events) => Effect.Effect<void, EventJournalStorage.EventJournalAppendEntryFailed>
  }

  export interface Reducer<State, Event> {
    (state: Option.Option<State>, event: EventJournalStorage.EventJournalStorageEntry<Event>): State
  }
}

interface StateInfo<State> {
  state: Option.Option<State>
  nextSequence: number
}

export function make<
  Aggregate extends AggregateRoot.AggregateRoot.All,
  State extends Schema.Schema.All,
  Events extends ReadonlyArray<Message.Message.SchemaAnyForAggregate<Aggregate>>
>(
  args: EventSourcedAggregate.Args<Aggregate, State, Events>
): EventSourcedAggregate<Aggregate, Schema.Schema.Type<State>, Schema.Schema.Type<Events[number]>> {
  const applyEvent = (
    currentState: StateInfo<Schema.Schema.Type<State>>,
    journalEntry: EventJournalStorage.EventJournalStorageEntry<Schema.Schema.Type<Events[number]>>
  ): StateInfo<Schema.Schema.Type<State>> => ({
    state: Option.some(args.reduce(currentState.state, journalEntry)),
    nextSequence: journalEntry.sequence + 1
  })

  const readCurrentStateFromJournal = (aggregateId: AggregateId.AggregateId) =>
    pipe(
      EventJournalStorage.EventJournalStorage,
      Effect.map((journal) => journal.read(args.aggregateRoot.aggregateRootName, aggregateId, args.eventTypes, 0)),
      Stream.unwrap,
      Stream.runFold(
        {
          state: Option.none(),
          nextSequence: 1
        },
        applyEvent
      )
    )

  const read = (aggregateId: AggregateId.AggregateId) =>
    pipe(
      readCurrentStateFromJournal(aggregateId),
      Effect.map((_) => _.state)
    )

  /**
   * 1) read all events from storage and create the current state
   * 2) create a ref storing the current state
   * 3) create an append function that will both update the ref and persist the event to journal
   * 4) package those two into the draft object
   */

  const produce = (
    aggregateId: AggregateId.AggregateId
  ): EventSourcedAggregate.Producer<Schema.Schema.Type<State>, Schema.Schema.Type<Events[number]>> =>
  (
    draft
  ) =>
    Effect.gen(function*() {
      const lastState = yield* readCurrentStateFromJournal(aggregateId)
      const currentStateRef = yield* Ref.make(lastState)
      const journal = yield* EventJournalStorage.EventJournalStorage
      const read = pipe(Ref.get(currentStateRef), Effect.map((_) => _.state))
      const append = (event: Schema.Schema.Type<Events[number]>) =>
        Effect.gen(function*() {
          const currentState = yield* Ref.get(currentStateRef)
          const createdAt = new Date(yield* Clock.currentTimeMillis)
          const journalEntry = new EventJournalStorage.EventJournalStorageEntry({
            event,
            sequence: currentState.nextSequence,
            createdAt
          })
          yield* journal.append(
            args.aggregateRoot.aggregateRootName,
            aggregateId,
            args.eventTypes,
            journalEntry
          )
          yield* Ref.update(currentStateRef, (currentState) => applyEvent(currentState, journalEntry))
        })
      yield* draft({ read, append })
    })

  return { produce, read }
}
