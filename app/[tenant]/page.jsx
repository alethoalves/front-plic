import styles from "./page.module.scss";
import Auth from "@/components/Auth";
import { getTenant } from "../api/serverReq";

const Page = async ({params}) => {
  const tenant = params.tenant;
  const tenantExists = await getTenant({ slug: tenant });
  const {pathLogo} = tenantExists.tenant;
  
  return (
   <main className={styles.container} > 
    <Auth params={params}  pathLogo={pathLogo}/>
   </main>
  );
}

export default Page;