import { NextResponse } from "next/server";

import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import { getTenant } from "./app/api/server/getTenant";
import { pingAdminEvento, pingAluno, pingAvaliador, pingAvaliadorTenant, pingGestor, pingOrientador, pingRoot, pingUser } from "./app/api/server/pings";
import { getEventoBySlug } from "./app/api/serverReq";

export const middleware = async (request) => {
  // Recebe um request, extrai a URL e identifica o tenant a partir do caminho.
  const url = new URL(request.url);
  const tenantMatch = url.pathname.match(/^\/([^\/]*)/);
  const tenant = tenantMatch ? tenantMatch[1] : null;
  const slugEventoMatch = url.pathname.match(/\/evento\/([^\/]+)/);
  const slugEvento = slugEventoMatch ? slugEventoMatch[1] : null;
  
  console.log(slugEvento)
  const urlToSignin = new URL(request.url);
  urlToSignin.pathname = `/${tenant}`;
  const urlToEventos = new URL(request.url);
  urlToEventos.pathname = `/eventos`;
  const urlToRoot = new URL(request.url);
  urlToRoot.pathname = `/`;

  const urlToAvaliador = new URL(request.url);
  urlToAvaliador.pathname = `/avaliador/home`;
  const urlToRootAvaliador = new URL(request.url);
  urlToRootAvaliador.pathname = `/avaliador`;

  const urlToPlic = new URL(request.url);
  urlToPlic.pathname = `/root/home`;
  const urlToRootPlic = new URL(request.url);
  urlToRootPlic.pathname = `/root`;

  const urlToGestor = new URL(request.url);
  urlToGestor.pathname = `/${tenant}/gestor`;
  const urlToAvaliadorTenant = new URL(request.url);
  urlToAvaliadorTenant.pathname = `/${tenant}/avaliador`;
  const urlToOrientador = new URL(request.url);
  urlToOrientador.pathname = `/${tenant}/orientador`;
  const urlToAluno = new URL(request.url);
  urlToAluno.pathname = `/${tenant}/aluno`;
  const urlToUser = new URL(request.url);
  urlToUser.pathname = `/${tenant}/user`;
  const { pathname } = request.nextUrl;
  const token = getCookie("authToken", { cookies });
  const perfilSelecionado = getCookie("perfilSelecionado", { cookies });
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
    
    if (url.pathname.startsWith(`/evento/${slugEvento}/avaliador/convite`)) {
      console.log(`/evento/${slugEvento}/avaliador`)
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      
      const eventoExists = await getEventoBySlug(slugEvento);
      console.log(eventoExists.pathLogo)
      if (!eventoExists) {
        return NextResponse.redirect(urlToEventos);
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
    if (url.pathname.startsWith(`/evento/${slugEvento}/admin`)) {
      console.log(`/evento/${slugEvento}/admin`)
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
    console.log(pathname)
    
    if (url.pathname.startsWith(`/evento/${slugEvento}`)) {
      console.log(`/evento/${slugEvento}`)
      const eventoExists = await getEventoBySlug(slugEvento);
      if (!eventoExists) {
        return NextResponse.redirect('/eventos');
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
    
    // /eventos ou /eventos/ ou eventos/qualquercoisa
    if (/^\/eventos(\/|$)/.test(pathname)) {
      console.log('ENTROU EM QUALQUER ROTA que começa com /eventos');
      
      return NextResponse.next();
    }
    let pongAvaliador;
    pongAvaliador = await pingAvaliador(token);
    let pongAvaliadorTenant;
    pongAvaliadorTenant = await pingAvaliadorTenant(token,tenant);
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

    let pongRoot;
    pongRoot = await pingRoot(token);
     /******************
     * MIDDLEWARE PARA ROOT (/root)
     * ****************/
    // APENAS /root
    if (pathname === '/root') {
      console.log('ENTROU NA ROTA APENAS /root')
      if (pongRoot) return NextResponse.redirect(urlToPlic);
      console.log(pongRoot)
      return NextResponse.next();
    }

    //Rotas especificas para root, colocar antes das abaixo

    
    // Middleware apenas para as rotas root `/root/home`
    if (url.pathname.startsWith(`/root/home`)) {
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      if (!pongRoot) return NextResponse.redirect(urlToRootPlic);
      return NextResponse.next()
    }
   

    if (url.pathname.startsWith(`/artigo`)) {
      
      return NextResponse.next();
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
    let pongUser;
    pongUser = await pingUser(token, tenant);

    
    
    /******************
     * MIDDLEWARE PARA SIGNIN (apenas /:tenant, não inclui /:tenant/qualquercoisa)
     * ****************/
    if (/^\/[^\/]+$/.test(pathname)) {
      //Se houver gestor:
      if (pongGestor) return NextResponse.redirect(urlToGestor);
      //if (pongOrientador) return NextResponse.redirect(urlToOrientador);
      //if (pongAluno) return NextResponse.redirect(urlToAluno);
      if (pongUser) return NextResponse.redirect(urlToUser);
      if (perfilSelecionado && token) {
        if (perfilSelecionado  === "gestor") return NextResponse.redirect(urlToGestor)
        if (perfilSelecionado === "aluno") return NextResponse.redirect(urlToUser)
        if (perfilSelecionado === "orientador") return NextResponse.redirect(urlToUser)
        if (perfilSelecionado === "user") return NextResponse.redirect(urlToUser)
        if (perfilSelecionado === "avaliador") return NextResponse.redirect(urlToAvaliadorTenant)
      }
      

      return NextResponseWithTenant
      
    }
    /******************
     * MIDDLEWARE PARA AS ROTAS INTERNAS DE AVALIADOR (/:tenant)
     * ****************/
    // Middleware apenas para as rotas avaliador `/:tenant/avaliador`
    if (url.pathname.startsWith(`/${tenant}/avaliador`)) {
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      if (!pongAvaliadorTenant) return NextResponse.redirect(urlToSignin);
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
    /******************
     * MIDDLEWARE PARA AS ROTAS INTERNAS DE USER (/:tenant)
     * ****************/
    // Middleware apenas para as rotas user `/:tenant/user`
    if (url.pathname.startsWith(`/${tenant}/user`)) {
      // Não tem token válido OU não tem permissão de acesso -> redireciona
      if (!pongUser) return NextResponse.redirect(urlToSignin);
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
