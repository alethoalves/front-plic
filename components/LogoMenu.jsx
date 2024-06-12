import Image from "next/image";
import logo from "@/public/logo.svg"

const LogoMenu = () => {
    return (
      <div className="LogoMenu">
        <div className="logo-img">
          <Image src={logo} fill={true} alt="Logomarca da PLIC - Plataforma de Iniciação Científica"/>
        </div>
        
        <p>PLIC<strong>.gestor</strong></p>
      </div>
    );
  };
  
  export default LogoMenu;