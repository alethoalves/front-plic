import styles from "./page.module.scss";

const Page = () => {
  return (
    <main className={styles.main} >
      <div className={styles.description}>
        <h4>
          Selecione a sua instituição 
        </h4>
        <ul>
          <li><p>UnB</p></li>
          <li><p>Ceub</p></li>
          <li><p>UDF</p></li>
        </ul>
      </div>
    </main>
  );
}
export default Page;