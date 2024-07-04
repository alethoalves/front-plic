import { NextResponse } from 'next/server';
import { getUserData, isLogged, userTenant } from './app/api/serverReq';

export const middleware = async (request) => {
    const url = new URL(request.url);
    const tenantMatch = url.pathname.match(/^\/([^\/]*)/);
    const tenant = tenantMatch ? tenantMatch[1] : null;
    
    try {
        // Verificação se a rota é apenas `/:tenant`
        if (tenant && !url.pathname.includes(`/${tenant}/gestor`)) {
            
            const logged = await isLogged();
            if (logged) {
                const userData = await getUserData();
                const userTenantExists = await userTenant({ idUser: userData.data.id, slug: tenant });
                
                if (userTenantExists) {
                    
                    // Redireciona para `/:tenant/gestor`
                    url.pathname = `/${tenant}/gestor`;
                    return NextResponse.redirect(url);
                }
            }
        }
        
        // Verificação para rotas `/:tenant/gestor`
        if (url.pathname.startsWith(`/${tenant}/gestor`)) {
            const logged = await isLogged();
            
            if (logged) {
                const userData = await getUserData();
                const userTenantExists = await userTenant({ idUser: userData.data.id, slug: tenant });
                if (!userTenantExists) {
                    return redirectToSignIn(request);
                }
                return NextResponse.next();
            } else {
                return redirectToSignIn(request);
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return redirectToSignIn(request);
    }
};

const redirectToSignIn = (request) => {
    const url = new URL(request.url);
    const tenantMatch = url.pathname.match(/^\/([^\/]*)/);
    url.pathname = `/${tenantMatch[1]}`;
    return NextResponse.redirect(url);
};

export const config = {
    matcher: ['/:tenant*/gestor/:path*']
};
