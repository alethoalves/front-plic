import colorGenerate from "@/lib/colorGenerate";
import styles from "./page.module.scss";
import { headers } from "next/headers";

export const generateMetadata = async ({ params }) => {
  const { tenant } = params;
  return {
    title: `PLIC | ${tenant}`,
  };
};

const Layout = async ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const primaryColor = headersList.get("x-tenant-primary-color");

  const primaryVariants =
    colorGenerate.createPrimaryColorVariants(primaryColor);
  const whiteVariants = colorGenerate.createWhiteColorVariants(primaryColor);

  return (
    <div
      className={styles.main}
      style={{
        "--primary-darken": primaryVariants.darken,
        "--primary-dark": primaryVariants.dark,
        "--primary-normal": primaryVariants.normal,
        "--primary-light": primaryVariants.light,

        "--white-darken": whiteVariants.darken,
        "--white-dark": whiteVariants.dark,
        "--white-normal": whiteVariants.normal,
        "--white-light": whiteVariants.light,
      }}
    >
      {children}
    </div>
  );
};

export default Layout;
