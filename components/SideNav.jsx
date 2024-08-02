"use client";
import Image from "next/image";
import Menu from "@/components/Menu";

import styles from "./SideNav.module.scss";
import { RiQuestionAnswerLine } from "@remixicon/react";
import { useState } from "react";

const SideNav = ({ pathLogo }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  return (
    <div className={`${styles.sideNav} ${sidebarOpen && styles.open}`}>
      <div className={styles.hamburguerIcon} onClick={toggleSidebar}>
        <div className={`${styles.line} ${styles.line1}`}></div>
        <div className={`${styles.line} ${styles.line2}`}></div>
        <div className={`${styles.line} ${styles.line3}`}></div>
      </div>
      <div className={styles.sideNavItem1}>
        <div className={styles.logoMenu}>
          <div className={styles.logoImg}>
            <Image
              priority
              sizes="300 500 700"
              src={`/image/${pathLogo}`}
              fill={true}
              alt="Logomarca da PLIC - Plataforma de Iniciação Científica"
            />
          </div>
        </div>
      </div>
      <div className={styles.sideNavItem2}>
        <Menu onClick={toggleSidebar} />
      </div>
      <div className={styles.sideNavItem3}>
        <div className={styles.item1}>
          <RiQuestionAnswerLine />
        </div>
        <div className={styles.item2}>
          <h6>Chamados</h6>
          <p>Gerencie os chamados dos seus usuários</p>
        </div>
      </div>
    </div>
  );
};

export default SideNav;
