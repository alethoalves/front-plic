
import Logo from "@/components/LogoMenu";
import "@/styles/globals.scss";
import { RiQuestionAnswerLine } from "@remixicon/react";
import Image from "next/image";

export const metadata = {
  title: "Dashboard | PLIC",
};

const Layout = ({ children }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-item-1">
        <div className="side-nav">
          <div className="side-nav-item-1">
            <Logo/>
          </div>
          <div className="side-nav-item-2">MENU</div>
          <div className="side-nav-item-3">
            <div className="item-1">
              <RiQuestionAnswerLine/>
            </div>
            <div className="item-2">
              <h6>Chamados</h6>
              <p>Gerencie os chamados dos seus usuários</p>
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-item-2">
        <div className="nav-bar">
          <div className="nav-bar-item-1">...</div>
          <div className="nav-bar-item-2">
            <div className="notifications">...|</div>
            <div className="profile">...</div>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;