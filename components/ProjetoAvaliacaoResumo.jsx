"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/components/Formularios/Form.module.scss";
import {
  RiArrowLeftRightLine,
  RiEyeLine,
  RiGroupLine,
  RiInformationLine,
  RiQuillPenLine,
} from "@remixicon/react";
import { Tag } from "primereact/tag";
import { DataView } from "primereact/dataview";
import { Toast } from "primereact/toast";
import {
  getInscricaoProjetoById,
  updateInscricaoProjeto,
} from "@/app/api/client/projeto";
import { getSeverityByStatus, formatStatusText } from "@/lib/tagUtils";
import Button from "@/components/Button";

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
  planoFichas,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getInscricaoProjetoById(
          tenantSlug,
          idInscricao,
          projetoId
        );
        setInscricaoProjeto(data);
      } catch (error) {
        console.error("Erro ao buscar dados do projeto:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
  const fichasCombinadas = (() => {
    const porAvaliador = new Map();

    (inscricaoProjeto?.FichaAvaliacao || []).forEach((f) => {
      porAvaliador.set(f.avaliadorId, {
        fichaId: f.id,
        avaliador: f.avaliador,
        notaTotal: f.notaTotal || 0,
      });
    });

    (planoFichas || []).forEach((f) => {
      const existente = porAvaliador.get(f.avaliadorId);
      if (existente) {
        existente.notaTotal += f.notaTotal || 0;
      } else {
        porAvaliador.set(f.avaliadorId, {
          fichaId: f.id,
          avaliador: f.avaliador,
          notaTotal: f.notaTotal || 0,
        });
      }
    });

    return Array.from(porAvaliador.values());
  })();

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
          className={styles.fichas}
          onClick={() => abrirFichaDetalhada(ficha)}
        >
          <div className={styles.headerFicha}>
            <div className={styles.content1}>
              <p>
                Avaliador:
                <br />
                <strong>{ficha.avaliador?.nome}</strong>
              </p>
            </div>
            <div className={styles.content2}>
              <p>
                Total: <strong>{ficha.notaTotal}</strong>
              </p>
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
      </div>
    </div>
  );
};

export default ProjetoAvaliacaoResumo;
