import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

export const UserId = Schema.UUID.pipe(
  Schema.brand("UserId")
)
export type UserId = Schema.Schema.Type<typeof UserId>

export class UserSignupRequestData extends Schema.Class<UserSignupRequestData>("UserSignupRequestData")({
  email: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  surname: Schema.NonEmptyString,
  birthday: Schema.Date
}) {}

export class User extends Schema.TaggedClass<User>("User")("User", {
  id: UserId,
  ...UserSignupRequestData.fields
}) {
  static decodeUknown = Schema.decodeUnknown(User)
}

export class UserEmailAlreadyTakenError
  extends Schema.TaggedError<UserEmailAlreadyTakenError>("UserEmailAlreadyTakenError")("UserEmailAlreadyTakenError", {
    email: Schema.String
  })
{
  get message() {
    return `${this.email} is already taken.`
  }
}

export class NoSuchUserError extends Schema.TaggedError<NoSuchUserError>("NoSuchUserError")("NoSuchUserError", {
  userId: UserId
}) {}

export class UserApi extends HttpApiGroup.make("users").add(
  HttpApiEndpoint.post("signup", "/signup").setPayload(
    UserSignupRequestData
  ).addError(UserEmailAlreadyTakenError)
) {}
