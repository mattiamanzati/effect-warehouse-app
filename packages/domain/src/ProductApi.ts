import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform"
import { Schema } from "effect"
import { Product, ProductNotFoundError, ProductSkuAlreadyExistsError, ProductSkuFromString } from "./Product.js"

export class CreateProductPayload extends Schema.Class<CreateProductPayload>("CreateProductPayload")({
  sku: ProductSkuFromString,
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String)
}) {}

export class UpdateProductPayload extends Schema.Class<UpdateProductPayload>("UpdateProductPayload")({
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String)
}) {}

const productSkuFromPath = HttpApiSchema.param("productSku", ProductSkuFromString)

export class ProductApiGroup extends HttpApiGroup.make("products").add(
  HttpApiEndpoint.get("getAllProducts", "/products").addSuccess(Schema.Array(Product))
).add(
  HttpApiEndpoint.get("getProduct", `/products/${productSkuFromPath}`)
    .addSuccess(Product)
    .addError(ProductNotFoundError)
).add(
  HttpApiEndpoint.post("createProduct", "/products")
    .setPayload(CreateProductPayload)
    .addSuccess(Product)
    .addError(ProductSkuAlreadyExistsError)
).add(
  HttpApiEndpoint.patch("updateProduct", `/products/${productSkuFromPath}`)
    .setPayload(UpdateProductPayload)
    .addSuccess(Product)
    .addError(ProductNotFoundError)
).add(
  HttpApiEndpoint.del("deleteProduct", `/products/${productSkuFromPath}`)
    .addSuccess(Schema.Void)
) {}

export class ProductApi extends HttpApi.make("api").add(ProductApiGroup) {}
