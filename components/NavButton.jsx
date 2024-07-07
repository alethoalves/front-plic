
import styles from './NavButton.module.scss'


// Componente de Navegação
const NavButton = ({ icon: Icon, label, isActive, onClick }) => (
  <div
    className={`${styles.btn} ${isActive ? styles.selected : ''}`}
    onClick={onClick}
  >
    <Icon />
    <p>{label}</p>
  </div>
);
  
  export default NavButton;