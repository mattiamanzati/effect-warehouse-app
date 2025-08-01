import { Rx } from "@effect-rx/rx-react"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as Layer from "effect/Layer"
import * as BackendApiService from "./services/BackendApiService"
import * as RouterService from "./services/RouterService"
import * as SnackbarService from "./services/SnackbarService"

const Live = Layer.mergeAll(
  SnackbarService.SnackbarService.Default,
  RouterService.RouterService.Default,
  BackendApiService.BackendApiService.Default
).pipe(
  Layer.provide(FetchHttpClient.layer)
)

export const appRuntime = Rx.runtime(() => Live)
