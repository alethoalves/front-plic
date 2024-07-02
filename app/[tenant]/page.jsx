import styles from "./page.module.scss";
import Auth from "@/components/Auth";
import { getTenant } from "../api/serverReq";

const Page = async ({params}) => {
  const tenant = params.tenant;
  const tenantExists = await getTenant({ slug: tenant });
  const pathLogo = tenantExists.tenant ? tenantExists.tenant.pathLogo :'/';
  const slug = tenantExists.tenant ? tenantExists.tenant.slug :'';
  return (
   <main className={styles.container} > 
    <Auth params={params} slug={slug}  pathLogo={pathLogo}/>
   </main>
  );
}

export default Page;