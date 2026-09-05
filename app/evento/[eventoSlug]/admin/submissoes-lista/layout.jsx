import styles from "./layout.module.scss";

const Layout = ({ children }) => {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.navContent}>{children}</div>
      </div>
    </main>
  );
};

export default Layout;
