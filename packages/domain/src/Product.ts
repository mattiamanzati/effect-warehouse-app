import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { Schema } from "effect"

export const ProductSku = Schema.NonEmptyString.pipe(Schema.brand("ProductSku"))
export type ProductSku = Schema.Schema.Type<typeof ProductSku>
export namespace ProductSku {
  export type Encoded = Schema.Schema.Encoded<typeof ProductSku>
  export type Context = Schema.Schema.Context<typeof ProductSku>
}

export class Product extends Schema.Class<Product>("Product")({
  sku: ProductSku,
  name: Schema.NonEmptyString,
  description: Schema.OptionFromNullOr(Schema.String)
}) {
}

export class ProductCatalogError
  extends Schema.TaggedError<ProductCatalogError>("ProductCatalogError")("ProductCatalogError", {
    cause: Schema.String
  })
{}

export class ProductSkuAlreadyExistsError
  extends Schema.TaggedError<ProductSkuAlreadyExistsError>("ProductSkuAlreadyExistsError")(
    "ProductSkuAlreadyExistsError",
    {
      sku: Schema.NonEmptyString
    }
  )
{
  toString(): string {
    return `The following SKU already exists: ${this.sku}`
  }
}

export class ProductNotFoundError extends Schema.TaggedError<ProductNotFoundError>("ProductNotFoundError")(
  "ProductNotFoundError",
  {},
  HttpApiSchema.annotations({ status: 404 })
) {}
