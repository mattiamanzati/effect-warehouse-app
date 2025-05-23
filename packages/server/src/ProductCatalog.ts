import { Product, ProductNotFoundError, ProductSku, ProductSkuAlreadyExistsError } from "@warehouse/domain/Product"
import * as Array from "effect/Array"
import * as Effect from "effect/Effect"

export interface CreateProductData {
  sku: string
  name: string
  description: string
}

export interface UpdateProductData {
  name: string
  description: string
}

export class ProductCatalog extends Effect.Service<ProductCatalog>()("ProductCatalog", {
  effect: Effect.gen(function*() {
    const products = new Map<string, Product>()
    yield* Effect.void

    function listAll() {
      return Effect.succeed(Array.fromIterable(products.values()))
    }

    function getProduct(productSku: ProductSku) {
      return Effect.gen(function*() {
        const product = products.get(productSku.value)
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
            sku: ProductSku.make({ value: data.sku }),
            name: data.name,
            description: data.description
          })
        )

        return products.get(data.sku)!
      })
    }

    function updateProduct(productId: ProductSku, data: UpdateProductData) {
      return Effect.gen(function*() {
        const product = products.get(productId.value)
        if (!product) return yield* Effect.fail(new ProductNotFoundError())
        products.set(
          product.sku.value,
          new Product({
            ...product,
            name: data.name,
            description: data.description
          })
        )

        return products.get(product.sku.value)!
      })
    }

    function deleteProduct(productId: ProductSku) {
      return Effect.sync(() => {
        if (!products.has(productId.value)) return

        products.delete(productId.value)
      })
    }

    return { listAll, getProduct, createProduct, updateProduct, deleteProduct }
  })
}) {}
