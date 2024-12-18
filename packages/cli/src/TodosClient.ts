import { HttpApiClient } from "@effect/platform"
import { TodosApi } from "@rsp-app/domain/TodosApi"
import { Effect, Layer } from "effect"

export const make = Effect.gen(function*() {
  const client = yield* HttpApiClient.make(TodosApi, {
    baseUrl: "http://localhost:3000"
  })

  function create(text: string) {
    return client.todos.createTodo({ payload: { text } }).pipe(
      Effect.flatMap((todo) => Effect.logInfo("Created todo: ", todo))
    )
  }

  const list = client.todos.getAllTodos().pipe(
    Effect.flatMap((todos) => Effect.logInfo(todos))
  )

  function complete(id: number) {
    return client.todos.completeTodo({ path: { id } }).pipe(
      Effect.flatMap((todo) => Effect.logInfo("Marked todo completed: ", todo)),
      Effect.catchTag("TodoNotFound", () => Effect.logError(`Failed to find todo with id: ${id}`))
    )
  }

  function remove(id: number) {
    return client.todos.removeTodo({ path: { id } }).pipe(
      Effect.flatMap(() => Effect.logInfo(`Deleted todo with id: ${id}`)),
      Effect.catchTag("TodoNotFound", () => Effect.logError(`Failed to find todo with id: ${id}`))
    )
  }

  return {
    create,
    list,
    complete,
    remove
  } as const
})

export class TodosClient extends Effect.Tag("cli/TodosClient")<
  TodosClient,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(this, make)
}
