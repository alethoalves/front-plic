import { NextResponse } from 'next/server';
import { isLogged } from './api/serverReq';

export const middleware = async (request) => {
    const { pathname } = request.nextUrl;

    try {
        const logged = await isLogged();

        if (pathname === '/auth' && logged) {
            const url = new URL(request.url);
            url.pathname = '/dashboard';
            if (url.pathname !== pathname) {
                return NextResponse.redirect(url);
            }
        }

        if (logged) {
            return NextResponse.next(); // Continua a requisição
        }

        // Redireciona para a página de login caso não esteja logado e não esteja já em /auth
        if (pathname !== '/auth') {
            return redirectToSignIn(request);
        }

        return NextResponse.next(); // Permite a requisição continuar para /auth se não estiver logado
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return redirectToSignIn(request);
    }
};

const redirectToSignIn = (request) => {
    const url = new URL(request.url);
    url.pathname = '/auth';
    return NextResponse.redirect(url);
};

export const config = {
    matcher: ['/dashboard/:path*', '/auth'], // Defina as rotas que você quer proteger
};
