import { redirect } from 'next/navigation';
import { getTenant } from "../api/serverReq";
import colorGenerate from '@/lib/colorGenerate';

export const generateMetadata = async ({ params }) => {
  const { tenant } = params;
  return {
    title: `PLIC | ${tenant}`,
  };
}

const Layout = async ({ children, params }) => {

  const tenant = params.tenant;
  const tenantExists = await getTenant({ slug: tenant });

  if (!tenantExists.tenant) {
    redirect('/404/paginaNaoEncontrada');
  }

  const { primaryColor } = tenantExists.tenant;

  const primaryVariants = colorGenerate.createPrimaryColorVariants(primaryColor);
  const whiteVariants = colorGenerate.createWhiteColorVariants(primaryColor);

  return (
    <div style={
      {
        '--primary-darken': primaryVariants.darken,
        '--primary-dark': primaryVariants.dark,
        '--primary-normal': primaryVariants.normal,
        '--primary-light': primaryVariants.light,

        '--white-darken': whiteVariants.darken,
        '--white-dark': whiteVariants.dark,
        '--white-normal': whiteVariants.normal,
        '--white-light': whiteVariants.light
      }
    }>
      {children}
    </div>
  );
}

export default Layout;
