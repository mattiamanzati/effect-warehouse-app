import { HttpApiBuilder } from "@effect/platform"
import { Product, ProductApi, ProductId } from "@warehouse/domain/ProductApi"
import { Effect, Layer } from "effect"

const ProductApiLive = HttpApiBuilder.group(
  ProductApi,
  "products",
  (handlers) =>
    handlers.handle("getAllProducts", () =>
      Effect.gen(function*() {
        yield* Effect.sleep(5000)
        return [
          new Product({ id: new ProductId({ value: "1" }), name: "First Product" }),
          new Product({
            id: new ProductId({ value: "2" }),
            name: "Second Product",
            description: "test description"
          })
        ]
      })).handle("createProduct", (request) =>
        Effect.gen(function*() {
          yield* Effect.log(request.payload)
          return new Product({ id: new ProductId({ value: "1" }), ...request.payload })
        }))
)

export const ApiLive = HttpApiBuilder.api(ProductApi).pipe(
  Layer.provide(ProductApiLive)
)
