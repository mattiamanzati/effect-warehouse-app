import * as Schema from "effect/Schema"
import * as Member from "./Member.js"

export const WarehouseIdTypeId = Symbol.for("@@WarehouseId")

export const WarehouseId = Schema.UUID.pipe(
  Schema.annotations({
    identifier: "WarehouseId"
  })
)

export const Warehouse = Schema.Struct({
  warehouseId: WarehouseId,
  name: Schema.NonEmptyString,
  ownerId: Schema.Option(Member.MemberId)
}).pipe(
  Schema.annotations({ identifier: "Warehouse" })
)
