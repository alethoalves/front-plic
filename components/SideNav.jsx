"use client";
import Image from "next/image";
import Menu from "@/components/Menu";
import itensMenu from "@/lib/menuItens";
import itensMenuOrientador from "@/lib/menuItensOrientador";
import itensMenuAluno from "@/lib/menuItensAluno";
import itensMenuAdmin from "@/lib/menuItensAdmin";
import itensMenuAvaliador from "@/lib/menuItensAvaliador";
import itensMenuRoot from "@/lib/menuItensRoot";
import itensMenuUser from "@/lib/menuItensUser";
import itensMenuAvaliadorTenant from "@/lib/menuItensAvaliadorTenant";

import styles from "./SideNav.module.scss";
import { RiQuestionAnswerLine } from "@remixicon/react";
import { useState } from "react";

const SideNav = ({ pathLogo, menuType = "gestor" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  let menuData;
  if (menuType === "gestor") {
    menuData = itensMenu;
  }
  if (menuType === "orientador") {
    menuData = itensMenuOrientador;
  }
  if (menuType === "avaliadorTenant") {
    menuData = itensMenuAvaliadorTenant;
  }
  if (menuType === "user") {
    menuData = itensMenuUser;
  }
  if (menuType === "aluno") {
    menuData = itensMenuAluno;
  }
  if (menuType === "admin") {
    menuData = itensMenuAdmin;
  }
  if (menuType === "avaliador") {
    menuData = itensMenuAvaliador;
  }
  if (menuType === "root") {
    menuData = itensMenuRoot;
  }
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
        <Menu onClick={toggleSidebar} itensMenu={menuData} />
      </div>
      {false && (
        <div className={styles.sideNavItem3}>
          <div className={styles.item1}>
            <RiQuestionAnswerLine />
          </div>
          <div className={styles.item2}>
            <h6>Chamados</h6>
            <p>Gerencie os chamados dos seus usuários</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideNav;
