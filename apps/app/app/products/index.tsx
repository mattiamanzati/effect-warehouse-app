import { useRxValue } from "@effect-rx/rx-react"
import * as Result from "@effect-rx/rx/Result"
import * as HttpApiClient from "@effect/platform/HttpApiClient"
import { ProductApi } from "@warehouse/domain/ProductApi"
import { Effect } from "effect"
import { useRouter } from "expo-router"
import * as RNP from "react-native-paper"
import { appRuntime } from "../../core/appRuntime"
import { FAB } from "../../core/components"

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
  const router = useRouter()

  const content = Result.match(products, {
    onInitial: () => <RNP.ActivityIndicator animating={true} />,
    onFailure: (error) => <RNP.Text>{String(error)}</RNP.Text>,
    onSuccess: ({ value }) => (
      <>
        {value.map((product) => (
          <RNP.List.Item
            onPress={() =>
              router.navigate({
                pathname: "/products/edit/[productSku]",
                params: { productSku: product.sku.value }
              })}
            key={product.sku.value}
            title={product.name}
            description={product.description}
          />
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
      <FAB icon="plus" onPress={() => router.navigate("/products/create")} label="Create" />
    </>
  )
}
