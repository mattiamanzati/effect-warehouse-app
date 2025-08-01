import * as Effect from "effect/Effect"
import * as Router from "expo-router"

export class RouterService extends Effect.Service<RouterService>()("RouterService", {
  accessors: true,
  effect: Effect.sync(() => {
    function navigate(url: Router.Href) {
      return Effect.sync(() => Router.router.navigate(url))
    }

    return { navigate }
  })
}) {}
