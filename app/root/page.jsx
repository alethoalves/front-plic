import styles from "./page.module.scss";
import Signin from "@/components/Signin";

const Page = async ({ params }) => {
  const tenant = params.tenant;
  // Acessar os cabeçalhos da requisição
  const pathLogo = "plicRoot.png";

  return (
    <main className={styles.container}>
      <Signin slug={tenant} pathLogo={pathLogo} isRoot={true} />
    </main>
  );
};

export default Page;
