"use client";
import {
  RiCalendarLine,
  RiUserLine,
  RiBookOpenLine,
  RiFileListLine,
  RiPrinterLine,
  RiCheckboxCircleLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState, useRef } from "react";
import { getHistoricoParticipacaoByCPF } from "@/app/api/client/historico";

const HistoricoParticipacao = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR");
  };

  // Função para formatar período
  const formatarPeriodo = (inicio, fim) => {
    if (!inicio) return "-";
    const dataInicio = formatarData(inicio);
    const dataFim = fim ? formatarData(fim) : "Atual";
    return `${dataInicio} a ${dataFim}`;
  };

  // Função de impressão simplificada
  // Função de impressão corrigida
  const handlePrint = () => {
    const printContent = contentRef.current;
    if (!printContent) return;

    // Clona o conteúdo para não afetar o original
    const contentClone = printContent.cloneNode(true);

    const printWindow = window.open("", "_blank");

    // Coleta todos os estilos da página atual
    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((element) => {
        if (element.tagName === "STYLE") {
          return element.innerHTML;
        } else if (element.href) {
          return `@import url('${element.href}');`;
        }
        return "";
      })
      .join("\n");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Histórico de Participação</title>
        <style>
          ${styles}
          
          /* Reset para impressão */
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            color: #000;
            background: white;
          }
          
          /* Esconde elementos não necessários na impressão */
          .actionsContainer {
            display: none !important;
          }
          
          /* Ajustes específicos para impressão */
          @media print {
            @page { 
              margin: 0.5cm; 
            }
            body { 
              margin: 0; 
              padding: 0; 
            }
            .content {
              box-shadow: none !important;
              border-radius: 0 !important;
              
            }
          }
          
          /* Garante que cores sejam impressas */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${contentClone.innerHTML}
      </body>
    </html>
  `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      // Fecha a janela após um tempo se o usuário cancelar a impressão
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 500);
    };
  };

  // Componente de Cabeçalho da Instituição
  const HeaderInstituicao = ({ tenant }) => (
    <div className={styles.headerInstituicao}>
      <div className={styles.logoSection}>
        {tenant.pathLogo && (
          <img
            src={`/image/${tenant.pathLogo}`}
            alt={`Logo ${tenant.nome}`}
            className={styles.logo}
          />
        )}
        <div className={styles.instituicaoInfo}>
          <h1 className={styles.instituicaoNome}>
            {tenant.nome} - {tenant.sigla}
          </h1>
          {tenant.emailTenant && (
            <p className={styles.emailInstituicao}>{tenant.emailTenant}</p>
          )}
        </div>
      </div>
      <div className={styles.documentoInfo}>
        <h2 className={styles.tituloDocumento}>
          Histórico de Participação em Iniciação Científica
        </h2>
        <p className={styles.dataEmissao}>
          Emitido em: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );

  // Componente de Informações do Usuário
  const InfoUsuario = ({ user }) => (
    <div className={styles.infoUsuario}>
      <div className={styles.usuarioHeader}>
        <RiUserLine className={styles.usuarioIcon} />
        <h3>Informações do Participante</h3>
      </div>
      <div className={styles.usuarioDados}>
        <div className={styles.dadoItem}>
          <span className={styles.dadoLabel}>Nome:</span>
          <span className={styles.dadoValor}>{user.nome}</span>
        </div>
        <div className={styles.dadoItem}>
          <span className={styles.dadoLabel}>CPF:</span>
          <span className={styles.dadoValor}>{user.cpf}</span>
        </div>
      </div>
    </div>
  );

  // Componente de Resumo de Participações
  const ResumoParticipacoes = ({ total, participacoes }) => {
    // Calcular totais de bolsistas para alunos
    const calcularTotaisBolsistas = () => {
      if (!participacoes || !participacoes.aluno)
        return { totalAlunos: 0, totalBolsistas: 0 };

      const totalAlunos = participacoes.aluno.length;
      const totalBolsistas = participacoes.aluno.filter((participacao) => {
        // Verifica se há vínculo de bolsa ativo
        return (
          participacao.VinculoSolicitacaoBolsa &&
          participacao.VinculoSolicitacaoBolsa.some(
            (vinculo) =>
              vinculo.status === "ATIVO" || vinculo.status === "APROVADO"
          )
        );
      }).length;

      return { totalAlunos, totalBolsistas };
    };

    const { totalAlunos, totalBolsistas } = calcularTotaisBolsistas();

    return (
      <div className={styles.resumoParticipacoes}>
        <div className={styles.resumoHeader}>
          <RiFileListLine className={styles.resumoIcon} />
          <h3>Resumo de Participações</h3>
        </div>
        <div className={styles.resumoGrid}>
          <div className={styles.resumoItem}>
            <span className={styles.resumoNumero}>{total.geral}</span>
            <span className={styles.resumoLabel}>Total de Participações</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.resumoNumero}>
              {total.por_tipo.orientador}
            </span>
            <span className={styles.resumoLabel}>Como Orientador</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.resumoNumero}>
              {total.por_tipo.coorientador}
            </span>
            <span className={styles.resumoLabel}>Como Coorientador</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.resumoNumero}>{total.por_tipo.aluno}</span>
            <span className={styles.resumoLabel}>Como Aluno</span>
            {total.por_tipo.aluno > 0 && (
              <div className={styles.bolsistasInfo}>
                <span className={styles.bolsistasText}>
                  {totalBolsistas} com bolsa
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Componente de Lista de Participações por Tipo
  const ListaParticipacoes = ({ tipo, participacoes, titulo, icone }) => {
    if (!participacoes || participacoes.length === 0) return null;

    // Função para mapear o status para texto legível
    const getStatusText = (status) => {
      const statusMap = {
        EM_ANALISE: "em análise",
        APROVADA: "pendente de Termo de Compromisso",
        RECUSADA: "recusado",
        SUBSTITUIDA: "substituída",
        CANCELADA: "cancelado",
        ATIVA: "regular",
        PENDENTE: "pendente",
        INATIVA: "inativo",
      };
      return statusMap[status] || status;
    };

    // Função para obter a classe CSS baseada no status
    const getStatusClass = (status) => {
      const statusClassMap = {
        EM_ANALISE: styles.statusEmAnalise,
        APROVADA: styles.statusPendente,
        RECUSADA: styles.statusRecusada,
        SUBSTITUIDA: styles.statusSubstituida,
        CANCELADA: styles.statusCancelada,
        ATIVA: styles.statusAtiva,
        PENDENTE: styles.statusPendente,
        INATIVA: styles.statusInativa,
      };
      return statusClassMap[status] || styles.statusDefault;
    };

    // Função para obter a instituição pagadora
    const getInstituicaoPagadora = (participacao) => {
      // Para alunos, verifica na própria participação
      if (tipo === "aluno") {
        if (
          participacao.VinculoSolicitacaoBolsa &&
          participacao.VinculoSolicitacaoBolsa.length > 0
        ) {
          const vinculoAtivo = participacao.VinculoSolicitacaoBolsa.find(
            (vinculo) =>
              vinculo.status === "ATIVO" || vinculo.status === "APROVADO"
          );

          if (
            vinculoAtivo &&
            vinculoAtivo.solicitacaoBolsa &&
            vinculoAtivo.solicitacaoBolsa.bolsa &&
            vinculoAtivo.solicitacaoBolsa.bolsa.cota
          ) {
            return vinculoAtivo.solicitacaoBolsa.bolsa.cota.instituicaoPagadora;
          }
        }
        return "Sem bolsa";
      }

      // Para orientador/coorientador, verifica nos estudantes orientados
      return null;
    };

    // Função para obter a instituição pagadora do estudante (para orientador/coorientador)
    const getInstituicaoPagadoraEstudante = (estudante) => {
      if (
        estudante.VinculoSolicitacaoBolsa &&
        estudante.VinculoSolicitacaoBolsa.length > 0
      ) {
        const vinculoAtivo = estudante.VinculoSolicitacaoBolsa.find(
          (vinculo) =>
            vinculo.status === "ATIVO" || vinculo.status === "APROVADO"
        );

        if (
          vinculoAtivo &&
          vinculoAtivo.solicitacaoBolsa &&
          vinculoAtivo.solicitacaoBolsa.bolsa &&
          vinculoAtivo.solicitacaoBolsa.bolsa.cota
        ) {
          return vinculoAtivo.solicitacaoBolsa.bolsa.cota.instituicaoPagadora;
        }
      }

      return "Sem bolsa";
    };

    return (
      <div className={styles.listaParticipacoes}>
        <div className={styles.listaHeader}>
          {icone}
          <h3>{titulo}</h3>
          <span className={styles.contador}>({participacoes.length})</span>
        </div>

        <div className={styles.participacoesGrid}>
          {participacoes.map((participacao) => {
            const instituicaoPagadora = getInstituicaoPagadora(participacao);

            return (
              <div key={participacao.id} className={styles.participacaoCard}>
                <div className={styles.participacaoHeader}>
                  <div className={styles.participacaoInfo}>
                    <h4 className={styles.editalTitulo}>
                      {participacao.inscricao.edital.titulo} (
                      {participacao.inscricao.edital.ano})
                    </h4>
                    {tipo === "aluno" && instituicaoPagadora && (
                      <div className={styles.instituicaoInfo}>
                        <span className={styles.instituicaoLabel}>
                          Instituição Pagadora:
                        </span>
                        <span className={styles.instituicaoValor}>
                          {instituicaoPagadora}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.participacaoPeriodo}>
                    <RiCalendarLine size={14} />
                    <span>
                      {formatarPeriodo(
                        participacao.dt_inicio,
                        participacao.dt_final
                      )}
                    </span>
                    {participacao.dt_final_tipo === "PREVISAO" && (
                      <span className={styles.previsaoBadge}>Previsão</span>
                    )}
                  </div>
                </div>

                {tipo === "aluno" && participacao.planoDeTrabalho && (
                  <div className={styles.planoInfo}>
                    <RiBookOpenLine size={14} />
                    <span>Plano: {participacao.planoDeTrabalho.titulo}</span>
                  </div>
                )}

                {tipo !== "aluno" &&
                  participacao.inscricao.planosDeTrabalho && (
                    <div className={styles.orientadosSection}>
                      <div className={styles.orientadosHeader}>
                        <RiUserLine size={14} />
                        <span>Estudantes Orientados:</span>
                      </div>
                      <div className={styles.orientadosList}>
                        {participacao.inscricao.planosDeTrabalho.map(
                          (plano) => (
                            <div key={plano.id} className={styles.planoItem}>
                              <div className={styles.planoTitulo}>
                                {plano.titulo}
                              </div>
                              <div className={styles.estudantesList}>
                                {plano.participacoes.map((estudante) => (
                                  <div
                                    key={estudante.id}
                                    className={styles.estudanteItem}
                                  >
                                    <div className={styles.estudanteInfo}>
                                      <span className={styles.estudanteNome}>
                                        {estudante.user.nome}
                                      </span>
                                      <span
                                        className={styles.estudanteInstituicao}
                                      >
                                        {getInstituicaoPagadoraEstudante(
                                          estudante
                                        )}
                                      </span>
                                    </div>
                                    <span
                                      className={`${
                                        styles.estudanteStatus
                                      } ${getStatusClass(
                                        estudante.statusParticipacao
                                      )}`}
                                    >
                                      {getStatusText(
                                        estudante.statusParticipacao
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Buscar dados
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getHistoricoParticipacaoByCPF(params.tenant);
        setData(response);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        setError(
          error.response?.data?.message ||
            "Erro ao carregar histórico de participação"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <RiBookOpenLine className={styles.loadingIcon} />
        <p>Carregando histórico de participação...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3 className="mb-2">Atenção!</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.emptyContainer}>
        <RiBookOpenLine className={styles.emptyIcon} />
        <h3>Nenhum dado encontrado</h3>
        <p>Não foi possível carregar o histórico de participação.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Botões de ação */}
      <div className={styles.actionsContainer}>
        <button onClick={handlePrint} className={styles.printButton}>
          <RiPrinterLine size={16} />
          Imprimir Documento
        </button>
      </div>

      {/* Conteúdo principal para impressão */}
      <div ref={contentRef} className={styles.content}>
        <HeaderInstituicao tenant={data.tenant} />
        <div className={styles.mainContent}>
          <InfoUsuario user={data.user} />
          <ResumoParticipacoes
            total={data.total}
            participacoes={data.participacoes}
          />

          <ListaParticipacoes
            tipo="orientador"
            participacoes={data.participacoes.orientador}
            titulo="Participações como Orientador"
            icone={<RiUserLine className={styles.listaIcon} />}
          />

          <ListaParticipacoes
            tipo="coorientador"
            participacoes={data.participacoes.coorientador}
            titulo="Participações como Coorientador"
            icone={<RiUserLine className={styles.listaIcon} />}
          />

          <ListaParticipacoes
            tipo="aluno"
            participacoes={data.participacoes.aluno}
            titulo="Participações como Bolsista"
            icone={<RiBookOpenLine className={styles.listaIcon} />}
          />
        </div>
        {/* Rodapé com autenticação */}
        <div className={styles.footer}>
          <div className={styles.autenticacao}>
            <RiCheckboxCircleLine className={styles.autenticacaoIcon} />
            <div className={styles.autenticacaoInfo}>
              <p>
                Consulte a autenticidade deste documento em{" "}
                <strong>www.plic.app.br/autenticacao</strong>
              </p>
              {data.codVerificador && (
                <p className={styles.codigoVerificador}>
                  Código verificador: <strong>{data.codVerificador}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricoParticipacao;
