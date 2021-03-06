import REFRESH_MUTATION from "../../urql/graphql/refresh.mutation";

let tokenData = null;

export function getToken() {
  return tokenData || null;
}

export function setToken(value) {
  tokenData = value;
}

export function isTokenExpired(authState) {
  return authState && new Date() > new Date(authState?.expiredAt);
}

export async function refreshToken(mutate) {
  return await mutate(REFRESH_MUTATION).then(({ data }) => data?.refresh);
}
