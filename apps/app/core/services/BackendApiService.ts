import { HttpApiClient } from "@effect/platform"
import { ProductApi } from "@warehouse/domain/ProductApi"
import { Effect } from "effect"

export class BackendApiService extends Effect.Service<BackendApiService>()("BackendApiService", {
  accessors: true,
  effect: HttpApiClient.make(ProductApi, {
    baseUrl: "http://localhost:3000/"
  })
}) {}
