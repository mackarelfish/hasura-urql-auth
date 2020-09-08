import Head from "next/head";
import styles from "../styles/Home.module.css";

import withUrqlClientWrapper from "../urql/withUrqlClientWrapper";
import { useQuery } from "urql";

function Home() {
  const USER_QUERY = `
    query {
      user {
        id
        username
        email
        all_roles {
          role {
            id
            name
          }
        }
      }
    }
  `;

  const [{ fetching, data, error }] = useQuery({
    query: USER_QUERY,
  });

  if (fetching && !data) return <div>Loading...</div>;

  if (error) return <div>Error...</div>;

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <pre>{data && JSON.stringify(data.user, null, 2)}</pre>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  );
}

export default withUrqlClientWrapper({}, Home);
