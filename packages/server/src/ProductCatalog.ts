import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import {
  Product,
  ProductCatalogError,
  ProductNotFoundError,
  ProductSku,
  ProductSkuAlreadyExistsError
} from "@warehouse/domain/Product"
import type { Option } from "effect"
import { flow, Schema } from "effect"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"

export interface CreateProductData {
  sku: ProductSku
  name: string
  description: Option.Option<string>
}

export interface UpdateProductData {
  name: string
  description: Option.Option<string>
}

export class ProductCatalog extends Effect.Service<ProductCatalog>()("ProductCatalog", {
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    yield* sql`
      CREATE TABLE IF NOT EXISTS products (
        sku TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      )
    `

    const listAll = flow(
      SqlSchema.findAll({
        Request: Schema.Void,
        Result: Product,
        execute: () => sql`SELECT * FROM products ORDER BY sku`
      }),
      Effect.catchAllCause((cause) => {
        return new ProductCatalogError({ cause: Cause.pretty(cause) })
      })
    )

    const getProduct = flow(
      SqlSchema.single({
        Request: ProductSku,
        Result: Product,
        execute: (sku) => sql`SELECT * FROM products WHERE sku = ${sku}`
      }),
      Effect.catchTags({
        "NoSuchElementException": () => new ProductNotFoundError(),
        "ParseError": (_) => new ProductCatalogError({ cause: String(_) }),
        "SqlError": (_) => new ProductCatalogError({ cause: String(_.cause) })
      })
    )

    const _findProductsBySku = SqlSchema.findAll({
      Request: ProductSku,
      Result: Product,
      execute: (sku) => sql`SELECT * FROM products WHERE sku = ${sku}`
    })

    const _createProductRecord = SqlSchema.void({
      Request: Product,
      execute: (product) =>
        sql`INSERT INTO products (sku, name, description) VALUES (${product.sku}, ${product.name}, ${
          product.description || null
        })`
    })

    function createProduct(data: CreateProductData) {
      return Effect.gen(function*() {
        const existingProducts = yield* _findProductsBySku(data.sku)
        if (existingProducts.length > 0) return yield* Effect.fail(new ProductSkuAlreadyExistsError({ sku: data.sku }))

        const product = Product.make({
          sku: data.sku,
          name: data.name,
          description: data.description
        })

        yield* _createProductRecord(product)

        return product
      }).pipe(
        Effect.catchTag("ParseError", (_) => new ProductCatalogError({ cause: String(_) })),
        Effect.catchTag("SqlError", (_) => new ProductCatalogError({ cause: String(_.cause) }))
      )
    }

    const _updateProductRecord = SqlSchema.void({
      Request: Product,
      execute: (product) =>
        sql`UPDATE products SET name = ${product.name}, description = ${
          product.description || null
        } WHERE sku = ${product.sku}`
    })

    function updateProduct(sku: ProductSku, data: UpdateProductData) {
      return Effect.gen(function*() {
        const product = yield* getProduct(sku)
        const updatedProduct = Product.make({
          ...product,
          name: data.name,
          description: data.description
        })
        yield* _updateProductRecord(updatedProduct)
        return updatedProduct
      }).pipe(
        Effect.catchTag("ParseError", (_) => new ProductCatalogError({ cause: String(_) })),
        Effect.catchTag("SqlError", (_) => new ProductCatalogError({ cause: String(_.cause) }))
      )
    }

    function deleteProduct(sku: ProductSku) {
      return sql`DELETE FROM products WHERE sku = ${sku}`.pipe(
        Effect.asVoid,
        Effect.catchTag("SqlError", (_) => new ProductCatalogError({ cause: String(_.cause) }))
      )
    }

    return { listAll, getProduct, createProduct, updateProduct, deleteProduct }
  })
}) {}
