import styles from "./page.module.scss";
import { headers } from "next/headers";
import ConviteAvaliadorClient from "./ConviteAvaliadorClient";
import { getStatusAvaliacoesAvaliador } from "@/app/api/serverReq";

const Page = async ({ params }) => {
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");
  const avaliacoesEncerradas = await getStatusAvaliacoesAvaliador(params.tenant, params.ano);

  return (
    <main className={styles.main}>
      <ConviteAvaliadorClient
        tenant={params.tenant}
        ano={params.ano}
        pathLogo={pathLogo}
        avaliacoesEncerradas={avaliacoesEncerradas}
      />
    </main>
  );
};

export default Page;
