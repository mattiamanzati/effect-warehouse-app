import { HttpApiBuilder } from "@effect/platform"
import { ProductApi } from "@warehouse/domain/ProductApi"
import { Effect, Layer } from "effect"
import * as ProductCatalog from "./ProductCatalog.js"

const ProductApiLive = HttpApiBuilder.group(
  ProductApi,
  "products",
  (handlers) =>
    Effect.gen(function*() {
      const catalog = yield* ProductCatalog.ProductCatalog

      return handlers.handle("getAllProducts", () => catalog.listAll()).handle("getProduct", (r) =>
        catalog.getProduct(r.path.productSku)).handle("createProduct", (r) =>
          catalog.createProduct({
            sku: r.payload.sku.value,
            name: r.payload.name,
            description: r.payload.description || ""
          })).handle("updateProduct", (r) =>
          catalog.updateProduct(r.path.productSku, {
            name: r.payload.name,
            description: r.payload.description || ""
          })).handle("deleteProduct", (r) =>
          catalog.deleteProduct(r.path.productSku))
    })
)

export const ApiLive = HttpApiBuilder.api(ProductApi).pipe(
  Layer.provide(ProductApiLive)
)
