"use client";
import { RiLogoutBoxRLine } from "@remixicon/react";
import styles from "./NavBar.module.scss";
import { logout } from "@/app/api/client/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SideNav = ({ slug }) => {
  const router = useRouter();
  const handleClick = () => {
    logout();
    router.replace(`/${slug}`);
  };
  return (
    <div className={styles.navBar}>
      <div className={styles.navBarItem1}></div>
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

export default SideNav;
