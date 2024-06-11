import styles from "./page.module.scss";

const Page = () => {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h1>
          Página inicial 
        </h1>
        <ul>
          <li><p>Gestor</p></li>
          <li><p>Participante</p></li>
        </ul>
      </div>
    </main>
  );
}
export default Page;