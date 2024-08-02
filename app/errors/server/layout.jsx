import { redirect } from "next/navigation";
import colorGenerate from "@/lib/colorGenerate";
import styles from "./page.module.scss";

const Layout = async ({ children, params }) => {
  return <div>ERRO NO SERVIDOR</div>;
  const tenant = params.tenant;
  const tenantExists = await getTenant(tenant);
  if (!tenantExists.tenant) {
    redirect("/404/paginaNaoEncontrada");
  }

  const { primaryColor } = tenantExists.tenant;
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
