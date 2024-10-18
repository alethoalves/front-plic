"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

import styles from "./Menu.module.scss";

const Menu = ({ onClick, itensMenu }) => {
  const pathname = usePathname();
  const { tenant, eventoSlug } = useParams();

  return (
    <ul className={styles.menu}>
      {itensMenu.map((item, i) => {
        const Icon = item.icon;
        const resolvedPath = item.path.replace(
          "[tenant]",
          tenant || eventoSlug
        );

        // Verificação específica para a rota "Home"
        const isActive =
          i === 0
            ? pathname === resolvedPath
            : pathname.startsWith(resolvedPath) &&
              pathname !== `/${tenant}/gestor`;

        return (
          <Link key={i} href={resolvedPath} onClick={onClick} passHref>
            <li className={isActive ? styles.active : ""}>
              <div className={styles.icon}>{Icon && <Icon />}</div>
              <p>{item.title}</p>
            </li>
          </Link>
        );
      })}
    </ul>
  );
};

export default Menu;
