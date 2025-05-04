import { RiFoldersLine, RiGraduationCapLine, RiInformationLine } from '@remixicon/react';
import styles from "./page.module.scss";


const Page = ({ params }) => {
  
  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.icon}><RiFoldersLine/></div>
          <h5>Orientador: Fulano de Tal</h5>
        </div>
        <div className={styles.mainContent}>
          
        </div>
      </div>
    </div>
  );
};

export default Page;
