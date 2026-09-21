import styles from "./layout.module.scss";

// Layout próprio do wizard mobile do avaliador. Esta rota (/avaliar) é IRMÃ
// de /avaliador, não filha dela — de propósito, porque layouts do Next.js
// nested herdam o layout de toda pasta ancestral: se isso morasse dentro de
// avaliador/, teria puxado SideNav/NavBarAvaliadorEvento de
// avaliador/layout.jsx (que segue cobrindo a tela antiga
// /avaliador/avaliacoes) mesmo com este layout.jsx próprio. Ver
// CabecalhoWizard pro substituto leve de navegação/logout dentro do wizard.
const Layout = ({ children }) => {
  return <div className={styles.wrapper}>{children}</div>;
};

export default Layout;
