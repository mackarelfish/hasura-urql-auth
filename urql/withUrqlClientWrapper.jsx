import Router from "next/router";
import { dedupExchange, fetchExchange } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import { withUrqlClient } from "next-urql";

import { authExchange } from "./exchanges/authExchange.ts";
import { errorExchange } from "./exchanges/errorExchange.ts";

import LOGOUT_MUTATION from "./graphql/logout.mutation";
import { refreshToken, setToken } from "../lib/auth/token";

export default function withUrqlClientWrapper(options, Component) {
  return withUrqlClient(
    (ssrExchange, _ctx) => ({
      url: "http://localhost:8080/v1/graphql",
      fetchOptions: {
        credentials: "include",
      },
      maskTypename: true,
      exchanges: [
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
        ssrExchange,
        errorExchange({
          onError: (error, operation) => {
            console.log(operation);
            console.log(error);
          },
        }),
        authExchange({
          getAuth: async ({ authState, mutate }) => {
            // try getting token from memory
            if (!authState) {
              const tokenData = await refreshToken(mutate);
              if (tokenData) {
                setToken(tokenData);
                return tokenData;
              }
            }

            if (authState) return authState;

            setToken(null);
            await mutate(LOGOUT_MUTATION);
            if (typeof window !== "undefined") Router.push("/login");
            return null;
          },
          willAuthError: ({ authState }) => {
            return !authState || new Date() > new Date(authState.expiredAt);
          },
          didAuthError: ({ error }) => {
            return error.graphQLErrors.some((e) =>
              e.message.includes("No token provided")
            );
          },
          addAuthToOperation: ({ authState, operation }) => {
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
