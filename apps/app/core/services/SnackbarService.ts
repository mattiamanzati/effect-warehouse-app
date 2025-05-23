import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import * as SubscriptionRef from "effect/SubscriptionRef"

export interface SnackbarNotificationItem {
  text: string
  type?: "notification" | "error"
}

export class SnackbarService extends Effect.Service<SnackbarService>()("SnackbarService", {
  effect: Effect.gen(function*() {
    const notificationsRef = yield* SubscriptionRef.make([] as Array<SnackbarNotificationItem>)

    function addNotification(data: SnackbarNotificationItem) {
      return SubscriptionRef.update(notificationsRef, Array.append(data))
    }

    function removeNotification(data: SnackbarNotificationItem) {
      return SubscriptionRef.update(notificationsRef, Array.filter((_) => _ !== data))
    }

    const changes = notificationsRef.changes

    return { addNotification, removeNotification, changes }
  })
}) {}

export function ignoreLogged<A, E, R>(
  fa: Effect.Effect<A, E, R>
) {
  return Effect.flatMap(SnackbarService, (service) =>
    fa.pipe(
      Effect.catchAll(
        (error) =>
          service.addNotification({
            type: "error",
            text: `Error occurred: ${String(error)}`
          })
      ),
      Effect.catchAllDefect((defect) =>
        service.addNotification({
          type: "error",
          text: `Something very bad happened: ${String(defect)}`
        })
      )
    ))
}
