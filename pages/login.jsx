import { useState } from "react";
import withUrqlClientWrapper from "../urql/withUrqlClientWrapper";
import { useMutation } from "urql";
import { setToken, getToken } from "../lib/auth/token";
import { useRouter } from "next/router";

function Home() {
  const LOGIN_MUTATION = `
    mutation login($usernameOrEmail: String!, $password: String!) {
      login(password: $password, usernameOrEmail: $usernameOrEmail) {
        expiredAt
        token
      }
    }
  `;

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSetValue(e, setter) {
    setter(e.target.value);
  }

  const router = useRouter();
  function handleLogin(e) {
    e.preventDefault();
    login({ usernameOrEmail, password })
      .then((res) => {
        if (res.error) throw res.error;
        setToken(res.data.login);
        router.push("/");
      })
      .catch((e) => console.error(e));
  }

  const [{}, login] = useMutation(LOGIN_MUTATION);

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={usernameOrEmail}
          onChange={(e) => handleSetValue(e, setUsernameOrEmail)}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => handleSetValue(e, setPassword)}
        />
        <button type="submit">Submit</button>
      </form>

      <p onClick={() => console.log(getToken())}>Show token</p>
    </div>
  );
}

export default withUrqlClientWrapper({}, Home);
