"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/components/Formularios/Form.module.scss";
import {
  RiArchiveLine,
  RiArrowLeftRightLine,
  RiEyeLine,
  RiGroupLine,
  RiInboxUnarchiveLine,
  RiInformationLine,
  RiQuillPenLine,
  RiStarLine,
} from "@remixicon/react";
import { Tag } from "primereact/tag";
import { DataView } from "primereact/dataview";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getInscricaoProjetoById,
  updateInscricaoProjeto,
} from "@/app/api/client/projeto";
import { arquivarFichaAvaliacao } from "@/app/api/client/avaliador";
import { getParticipacao } from "@/app/api/client/participacao";
import { combinarFichasPorAvaliador } from "@/lib/fichaAvaliacaoUtils";
import { getSeverityByStatus, formatStatusText } from "@/lib/tagUtils";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import GrupoAvaliacao from "@/components/participacao/GrupoAvaliacao";

/**
 * Resumo somente leitura (+ troca de status) de um projeto avaliado — usado
 * no modal da tabela "Planos de Trabalho" da tela de Acompanhamento.
 * Diferente de FormGestorProjetoCreateOrEdit, não tem abas, edição de
 * conteúdo/cronograma/área, nem ações de desvincular projeto, remover
 * avaliador ou excluir ficha.
 *
 * `planoFichas` (opcional): fichas do plano de trabalho que originou a
 * abertura desse resumo — a nota do plano já soma a nota do projeto, então
 * elas entram junto na lista de "Fichas de Avaliação" abaixo.
 */
const ProjetoAvaliacaoResumo = ({
  tenantSlug,
  ano,
  projetoId,
  idInscricao,
  planoId,
  notaAlunoPlano,
  notaOrientadorPlano,
  planoFichas,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const [participacaoSelecionada, setParticipacaoSelecionada] = useState(null);
  const [detalheParticipacao, setDetalheParticipacao] = useState(null);
  const [carregandoDetalheParticipacao, setCarregandoDetalheParticipacao] =
    useState(false);
  const toast = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getInscricaoProjetoById(
        tenantSlug,
        idInscricao,
        projetoId,
        planoId
      );
      setInscricaoProjeto(data);
    } catch (error) {
      console.error("Erro ao buscar dados do projeto:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, idInscricao, projetoId]);

  const handleUpdateStatus = async (statusAvaliacao) => {
    try {
      const response = await updateInscricaoProjeto(
        tenantSlug,
        inscricaoProjeto.id,
        { statusAvaliacao }
      );
      setInscricaoProjeto(response);
      await onSuccess?.();
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status atualizado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Ocorreu um erro ao atualizar o status.",
        life: 3000,
      });
    }
  };

  // Arquivar/desarquivar exclui/restaura a nota deste avaliador da média e
  // da contagem mínima de avaliações — pode afetar até duas fichas reais
  // (a do projeto e a deste plano), então alterna as duas que existirem.
  const handleToggleArquivar = (ficha) => {
    const alvo = !ficha.arquivada;
    confirmDialog({
      message: alvo
        ? "Arquivar esta ficha de avaliação? A nota deste avaliador deixará de contar na média e no número mínimo de avaliações do projeto/plano."
        : "Desarquivar esta ficha de avaliação? A nota deste avaliador voltará a contar na média.",
      header: "Confirmação",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      accept: async () => {
        try {
          const idsParaAlternar = [
            ficha.fichaProjetoId,
            ficha.fichaPlanoId,
          ].filter(Boolean);
          for (const id of idsParaAlternar) {
            await arquivarFichaAvaliacao(tenantSlug, id, alvo);
          }
          await fetchData();
          await onSuccess?.();
          toast.current?.show({
            severity: "success",
            summary: "Sucesso",
            detail: alvo ? "Ficha arquivada." : "Ficha desarquivada.",
            life: 3000,
          });
        } catch (error) {
          console.error("Erro ao arquivar/desarquivar ficha:", error);
          toast.current?.show({
            severity: "error",
            summary: "Erro",
            detail: "Ocorreu um erro ao arquivar/desarquivar a ficha.",
            life: 3000,
          });
        }
      },
    });
  };

  // Nota total de uma participação (aluno/orientador) = nota da ficha Lattes
  // + soma das notas extras lançadas manualmente — mesma fórmula usada nas
  // telas de Seleção de Participações e na importação de notas do plano.
  const calcularNotaParticipacao = (participacao) => {
    const totalExtra = (participacao.NotaExtraParticipacao || []).reduce(
      (soma, nota) => soma + nota.valor,
      0
    );
    return {
      notaFicha: participacao.fichaAvaliacao?.nota ?? 0,
      totalExtra,
      total: (participacao.fichaAvaliacao?.nota ?? 0) + totalExtra,
    };
  };

  const participacoesNotas = [
    ...(inscricaoProjeto?.participacoesAluno || []).map((p) => ({
      ...p,
      tipoLabel: "Aluno",
    })),
    ...(inscricaoProjeto?.participacoesOrientador || []).map((p) => ({
      ...p,
      tipoLabel: "Orientador",
    })),
  ];

  // Abre um segundo modal, por cima deste, com a ficha Lattes completa de
  // uma participação — busca sob demanda (não vem na lista resumida acima).
  const abrirDetalheParticipacao = async (participacao) => {
    setParticipacaoSelecionada(participacao);
    setDetalheParticipacao(null);
    setCarregandoDetalheParticipacao(true);
    try {
      const completa = await getParticipacao(tenantSlug, participacao.id, ano);
      setDetalheParticipacao(completa);
    } catch (error) {
      console.error("Erro ao buscar ficha da participação:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível carregar a ficha da participação.",
        life: 3000,
      });
    } finally {
      setCarregandoDetalheParticipacao(false);
    }
  };

  const fecharDetalheParticipacao = () => {
    setParticipacaoSelecionada(null);
    setDetalheParticipacao(null);
  };

  const listTemplateParticipacoes = (participacoes) => (
    <div className={styles.list}>
      {participacoes.map((p) => {
        const { total } = calcularNotaParticipacao(p);
        return (
          <div
            key={p.id}
            className={styles.fichas}
            onClick={() => abrirDetalheParticipacao(p)}
          >
            <div className={styles.headerFicha}>
              <div className={styles.content1}>
                <p>
                  {p.tipoLabel}:
                  <br />
                  <strong>{p.user?.nome}</strong>
                </p>
              </div>
              <div className={styles.content2}>
                <p>
                  Total: <strong>{total}</strong>
                </p>
                <RiEyeLine />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // O gestor só alterna entre "Avaliada" e "Aguardando avaliação" aqui — o
  // status "Em avaliação" é setado automaticamente pelo sistema (atribuição
  // de avaliador), não é uma opção manual nesse resumo.
  const statusAtual = inscricaoProjeto?.statusAvaliacao;
  const proximoStatus =
    statusAtual === "AVALIADA" ? "AGUARDANDO_AVALIACAO" : "AVALIADA";
  const proximoStatusLabel =
    proximoStatus === "AVALIADA" ? "Avaliado" : "Não avaliado";

  const listTemplateAvaliadores = (avaliadores) => (
    <div className={styles.list}>
      {avaliadores.map((avaliador) => (
        <div key={avaliador.id} className={styles.itemList}>
          <div className={styles.content1}>
            <p>{avaliador.avaliador?.nome}</p>
          </div>
        </div>
      ))}
    </div>
  );

  // Uma linha por avaliador: quem avaliou o projeto também avaliou o(s)
  // plano(s) na mesma submissão, então a nota exibida é a soma (projeto +
  // plano) — não faz sentido mostrar como duas fichas separadas.
  const fichasCombinadas = combinarFichasPorAvaliador(
    inscricaoProjeto?.FichaAvaliacao || [],
    planoFichas || []
  );

  // Abre, em nova aba, a ficha completa (respostas do projeto + dos planos
  // desse mesmo avaliador) — mesmo estilo de tela usado pelo avaliador em
  // /avaliador/avaliacoes/fichas.
  const abrirFichaDetalhada = (ficha) => {
    window.open(
      `/${tenantSlug}/gestor/${ano}/avaliacoes/fichas/${ficha.fichaId}`,
      "_blank"
    );
  };

  const listTemplateFichas = (fichas) => (
    <div className={styles.list}>
      {fichas.map((ficha) => (
        <div
          key={ficha.fichaId}
          className={`${styles.fichas} ${
            ficha.arquivada ? styles.fichaArquivada : ""
          }`}
          onClick={() => abrirFichaDetalhada(ficha)}
        >
          <div className={styles.headerFicha}>
            <div className={styles.content1}>
              <p>
                Avaliador:
                <br />
                <strong>{ficha.avaliador?.nome}</strong>
              </p>
              {ficha.arquivada && (
                <Tag severity="warning" value="Arquivada" className="mt-1" />
              )}
            </div>
            <div className={styles.content2}>
              <p
                style={
                  ficha.arquivada ? { textDecoration: "line-through" } : undefined
                }
              >
                Total: <strong>{ficha.notaTotal}</strong>
              </p>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleArquivar(ficha);
                }}
                title={ficha.arquivada ? "Desarquivar" : "Arquivar"}
              >
                {ficha.arquivada ? (
                  <RiInboxUnarchiveLine />
                ) : (
                  <RiArchiveLine />
                )}
              </span>
              <RiEyeLine />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.content}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.toast}>
        <Toast ref={toast} />
        <ConfirmDialog />
      </div>
      <div className={styles.mainContent}>
        <div className={styles.box}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiInformationLine />
            </div>
            <h6>Dados gerais</h6>
          </div>
          <div className="pl-2 pr-2 pb-2">
            <p className="mb-1">
              <strong>Título do projeto: </strong>
              {inscricaoProjeto?.projeto?.titulo}
            </p>
            <p className="mb-1">
              <strong>Área: </strong>
              {inscricaoProjeto?.projeto?.area?.area}
            </p>

            <div className={styles.statusField}>
              <p>
                <strong>Status atual: </strong>
              </p>
              <Tag severity={getSeverityByStatus(statusAtual)}>
                {formatStatusText(statusAtual)}
              </Tag>
              <Button
                className="button btn-secondary"
                icon={RiArrowLeftRightLine}
                onClick={() => handleUpdateStatus(proximoStatus)}
              >
                Alterar para {proximoStatusLabel}
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.box}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiGroupLine />
            </div>
            <h6>Avaliadores</h6>
          </div>
          {inscricaoProjeto?.InscricaoProjetoAvaliador && (
            <DataView
              value={inscricaoProjeto.InscricaoProjetoAvaliador}
              listTemplate={listTemplateAvaliadores}
              layout="list"
              emptyMessage="Nada encontrado :/"
            />
          )}
        </div>

        <div className={styles.box}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiQuillPenLine />
            </div>
            <h6>Fichas de Avaliação</h6>
          </div>
          <DataView
            value={fichasCombinadas}
            listTemplate={listTemplateFichas}
            layout="list"
            emptyMessage="Nada encontrado :/"
          />
        </div>

        {planoId && (
          <div className={styles.box}>
            <div className={styles.header}>
              <div className={styles.icon}>
                <RiStarLine />
              </div>
              <h6>Notas das Participações</h6>
            </div>
            <div className="pl-2 pr-2 pb-2">
              <p className="mb-1">
                <strong>Nota Aluno (persistida no plano): </strong>
                {notaAlunoPlano ?? "—"}
              </p>
              <p className="mb-1">
                <strong>Nota Orientador (persistida no plano): </strong>
                {notaOrientadorPlano ?? "—"}
              </p>
            </div>
            <DataView
              value={participacoesNotas}
              listTemplate={listTemplateParticipacoes}
              layout="list"
              emptyMessage="Nenhuma participação de aluno ou orientador encontrada."
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={!!participacaoSelecionada}
        onClose={fecharDetalheParticipacao}
        size="small"
      >
        {carregandoDetalheParticipacao && <p>Carregando...</p>}
        {!carregandoDetalheParticipacao && detalheParticipacao && (
          <div>
            <h5 className="mb-1">
              {participacaoSelecionada?.tipoLabel}:{" "}
              {detalheParticipacao.user?.nome}
            </h5>
            <p className="mb-2">
              Ficha:{" "}
              <strong>
                {detalheParticipacao.fichaAvaliacao?.nota ?? 0} /{" "}
                {detalheParticipacao.fichaAvaliacao?.notaMax ?? 0}
              </strong>
              {" · "}
              Notas extras:{" "}
              <strong>
                {(detalheParticipacao.NotaExtraParticipacao || []).reduce(
                  (soma, nota) => soma + nota.valor,
                  0
                )}
              </strong>
            </p>
            {detalheParticipacao.fichaAvaliacao?.grupos?.length > 0 ? (
              detalheParticipacao.fichaAvaliacao.grupos.map((grupo, i) => (
                <GrupoAvaliacao key={i} grupo={grupo} nivel={0} />
              ))
            ) : (
              <p>Nenhum item de avaliação.</p>
            )}
            {(detalheParticipacao.NotaExtraParticipacao || []).length > 0 && (
              <div className="mt-2">
                <h6 className="mb-1">Notas extras</h6>
                {detalheParticipacao.NotaExtraParticipacao.map((nota) => (
                  <p key={nota.id} className="mb-1">
                    +{nota.valor} pt{nota.valor === 1 ? "" : "s"}
                    {nota.observacao ? ` — ${nota.observacao}` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjetoAvaliacaoResumo;
