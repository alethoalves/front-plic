import styles from "./page.module.scss";
import Signin from "@/components/Signin";
import { headers } from "next/headers";

const Page = async ({ params }) => {
  const tenant = params.tenant;
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");

  return (
    <main className={styles.container}>
      <Signin slug={tenant} pathLogo={pathLogo} />
    </main>
  );
};

export default Page;
