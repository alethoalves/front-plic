import styles from "./Badge.module.scss";

export const Badge = ({
  children,
  variant = "neutral",
  size = "medium",
  icon,
}) => {
  // Função helper para combinar classes
  const classNames = (...classes) => {
    return classes.filter(Boolean).join(" ");
  };

  return (
    <span className={classNames(styles.badge, styles[variant], styles[size])}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
};
