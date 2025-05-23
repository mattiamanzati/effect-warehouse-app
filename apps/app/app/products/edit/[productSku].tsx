import { Rx, useRx, useRxSet, useRxValue } from "@effect-rx/rx-react"
import * as Result from "@effect-rx/rx/Result"
import * as HttpApiClient from "@effect/platform/HttpApiClient"
import { ProductApi } from "@warehouse/domain/ProductApi"
import { Effect } from "effect"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as React from "react"
import { appRuntime } from "../../../core/appRuntime"
import { AppBar, Button, Form, FormField, TextField } from "../../../core/components/index"
import { RouterService } from "../../../core/services/RouterService"
import * as SnackbarService from "../../../core/services/SnackbarService"

const productSkuRx = Rx.make("")
const productName = Rx.make("")
const productDescription = Rx.make("")

const loadProduct = appRuntime.rx((ctx) =>
  Effect.gen(function*() {
    const productSku = ctx(productSkuRx)
    const client = yield* HttpApiClient.make(ProductApi, {
      baseUrl: "http://localhost:3000/"
    })

    const product = yield* client.products.getProduct({ path: { productSku: productSku as any } })
    ctx.set(productName, product.name)
    ctx.set(productDescription, product.description || "")
  }).pipe(
    SnackbarService.ignoreLogged
  )
)

const productUpdate = appRuntime.fn((_: void, ctx) =>
  Effect.gen(function*() {
    const snackService = yield* SnackbarService.SnackbarService
    const client = yield* HttpApiClient.make(ProductApi, {
      baseUrl: "http://localhost:3000/"
    })

    const product = yield* client.products.updateProduct({
      path: {
        productSku: (ctx(productSkuRx)) as any
      },
      payload: {
        name: ctx(productName),
        description: ctx(productDescription)
      }
    })

    yield* snackService.addNotification({
      text: `Product ${product.name} updated`
    })

    yield* RouterService.navigate("/products")
  }).pipe(
    SnackbarService.ignoreLogged
  )
)

const deleteProduct = appRuntime.fn((_: void, ctx) =>
  Effect.gen(function*() {
    const snackService = yield* SnackbarService.SnackbarService
    const client = yield* HttpApiClient.make(ProductApi, {
      baseUrl: "http://localhost:3000/"
    })

    yield* client.products.deleteProduct({
      path: {
        productSku: (ctx(productSkuRx)) as any
      }
    })

    yield* snackService.addNotification({
      text: `Product deleted`
    })

    yield* RouterService.navigate("/products")
  }).pipe(
    SnackbarService.ignoreLogged
  )
)

export default function ProductEditLoader() {
  const { productSku } = useLocalSearchParams<{
    productSku: string
  }>()
  const setProductSku = useRxSet(productSkuRx)
  React.useEffect(() => setProductSku(productSku), [productSku])
  const product = useRxValue(loadProduct)

  return Result.match(product, {
    onInitial: () => <AppBar title="Loading..." />,
    onFailure: (error) => <AppBar title={String(error)} />,
    onSuccess: () => <ProductEdit />
  })
}

export function ProductEdit() {
  const [name, setName] = useRx(productName)
  const [description, setDescription] = useRx(productDescription)
  const saveProduct = useRxSet(productUpdate)
  const router = useRouter()
  const onBack = () => router.navigate("/products")
  const onDeleteProduct = useRxSet(deleteProduct)

  return (
    <>
      <AppBar onBack={onBack} title="Update Product" />
      <Form>
        <FormField>
          <TextField value={name} onChangeText={setName} label="Name" />
        </FormField>
        <FormField>
          <TextField value={description} onChangeText={setDescription} label="Description" />
        </FormField>
        <Button title="Save" onPress={saveProduct} />
        <Button title="Delete" type="delete" onPress={onDeleteProduct} />
      </Form>
    </>
  )
}
