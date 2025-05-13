import { Reactivity } from "@effect/experimental"
import { FileSystem } from "@effect/platform"
import { NodeFileSystem } from "@effect/platform-node"
import { SqlClient } from "@effect/sql"
import { SqliteClient } from "@effect/sql-sqlite-node"
import { describe, expect, it } from "@effect/vitest"
import { UserService } from "@warehouse/server/UserService"
import { Effect, Layer } from "effect"

const makeEmptyDb = Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem
  const tempDir = yield* fs.makeTempDirectoryScoped()
  return yield* SqliteClient.make({
    filename: tempDir + "/test.db"
  })
}).pipe(
  Effect.provide([NodeFileSystem.layer, Reactivity.layer])
)

const TestLayer = UserService.Default.pipe(
  Layer.provide(Layer.effect(SqlClient.SqlClient, makeEmptyDb))
)

describe("UserService", () => {
  it.scoped(
    "creates a user",
    () =>
      Effect.gen(function*() {
        const userService = yield* UserService

        const user = yield* userService.addUser({
          email: "test@test.com",
          name: "Mattia",
          surname: "Manzati",
          birthday: new Date(1993, 10, 5)
        })

        expect(user.id).not.toBeFalsy()
      }).pipe(
        Effect.provide(TestLayer)
      )
  )
})
