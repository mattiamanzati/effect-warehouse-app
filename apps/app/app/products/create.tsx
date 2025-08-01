import { Rx, useRx, useRxSet } from "@effect-rx/rx-react"
import { CreateProductPayload } from "@warehouse/domain/ProductApi"
import { Effect, Schema } from "effect"
import { useRouter } from "expo-router"
import * as React from "react"
import { appRuntime } from "../../core/appRuntime"
import { AppBar, Button, Form, FormField, TextField } from "../../core/components/index"
import { createUiMessageBag } from "../../core/hooks"
import * as BackendApiService from "../../core/services/BackendApiService"
import { RouterService } from "../../core/services/RouterService"
import * as SnackbarService from "../../core/services/SnackbarService"

const productSku = Rx.make("")
const productName = Rx.make("")
const productDescription = Rx.make("")
const messageBag = createUiMessageBag({
  sku: ["sku"],
  name: ["name"],
  description: ["description"]
})

const productCreate = appRuntime.fn((_: void, ctx) =>
  Effect.gen(function*() {
    const snackService = yield* SnackbarService.SnackbarService
    const client = yield* BackendApiService.BackendApiService

    const payload = yield* Schema.decode(CreateProductPayload)({
      sku: ctx(productSku),
      name: ctx(productName),
      description: ctx(productDescription)
    })

    const product = yield* client.products.createProduct({
      payload
    })

    yield* snackService.addNotification({
      text: `Product ${product.name} created`
    })

    yield* RouterService.navigate("/products")
  }).pipe(
    messageBag.catchParseIssues,
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
  const messages = messageBag.useErrors()
  const unmatchedErrors = messageBag.useUnmatchedErrors()

  return (
    <>
      <AppBar onBack={onBack} title="Create Product" />
      <Form>
        <FormField>
          <TextField value={sku} onChangeText={setSku} label="SKU" />
          {messages.sku}
        </FormField>
        <FormField>
          <TextField value={name} onChangeText={setName} label="Name" />
          {messages.name}
        </FormField>
        <FormField>
          <TextField value={description} onChangeText={setDescription} label="Description" />
          {messages.description}
        </FormField>
        {unmatchedErrors}
        <Button title="Create" onPress={addProduct} />
      </Form>
    </>
  )
}
