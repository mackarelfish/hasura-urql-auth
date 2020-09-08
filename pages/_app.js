import "../styles/globals.css";
import { createContext, useState } from "react";
import { setToken, getToken } from "../lib/auth/token";

const defaultUserContextValue = {
  tokenData: {
    token: "",
    expiredAt: "",
  },
  handleSetTokenData: null,
};

export const UserContext = createContext(defaultUserContextValue);

function MyApp({ Component, pageProps }) {
  const [tokenData, setTokenData] = useState(defaultUserContextValue.tokenData);

  function handleSetTokenData(value) {
    setToken(value);
    setTokenData(getToken());
  }

  return (
    <UserContext.Provider value={{ tokenData, handleSetTokenData }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  );
}

export default MyApp;
