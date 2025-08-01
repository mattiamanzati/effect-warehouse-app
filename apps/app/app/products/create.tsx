import { Rx, useRx, useRxSet } from "@effect-rx/rx-react"
import * as HttpApiClient from "@effect/platform/HttpApiClient"
import { ProductSku } from "@warehouse/domain/Product"
import { ProductApi } from "@warehouse/domain/ProductApi"
import { Effect } from "effect"
import { useRouter } from "expo-router"
import { appRuntime } from "../../core/appRuntime"
import { AppBar, Button, Form, FormField, TextField } from "../../core/components/index"
import { RouterService } from "../../core/services/RouterService"
import * as SnackbarService from "../../core/services/SnackbarService"

const productSku = Rx.make("")
const productName = Rx.make("")
const productDescription = Rx.make("")

const productCreate = appRuntime.fn((_: void, ctx) =>
  Effect.gen(function*() {
    const snackService = yield* SnackbarService.SnackbarService
    const client = yield* HttpApiClient.make(ProductApi, {
      baseUrl: "http://localhost:3000/"
    })

    const product = yield* client.products.createProduct({
      payload: {
        sku: ProductSku.make(ctx(productSku)),
        name: ctx(productName),
        description: ctx(productDescription)
      }
    })

    yield* snackService.addNotification({
      text: `Product ${product.name} created`
    })

    yield* RouterService.navigate("/products")
  }).pipe(
    SnackbarService.ignoreLogged
  )
)

export default function ProductList() {
  const [sku, setSku] = useRx(productSku)
  const [name, setName] = useRx(productName)
  const [description, setDescription] = useRx(productDescription)
  const addProduct = useRxSet(productCreate)
  const router = useRouter()
  const onBack = () => router.navigate("/products")

  return (
    <>
      <AppBar onBack={onBack} title="Create Product" />
      <Form>
        <FormField>
          <TextField value={sku} onChangeText={setSku} label="SKU" />
        </FormField>
        <FormField>
          <TextField value={name} onChangeText={setName} label="Name" />
        </FormField>
        <FormField>
          <TextField value={description} onChangeText={setDescription} label="Description" />
        </FormField>
        <Button title="Create" onPress={addProduct} />
      </Form>
    </>
  )
}
