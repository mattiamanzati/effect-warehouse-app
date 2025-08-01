import { HttpApiClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"

import { describe, expect, it } from "@effect/vitest"
import { ProductApi } from "@warehouse/domain/ProductApi"
import { Effect } from "effect"
import { ProductSku } from "../../domain/src/Product.js"

describe("Dummy", () => {
  it.effect(
    "should get the list of products",
    () =>
      Effect.gen(function*() {
        const client = yield* HttpApiClient.make(ProductApi, {
          baseUrl: "http://localhost:3000/"
        })

        const products = yield* client.products.getAllProducts()
        expect(products.length).toEqual(2)
      }).pipe(
        Effect.provide(NodeHttpClient.layer)
      )
  )

  it.effect(
    "should create a product",
    () =>
      Effect.gen(function*() {
        const client = yield* HttpApiClient.make(ProductApi, {
          baseUrl: "http://localhost:3000/"
        })

        const product = yield* client.products.createProduct({
          payload: {
            sku: ProductSku.fromString("1234567890"),
            name: "My new product"
          }
        })
        expect(product.name).toEqual("My new product")
      }).pipe(
        Effect.provide(NodeHttpClient.layer)
      )
  )
})
