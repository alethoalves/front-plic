import { NextResponse } from "next/server";

import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import { getTenant } from "./app/api/server/getTenant";
import { pingAdminEvento, pingAluno, pingAvaliador, pingGestor, pingOrientador } from "./app/api/server/pings";
import { getEventoBySlug } from "./app/api/serverReq";

export const middleware = async (request) => {
  // Recebe um request, extrai a URL e identifica o tenant a partir do caminho.
  const url = new URL(request.url);
  const tenantMatch = url.pathname.match(/^\/([^\/]*)/);
  const tenant = tenantMatch ? tenantMatch[1] : null;
  const slugEventoMatch = url.pathname.match(/eventos\/([^\/]+)\//);
  const slugEvento = slugEventoMatch ? slugEventoMatch[1] : null;
  console.log(slugEvento)
  const urlToSignin = new URL(request.url);
  urlToSignin.pathname = `/${tenant}`;
  const urlToRoot = new URL(request.url);
  urlToRoot.pathname = `/`;
  const urlToAvaliador = new URL(request.url);
  urlToAvaliador.pathname = `/avaliador/home`;
  const urlToRootAvaliador = new URL(request.url);
  urlToRootAvaliador.pathname = `/avaliador`;
  const urlToGestor = new URL(request.url);
  urlToGestor.pathname = `/${tenant}/gestor`;
  const urlToOrientador = new URL(request.url);
  urlToOrientador.pathname = `/${tenant}/orientador`;
  const urlToAluno = new URL(request.url);
  urlToAluno.pathname = `/${tenant}/aluno`;
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
     * MIDDLEWARE PARA EVENTO (/evento)
     * ****************/
    // APENAS /eventos/signin
    if (/^\/eventos\/signin$/.test(pathname)) {
      console.log('ENTROU NA ROTA /evento/signin')
      return NextResponse.next();
    }
   
    if (url.pathname.startsWith(`/eventos/${slugEvento}/avaliador/convite/`)) {
      console.log(`/eventos/${slugEvento}/avaliador/convite/`)
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      
      const eventoExists = await getEventoBySlug(slugEvento);
      console.log(eventoExists.pathLogo)
      if (!eventoExists) {
        return NextResponse.redirect(urlToSignin);
      }
      const NextResponseWithEvento = NextResponse.next();
      NextResponseWithEvento.headers.set(
        "x-tenant-primary-color",
        eventoExists.primaryColor || ""
      );
      NextResponseWithEvento.headers.set(
        "x-tenant-path-logo",
        eventoExists.pathLogo || ""
      );
      
      
        return NextResponseWithEvento;
    }
    
 /******************
     * MIDDLEWARE PARA AS ROTAS INTERNAS DO ADMIN DE EVENTO (/eventos/[eventoSlug]/admin)
     * ****************/
    // Middleware apenas para as rotas admin `/eventos/[eventoSlug]/admin`
    if (url.pathname.startsWith(`/eventos/${slugEvento}/admin`)) {
      console.log(`/eventos/${slugEvento}/admin`)
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      let pongAdminEvento;
      pongAdminEvento = await pingAdminEvento(token,slugEvento);
      if (!pongAdminEvento) return NextResponse.redirect(urlToSignin);
      const eventoExists = await getEventoBySlug(slugEvento);
      console.log(eventoExists.pathLogo)
      if (!eventoExists) {
        return NextResponse.redirect(urlToSignin);
      }
      const NextResponseWithEvento = NextResponse.next();
      NextResponseWithEvento.headers.set(
        "x-tenant-primary-color",
        eventoExists.primaryColor || ""
      );
      NextResponseWithEvento.headers.set(
        "x-tenant-path-logo",
        eventoExists.pathLogo || ""
      );
      
      
        return NextResponseWithEvento;
    }
    
    

    //Rotas especificas para evento, colocar antes das abaixo

    // /evento ou /evento/ ou evento/qualquercoisa
    if (/^\/eventos(\/|$)/.test(pathname)) {
      console.log('ENTROU EM QUALQUER ROTA que começa com /evento');
      
      return NextResponse.next();
    }
    let pongAvaliador;
    pongAvaliador = await pingAvaliador(token);
     /******************
     * MIDDLEWARE PARA AVALIADOR (/avaliador)
     * ****************/
    // APENAS /avaliador
    if (pathname === '/avaliador') {
      console.log('ENTROU NA ROTA APENAS /avaliador')
      if (pongAvaliador) return NextResponse.redirect(urlToAvaliador);
      console.log(pongAvaliador)
      return NextResponse.next();
    }

    //Rotas especificas para avaliador, colocar antes das abaixo

    
    // Middleware apenas para as rotas avaliador `/avaliador/home`
    if (url.pathname.startsWith(`/avaliador/home`)) {
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      if (!pongAvaliador) return NextResponse.redirect(urlToRootAvaliador);
      return NextResponse.next()
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
    let pongGestor = await pingGestor(token, tenant);
    let pongOrientador;
    pongOrientador = await pingOrientador(token, tenant);
    let pongAluno;
    pongAluno = await pingAluno(token, tenant);
    

    
    /******************
     * MIDDLEWARE PARA SIGNIN (apenas /:tenant, não inclui /:tenant/qualquercoisa)
     * ****************/
    if (/^\/[^\/]+$/.test(pathname)) {
      //Se houver gestor:
      if (pongGestor) return NextResponse.redirect(urlToGestor);
      if (pongOrientador) return NextResponse.redirect(urlToOrientador);
      if (pongAluno) return NextResponse.redirect(urlToAluno);
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
    /******************
     * MIDDLEWARE PARA AS ROTAS INTERNAS DE ORIENTADOR (/:tenant)
     * ****************/
    // Middleware apenas para as rotas orientador `/:tenant/orientador`
    if (url.pathname.startsWith(`/${tenant}/orientador`)) {
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      if (!pongOrientador) return NextResponse.redirect(urlToSignin);
      return NextResponseWithTenant
    }
    /******************
     * MIDDLEWARE PARA AS ROTAS INTERNAS DE ALUNO (/:tenant)
     * ****************/
    // Middleware apenas para as rotas aluno `/:tenant/aluno`
    if (url.pathname.startsWith(`/${tenant}/aluno`)) {
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      if (!pongAluno) return NextResponse.redirect(urlToSignin);
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
