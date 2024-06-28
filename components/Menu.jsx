'use client'

import itensMenu from "@/lib/menuItens";
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

import styles from './Menu.module.scss'

const Menu = ({onClick}) => {
  const pathname = usePathname();
  const { tenant } = useParams();
    return (
      <ul className={styles.menu}>
        {itensMenu.map((item, i) => {
          const Icon = item.icon;
          const resolvedPath = item.path.replace('[tenant]', tenant);
          return (
            <Link key={i} href={resolvedPath} onClick={onClick}>
            <li className={`${pathname === resolvedPath && styles.active}`} >
              <div className={styles.icon}>
                {Icon && <Icon />}
              </div>
              <p>{item.title}</p>
            </li>
            </Link>
            
          );
        })}
      </ul>
    );
  };
  
  export default Menu;