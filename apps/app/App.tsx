import * as RNP from "react-native-paper"
import { SnackbarProvider } from "./core/components"
import ProductList from "./products/ProductCreate"

export default function App() {
  return (
    <RNP.PaperProvider>
      <RNP.ThemeProvider theme={RNP.MD3LightTheme}>
        <SnackbarProvider>
          <ProductList />
        </SnackbarProvider>
      </RNP.ThemeProvider>
    </RNP.PaperProvider>
  )
}
