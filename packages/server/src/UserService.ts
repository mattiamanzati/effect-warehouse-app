import { SqlClient } from "@effect/sql"
import {
  NoSuchUserError,
  User,
  UserEmailAlreadyTakenError,
  UserId,
  type UserSignupRequestData
} from "@warehouse/domain/User"
import { Effect } from "effect"
import { v4 as uuidv4 } from "uuid"

export class UserService extends Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    // create the users table if not exists yet
    yield* sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT,
            name TEXT,
            surname TEXT,
            birthday DATE
        )
    `

    const findUserById = Effect.fn(function*(userId: UserId) {
      const users = yield* sql`SELECT * FROM users WHERE id = ${userId}`

      if (users.length !== 1) return yield* Effect.fail(new NoSuchUserError({ userId }))
      return yield* User.decodeUknown({ _tag: User._tag, ...users[0] })
    })

    const addUser = Effect.fn(function*(data: UserSignupRequestData) {
      const existingUserForEmail = yield* sql`SELECT email FROM users WHERE email = ${data.email}`

      if (existingUserForEmail.length > 0) {
        return yield* Effect.fail(new UserEmailAlreadyTakenError({ email: data.email }))
      }

      const userId = UserId.make(uuidv4())

      yield* sql`INSERT INTO users 
        (id, email, name, surname, birthday) 
        VALUES (${userId}, ${data.email}, ${data.name}, ${data.surname}, ${data.birthday.toISOString()})`

      const user = yield* findUserById(userId).pipe(Effect.catchTag(NoSuchUserError._tag, Effect.die))

      return user
    }, sql.withTransaction)

    return { addUser, findUserById }
  })
}) {}
