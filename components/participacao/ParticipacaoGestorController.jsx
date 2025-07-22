"use client";

import CPFVerificationForm from "../Formularios/CPFVerificationForm";
import { useEffect, useRef, useState } from "react";
import styles from "./ParticipacaoGestorController.module.scss";
import {
  ativarOuPendenteParticipacao,
  getParticipacao,
  inativarParticipacao,
  substituirAlunoParticipacao,
} from "@/app/api/client/participacao";

import {
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiExchangeLine,
  RiForbid2Line,
  RiGroupLine,
  RiHistoryLine,
  RiP2pFill,
  RiProhibited2Line,
  RiSwapLine,
  RiUserUnfollowLine,
} from "@remixicon/react";
import { getFormulario } from "@/app/api/client/formulario";
import Modal from "../Modal";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import {
  ativarVinculo,
  cancelarVinculo,
  devolverBolsa,
  tornarPendenteVinculo,
  transferirBolsa,
} from "@/app/api/client/bolsa";

import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { mapHistorico } from "@/lib/mapHistorico";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { getInscricao } from "@/app/api/client/inscricao";
import { LinhaTempo } from "../LinhaDoTempo";
import { updateDataHistorico } from "@/app/api/client/historico";
function buildMergedTimeline(item) {
  console.log("ALETHO");
  console.log(item);
  const merged = [];

  // Pega apenas o primeiro nome (antes do primeiro espaço)
  const primeiroNome = item.user.nome.split(" ")[0];

  // Helper para formatar ISO → "DD/MM/YYYY HH:mm:ss"
  function formatDateTimeBR(dateObj) {
    return dateObj
      .toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  }

  // 1) Copia o historicoParticipacao (já vindo de mapHistorico)
  if (Array.isArray(item.historicoParticipacao)) {
    console.log("ALETHO222");
    console.log(item.historicoParticipacao);
    item.historicoParticipacao.forEach((evt) => {
      merged.push({
        id: evt.id,
        isLatest: false, //evt.isLatest,
        status: `Participação de ${primeiroNome}: ${evt.status}`,
        date: evt.date,
        observacao: evt.observacao,
        rawStatus: evt.rawStatus,
      });
    });
  }

  // 2) Para cada vínculo, adiciona eventos de vínculo + eventos de solicitação
  if (Array.isArray(item.VinculoSolicitacaoBolsa)) {
    item.VinculoSolicitacaoBolsa.forEach((vinculo) => {
      const sol = vinculo.solicitacaoBolsa;
      const solId = sol?.id;

      // 2.a) Histórico de vínculo
      if (Array.isArray(vinculo.HistoricoStatusVinculo)) {
        vinculo.HistoricoStatusVinculo.forEach((evtV) => {
          const dateFull = formatDateTimeBR(new Date(evtV.inicio));
          merged.push({
            id: evtV.id,
            isLatest: false,
            status: `Vínculo de ${primeiroNome} à Solicitação de Bolsa ID-${solId}: ${evtV.status.toLowerCase()}`,
            date: dateFull,
            observacao: evtV.observacao || null,
            rawStatus: evtV.status,
          });
        });
      }
      /** 
      // 2.b) Histórico de solicitação
      if (sol && Array.isArray(sol.HistoricoStatusSolicitacaoBolsa)) {
        sol.HistoricoStatusSolicitacaoBolsa.forEach((evtS) => {
          const dateFull = formatDateTimeBR(new Date(evtS.inicio));
          merged.push({
            isLatest: false,
            status: `Solicitação de Bolsa ID-${solId}: ${evtS.status.toLowerCase()}`,
            date: dateFull,
            observacao: evtS.observacao || null,
            rawStatus: evtS.status,
          });
        });
      }*/
    });
  }

  // 3) Ordena cronologicamente pelo campo "date" (em "DD/MM/YYYY HH:mm:ss")
  merged.sort((a, b) => {
    function toTs(dateTimeStr) {
      const [dt, tm] = dateTimeStr.split(" ");
      const [dd, mm, yyyy] = dt.split("/").map(Number);
      const [hh, mi, ss] = tm.split(":").map(Number);
      return new Date(yyyy, mm - 1, dd, hh, mi, ss).getTime();
    }
    return toTs(b.date) - toTs(a.date);
  });

  return merged;
}

const ParticipacaoGestorController = ({
  tenant,
  participacaoId,
  onSuccess,
}) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [editalInfo, setEditalInfo] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);
  const [isModalSubstituicaoAlunoOpen, setIsModalSubstituicaoAlunoOpen] =
    useState(false);
  const [isModalCancelamentoOpen, setIsModalCancelamentoOpen] = useState(false);
  const [dataInativacao, setDataInativacao] = useState("");
  const [dataTransferencia, setDataTransferencia] = useState("");

  const [isLoadingAtivacao, setIsLoadingAtivacao] = useState(false);
  const [isLoadingToggle, setIsLoadingToggle] = useState(false);
  const [isModalAtivarPendenteOpen, setIsModalAtivarPendenteOpen] =
    useState(false);
  const [observacaoPendencia, setObservacaoPendencia] = useState("");
  const [statusAcao, setStatusAcao] = useState(null); // 'ATIVAR' ou 'PENDENTE'
  // Adicione este estado no componente
  const [justificativaInativacao, setJustificativaInativacao] = useState("");

  const renderModalAtivarPendente = () => (
    <Modal
      isOpen={isModalAtivarPendenteOpen}
      onClose={() => setIsModalAtivarPendenteOpen(false)}
    >
      <div className="mb-2">
        <h4>
          {statusAcao === "ATIVAR"
            ? "Confirmar Ativação"
            : "Confirmar Pendência"}
        </h4>

        {statusAcao === "PENDENTE" && (
          <div className="field mt-3">
            <label htmlFor="observacao">Motivo da Pendência *</label>
            <InputTextarea
              id="observacao"
              value={observacaoPendencia}
              onChange={(e) => setObservacaoPendencia(e.target.value)}
              rows={3}
              placeholder="Informe o motivo para tornar a participação pendente..."
            />
          </div>
        )}

        <div className="flex justify-content-end gap-1 mt-4">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            onClick={() => setIsModalAtivarPendenteOpen(false)}
          />
          <Button
            label={
              isLoadingConfirmacao ? (
                <>
                  <i className="pi pi-spinner pi-spin mr-2" />
                  Processando...
                </>
              ) : (
                "Confirmar Pendência"
              )
            }
            onClick={handleConfirmarAtivarPendente}
            disabled={!observacaoPendencia.trim() || isLoadingConfirmacao}
          />
        </div>
      </div>
    </Modal>
  );
  const fetch = async () => {
    // 1) Busca o registro atualizado da API
    const itemAPI = await getParticipacao(tenant, participacaoId);

    // 2) Mapeia o histórico de participação
    const hp = mapHistorico(itemAPI.HistoricoStatusParticipacao);
    setHistPart(hp);

    // 3) Guarda esse mapa dentro de itemAPI (para o buildMergedTimeline)
    itemAPI.historicoParticipacao = hp;

    // 4) Mapeia os históricos de cada vínculo, se ainda quiser manter
    const vinculos = itemAPI.VinculoSolicitacaoBolsa ?? [];
    setHistVinc(
      Object.fromEntries(
        vinculos.map((v) => [v.id, mapHistorico(v.HistoricoStatusVinculo)])
      )
    );
    setHistSol(
      Object.fromEntries(
        vinculos.map((v) => [
          v.id,
          mapHistorico(v.solicitacaoBolsa?.HistoricoStatusSolicitacaoBolsa),
        ])
      )
    );

    // 5) **Recalcula a timeline unificada AQUI**
    const unified = buildMergedTimeline(itemAPI);
    setMergeTimelineData(unified);

    // 6) Atualiza o `item` completo e demais estados (edital, tipo etc.)
    setItem(itemAPI);
    setEditalInfo(itemAPI.inscricao.edital);
    setTipoParticipacao(itemAPI.tipo);

    // 7) (se ainda precisar) buscar formulários conforme tipo…
    if (
      itemAPI.tipo === "orientador" &&
      itemAPI.inscricao.edital.formOrientadorId
    ) {
      const responseFormOrientador = await getFormulario(
        tenant,
        itemAPI.inscricao.edital.formOrientadorId
      );
      setCamposFormOrientador(
        responseFormOrientador.campos.sort((a, b) => a.ordem - b.ordem)
      );
    }
    if (
      itemAPI.tipo === "coorientador" &&
      itemAPI.inscricao.edital.formCoorientadorId
    ) {
      const responseFormCoorientador = await getFormulario(
        tenant,
        itemAPI.inscricao.edital.formCoorientadorId
      );
      setCamposFormCoorientador(
        responseFormCoorientador.campos.sort((a, b) => a.ordem - b.ordem)
      );
    }
    if (itemAPI.tipo === "aluno" && itemAPI.inscricao.edital.formAlunoId) {
      const responseFormAluno = await getFormulario(
        tenant,
        itemAPI.inscricao.edital.formAlunoId
      );
      setCamposFormAluno(
        responseFormAluno.campos.sort((a, b) => a.ordem - b.ordem)
      );
    }

    // Por fim, pare de exibir loading
    setLoading(false);
  };

  const [isLoadingConfirmacao, setIsLoadingConfirmacao] = useState(false);

  const handleConfirmarAtivarPendente = async () => {
    setIsLoadingConfirmacao(true);
    try {
      const resultado = await ativarOuPendenteParticipacao(
        tenant,
        participacaoId,
        observacaoPendencia
      );
      await fetch();
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Participação tornada pendente com sucesso!",
        life: 3000,
      });
      if (onSuccess) await onSuccess();
    } catch (error) {
      console.error("Erro ao alterar status da participação:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.message ||
          "Ocorreu um erro ao alterar o status da participação",
        life: 3000,
      });
    } finally {
      setIsLoadingConfirmacao(false);
      setIsModalAtivarPendenteOpen(false);
      setObservacaoPendencia("");
    }
  };
  const handleToggleAtivarPendente = async () => {
    const statusAtual = item.statusParticipacao || "EM_ANALISE";

    if (statusAtual === "ATIVA") {
      // Tornar pendente - abrir modal para justificativa
      setStatusAcao("PENDENTE");
      setObservacaoPendencia("");
      setIsModalAtivarPendenteOpen(true);
    } else if (
      statusAtual === "PENDENTE" ||
      statusAtual === "APROVADA" ||
      statusAtual === "EM_ANALISE"
    ) {
      // Ativar diretamente sem modal
      setIsLoadingAtivacao(true);
      try {
        const resultado = await ativarOuPendenteParticipacao(
          tenant,
          participacaoId,
          null
        );
        await fetch();
        toast.current?.show({
          severity: "success",
          summary: "Sucesso",
          detail: "Participação ativada com sucesso!",
          life: 3000,
        });
        if (onSuccess) await onSuccess();
      } catch (error) {
        console.error("Erro ao ativar participação:", error);
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: error.message || "Ocorreu um erro ao ativar a participação",
          life: 3000,
        });
      } finally {
        setIsLoadingAtivacao(false);
      }
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail:
          "A participação não está em um status que permita esta operação",
        life: 3000,
      });
    }
  };
  // Funções para abrir/fechar o modal de cancelamento
  const openModalCancelamento = () => {
    setIsModalCancelamentoOpen(true);
  };

  const closeModalCancelamento = () => {
    setIsModalCancelamentoOpen(false);
    setDataInativacao("");
  };

  // Função para lidar com o cancelamento/inativação
  const handleConfirmarCancelamento = async () => {
    if (!dataInativacao && item.inicio) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, selecione uma data de inativação",
        life: 3000,
      });
      return;
    }

    if (!justificativaInativacao) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, informe uma justificativa para a inativação",
        life: 3000,
      });
      return;
    }

    try {
      // Formata a data para o formato DD/MM/YYYY esperado pelo backend
      const formattedDate = dataInativacao;

      await inativarParticipacao(tenant, participacaoId, {
        fim: formattedDate, // Corrigido: usando o nome do parâmetro esperado pela API
        justificativa: justificativaInativacao, // Corrigido: usando o nome do parâmetro esperado pela API
      });
      const item = await getParticipacao(tenant, participacaoId);
      setItem(item);
      await fetch();
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Participação inativada com sucesso",
        life: 3000,
      });
      if (onSuccess) {
        await onSuccess();
      }
      closeModalCancelamento();
    } catch (error) {
      console.error("Erro ao inativar participação:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Ocorreu um erro ao inativar a participação",
        life: 3000,
      });
    }
  };

  // Renderização do modal de cancelamento
  const renderModalCancelamento = () => (
    <Modal isOpen={isModalCancelamentoOpen} onClose={closeModalCancelamento}>
      <div className="mb-2">
        <h4>Confirmar Inativação</h4>

        {/* Mensagens de erro/bloqueio */}
        {item?.statusParticipacao !== "APROVADA" &&
          item?.statusParticipacao !== "PENDENTE" &&
          item?.statusParticipacao !== "ATIVA" && (
            <div className="p-message p-message-error mb-3 mt-3">
              Esta participação não pode ser inativada porque seu status não é
              "APROVADO" ou "PENDENTE"
            </div>
          )}

        {item?.VinculoSolicitacaoBolsa?.some(
          (v) => v.status !== "RECUSADO" && item?.statusParticipacao !== "ATIVA"
        ) && (
          <div className="p-message p-message-warn mb-3 mt-3">
            Existem vínculos de bolsa ativos associados a esta participação. É
            necessário recusar todos os vínculos antes de inativar.
          </div>
        )}

        {/* Mostrar campos apenas se a participação puder ser inativada */}
        {(item?.statusParticipacao === "APROVADA" ||
          item?.statusParticipacao === "ATIVA" ||
          item?.statusParticipacao === "PENDENTE") && (
          <>
            <p>Informe os dados para inativação:</p>

            {/* Campo de data apenas se houver data de início */}
            {item?.inicio && (
              <div className="field mt-3">
                <label htmlFor="dataInativacao">Data de inativação</label>
                <input
                  id="dataInativacao"
                  type="date"
                  className="p-inputtext p-component w-full"
                  value={dataInativacao}
                  onChange={(e) => setDataInativacao(e.target.value)}
                  min={
                    new Date(item.inicio.split("/").reverse().join("-"))
                      .toISOString()
                      .split("T")[0]
                  }
                />
              </div>
            )}

            {/* Campo de justificativa sempre visível quando pode inativar */}
            <div className="field mt-3">
              <label htmlFor="justificativa">Justificativa *</label>
              <textarea
                id="justificativa"
                className="p-inputtext p-component w-full"
                value={justificativaInativacao}
                onChange={(e) => setJustificativaInativacao(e.target.value)}
                rows={3}
                placeholder="Informe o motivo da inativação..."
                required
              />
            </div>
          </>
        )}

        <div className="flex justify-content-end gap-1 mt-4">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            onClick={closeModalCancelamento}
          />
          <Button
            label="Confirmar Inativação"
            severity="danger"
            onClick={handleConfirmarCancelamento}
            disabled={
              // Desabilitar se:
              // 1. Status não for APROVADA
              (item?.statusParticipacao !== "APROVADA" &&
                item?.statusParticipacao !== "PENDENTE" &&
                item?.statusParticipacao !== "ATIVA" &&
                // 2. Há vínculos não recusados
                item?.VinculoSolicitacaoBolsa?.length > 0 &&
                item?.VinculoSolicitacaoBolsa?.some(
                  (v) => v.status !== "RECUSADO"
                )) ||
              // 3. Falta justificativa
              !justificativaInativacao ||
              // 4. Falta data de inativação (se houver data de início)
              (item?.inicio && !dataInativacao)
            }
          />
        </div>
      </div>
    </Modal>
  );

  // Estados para substituição de aluno
  const [cpfVerificado, setCpfVerificado] = useState(null);
  const [novoAluno, setNovoAluno] = useState(null);
  const [motivoSubstituicao, setMotivoSubstituicao] = useState("");
  const [dataInicioSubstituicao, setDataInicioSubstituicao] = useState(null);
  const [loadingSubstituicao, setLoadingSubstituicao] = useState(false);

  // Função para lidar com a substituição
  const handleSubstituirAluno = async () => {
    if (!motivoSubstituicao.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, informe o motivo da substituição",
        life: 3000,
      });
      return;
    }

    if (item?.inicio && !dataInicioSubstituicao) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, informe a data de início para a nova participação",
        life: 3000,
      });
      return;
    }

    try {
      setLoadingSubstituicao(true);
      const resultado = await substituirAlunoParticipacao(
        tenant,
        participacaoId,
        cpfVerificado.userId,
        motivoSubstituicao,
        dataInicioSubstituicao
          ? formatarDataParaBackend(dataInicioSubstituicao)
          : null
      );

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Substituição realizada!",
        life: 3000,
      });
      await fetch();
      if (onSuccess) {
        await onSuccess();
      }
      setCpfVerificado();
      setNovoAluno();
      setMotivoSubstituicao("");

      setIsModalSubstituicaoAlunoOpen(false);
    } catch (error) {
      console.error("Erro ao substituir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Ocorreu um erro ao substituir",
        life: 3000,
      });
    } finally {
      setLoadingSubstituicao(false);
    }
  };

  // Modal de substituição de aluno
  const renderModalSubstituicaoAluno = () => (
    <Modal
      isOpen={isModalSubstituicaoAlunoOpen}
      onClose={() => {
        setIsModalSubstituicaoAlunoOpen(false);
        setCpfVerificado();
        setNovoAluno();
        setMotivoSubstituicao("");
      }}
    >
      <div className="mb-2">
        <h4 className="mb-2">Substituição</h4>

        {!cpfVerificado ? (
          <CPFVerificationForm
            tenantSlug={tenant}
            onCpfVerified={(data) => {
              setCpfVerificado(data);
              setNovoAluno(data);
            }}
          />
        ) : (
          <div className="flex flex-column gap-3">
            <div className="field mb-2">
              <label htmlFor="novoAluno">Novo Participante</label>
              <InputText
                className="w-100"
                id="novoAluno"
                value={novoAluno.nome}
                disabled
              />
            </div>

            <div className="field">
              <label htmlFor="motivo">Motivo da Substituição *</label>
              <InputTextarea
                id="motivo"
                value={motivoSubstituicao}
                onChange={(e) => setMotivoSubstituicao(e.target.value)}
                placeholder="Informe o motivo da substituição"
              />
            </div>

            {item?.inicio && (
              <div className="field">
                <label htmlFor="dataInicio">Nova Data de Início *</label>
                <Calendar
                  id="dataInicio"
                  value={dataInicioSubstituicao}
                  onChange={(e) => setDataInicioSubstituicao(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                />
              </div>
            )}

            <div className="flex justify-content-end gap-1 mt-3">
              <Button
                label="Cancelar"
                severity="secondary"
                outlined
                onClick={() => {
                  setIsModalSubstituicaoAlunoOpen(false);
                  setCpfVerificado();
                  setNovoAluno();
                  setMotivoSubstituicao("");
                }}
              />
              <Button
                label={
                  loadingSubstituicao
                    ? "Substituindo..."
                    : "Confirmar Substituição"
                }
                icon={loadingSubstituicao ? "pi pi-spinner pi-spin" : ""}
                onClick={handleSubstituirAluno}
                disabled={
                  !motivoSubstituicao.trim() ||
                  (item?.inicio && !dataInicioSubstituicao)
                }
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
  const [historicoParticipacao, setHistPart] = useState([]);
  const [historicoVinculo, setHistVinc] = useState({});
  const [historicoSolicitacao, setHistSol] = useState({});
  const [mergeTimelineData, setMergeTimelineData] = useState([]);

  const toast = useRef(null);
  useEffect(() => {
    setLoading(true);
    fetch().catch((err) => {
      console.error("Erro ao buscar dados iniciais:", err);
      setLoading(false);
    });
  }, [tenant, participacaoId]);

  const formatarDataParaBackend = (dataISO) => {
    const date = new Date(dataISO);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [loadingVinculoId, setLoadingVinculoId] = useState(null);

  const handleAtivarVinculo = async (vinculoId) => {
    setLoadingVinculoId(vinculoId);
    try {
      await ativarVinculo(tenant, vinculoId); // chamada à API
      await fetch(); // atualiza os dados
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Vínculo ativado com sucesso!",
        life: 3000,
      });
      if (onSuccess) await onSuccess();
    } catch (err) {
      console.error("Erro ao ativar vínculo:", err);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail:
          err?.response?.data?.message ||
          err.message ||
          "Falha ao ativar vínculo",
        life: 4000,
      });
    } finally {
      setLoadingVinculoId(null);
    }
  };
  const [loadingPendenciaId, setLoadingPendenciaId] = useState(null);
  const [modalPendenciaVinculoId, setModalPendenciaVinculoId] = useState(null);
  const [justPendencia, setJustPendencia] = useState("");
  const handleTornarPendente = async () => {
    if (!justPendencia.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Informe a justificativa da pendência",
        life: 3000,
      });
      return;
    }

    setLoadingPendenciaId(modalPendenciaVinculoId);
    try {
      await tornarPendenteVinculo(
        tenant,
        modalPendenciaVinculoId,
        justPendencia.trim()
      );
      await fetch(); // atualiza a tela
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Vínculo tornado pendente com sucesso",
        life: 3000,
      });
      if (onSuccess) await onSuccess();
      setModalPendenciaVinculoId(null); // fecha modal
      setJustPendencia("");
    } catch (err) {
      console.error("Erro:", err);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail:
          err?.response?.data?.message ||
          err.message ||
          "Falha ao alterar status",
        life: 4000,
      });
    } finally {
      setLoadingPendenciaId(null);
    }
  };
  {
    /* fora do return principal, mas dentro do componente */
  }
  const renderModalPendenciaVinculo = () => (
    <Modal
      isOpen={!!modalPendenciaVinculoId}
      onClose={() => {
        setModalPendenciaVinculoId(null);
        setJustPendencia("");
      }}
    >
      <h4 className="mb-3">Justificativa da Pendência</h4>

      <InputTextarea
        rows={4}
        className="w-full"
        value={justPendencia}
        onChange={(e) => setJustPendencia(e.target.value)}
        placeholder="Descreva o motivo…"
      />

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          onClick={() => {
            setModalPendenciaVinculoId(null);
            setJustPendencia("");
          }}
        />
        <Button
          label={
            loadingPendenciaId ? (
              <>
                <i className="pi pi-spinner pi-spin mr-2" />
                Processando…
              </>
            ) : (
              "Confirmar"
            )
          }
          disabled={loadingPendenciaId}
          onClick={handleTornarPendente}
        />
      </div>
    </Modal>
  );
  const [loadingCancelId, setLoadingCancelId] = useState(null);
  const [modalCancelVincId, setModalCancelVincId] = useState(null);
  const [justCancel, setJustCancel] = useState("");
  const handleCancelarVinculo = async () => {
    if (!justCancel.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Informe a justificativa do cancelamento",
        life: 3000,
      });
      return;
    }

    setLoadingCancelId(modalCancelVincId);
    try {
      await cancelarVinculo(tenant, modalCancelVincId, justCancel.trim());
      await fetch(); // atualiza a tela
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Vínculo cancelado com sucesso",
        life: 3000,
      });
      if (onSuccess) await onSuccess();
      setModalCancelVincId(null);
      setJustCancel("");
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail:
          err?.response?.data?.message ||
          err.message ||
          "Falha ao cancelar vínculo",
        life: 4000,
      });
    } finally {
      setLoadingCancelId(null);
    }
  };
  const renderModalCancelVinculo = () => (
    <Modal
      isOpen={!!modalCancelVincId}
      onClose={() => {
        setModalCancelVincId(null);
        setJustCancel("");
      }}
    >
      <h4 className="mb-3">Justificativa de Cancelamento</h4>

      <InputTextarea
        rows={4}
        className="w-full"
        value={justCancel}
        onChange={(e) => setJustCancel(e.target.value)}
        placeholder="Explique por que o vínculo está sendo cancelado…"
      />

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          onClick={() => {
            setModalCancelVincId(null);
            setJustCancel("");
          }}
        />
        <Button
          label={
            loadingCancelId ? (
              <>
                <i className="pi pi-spinner pi-spin mr-2" /> Processando…
              </>
            ) : (
              "Confirmar cancelamento"
            )
          }
          disabled={loadingCancelId}
          onClick={handleCancelarVinculo}
        />
      </div>
    </Modal>
  );
  const [loadingDevolucaoId, setLoadingDevolucaoId] = useState(null);
  const [modalDevolucaoId, setModalDevolucaoId] = useState(null);
  const [justDevolucao, setJustDevolucao] = useState("");
  const handleDevolverBolsa = async () => {
    if (!justDevolucao.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Informe a justificativa da devolução",
        life: 3000,
      });
      return;
    }

    setLoadingDevolucaoId(modalDevolucaoId);
    try {
      await devolverBolsa(tenant, modalDevolucaoId, justDevolucao.trim());
      await fetch();
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Bolsa devolvida com sucesso",
        life: 3000,
      });
      onSuccess && (await onSuccess());
      setModalDevolucaoId(null);
      setJustDevolucao("");
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail:
          err?.response?.data?.message || err.message || "Falha na devolução",
        life: 4000,
      });
    } finally {
      setLoadingDevolucaoId(null);
    }
  };
  const renderModalDevolucao = () => (
    <Modal
      isOpen={!!modalDevolucaoId}
      onClose={() => {
        setModalDevolucaoId(null);
        setJustDevolucao("");
      }}
    >
      <h4 className="mb-3">Justificativa da Devolução</h4>

      <InputTextarea
        rows={4}
        className="w-full"
        value={justDevolucao}
        onChange={(e) => setJustDevolucao(e.target.value)}
        placeholder="Explique o motivo da devolução da bolsa…"
      />

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          onClick={() => {
            setModalDevolucaoId(null);
            setJustDevolucao("");
          }}
        />
        <Button
          label={
            loadingDevolucaoId ? (
              <>
                <i className="pi pi-spinner pi-spin mr-2" /> Processando…
              </>
            ) : (
              "Confirmar devolução"
            )
          }
          disabled={loadingDevolucaoId}
          onClick={handleDevolverBolsa}
        />
      </div>
    </Modal>
  );
  const [modalTransferOpen, setModalTransferOpen] = useState(false);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [alunosOptions, setAlunosOptions] = useState([]);
  const [alunoDestinoId, setAlunoDestinoId] = useState(null);
  const [justTransfer, setJustTransfer] = useState("");
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [vinculoOrigemSelecionado, setVinculoOrigemSelecionado] =
    useState(null);

  const loadAlunosInscricao = async () => {
    if (loadingAlunos || alunosOptions.length) return; // já carregado
    try {
      setLoadingAlunos(true);
      const dados = await getInscricao(tenant, item.inscricao.id);
      console.log(item.inscricao.id);
      console.log(dados);
      setAlunosOptions(
        (dados.alunos || []).map((p) => ({
          label: p.nome_aluno, // campo vindo do back-end achatado
          value: p.id, // id da Participacao
        }))
      );
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível carregar os alunos desta inscrição",
      });
    } finally {
      setLoadingAlunos(false);
    }
  };
  const renderModalTransferencia = () => (
    <Modal
      isOpen={modalTransferOpen}
      onClose={() => {
        setModalTransferOpen(false);
        setAlunoDestinoId(null);
        setJustTransfer("");
        setVinculoOrigemSelecionado(null);
        setDataTransferencia(null);
      }}
    >
      <h4 className="mb-3">Transferir bolsa para outro aluno</h4>

      {loadingAlunos ? (
        <p>Carregando alunos…</p>
      ) : (
        <>
          <Dropdown
            className="w-full mb-3"
            placeholder="Selecione o aluno"
            options={alunosOptions}
            value={alunoDestinoId}
            onChange={(e) => setAlunoDestinoId(e.value)}
          />
          <InputTextarea
            rows={4}
            className="w-full"
            placeholder="Justificativa da transferência"
            value={justTransfer}
            onChange={(e) => setJustTransfer(e.target.value)}
          />
          <div className="field mt-3">
            <label htmlFor="dataInativacao">Data da Transferência</label>
            <input
              id="dataTransferencia"
              type="date"
              className="p-inputtext p-component w-full"
              value={dataTransferencia}
              onChange={(e) => setDataTransferencia(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          onClick={() => setModalTransferOpen(false)}
        />
        <Button
          label={
            loadingTransfer ? (
              <>
                <i className="pi pi-spinner pi-spin mr-2" /> Processando…
              </>
            ) : (
              "Confirmar"
            )
          }
          disabled={loadingTransfer}
          onClick={async () => {
            if (!alunoDestinoId || !justTransfer.trim()) {
              toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Selecione o aluno e informe a justificativa",
              });
              return;
            }
            try {
              setLoadingTransfer(true);
              await transferirBolsa(
                tenant,
                vinculoOrigemSelecionado, // use o solicitacaoBolsaId atual
                alunoDestinoId,
                justTransfer.trim(),
                dataTransferencia
              );
              await fetch();
              toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: "Transferência concluída",
              });
              onSuccess && (await onSuccess());
              setModalTransferOpen(false);
              setAlunoDestinoId(null);
              setJustTransfer("");
            } catch (err) {
              console.error(err);
              toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: err?.response?.data?.message || err.message,
              });
            } finally {
              setLoadingTransfer(false);
            }
          }}
        />
      </div>
    </Modal>
  );
  const handleUpdateTimelineEvent = async (updatedEvent) => {
    try {
      // Extrai os dados necessários do evento atualizado
      const { id, date, tabelaHistorico } = updatedEvent;

      // Parse da data no formato "dd/mm/yyyy hh:mm:ss" para os componentes individuais
      const [datePart, timePart] = date.split(" ");
      const [dd, mm, yyyy] = datePart.split("/");
      const [hh, min] = timePart.split(":");

      // Depois faz a chamada à API
      await updateDataHistorico(
        tenant,
        parseInt(dd),
        parseInt(mm),
        parseInt(yyyy),
        parseInt(hh),
        parseInt(min),
        tabelaHistorico,
        id
      );

      // Atualiza novamente para garantir sincronia (opcional)
      await fetch(); // Isso vai recarregar todos os dados do backend

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Evento atualizado com sucesso",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      // Reverte a mudança local em caso de erro
      await fetch(); // Recarrega os dados originais

      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao atualizar evento",
        life: 3000,
      });
    }
  };
  return (
    <>
      <Toast ref={toast} />
      {renderModalSubstituicaoAluno()}
      {renderModalCancelamento()}
      {renderModalAtivarPendente()}
      {renderModalPendenciaVinculo()}
      {renderModalCancelVinculo()}
      {renderModalDevolucao()}
      {renderModalTransferencia()}

      {loading && <p>Carregando...</p>}
      {item && !loading && (
        <>
          {/* TELA DE VISUALIZAÇÃO */}
          <div className={styles.content}>
            <div className={styles.mainContent}>
              {item.tipo === "aluno" && (
                <div className={styles.box}>
                  <div className={styles.header}>
                    <div className={styles.icon}>
                      <RiGroupLine />
                    </div>
                    <h6>Plano de Trabalho</h6>
                  </div>
                  <div className={styles.list}>
                    <div className={styles.itemList}>
                      <div className={styles.content1}>
                        <p>{item.planoDeTrabalho?.titulo}</p>
                      </div>
                      <div className={styles.content2} onClick={() => {}}>
                        <RiArrowRightSLine />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {item.tipo === "aluno" && (
                <div className={styles.box}>
                  <div className={styles.header}>
                    <div className={styles.icon}>
                      <RiGroupLine />
                    </div>
                    <h6>Orientador</h6>
                  </div>
                  <div className={styles.list}>
                    <div className={styles.itemList}>
                      <div className={styles.content1}>
                        <p>
                          {item.inscricao?.participacoes?.find(
                            (p) => p.tipo === "orientador"
                          )?.user?.nome || "Nenhum orientador encontrado"}
                        </p>
                      </div>
                      <div className={styles.content2} onClick={() => {}}>
                        <RiArrowRightSLine />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-2">
                <div className={styles.userCard}>
                  <div className={styles.user}>
                    <h6>{item.user?.nome}</h6>

                    <div className={styles.actions}>
                      <div
                        onClick={() => {
                          setIsModalSubstituicaoAlunoOpen(true);
                          setCpfVerificado();
                          setNovoAluno();
                          setMotivoSubstituicao("");
                        }}
                        className={`${styles.action} ${styles.warning}`}
                        disabled={item.statusParticipacao !== "APROVADA"}
                        title={
                          item.statusParticipacao !== "APROVADA"
                            ? "Só é possível substituir alunos em participações com status APROVADA"
                            : "Substituir aluno"
                        }
                      >
                        <RiP2pFill />
                        <p>Substituir</p>
                      </div>
                      <div
                        onClick={handleToggleAtivarPendente}
                        className={`${styles.action} ${
                          item.statusParticipacao === "ATIVA"
                            ? styles.error
                            : styles.normal
                        }`}
                        disabled={
                          isLoadingAtivacao ||
                          !["PENDENTE", "ATIVA", "APROVADA"].includes(
                            item.statusParticipacao
                          )
                        }
                        title={
                          !["PENDENTE", "ATIVA", "APROVADA"].includes(
                            item.statusParticipacao
                          )
                            ? "Só é possível alternar entre status ATIVA e PENDENTE"
                            : item.statusParticipacao === "ATIVA"
                            ? "Tornar participação pendente"
                            : "Ativar participação"
                        }
                      >
                        {isLoadingAtivacao ? (
                          <i className="pi pi-spinner pi-spin" />
                        ) : item.statusParticipacao === "ATIVA" ? (
                          <RiForbid2Line />
                        ) : (
                          <RiCheckboxCircleLine />
                        )}
                        <p>
                          {item.statusParticipacao === "ATIVA"
                            ? "Pendente"
                            : "Ativar"}
                        </p>
                      </div>
                      <div
                        onClick={openModalCancelamento}
                        className={`${styles.action} ${styles.error}`}
                        disabled={
                          item.statusParticipacao !== "APROVADA" ||
                          item.VinculoSolicitacaoBolsa?.some(
                            (v) => v.status !== "RECUSADO"
                          )
                        }
                        title={
                          item.statusParticipacao !== "APROVADA" ||
                          item.statusParticipacao !== "PENDENTE"
                            ? "Só é possível inativar participações com status APROVADA ou PENDENTE"
                            : item.VinculoSolicitacaoBolsa?.some(
                                (v) => v.status !== "RECUSADO"
                              )
                            ? "Recuse todos os vínculos de bolsa antes de inativar"
                            : "Inativar participação"
                        }
                      >
                        <RiUserUnfollowLine />
                        <p>Cancelar</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.contentCard}>
                    <div className={styles.historico}>
                      <LinhaTempo
                        data={historicoParticipacao}
                        onUpdate={handleUpdateTimelineEvent}
                        tabelaHistorico="participacao"
                      />
                    </div>

                    <div
                      className={`flex flex-column  ${styles.checkboxList} `}
                    ></div>
                    {item.VinculoSolicitacaoBolsa.length > 0 &&
                      item.VinculoSolicitacaoBolsa.filter(
                        (vinculo) =>
                          vinculo.status !== "TRANSFERIDA" &&
                          vinculo.status !== "RECUSADO" //||
                        //true //faz mostrar o historico da vinculacao da balsa mesmo se o aluno nao tiver mais bolsa
                      ).map((vinculo) => (
                        <div
                          key={vinculo.id}
                          className={`${styles.userCard} mt-2`}
                        >
                          <div className={styles.user}>
                            <h6>Vinculação</h6>

                            <div className={styles.actions}>
                              <div
                                onClick={() => {
                                  setModalCancelVincId(vinculo.id);
                                  setJustCancel("");
                                }}
                                className={`${styles.action} ${styles.normal}`}
                                disabled={
                                  loadingCancelId === vinculo.id ||
                                  ["EM_ANALISE", "APROVADA"].includes(
                                    vinculo.solicitacaoBolsa?.status || ""
                                  )
                                }
                              >
                                {loadingCancelId === vinculo.id ? (
                                  <i className="pi pi-spinner pi-spin" />
                                ) : (
                                  <RiProhibited2Line />
                                )}
                                <p>Cancelar</p>
                              </div>
                              <div
                                onClick={() => {
                                  setModalPendenciaVinculoId(vinculo.id);
                                  setJustPendencia("");
                                }}
                                className={`${styles.action} ${styles.normal}`}
                                disabled={loadingPendenciaId === vinculo.id}
                              >
                                {loadingPendenciaId === vinculo.id ? (
                                  <i className="pi pi-spinner pi-spin" />
                                ) : (
                                  <RiErrorWarningLine />
                                )}
                                <p>Pendência</p>
                              </div>
                              <div
                                onClick={() => handleAtivarVinculo(vinculo.id)}
                                className={`${styles.action} ${styles.normal}`}
                                disabled={loadingVinculoId === vinculo.id}
                              >
                                {loadingVinculoId === vinculo.id ? (
                                  <i className="pi pi-spinner pi-spin" />
                                ) : (
                                  <RiCheckboxCircleLine />
                                )}
                                <p>Ativar</p>
                              </div>
                            </div>
                          </div>
                          <div className={styles.contentCard}>
                            <h6>Status da vinculação entre aluno e Bolsa: </h6>

                            <div className={styles.historico}>
                              <LinhaTempo
                                data={historicoVinculo[vinculo.id]}
                                onUpdate={handleUpdateTimelineEvent}
                                tabelaHistorico="vinculo"
                              />
                            </div>
                            <div
                              key={vinculo.id}
                              className={`${styles.userCard} mt-2`}
                            >
                              <div className={styles.user}>
                                <h6>
                                  Solicitação de Bolsa ID-
                                  {vinculo.solicitacaoBolsa.id}
                                </h6>
                                <div className={styles.actions}>
                                  <div
                                    className={`${styles.action} ${styles.normal}`}
                                    onClick={async () => {
                                      setVinculoOrigemSelecionado(vinculo.id); // ➜ NOVO estado
                                      await loadAlunosInscricao();
                                      setDataTransferencia(null);
                                      setModalTransferOpen(true);
                                    }}
                                  >
                                    <RiExchangeLine />
                                    <p>Transferir</p>
                                  </div>

                                  <div
                                    className={`${styles.action} ${styles.error}`}
                                    onClick={() => {
                                      setModalDevolucaoId(
                                        vinculo.solicitacaoBolsa?.id
                                      );
                                      setJustDevolucao("");
                                    }}
                                    disabled={
                                      loadingDevolucaoId ===
                                        vinculo.solicitacaoBolsa?.id ||
                                      // bloqueia se status EM_ANALISE ou APROVADA
                                      ["EM_ANALISE", "APROVADA"].includes(
                                        vinculo.solicitacaoBolsa?.status
                                      )
                                    }
                                  >
                                    {loadingDevolucaoId ===
                                    vinculo.solicitacaoBolsa?.id ? (
                                      <i className="pi pi-spinner pi-spin" />
                                    ) : (
                                      <RiSwapLine />
                                    )}
                                    <p>Devolver</p>
                                  </div>
                                </div>
                              </div>
                              <div className={styles.contentCard}>
                                <h6>Fonte pagadora: </h6>
                                <p>
                                  {vinculo.solicitacaoBolsa?.bolsa?.cota
                                    .instituicaoPagadora ||
                                    "Aluno deve aguardar disponbilização de bolsa"}
                                </p>
                                <div className={styles.historico}>
                                  <LinhaTempo
                                    data={historicoSolicitacao[vinculo.id]}
                                    onUpdate={handleUpdateTimelineEvent}
                                    tabelaHistorico="solicitacaoBolsa"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    <div className={`${styles.box} mt-2`}>
                      <div className={styles.header}>
                        <div className={styles.icon}>
                          <RiHistoryLine />{" "}
                          {/* Adicione este ícone aos seus imports */}
                        </div>
                        <h6>Histórico Completo</h6>
                      </div>
                      <div className="p-2">
                        <LinhaTempo
                          className={styles.linhaTempo}
                          data={mergeTimelineData}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ParticipacaoGestorController;
