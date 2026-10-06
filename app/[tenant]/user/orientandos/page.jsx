"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import {
  RiArrowLeftRightLine,
  RiCheckboxCircleLine,
  RiGroupLine,
  RiLockLine,
  RiSearchEyeLine,
  RiTimeLine,
} from "@remixicon/react";
import InscricaoBoard from "@/components/orientandos/InscricaoBoard";
import ModalSolicitacao from "@/components/orientandos/ModalSolicitacao";
import HistoricoSolicitacoes from "@/components/orientandos/HistoricoSolicitacoes";
import {
  cancelarSolicitacaoAlteracao,
  getHistoricoSolicitacoesOrientador,
  getPainelOrientandos,
  getRecursoSolicitacoesOrientador,
} from "@/app/api/client/alteracaoParticipacao";
import { mensagemErro } from "@/lib/alteracaoParticipacao";
import styles from "./page.module.scss";

const ABA_HISTORICO = "historico";

const Page = ({ params }) => {
  const toast = useRef(null);
  const [editais, setEditais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [abaAtiva, setAbaAtiva] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [modal, setModal] = useState(null); // { tipo, aluno, alunosInscricao, destinoInicialId }

  const [recursoDesabilitado, setRecursoDesabilitado] = useState(false);

  const carregarPainel = useCallback(async () => {
    try {
      setErro("");
      if (!(await getRecursoSolicitacoesOrientador(params.tenant))) {
        setRecursoDesabilitado(true);
        return;
      }
      const dados = await getPainelOrientandos(params.tenant);
      setEditais(dados || []);
      // Abre no ano mais recente com edital vigente (encerrados ficam só para consulta).
      const inicial = dados?.find((e) => e.vigente) || dados?.[0];
      setAbaAtiva((atual) => atual ?? inicial?.ano ?? ABA_HISTORICO);
    } catch (error) {
      setErro(
        mensagemErro(error, "Não foi possível carregar seus orientandos."),
      );
    } finally {
      setCarregando(false);
    }
  }, [params.tenant]);

  const carregarHistorico = useCallback(async () => {
    setCarregandoHistorico(true);
    try {
      setHistorico(
        (await getHistoricoSolicitacoesOrientador(params.tenant)) || [],
      );
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: mensagemErro(error),
        life: 4000,
      });
    } finally {
      setCarregandoHistorico(false);
    }
  }, [params.tenant]);

  useEffect(() => {
    carregarPainel();
  }, [carregarPainel]);

  // O histórico só é buscado com o recurso habilitado.
  useEffect(() => {
    if (!carregando && !recursoDesabilitado) carregarHistorico();
  }, [carregando, recursoDesabilitado, carregarHistorico]);

  const atualizar = () => {
    carregarPainel();
    carregarHistorico();
  };

  const pendentes = useMemo(
    () => historico.filter((s) => s.status === "PENDENTE").length,
    [historico],
  );

  // Uma aba por ano (mais recente primeiro); dentro dela, uma seção por edital.
  const anos = useMemo(() => {
    const porAno = new Map();
    editais.forEach((e) => {
      if (!porAno.has(e.ano)) porAno.set(e.ano, []);
      porAno.get(e.ano).push(e);
    });
    return [...porAno.entries()]
      .sort(([a], [b]) => b - a)
      .map(([ano, lista]) => ({
        ano,
        // Vigentes antes dos encerrados, depois por título
        editais: [...lista].sort(
          (a, b) =>
            Number(b.vigente) - Number(a.vigente) ||
            a.titulo.localeCompare(b.titulo, "pt-BR"),
        ),
      }));
  }, [editais]);

  const abas = useMemo(
    () => [
      ...anos.map(({ ano, editais: lista }) => ({
        id: ano,
        label: String(ano),
        encerrado: lista.every((e) => !e.vigente),
      })),
      {
        id: ABA_HISTORICO,
        label: `Histórico de solicitações${pendentes ? ` (${pendentes})` : ""}`,
      },
    ],
    [anos, pendentes],
  );

  const anoAtivo = anos.find((a) => a.ano === abaAtiva);

  const abrirAcao = (tipo, aluno, extras = {}) => {
    setModal({
      tipo,
      aluno,
      alunosInscricao: extras.alunosInscricao || [],
      destinoInicialId: extras.destinoInicialId ?? null,
    });
  };

  const cancelarSolicitacao = (id) => {
    confirmDialog({
      header: "Cancelar solicitação",
      message:
        "A solicitação será retirada da análise da gestão. Deseja continuar?",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Cancelar solicitação",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await cancelarSolicitacaoAlteracao(params.tenant, id);
          toast.current?.show({
            severity: "success",
            summary: "Solicitação cancelada",
            life: 3000,
          });
          atualizar();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Erro",
            detail: mensagemErro(error),
            life: 4000,
          });
        }
      },
    });
  };

  return (
    <div className={styles.pagina}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <ModalSolicitacao
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        tenant={params.tenant}
        tipo={modal?.tipo}
        aluno={modal?.aluno}
        alunosInscricao={modal?.alunosInscricao}
        destinoInicialId={modal?.destinoInicialId}
        onEnviada={atualizar}
        toast={toast}
      />

      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <RiGroupLine />
            </div>
            <div className={styles.headerContent}>
              <h6>Meus orientandos</h6>
              <p>
                Remaneje bolsas, substitua ou cancele participações dos seus
                alunos. Toda solicitação é analisada pela gestão antes de ter
                efeito.
              </p>
            </div>
            {pendentes > 0 && (
              <button
                type="button"
                className={styles.badgePendentes}
                onClick={() => setAbaAtiva(ABA_HISTORICO)}
              >
                <RiTimeLine size={18} />
                {pendentes} aguardando aprovação da gestão
              </button>
            )}
          </div>

          <div className={styles.comoFunciona}>
            <div className={styles.passo}>
              <RiArrowLeftRightLine size={20} />
              <span>
                <strong>Solicite</strong>
                Arraste a bolsa até um voluntário ou use o menu de cada aluno.
              </span>
            </div>
            <div className={styles.passo}>
              <RiSearchEyeLine size={20} />
              <span>
                <strong>Revise</strong>
                Veja o efeito previsto e os documentos que serão gerados.
              </span>
            </div>
            <div className={styles.passo}>
              <RiCheckboxCircleLine size={20} />
              <span>
                <strong>Gestão aprova</strong>A alteração só acontece após a
                aprovação.
              </span>
            </div>
          </div>

          {carregando && (
            <p className={styles.mensagem}>Carregando orientandos…</p>
          )}
          {!carregando && recursoDesabilitado && (
            <p className={styles.avisoConsulta}>
              <RiLockLine />
              <span>Este recurso ainda não está habilitado para a sua instituição.</span>
            </p>
          )}
          {!carregando && erro && (
            <p className={`${styles.mensagem} ${styles.mensagemErro}`}>
              {erro}
            </p>
          )}

          {!carregando && !erro && !recursoDesabilitado && (
            <>
              <div className={styles.abas}>
                {abas.map((aba) => (
                  <button
                    key={aba.id}
                    type="button"
                    className={`${styles.aba} ${abaAtiva === aba.id ? styles.abaAtiva : ""} ${
                      aba.encerrado ? styles.abaEncerrada : ""
                    }`}
                    onClick={() => setAbaAtiva(aba.id)}
                    title={
                      aba.encerrado
                        ? "Editais deste ano fora da vigência — somente consulta"
                        : undefined
                    }
                  >
                    {aba.label}
                    {aba.encerrado && (
                      <span className={styles.seloEncerrado}>encerrado</span>
                    )}
                  </button>
                ))}
              </div>

              <div className={styles.conteudoAba}>
                {abaAtiva === ABA_HISTORICO && (
                  <HistoricoSolicitacoes
                    solicitacoes={historico}
                    carregando={carregandoHistorico}
                    onCancelar={cancelarSolicitacao}
                  />
                )}

                {anoAtivo?.editais.map((edital) => (
                  <section key={edital.id} className={styles.edital}>
                    <header className={styles.editalCabecalho}>
                      <h5>{edital.titulo}</h5>
                      <span
                        className={
                          edital.vigente
                            ? styles.seloVigente
                            : styles.seloEncerrado
                        }
                      >
                        {edital.vigente
                          ? edital.fimVigencia
                            ? `Vigente até ${edital.fimVigencia}`
                            : "Vigente"
                          : "Encerrado"}
                      </span>
                    </header>

                    {!edital.vigente && (
                      <p className={styles.avisoConsulta}>
                        <RiLockLine />
                        <span>
                          Edital fora do período de vigência
                          {edital.fimVigencia
                            ? ` (encerrado em ${edital.fimVigencia})`
                            : ""}
                          : somente consulta. Para alterações, procure a gestão.
                        </span>
                      </p>
                    )}

                    {edital.inscricoes
                      .filter((i) => i.alunos.length > 0)
                      .map((inscricao) => (
                        <InscricaoBoard
                          key={inscricao.id}
                          inscricao={inscricao}
                          onAcao={abrirAcao}
                          onCancelarSolicitacao={cancelarSolicitacao}
                          onAviso={(detail) =>
                            toast.current?.show({
                              severity: "warn",
                              summary: "Transferência não permitida",
                              detail,
                              life: 6000,
                            })
                          }
                        />
                      ))}
                  </section>
                ))}

                {editais.length === 0 && abaAtiva !== ABA_HISTORICO && (
                  <p className={styles.mensagem}>
                    Você ainda não tem alunos em planos de trabalho
                    classificados como orientador.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
