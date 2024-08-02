import { NextResponse } from "next/server";
import { getTenant, pingGestor } from "./app/api/serverReq";
import { getCookie } from "cookies-next";
import { cookies } from "next/headers";

export const middleware = async (request) => {
  // Recebe um request, extrai a URL e identifica o tenant a partir do caminho.
  const url = new URL(request.url);
  const tenantMatch = url.pathname.match(/^\/([^\/]*)/);
  const tenant = tenantMatch ? tenantMatch[1] : null;
  const urlToSignin = new URL(request.url);
  urlToSignin.pathname = `/${tenant}`;
  const urlToRoot = new URL(request.url);
  urlToRoot.pathname = `/`;
  const urlToAvaliador = new URL(request.url);
  urlToAvaliador.pathname = `/avaliador/signin`;
  const urlToGestor = new URL(request.url);
  urlToGestor.pathname = `/${tenant}/gestor`;
  const { pathname } = request.nextUrl;
  const token = getCookie("authToken", { cookies });
  console.log('ENTROU NO MIDDLEWARE')

  
  try {
    /******************
     * MIDDLEWARE PARA A RAIZ (/) OU ERROR/SERVER
     * ****************/
    if (
      /^\/$/.test(pathname) ||  //RAIZ
      url.pathname.startsWith(`/errors/server`)) // ERRO
    {
      console.log('ENTROU NA RAIZ OU NO ERRO') 
      return NextResponse.next();
    }

    /******************
     * MIDDLEWARE PARA AVALIADOR (/avaliador)
     * ****************/
    // APENAS /avaliador/signin
    if (/^\/avaliador\/signin$/.test(pathname)) {
      console.log('ENTROU NA ROTA /avaliador/signin')
      return NextResponse.next();
    }

    //Rotas especificas para avaliador, colocar antes das abaixo

    // /avaliador ou /avaliador/ ou avaliador/qualquercoisa
    if (/^\/avaliador(\/|$)/.test(pathname)) {
      console.log('ENTROU EM QUALQUER ROTA que começa com /avaliador');
      return NextResponse.redirect(urlToAvaliador);
    }
    /******************
     * MIDDLEWARE PARA TODAS AS ROTAS EXCETO AS ROTAS ACIMA
     * ****************/
    const tenantExists = await getTenant(tenant);
    if (!tenantExists) {
      return NextResponse.redirect(urlToRoot);
    }
    const NextResponseWithTenant = NextResponse.next();
    NextResponseWithTenant.headers.set(
      "x-tenant-primary-color",
      tenantExists.primaryColor || ""
    );
    NextResponseWithTenant.headers.set(
      "x-tenant-path-logo",
      tenantExists.pathLogo || ""
    );
    const pongGestor = await pingGestor(token, tenant);
    /******************
     * MIDDLEWARE PARA SIGNIN (apenas /:tenant, não inclui /:tenant/qualquercoisa)
     * ****************/
    if (/^\/[^\/]+$/.test(pathname)) {
      //Se houver gestor:
      if (pongGestor) return NextResponse.redirect(urlToGestor);
      return NextResponseWithTenant
    }
    /******************
     * MIDDLEWARE PARA AS ROTAS INTERNAS DE GESTOR (/:tenant)
     * ****************/
    // Middleware apenas para as rotas gestor `/:tenant/gestor`
    if (url.pathname.startsWith(`/${tenant}/gestor`)) {
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      if (!pongGestor) return NextResponse.redirect(urlToSignin);
      return NextResponseWithTenant
    }
     
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
  const errorUrl = new URL(request.url);
  errorUrl.pathname = "/errors/server";
  return NextResponse.redirect(errorUrl);
  }
};

export const config = {
  matcher: ["/((?!api|/^/$/|_next/static|_next/static|image|favicon.ico).*)"],
};
