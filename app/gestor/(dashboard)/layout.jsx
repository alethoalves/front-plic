import SideNav from "@/components/SideNav";
import NavBar from "@/components/NavBar";

import styles from "./layout.module.scss"

export const metadata = {
  title: "Dashboard | PLIC",
};

const Layout = ({ children }) => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.item1}>
        <SideNav/>
      </div>
      <div className={styles.item2}>
        <NavBar/>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;