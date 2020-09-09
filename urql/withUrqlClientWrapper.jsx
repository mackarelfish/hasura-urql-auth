import Router from "next/router";
import { dedupExchange, fetchExchange } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import { devtoolsExchange } from "@urql/devtools";
import { withUrqlClient } from "next-urql";

import { authExchange } from "./exchanges/authExchange.ts";
import { errorExchange } from "./exchanges/errorExchange.ts";

import {
  refreshToken,
  setToken,
  isTokenExpired,
  getToken,
} from "../lib/auth/token";

export default function withUrqlClientWrapper(options, Component) {
  return withUrqlClient(
    (ssrExchange, _ctx) => ({
      url: "http://localhost:8080/v1/graphql",
      maskTypename: true,
      fetchOptions: {
        credentials: "include",
      },
      exchanges: [
        devtoolsExchange,
        dedupExchange,
        cacheExchange({
          keys: {
            user_role: () => null,
          },
          updates: {
            Mutation: {
              login: (_result, _args, cache, _info) => {
                cache.invalidate({ __typename: "Query" }, "user");
              },
            },
          },
        }),
        errorExchange({
          onError: (error) => {
            if (
              error.graphQLErrors.some((e) =>
                e.extensions?.code.includes("validation-failed")
              )
            )
              Router.push("/login");
          },
        }),
        ssrExchange,
        authExchange({
          getAuth: async ({ mutate }) => {
            const tokenData = await refreshToken(mutate);
            if (tokenData) {
              setToken(tokenData);
              return tokenData;
            }
            setToken(null);
            return null;
          },
          willAuthError: () => {
            if (isTokenExpired(getToken())) {
              setToken(null);
              return true;
            }
            return false;
          },
          didAuthError: ({ error }) => {
            const authError = error.graphQLErrors.some((e) =>
              e.extensions?.code.includes("invalid-jwt")
            );
            if (authError) setToken(null);

            return authError;
          },
          addAuthToOperation: ({ operation }) => {
            const authState = getToken();
            // the token isn't in the auth state, return the operation without changes
            if (!authState || !authState.token) {
              return operation;
            }

            // fetchOptions can be a function (See Client API) but you can simplify this based on usage
            const fetchOptions =
              typeof operation.context.fetchOptions === "function"
                ? operation.context.fetchOptions()
                : operation.context.fetchOptions || {};

            return {
              ...operation,
              context: {
                ...operation.context,
                fetchOptions: {
                  ...fetchOptions,
                  headers: {
                    ...fetchOptions.headers,
                    Authorization: `Bearer ${authState.token}`,
                  },
                },
              },
            };
          },
        }),
        fetchExchange,
      ],
    }),
    options
  )(Component);
}
