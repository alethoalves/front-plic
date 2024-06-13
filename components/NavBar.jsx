import styles from './NavBar.module.scss'

const SideNav = () => {
    return (
    <div className={styles.navBar}>
        <div className={styles.navBarItem1}>...</div>
        <div className={styles.navBarItem2}>
            <div className={styles.notifications}>...|</div>
            <div className={styles.profile}>...</div>
        </div>
    </div>
    );
  };
  
  export default SideNav;