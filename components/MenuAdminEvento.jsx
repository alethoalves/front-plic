"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./MenuAdminEvento.module.scss";
import { getSessoesBySlug } from "@/app/api/client/sessoes";

const MenuInscricao = ({ params, menu, onClick }) => {
  const pathname = usePathname();
  const { tenant, idInscricao } = useParams();

  return (
    <div className={styles.nav}>
      {menu.map((item, i) => {
        const Icon = item.icon;
        const resolvedPath = item.path;

        const isActive = pathname === resolvedPath;

        return (
          <Link
            key={i}
            href={resolvedPath}
            passHref
            className={`${styles.btn} ${isActive ? styles.selected : ""}`}
          >
            <p>{item.title}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default MenuInscricao;
