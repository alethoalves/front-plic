'use client'

import itensMenu from "@/lib/menuItens";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Menu = () => {
  const pathname = usePathname();
    return (
      <ul className="Menu">
        {itensMenu.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} href={item.path}>
            <li className={`${pathname === item.path && 'active'}`} >
              <div className="icon">
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