
import LogoMenu from "@/components/LogoMenu";
import Logo from "@/components/LogoMenu";
import Menu from "@/components/Menu";
import "@/styles/globals.scss";
import { RiFile2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";


export const metadata = {
  title: "Dashboard | PLIC",
};

const Layout = ({ children }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-item-1">
        <div className="side-nav">
          <div className="side-nav-item-1">
            <LogoMenu/>
          </div>
          <div className="side-nav-item-2">
            <Menu/>
          </div>
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