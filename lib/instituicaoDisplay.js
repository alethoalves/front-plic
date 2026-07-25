// Resolve o nome/sigla da instituição de uma submissão (ou item equivalente
// vindo da API), que pode ser um Tenant real ou uma instituição parceira sem
// Tenant. Prioriza o campo `instituicao` (novo, calculado no backend via
// resolveInstituicaoDisplay) e cai pra `tenant` como fallback, pra continuar
// funcionando mesmo se o front for deployado antes do back nessa mudança.
export function getInstituicaoSigla(item) {
  return (
    item?.instituicao?.sigla?.toUpperCase() ??
    item?.tenant?.sigla?.toUpperCase() ??
    "—"
  );
}

export function getInstituicaoNome(item) {
  return (
    item?.instituicao?.nome ?? item?.tenant?.nome ?? "Instituição não informada"
  );
}

export function getInstituicaoLabel(item) {
  const sigla = getInstituicaoSigla(item);
  const nome = getInstituicaoNome(item);
  return item?.instituicao?.tipo === "PARCEIRA"
    ? `${sigla} - ${nome} (parceira)`
    : `${sigla} - ${nome}`;
}
