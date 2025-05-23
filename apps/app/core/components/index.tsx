import { useRxSet, useRxSuspenseSuccess } from "@effect-rx/rx-react"
import { Effect, pipe } from "effect"
import * as Stream from "effect/Stream"
import * as RN from "react-native"
import * as RNP from "react-native-paper"
import { appRuntime } from "../appRuntime"
import * as SnackbarService from "../services/SnackbarService"

export const Form = (props: React.PropsWithChildren<{ style?: RN.ViewStyle }>) => (
  <RN.View style={[{ padding: 16 }, props.style]}>{props.children}</RN.View>
)
export const FormField = (props: React.PropsWithChildren<{ style?: RN.ViewStyle }>) => (
  <RN.View style={[{ marginBottom: 16 }, props.style]}>{props.children}</RN.View>
)

export const TextField = (props: RNP.TextInputProps) => <RNP.TextInput {...props} mode="outlined" />

export const AppBar = (props: React.PropsWithChildren<{ title: string; style?: RN.ViewStyle }>) => (
  <RNP.Appbar.Header>
    <RNP.Appbar.Content title={props.title} />
  </RNP.Appbar.Header>
)
export const Button = (
  props: React.PropsWithChildren<{ title: string; onPress: () => void; style?: RN.ViewStyle }>
) => (
  <RNP.Button mode="contained" onPress={props.onPress} style={[{ marginBottom: 16 }, props.style]}>
    {props.title}
  </RNP.Button>
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

export const SnackbarProvider = (props: React.PropsWithChildren<{ style?: RN.ViewStyle }>) => {
  const entries = useRxSuspenseSuccess(currentSnackEntries).value
  const onDismiss = useRxSet(dismissSnackEntry)
  return (
    <>
      {props.children}
      {entries.map((entry, index) => (
        <RNP.Snackbar
          key={index}
          visible={true}
          style={entry.type === "error" ? { backgroundColor: "#FF0000" } : null}
          onDismiss={() => onDismiss(entry)}
        >
          {entry.text}
        </RNP.Snackbar>
      ))}
    </>
  )
}
