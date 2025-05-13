import { FetchHttpClient, HttpApiClient } from "@effect/platform"
import { ProductApi } from "@warehouse/domain/ProductApi"
import type { Cause } from "effect"
import { Data, Effect, Exit, Layer, ManagedRuntime } from "effect"
import { StatusBar } from "expo-status-bar"
import { useEffect, useReducer, useState } from "react"
import { Button, StyleSheet, Text, View } from "react-native"

interface RemoteDataLoading {
  readonly _tag: "Loading"
}

interface RemoteDataSuccess<A> {
  readonly _tag: "Success"
  readonly value: A
}

interface RemoteDataFailure<E> {
  readonly _tag: "Failure"
  readonly error: E
}

type RemoteData<A, E> = RemoteDataLoading | RemoteDataSuccess<A> | RemoteDataFailure<E>

interface RemoteDataEnum extends Data.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: RemoteData<this["A"], this["B"]>
}

const RemoteData = Data.taggedEnum<RemoteDataEnum>()

function makeRuntimeHooks<RR, ER>(appRuntime: ManagedRuntime.ManagedRuntime<RR, ER>) {
  function useRemoteData<A, E>(fa: Effect.Effect<A, E, RR>): RemoteData<A, Cause.Cause<E | ER>> {
    const [state, setState] = useState<RemoteData<A, Cause.Cause<E | ER>>>(RemoteData.Loading())

    useEffect(() => {
      const cancel = appRuntime.runCallback(fa, {
        onExit: (exit) => {
          if (Exit.isSuccess(exit)) {
            setState(RemoteData.Success({ value: exit.value }))
          } else {
            setState(RemoteData.Failure({ error: exit.cause }))
          }
        }
      })
      return cancel
    }, [fa])

    return state
  }

  return { useRemoteData }
}

class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function*() {
    yield* Effect.log("constructing service...")

    return {}
  })
}) {}

const MyAppLive = FetchHttpClient.layer.pipe(
  Layer.provideMerge(MyService.Default)
)

const appRuntime = ManagedRuntime.make(MyAppLive)
const { useRemoteData } = makeRuntimeHooks(appRuntime)

const program = Effect.gen(function*() {
  const client = yield* HttpApiClient.make(ProductApi, {
    baseUrl: "http://localhost:3000/"
  })

  return yield* client.products.getAllProducts()
})

function ProductFetcherComponer() {
  const products = useRemoteData(program)

  return RemoteData.$match(products, {
    "Loading": () => <Text>Loading...</Text>,
    "Failure": ({ error }) => <Text>{String(error)}</Text>,
    "Success": ({ value }) => (
      <>
        <Text>Product List</Text>
        {value.map((_) => (
          <View key={_.id.value}>
            <Text>{_.name}</Text>
          </View>
        ))}
      </>
    )
  })
}

export default function App() {
  const [showProducts, toggleProducts] = useReducer((s) => !s, false)
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Button onPress={toggleProducts} title="Toggle Products" />
      {showProducts ? <ProductFetcherComponer /> : null}
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
})
