const montarMensagemConviteAvaliador = (instituicao,
  gestor,
  email,
  fone,
  dataIni,
  dataFim) => {
    const fmt = (d) => (d ? d.toLocaleDateString("pt-BR") : "__/__/____");

  return `
    <p>
      Você recebeu um convite para avaliar os projetos de Iniciação Científica da instituição <strong>${instituicao}</strong>.
    </p>
    <p>
      As avaliações ocorrerão, <strong>de forma online,</strong> entre os dias <strong>${fmt(dataIni)}</strong> e <strong>${fmt(dataFim)}</strong>. Após o período avaliativo, será disponibilizado certificado de avaliação.
    </p>
    <br/>
    <p>Caso possa avaliar, clique no botão abaixo e complete seu cadastro.</p>
    <br/>
    <p>
      Em caso de dúvida, entre em contato pelo e-mail <strong><a href="mailto:${email}">${email}</a></strong> ou pelo <strong>telefone ${fone}</strong>.
    </p>
    <br/>
    <p>Atenciosamente,<br/>${gestor}</p>
  `;
  };
export default montarMensagemConviteAvaliador;

