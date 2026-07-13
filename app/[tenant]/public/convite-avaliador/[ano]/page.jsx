import styles from "./page.module.scss";
import { headers } from "next/headers";
import ConviteAvaliadorClient from "./ConviteAvaliadorClient";

const Page = ({ params }) => {
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");

  return (
    <main className={styles.main}>
      <ConviteAvaliadorClient
        tenant={params.tenant}
        ano={params.ano}
        pathLogo={pathLogo}
      />
    </main>
  );
};

export default Page;
