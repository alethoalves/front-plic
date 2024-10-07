"use client";
import { RiLogoutBoxRLine } from "@remixicon/react";
import styles from "./NavBarAluno.module.scss";
import { logout } from "@/app/api/client/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

const NavBarAluno = ({ pathLogo, slug }) => {
  const router = useRouter();
  const handleClick = () => {
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
        <div className={styles.notifications}></div>
        <div className={styles.logout} onClick={handleClick}>
          <p>Sair</p>
          <RiLogoutBoxRLine />
        </div>
      </div>
    </div>
  );
};

export default NavBarAluno;
