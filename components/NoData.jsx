import Image from "next/image";
import styles from "./NoData.module.scss";

const NoData = ({ description = "Nada encontrado :/" }) => {
  return (
    <div className={styles.nadaEncontrado}>
      <div className={styles.logo}>
        <Image
          priority
          fill
          src={`/image/noData.svg`}
          alt="logo"
          sizes="300 500 700"
        />
      </div>
      <h6>{description}</h6>
    </div>
  );
};

export default NoData;
