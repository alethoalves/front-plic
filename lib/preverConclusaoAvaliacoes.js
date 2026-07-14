const preverConclusaoAvaliacoes = (datasConclusao, pendentes) => {
  const datasValidas = datasConclusao
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d))
    .sort((a, b) => a - b);

  if (datasValidas.length < 2 || pendentes <= 0) {
    return { temDadosSuficientes: false };
  }

  const hoje = new Date();
  const primeiraData = datasValidas[0];
  const diasDecorridos = Math.max(
    1,
    Math.ceil((hoje - primeiraData) / (1000 * 60 * 60 * 24))
  );
  const taxaPorDia = datasValidas.length / diasDecorridos;

  if (taxaPorDia <= 0) {
    return { temDadosSuficientes: false };
  }

  const diasRestantes = Math.ceil(pendentes / taxaPorDia);
  const dataPrevista = new Date(hoje);
  dataPrevista.setDate(dataPrevista.getDate() + diasRestantes);

  return {
    temDadosSuficientes: true,
    taxaPorDia: Number(taxaPorDia.toFixed(2)),
    diasRestantes,
    dataPrevista,
    concluidas: datasValidas.length,
    pendentes,
  };
};

export default preverConclusaoAvaliacoes;
