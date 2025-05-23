import { Rx } from "@effect-rx/rx-react"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as Layer from "effect/Layer"
import * as SnackbarService from "./services/SnackbarService"

const Live = Layer.mergeAll(FetchHttpClient.layer, SnackbarService.SnackbarService.Default)

export const appRuntime = Rx.runtime(() => Live)
