"use client";
import styles from "./Avatar.module.scss";

const Avatar = ({ nome, size = 36, className = "", onClick }) => {
  const inicial = nome?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className={`${styles.avatar} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      onClick={onClick}
    >
      {inicial}
    </div>
  );
};

export default Avatar;
