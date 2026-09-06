"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A gestão de sessões/subsessões migrou pra dentro de Configurações (aba
// "Sessões") — cada subsessão específica virou item do menu lateral, então
// esta lista intermediária deixou de ser necessária. Mantido como redirect
// pra não quebrar links/favoritos antigos apontando pra esta rota.
const Page = ({ params }) => {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/evento/${params.eventoSlug}/admin/configuracoes?aba=sessoes`);
  }, [params.eventoSlug, router]);

  return null;
};

export default Page;
