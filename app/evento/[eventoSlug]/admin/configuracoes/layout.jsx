import Header from "@/components/Header";
import styles from "./layout.module.scss";

const Layout = async ({ children }) => {
  return (
    <main className={styles.main}>
      <Header
        className="mb-3"
        subtitulo="Configurações do evento"
        descricao="Edite as informações gerais, datas, aparência e regras de avaliação desta edição."
      />
      <div className={styles.content}>
        <div className={styles.navContent}>{children}</div>
      </div>
    </main>
  );
};

export default Layout;
