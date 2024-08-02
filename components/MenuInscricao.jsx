'use client'

import itensMenu from "@/lib/menuInscricao";
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

import styles from './MenuInscricao.module.scss'

const MenuInscricao = ({ onClick }) => {
  const pathname = usePathname();
  const { tenant,idInscricao } = useParams();

  return (
    <div className={styles.nav}>
      {itensMenu.map((item, i) => {
        const Icon = item.icon;
        const resolvedPath = item.path
          .replace('[tenant]', tenant)
          .replace('[idInscricao]', idInscricao);
        const isActive = pathname === resolvedPath;

        return (
          <Link key={i} href={resolvedPath} passHref className={`${styles.btn} ${isActive ? styles.selected : ''}`}>
            <Icon />
            <p>{item.title}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default MenuInscricao;
