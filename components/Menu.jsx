"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

import styles from "./Menu.module.scss";
import { useEffect, useState } from "react";
import { getEditais } from "@/app/api/client/edital";
import { getCookie, setCookie } from "cookies-next";

const Menu = ({ onClick, itensMenu, existeEdital, gestor = false }) => {
  const pathname = usePathname();
  const { tenant, eventoSlug, edicao } = useParams();
  const [ano, setAno] = useState(null);

  useEffect(() => {
    if (gestor) {
      const fetchData = async () => {
        const anoSelected = getCookie("anoSelected");
        const editaisData = await getEditais(tenant);

        if (editaisData.length > 0) {
          const anoValidado = editaisData.some(
            (edital) => edital.ano === parseInt(anoSelected)
          );

          let finalAno;
          if (anoValidado) {
            finalAno = anoSelected;
          } else {
            const editaisOrdenados = [...editaisData].sort(
              (a, b) => b.ano - a.ano
            );
            finalAno = editaisOrdenados[0].ano;
            setCookie("anoSelected", finalAno, {
              maxAge: 60 * 60 * 24 * 365,
            });
          }
          setAno(finalAno);
        }
      };

      fetchData();
    }
  }, [gestor, tenant]);

  const renderMenuItem = (item, i, isGroupItem = false) => {
    const Icon = item.icon;
    const resolvedPath = item.path
      ?.replace("[tenant]", tenant || eventoSlug)
      ?.replace("[ano]", ano)
      ?.replace("[edicao]", edicao);

    // Verificação específica para a rota "Home"
    const isActive =
      i === 0 && !isGroupItem
        ? pathname === resolvedPath
        : resolvedPath &&
          pathname.startsWith(resolvedPath) &&
          pathname !== `/${tenant}/gestor/${ano}`;

    if (!item.path) return null;

    return (
      <Link key={i} href={resolvedPath} onClick={onClick} passHref>
        <li
          className={`${isActive ? styles.active : ""} ${
            isGroupItem ? styles.groupItem : ""
          }`}
        >
          <div className={styles.icon}>{Icon && <Icon />}</div>
          <p>{item.title}</p>
        </li>
      </Link>
    );
  };

  const renderGroup = (group, groupIndex) => {
    return (
      <div key={groupIndex} className={styles.group}>
        <div className={styles.groupTitle}>
          <div className={styles.icon}>{group.icon && <group.icon />}</div>
          <p>{group.title}</p>
        </div>
        <ul className={styles.groupItems}>
          {group.itens.map((item, i) => renderMenuItem(item, i))}
        </ul>
      </div>
    );
  };

  return (
    <ul className={styles.menu}>
      {itensMenu.map((item, i) => {
        if (item.group) {
          return renderGroup(item.group, i);
        }
        return renderMenuItem(item, i);
      })}
    </ul>
  );
};

export default Menu;
