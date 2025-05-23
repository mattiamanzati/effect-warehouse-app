import { useRxSet } from "@effect-rx/rx-react"
import * as Effect from "effect/Effect"
import type { Router } from "expo-router"
import { Slot, useRouter } from "expo-router"
import * as React from "react"
import * as RNP from "react-native-paper"
import { appRuntime } from "../core/appRuntime"
import { SnackbarProvider } from "../core/components"
import * as RouterService from "../core/services/RouterService"

const setCurrentRouter = appRuntime.fn((router: Router) =>
  Effect.gen(function*() {
    const service = yield* RouterService.RouterService
    service.setCurrentRouter(router)
  })
)

export default function App() {
  // just to hijack in the expo-router instance
  const router = useRouter()
  const setRouter = useRxSet(setCurrentRouter)
  React.useEffect(() => setRouter(router), [router, setRouter])

  return (
    <RNP.PaperProvider>
      <RNP.ThemeProvider theme={RNP.MD3LightTheme}>
        <SnackbarProvider>
          <Slot />
        </SnackbarProvider>
      </RNP.ThemeProvider>
    </RNP.PaperProvider>
  )
}
