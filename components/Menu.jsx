'use client'

import itensMenu from "@/lib/menuItens";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Menu.module.scss'

const Menu = ({onClick}) => {
  const pathname = usePathname();
    return (
      <ul className={styles.menu}>
        {itensMenu.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} href={item.path} onClick={onClick}>
            <li className={`${pathname === item.path && styles.active}`} >
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