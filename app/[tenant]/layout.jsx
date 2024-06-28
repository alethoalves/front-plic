export const metadata = {
  title: "Login | PLIC",
};

const Layout = ({ children, params }) => {
  return (
    <div>
      {params.tenant}
      {children}
    </div>
  );
}

export default Layout;