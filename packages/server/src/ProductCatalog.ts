import type { ProductSku } from "@warehouse/domain/Product"
import { Product, ProductNotFoundError, ProductSkuAlreadyExistsError } from "@warehouse/domain/Product"
import * as Array from "effect/Array"
import * as Effect from "effect/Effect"

export interface CreateProductData {
  sku: ProductSku
  name: string
  description: string
}

export interface UpdateProductData {
  name: string
  description: string
}

export class ProductCatalog extends Effect.Service<ProductCatalog>()("ProductCatalog", {
  effect: Effect.gen(function*() {
    const products = new Map<ProductSku, Product>()
    yield* Effect.void

    function listAll() {
      return Effect.succeed(Array.fromIterable(products.values()))
    }

    function getProduct(productSku: ProductSku) {
      return Effect.gen(function*() {
        const product = products.get(productSku)
        if (!product) return yield* Effect.fail(new ProductNotFoundError())

        return product
      })
    }

    function createProduct(data: CreateProductData) {
      return Effect.gen(function*() {
        if (products.has(data.sku)) return yield* Effect.fail(new ProductSkuAlreadyExistsError({ sku: data.sku }))

        products.set(
          data.sku,
          new Product({
            sku: data.sku,
            name: data.name,
            description: data.description
          })
        )

        return products.get(data.sku)!
      })
    }

    function updateProduct(sku: ProductSku, data: UpdateProductData) {
      return Effect.gen(function*() {
        const product = products.get(sku)
        if (!product) return yield* Effect.fail(new ProductNotFoundError())
        products.set(
          product.sku,
          new Product({
            ...product,
            name: data.name,
            description: data.description
          })
        )

        return products.get(product.sku)!
      })
    }

    function deleteProduct(sku: ProductSku) {
      return Effect.sync(() => {
        if (!products.has(sku)) return

        products.delete(sku)
      })
    }

    return { listAll, getProduct, createProduct, updateProduct, deleteProduct }
  })
}) {}
