import * as Schema from "effect/Schema"

export const MemberIdTypeId = Symbol.for("@@MemberId")
export const MemberId = Schema.UUID.pipe(
  Schema.annotations({ identifier: "MemberId" })
)

export const Member = Schema.Struct({
  memberId: MemberId,
  name: Schema.NonEmptyString,
  surname: Schema.NonEmptyString,
  birthday: Schema.Date
}).pipe(
  Schema.annotations({ identifier: "Member" })
)
export type Member = Schema.Schema.Type<typeof Member>
