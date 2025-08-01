import { useRxSet, useRxSuspenseSuccess } from "@effect-rx/rx-react"
import { Effect, pipe } from "effect"
import * as Stream from "effect/Stream"
import type { ViewStyle } from "react-native"
import { View } from "react-native"
import * as RNP from "react-native-paper"
import { appRuntime } from "../appRuntime"
import * as SnackbarService from "../services/SnackbarService"

export const Form = (props: React.PropsWithChildren<{ style?: ViewStyle }>) => (
  <View style={[{ padding: 16 }, props.style]}>{props.children}</View>
)
export const FormField = (props: React.PropsWithChildren<{ style?: ViewStyle }>) => (
  <View style={[{ marginBottom: 16 }, props.style]}>{props.children}</View>
)

export const TextField = (props: RNP.TextInputProps) => <RNP.TextInput {...props} mode="outlined" />

export const AppBar = (
  props: React.PropsWithChildren<{ title: string; onBack?: () => void; style?: ViewStyle }>
) => (
  <RNP.Appbar.Header>
    {props.onBack ? <RNP.Appbar.BackAction onPress={props.onBack} /> : null}
    <RNP.Appbar.Content title={props.title} />
  </RNP.Appbar.Header>
)
export const Button = (
  props: React.PropsWithChildren<
    { type?: "action" | "delete"; title: string; onPress: () => void; style?: ViewStyle }
  >
) => (
  <RNP.Button
    buttonColor={props.type === "delete" ? "#FF0000" : undefined}
    mode="contained"
    onPress={props.onPress}
    style={[{ marginBottom: 16 }, props.style]}
  >
    {props.title}
  </RNP.Button>
)

export const FAB = (
  props: React.PropsWithChildren<{ label?: string; icon: string; onPress: () => void; style?: ViewStyle }>
) => (
  <RNP.FAB
    icon={props.icon}
    label={props.label}
    style={[{ position: "absolute", bottom: 16, right: 16 }, props.style]}
    onPress={props.onPress}
  />
)

const currentSnackEntries = appRuntime.rx(() =>
  pipe(
    SnackbarService.SnackbarService,
    Effect.map((service) => service.changes),
    Stream.unwrap
  )
)

const dismissSnackEntry = appRuntime.fn((entry: SnackbarService.SnackbarNotificationItem) =>
  Effect.gen(function*() {
    const service = yield* SnackbarService.SnackbarService

    yield* service.removeNotification(entry)
  })
)

export const SnackbarProvider = (props: React.PropsWithChildren<{ style?: ViewStyle }>) => {
  const entries = useRxSuspenseSuccess(currentSnackEntries).value
  const onDismiss = useRxSet(dismissSnackEntry)
  return (
    <>
      {props.children}
      {entries.map((entry, index) => (
        <RNP.Snackbar
          key={JSON.stringify(entry) + index} /** TODO: add proper id when creating notifications */
          visible={true}
          duration={1000}
          style={entry.type === "error" ? { backgroundColor: "#FF0000" } : null}
          onDismiss={() => onDismiss(entry)}
        >
          {entry.text}
        </RNP.Snackbar>
      ))}
    </>
  )
}
