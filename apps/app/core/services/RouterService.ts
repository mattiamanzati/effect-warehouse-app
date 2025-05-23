import * as Effect from "effect/Effect"
import type { Router } from "expo-router"

export class RouterService extends Effect.Service<RouterService>()("RouterService", {
  accessors: true,
  effect: Effect.sync(() => {
    let router: Router | null = null

    function navigate(url: string) {
      return Effect.sync(() => router!.navigate(url))
    }

    function setCurrentRouter(
      newRouter: Router
    ) {
      router = newRouter
    }

    return { navigate, setCurrentRouter }
  })
}) {}
