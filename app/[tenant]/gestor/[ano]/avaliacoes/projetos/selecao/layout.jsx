import styles from "./layout.module.scss";

const Layout = ({ children }) => {
  return (
    <main className={styles.main}>
      <div className={styles.content}>{children}</div>
    </main>
  );
};

export default Layout;
