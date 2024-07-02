'use client'
import { RiCloseLine} from "@remixicon/react";
import { useEffect, useState } from "react";
import styles from './Notification.module.scss';

export function Notification({className, children}) {
    const [visible, setVisible] = useState(false);
    const [parentDisplay, setParentDisplay] = useState('block');

    useEffect(() => {
        setTimeout(() => {
          setVisible(true);
        
        }, 200); // 7 segundos de atraso
      }, []);
    
      const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => {
          setParentDisplay('none');
        }, 400); // Tempo de espera após o desaparecimento da notificação antes de ocultar a div pai
      };
    return (
        <div className={`${styles.notification} ${className} ${visible ? styles.visible : ''} ${parentDisplay==='none'?styles.none:''}`}>
            <p className="p5">{children}</p>
            <a onClick={handleDismiss}><RiCloseLine/></a>
        </div>
    )
  }

