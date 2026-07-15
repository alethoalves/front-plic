import styles from "./layout.module.scss";
import MenuSelecao from "@/components/MenuSelecao";

const Layout = ({ children }) => {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <MenuSelecao />
        <div className={`${styles.navContent} mt-3`}>{children}</div>
      </div>
    </main>
  );
};

export default Layout;
