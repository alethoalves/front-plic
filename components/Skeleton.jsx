// components/Skeleton.jsx
import React from "react";
import styles from "./Skeleton.module.scss";

const Skeleton = () => {
  return (
    <div className={`${styles.skeleton}  `}>
      <div className={styles.header}></div>
      <div className={styles.body}></div>
      <div className={styles.footer}></div>
    </div>
  );
};

export default Skeleton;
