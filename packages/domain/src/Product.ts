import * as Schema from "effect/Schema"
import * as UnitOfMeasure from "./UnitOfMeasure.js"

export const ProductIdTypeId = Symbol.for("@@ProductId")

export const ProductId = Schema.UUID.pipe(
  Schema.annotations({ identifier: "ProductID" }),
  Schema.brand(ProductIdTypeId)
)

export type ProductID = Schema.Schema.Type<typeof ProductId>

export const Product = Schema.Struct({
  productId: ProductId,
  name: Schema.NonEmptyString,
  unitOfMeasureId: UnitOfMeasure.UnitOfMeasureId
}).pipe(
  Schema.annotations({ identifier: "Product" })
)
