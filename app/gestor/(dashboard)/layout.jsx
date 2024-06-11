
import "@/styles/globals.scss";

export const metadata = {
  title: "Dashboard | PLIC",
};

const Layout = ({ children }) => {
  return (
    <div className="dashboard">
      <div className="item-1">
        <div className="side-nav">
          <div className="logo">LOGO</div>
          <div className="menu">MENU</div>
          <div className="suporte">SUPORTE</div>
        </div>
      </div>
      <div className="item-2">
        <div className="nav-bar">
          <div className="item-1">...</div>
          <div className="item-2">
            <div className="notifications">...</div>
            <div className="profile">...</div>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;