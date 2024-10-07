import Image from "next/image";
import styles from "./NoData.module.scss";

const Updated = ({ description = "Nada encontrado :/", subscription }) => {
  return (
    <div className={styles.nadaEncontrado}>
      <div className={styles.logo}>
        <Image
          priority
          fill
          src={`/image/updated.svg`}
          alt="logo"
          sizes="300 500 700"
        />
      </div>
      <h6>{description}</h6>
      {subscription && <p>{subscription}</p>}
    </div>
  );
};

export default Updated;
