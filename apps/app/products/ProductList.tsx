import { useRxValue } from "@effect-rx/rx-react"
import * as Result from "@effect-rx/rx/Result"
import * as HttpApiClient from "@effect/platform/HttpApiClient"
import { ProductApi } from "@warehouse/domain/ProductApi"
import { Effect } from "effect"
import * as RNP from "react-native-paper"
import { appRuntime } from "../core/appRuntime"

const productList = appRuntime.rx(() =>
  Effect.gen(function*() {
    const client = yield* HttpApiClient.make(ProductApi, {
      baseUrl: "http://localhost:3000/"
    })

    return yield* client.products.getAllProducts()
  })
)

export default function ProductList() {
  const products = useRxValue(productList)

  const content = Result.match(products, {
    onInitial: () => <RNP.ActivityIndicator animating={true} />,
    onFailure: (error) => <RNP.Text>{String(error)}</RNP.Text>,
    onSuccess: ({ value }) => (
      <>
        {value.map((product) => (
          <RNP.List.Item key={product.sku.value} title={product.name} description={product.description} />
        ))}
      </>
    )
  })

  return (
    <>
      <RNP.Appbar.Header>
        <RNP.Appbar.Content title="Product List" />
      </RNP.Appbar.Header>
      {content}
    </>
  )
}
