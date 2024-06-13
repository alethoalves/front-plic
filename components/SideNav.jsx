import Image from 'next/image';
import Menu from "@/components/Menu";
import logo from "@/public/logo.svg"

import styles from './SideNav.module.scss'
import { RiQuestionAnswerLine } from '@remixicon/react';

const SideNav = () => {
    return (
        <div className={styles.sideNav}>
        <div className={styles.sideNavItem1}>
          <div className={styles.logoMenu}>
            <div className={styles.logoImg}>
              <Image src={logo} fill={true} alt="Logomarca da PLIC - Plataforma de Iniciação Científica"/>
            </div>
            <p>PLIC<strong>.gestor</strong></p>
          </div>
        </div>
        <div className={styles.sideNavItem2}>
          <Menu/>
        </div>
        <div className={styles.sideNavItem3}>
          <div className={styles.item1}>
            <RiQuestionAnswerLine/>
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