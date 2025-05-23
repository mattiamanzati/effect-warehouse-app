import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { Schema } from "effect"

export class ProductSku extends Schema.TaggedClass<ProductSku>("ProductSku")("ProductSku", {
  value: Schema.NonEmptyString
}) {
  static fromString = (value: string) => new ProductSku({ value })
}

export const ProductSkuFromString = Schema.transform(
  Schema.NonEmptyString,
  ProductSku,
  {
    encode: (_) => _.value,
    decode: (_) => ProductSku.fromString(_)
  }
)

export class Product extends Schema.TaggedClass<Product>("Product")("Product", {
  sku: ProductSkuFromString,
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String)
}) {
}

export class ProductSkuAlreadyExistsError
  extends Schema.TaggedError<ProductSkuAlreadyExistsError>("ProductSkuAlreadyExistsError")(
    "ProductSkuAlreadyExistsError",
    {
      sku: Schema.NonEmptyString
    }
  )
{
}

export class ProductNotFoundError extends Schema.TaggedError<ProductNotFoundError>("ProductNotFoundError")(
  "ProductNotFoundError",
  {},
  HttpApiSchema.annotations({ status: 404 })
) {}
