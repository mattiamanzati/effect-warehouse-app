import * as Array from "effect/Array"
import * as Brand from "effect/Brand"
import * as Effect from "effect/Effect"
import * as SubscriptionRef from "effect/SubscriptionRef"

export type NotificationId = number & Brand.Brand<"NotificationId">
export const NotificationId = Brand.nominal<NotificationId>()

export interface SnackbarNotificationItem {
  id: NotificationId
  text: string
  type?: "notification" | "error"
  duration?: number
}

export type CreateNotificationPayload = Omit<SnackbarNotificationItem, "id">

export class SnackbarService extends Effect.Service<SnackbarService>()("SnackbarService", {
  accessors: true,
  effect: Effect.gen(function*() {
    const notificationsRef = yield* SubscriptionRef.make([] as Array<SnackbarNotificationItem>)
    let notificationId = 0

    function addNotification(payload: CreateNotificationPayload) {
      return SubscriptionRef.update(
        notificationsRef,
        Array.append({ ...payload, id: NotificationId(notificationId++) })
      )
    }

    function removeNotification(notificationId: NotificationId) {
      return SubscriptionRef.update(notificationsRef, Array.filter((_) => _.id !== notificationId))
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
