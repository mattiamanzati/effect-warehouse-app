import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

export class ProductId extends Schema.TaggedClass<ProductId>("ProductId")("ProductId", {
  value: Schema.NonEmptyString
}) {}

export class Product extends Schema.TaggedClass<Product>("Product")("Product", {
  id: ProductId,
  name: Schema.NonEmptyString,
  description: Schema.optional(Schema.String)
}) {}

const CreateProductPayload = Product.pipe(Schema.omit("id", "_tag"))

export class ProductApiGroup extends HttpApiGroup.make("products").add(
  HttpApiEndpoint.get("getAllProducts", "/products").addSuccess(Schema.Array(Product))
).add(
  HttpApiEndpoint.post("createProduct", "/products").setPayload(CreateProductPayload).addSuccess(Product)
) {}

export class ProductApi extends HttpApi.make("api").add(ProductApiGroup) {}
