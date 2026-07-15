"use client";
import itensMenu from "@/lib/menuSelecao";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import styles from "./MenuInscricao.module.scss";

const MenuSelecao = () => {
  const pathname = usePathname();
  const { tenant, ano } = useParams();

  return (
    <div className={styles.nav}>
      {itensMenu.map((item, i) => {
        const Icon = item.icon;
        const resolvedPath = item.path
          .replace("[tenant]", tenant)
          .replace("[ano]", ano);
        const isActive = pathname === resolvedPath;

        return (
          <Link
            key={i}
            href={resolvedPath}
            passHref
            className={`${styles.btn} ${isActive ? styles.selected : ""}`}
          >
            <Icon />
            <p>{item.title}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default MenuSelecao;
