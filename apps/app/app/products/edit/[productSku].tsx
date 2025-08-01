import { Rx, useRx, useRxSet, useRxValue } from "@effect-rx/rx-react"
import * as Result from "@effect-rx/rx/Result"
import { ProductSku } from "@warehouse/domain/Product"
import { UpdateProductPayload } from "@warehouse/domain/ProductApi"
import { Effect, Option, Schema } from "effect"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as React from "react"
import { appRuntime } from "../../../core/appRuntime"
import { AppBar, Button, Form, FormField, TextField } from "../../../core/components/index"
import { createUiMessageBag } from "../../../core/hooks"
import * as BackendApiService from "../../../core/services/BackendApiService"
import { RouterService } from "../../../core/services/RouterService"
import * as SnackbarService from "../../../core/services/SnackbarService"

const messageBag = createUiMessageBag({
  name: ["name"],
  description: ["description"]
})

const productSkuRx = Rx.make(ProductSku.make("<productSku>"))
const productName = Rx.make("")
const productDescription = Rx.make("")

const loadProduct = appRuntime.rx((ctx) =>
  Effect.gen(function*() {
    const productSku = ctx(productSkuRx)
    const client = yield* BackendApiService.BackendApiService

    const product = yield* client.products.getProduct({ path: { productSku } })
    ctx.set(productName, product.name)
    ctx.set(productDescription, Option.getOrElse(product.description, () => ""))
  }).pipe(
    SnackbarService.ignoreLogged
  )
)

const productUpdate = appRuntime.fn((_: void, ctx) =>
  Effect.gen(function*() {
    const snackService = yield* SnackbarService.SnackbarService
    const client = yield* BackendApiService.BackendApiService

    const payload = yield* Schema.decode(UpdateProductPayload)({
      name: ctx(productName),
      description: ctx(productDescription)
    })

    const product = yield* client.products.updateProduct({
      path: {
        productSku: ctx(productSkuRx)
      },
      payload
    })

    yield* snackService.addNotification({
      text: `Product ${product.name} updated`
    })

    yield* RouterService.navigate("/products")
  }).pipe(
    messageBag.catchParseIssues,
    SnackbarService.ignoreLogged
  )
)

const deleteProduct = appRuntime.fn((_: void, ctx) =>
  Effect.gen(function*() {
    const snackService = yield* SnackbarService.SnackbarService
    const client = yield* BackendApiService.BackendApiService

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
  React.useEffect(() => setProductSku(ProductSku.make(productSku)), [productSku])
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
  const messages = messageBag.useErrors()
  const unmatchedErrors = messageBag.useUnmatchedErrors()

  return (
    <>
      <AppBar onBack={onBack} title="Update Product" />
      <Form>
        <FormField>
          <TextField value={name} onChangeText={setName} label="Name" />
          {messages.name}
        </FormField>
        <FormField>
          <TextField value={description} onChangeText={setDescription} label="Description" />
          {messages.description}
        </FormField>
        {unmatchedErrors}
        <Button title="Save" onPress={saveProduct} />
        <Button title="Delete" type="delete" onPress={onDeleteProduct} />
      </Form>
    </>
  )
}
