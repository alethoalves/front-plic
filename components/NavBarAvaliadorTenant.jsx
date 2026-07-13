"use client";
import { RiLogoutBoxRLine } from "@remixicon/react";
import styles from "./NavBarAvaliadorTenant.module.scss";
import { logout } from "@/app/api/client/auth";
import { useRouter, usePathname, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import itensMenu from "@/lib/menuItensAvaliadorTenant";

const NavBarAvaliadorTenant = ({ pathLogo, slug }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant } = useParams();

  const handleLogout = () => {
    logout();
    router.replace(`/${slug}`);
  };

  return (
    <div className={styles.navBar}>
      <div className={styles.navBarItem1}>
        {pathLogo && (
          <div className={styles.logoImg}>
            <Image
              priority
              sizes="300 500 700"
              src={`/image/${pathLogo}`}
              fill={true}
              alt="Logomarca da PLIC - Plataforma de Iniciação Científica"
            />
          </div>
        )}
      </div>
      <div className={styles.navBarItem2}>
        <ul className={styles.menu}>
          {itensMenu.map((item, i) => {
            const Icon = item.icon;
            const resolvedPath = item.path.replace("[tenant]", tenant);
            const isActive =
              i === 0
                ? pathname === resolvedPath
                : pathname.startsWith(resolvedPath);

            return (
              <Link key={i} href={resolvedPath} passHref>
                <li className={isActive ? styles.active : ""}>
                  <Icon />
                  <p>{item.title}</p>
                </li>
              </Link>
            );
          })}
        </ul>
      </div>
      <div className={styles.navBarItem3}>
        <div className={styles.notifications}></div>
        <div className={styles.logout} onClick={handleLogout}>
          <p>Sair</p>
          <RiLogoutBoxRLine />
        </div>
      </div>
    </div>
  );
};

export default NavBarAvaliadorTenant;
