/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/products/create`; params?: Router.UnknownInputParams; } | { pathname: `/products`; params?: Router.UnknownInputParams; } | { pathname: `/products/edit`; params?: Router.UnknownInputParams; } | { pathname: `/products/edit/[productSku]`, params: Router.UnknownInputParams & { productSku: string | number; } };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/products/create`; params?: Router.UnknownOutputParams; } | { pathname: `/products`; params?: Router.UnknownOutputParams; } | { pathname: `/products/edit`; params?: Router.UnknownOutputParams; } | { pathname: `/products/edit/[productSku]`, params: Router.UnknownOutputParams & { productSku: string; } };
      href: Router.RelativePathString | Router.ExternalPathString | `/${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `/products/create${`?${string}` | `#${string}` | ''}` | `/products${`?${string}` | `#${string}` | ''}` | `/products/edit${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/products/create`; params?: Router.UnknownInputParams; } | { pathname: `/products`; params?: Router.UnknownInputParams; } | { pathname: `/products/edit`; params?: Router.UnknownInputParams; } | `/products/edit/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}` | { pathname: `/products/edit/[productSku]`, params: Router.UnknownInputParams & { productSku: string | number; } };
    }
  }
}
