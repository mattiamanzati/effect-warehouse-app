import { HttpApiBuilder, HttpApiEndpoint } from "@effect/platform"
import * as Product from "@rsp-app/domain/Product"
import { Effect, Layer } from "effect"
import { TodosRepository } from "./TodosRepository.js"

const TestEndpoint = HttpApiEndpoint.post("test", "/test").addSuccess(Product.ProductId).setPayload(Product.Product)

export const ApiLive = HttpApiBuilder.api(TodosApi).pipe(
  Layer.provide(TodosApiLive)
)
