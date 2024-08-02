import { RiInformationLine } from '@remixicon/react';
import styles from "./page.module.scss";


const Page = ({ params }) => {
  
  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.icon}><RiInformationLine/></div>
          <h5>Dados gerais</h5>
        </div>
        <div className={styles.mainContent}>
          
        </div>
      </div>
    </div>
  );
};

export default Page;
