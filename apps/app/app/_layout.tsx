import { Slot } from "expo-router"
import * as React from "react"
import * as RNP from "react-native-paper"
import { SnackbarProvider } from "../core/components"

export default function App() {
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
