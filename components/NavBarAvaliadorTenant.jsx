"use client";
import { RiLogoutBoxRLine } from "@remixicon/react";
import styles from "./NavBarAvaliadorTenant.module.scss";
import { logout } from "@/app/api/client/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { resolveEventoImageSrc } from "@/lib/resolveEventoImage";

// Navegação (menu de itens + comportamento hamburguer no mobile) é
// responsabilidade do SideNav (menuType="avaliadorTenant") — este componente
// cuida só do topo (logo em telas pequenas + logout), mesmo padrão de
// NavBarAluno.jsx.
const NavBarAvaliadorTenant = ({ pathLogo, slug }) => {
  const router = useRouter();

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
              src={resolveEventoImageSrc(pathLogo)}
              fill={true}
              alt="Logomarca da PLIC - Plataforma de Iniciação Científica"
            />
          </div>
        )}
      </div>
      <div className={styles.navBarItem2}>
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
