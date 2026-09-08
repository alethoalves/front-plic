"use client";
import { useEffect, useState } from "react";
import { RiLogoutBoxRLine } from "@remixicon/react";
import styles from "./NavBarAluno.module.scss";
import { logout } from "@/app/api/client/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { resolveEventoImageSrc } from "@/lib/resolveEventoImage";
import { getCurrentUserNome } from "@/lib/headers";
import Avatar from "@/components/Avatar";

const NavBarAluno = ({ pathLogo, slug }) => {
  const router = useRouter();
  const [nome, setNome] = useState(null);

  useEffect(() => {
    setNome(getCurrentUserNome());
  }, []);

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
              src={resolveEventoImageSrc(pathLogo)}
              fill={true}
              alt="Logomarca da PLIC - Plataforma de Iniciação Científica"
            />
          </div>
        )}
      </div>
      <div className={styles.navBarItem2}>
        <div className={styles.notifications}></div>
        <div
          className={styles.perfilLink}
          onClick={() => router.push(`/${slug}/user/perfil`)}
        >
          <Avatar nome={nome} size={32} />
        </div>
        <div className={styles.logout} onClick={handleClick}>
          <p>Sair</p>
          <RiLogoutBoxRLine />
        </div>
      </div>
    </div>
  );
};

export default NavBarAluno;
