// components/Skeleton.jsx
import React from "react";
import styles from "./UnderConstruction.module.scss";
import Image from "next/image";

const UnderConstruction = () => {
  return (
    <div className={styles.logo}>
      <Image
        priority
        fill
        src={`/image/underConstruction.svg`}
        alt="logo"
        sizes="300 500 700"
      />
    </div>
  );
};

export default UnderConstruction;
