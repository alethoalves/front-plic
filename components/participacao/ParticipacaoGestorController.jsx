"use client";

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

import { InputTextarea } from "primereact/inputtextarea";
import { mapHistorico } from "@/lib/mapHistorico";
import { getInscricao } from "@/app/api/client/inscricao";
import { LinhaTempo } from "../LinhaDoTempo";
import { updateDataHistorico } from "@/app/api/client/historico";
import InsertUpdateDate from "../InsertUpdateDate";
import { buildMergedTimeline } from "@/lib/TimeLineUnificada";

const ParticipacaoGestorController = ({
  tenant,
  ano,
  participacaoId,
  onSuccess,
}) => {
  // ================ ESTADOS PRINCIPAIS ================
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editalInfo, setEditalInfo] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);

  // Estados para formulários
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);

  // Estados para histórico
  const [historicoParticipacao, setHistPart] = useState([]);
  const [historicoVinculo, setHistVinc] = useState({});
  const [historicoSolicitacao, setHistSol] = useState({});
  const [mergeTimelineData, setMergeTimelineData] = useState([]);

  // Referências
  const toast = useRef(null);

  // ================ ESTADOS PARA MODAIS E AÇÕES ================
  // Substituição de aluno

  const [cpfVerificado, setCpfVerificado] = useState(null);
  const [novoAluno, setNovoAluno] = useState(null);

  // Ativação/Pendência

  const [statusAcao, setStatusAcao] = useState(null);
  const [isLoadingAtivacao, setIsLoadingAtivacao] = useState(false);
  const [statusPendencia, setStatusPendencia] = useState("PENDENTE");

  // Transferência de bolsa
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [alunosOptions, setAlunosOptions] = useState([]);
  const [alunoDestinoId, setAlunoDestinoId] = useState(null);
  const [vinculoOrigemSelecionado, setVinculoOrigemSelecionado] =
    useState(null);
  const [dataTransferencia, setDataTransferencia] = useState("");

  // Estados para ações em vínculos
  const [loadingVinculoId, setLoadingVinculoId] = useState(null);
  const [loadingPendenciaId, setLoadingPendenciaId] = useState(null);
  const [modalPendenciaVinculoId, setModalPendenciaVinculoId] = useState(null);
  const [justPendencia, setJustPendencia] = useState("");
  const [loadingCancelId, setLoadingCancelId] = useState(null);
  const [modalCancelVincId, setModalCancelVincId] = useState(null);
  const [justCancel, setJustCancel] = useState("");
  const [loadingDevolucaoId, setLoadingDevolucaoId] = useState(null);
  const [modalDevolucaoId, setModalDevolucaoId] = useState(null);
  const [justDevolucao, setJustDevolucao] = useState("");

  // ================ FUNÇÕES DE BUSCA DE DADOS ================
  const fetch = async () => {
    // 1) Busca o registro atualizado da API
    const itemAPI = await getParticipacao(tenant, participacaoId, ano);
    console.log(itemAPI);
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

  // ================ HANDLERS PARA PARTICIPAÇÃO ================
  const handleToggleAtivarPendente = async () => {
    const statusAtual = item.statusParticipacao || "EM_ANALISE";
    setStatusAcao(statusAtual);
    handleOpenModal("toggleParticipacao");
  };

  const handleConfirmarAtivarPendente = async () => {
    // Validação dos campos obrigatórios
    if (statusAcao === "PENDENTE" && !dateValue) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Data é obrigatória para ativação",
        life: 3000,
      });
      return;
    }

    if (statusAcao === "ATIVA" && (!dateValue || !justificativa)) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Data e justificativa são obrigatórias para esta ação",
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      await ativarOuPendenteParticipacao(
        tenant,
        participacaoId,
        justificativa,
        dateValue
      );

      await fetch();

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: `Participação ${
          statusAcao === "ATIVA" ? "ativada" : "tornada pendente"
        } com sucesso!`,
        life: 3000,
      });

      if (onSuccess) await onSuccess();

      // Reset dos estados
      setModalOpen(false);
      setJustificativa("");
      setDateValue(null); // ou setDateValue("") dependendo do seu estado inicial
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
      setSaving(false);
    }
  };

  const handleConfirmarCancelamento = async () => {
    if (!dateValue) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, selecione uma data de inativação",
        life: 3000,
      });
      return;
    }

    if (!justificativa) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, informe uma justificativa para a inativação",
        life: 3000,
      });
      return;
    }

    try {
      setSaving(true);
      await inativarParticipacao(tenant, participacaoId, {
        fim: dateValue,
        justificativa,
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
      await fetch();
      if (onSuccess) {
        await onSuccess();
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Erro ao inativar participação:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Ocorreu um erro ao inativar a participação",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Funções para substituição de aluno
  const handleSubstituirAluno = async () => {
    if (!justificativa.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, informe o motivo da substituição",
        life: 3000,
      });
      return;
    }

    if (!dateValue) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, informe a data de início para a nova participação",
        life: 3000,
      });
      return;
    }

    try {
      setSaving(true);
      await substituirAlunoParticipacao(
        tenant,
        participacaoId,
        cpfVerificado.userId,
        justificativa,
        dateValue
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
      setJustificativa("");

      setModalOpen(false);
    } catch (error) {
      console.error("Erro ao substituir:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Ocorreu um erro ao substituir",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ================ HANDLERS PARA VÍNCULOS ================
  const handleTransferirBolsa = async () => {
    setSaving(true);
    try {
      await transferirBolsa(
        tenant,
        vinculoOrigemSelecionado,
        alunoDestinoId,
        justificativa.trim(),
        dateValue
      );

      toast.current?.show({
        severity: "success",
        detail: "Transferência concluída",
      });
      await fetch();
      onSuccess?.();
      setModalOpen(false);
    } catch (error) {
      console.log(error);
      toast.current?.show({
        severity: "error",
        detail: error.response?.data?.message,
      });
    } finally {
      setSaving(false);
    }
  };
  const handleAtivarVinculo = async (vinculoId) => {
    // Verifica se dateValue existe
    if (!dateValue) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "A data é obrigatória para ativar o vínculo",
        life: 3000,
      });
      return; // Interrompe a execução se não tiver dateValue
    }

    setSaving(true);
    try {
      await ativarVinculo(tenant, vinculoId, dateValue); // Assumindo que a API aceita dateValue como parâmetro
      await fetch();

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Vínculo ativado com sucesso!",
        life: 3000,
      });

      if (onSuccess) await onSuccess();

      // Limpa o estado da data após sucesso (opcional)
      setDateValue(null);
      setModalOpen(false);
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
      setSaving(false);
    }
  };
  const handleTornarPendente = async (vinculoId) => {
    if (!justificativa.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Informe a justificativa da pendência",
        life: 3000,
      });
      return;
    }
    if (!dateValue) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "A data é obrigatória para ativar o vínculo",
        life: 3000,
      });
      return;
    }
    setSaving(true);
    try {
      // Envia o status selecionado (se for PENDENTE, envia null para usar o padrão)
      await tornarPendenteVinculo(
        tenant,
        vinculoId,
        justificativa.trim(),
        dateValue,
        statusPendencia === "PENDENTE" ? null : statusPendencia
      );
      await fetch();
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: `Vínculo tornado ${statusPendencia.toLowerCase()} com sucesso`,
        life: 3000,
      });
      if (onSuccess) await onSuccess();
      setDateValue(null);
      setModalOpen(false);
      // Reseta o status para o padrão após fechar o modal
      setStatusPendencia("PENDENTE");
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
      setSaving(false);
    }
  };

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
      await fetch();
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

  const handleDevolverBolsa = async () => {
    if (!justificativa.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Informe a justificativa da devolução",
        life: 3000,
      });
      return;
    }
    if (!dateValue) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, selecione uma data",
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      await devolverBolsa(
        tenant,
        solicitacaoBolsaId,
        justificativa.trim(),
        dateValue
      );
      await fetch();
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Bolsa devolvida com sucesso",
        life: 3000,
      });
      onSuccess && (await onSuccess());
      setSolicitacaoBolsaId(null);
      setModalOpen(false);
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
      setSaving(false);
    }
  };

  // ================ HANDLERS PARA TRANSFERÊNCIA ================
  const loadAlunosInscricao = async () => {
    if (loadingAlunos || alunosOptions.length) return;
    try {
      setLoadingAlunos(true);
      const dados = await getInscricao(tenant, item.inscricao.id);
      setAlunosOptions(
        (dados.alunos || []).map((p) => ({
          label: p.nome_aluno,
          value: p.id,
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

  // ================ HANDLERS PARA TIMELINE ================
  const handleUpdateTimelineEvent = async (updatedEvent) => {
    try {
      const { id, date, tabelaHistorico } = updatedEvent;
      const [datePart, timePart] = date.split(" ");
      const [dd, mm, yyyy] = datePart.split("/");
      const [hh, min] = timePart.split(":");

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

      await fetch();
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Evento atualizado com sucesso",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      await fetch();
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao atualizar evento",
        life: 3000,
      });
    }
  };

  // ================ RENDERIZAÇÃO DE MODAIS ================

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

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justificativa, setJustificativa] = useState();
  const [dateValue, setDateValue] = useState();
  const [option, setOption] = useState();
  const [vinculoId, setVinculoId] = useState();
  const [solicitacaoBolsaId, setSolicitacaoBolsaId] = useState();
  const opcoes = {
    transferencia: {
      titulo: "Transferir bolsa para outro aluno",
      onSave: handleTransferirBolsa,
      data: alunosOptions,
      loadingData: loadingAlunos,
      showDropdown: true,
      dropdownProps: {
        options: alunosOptions,
        value: alunoDestinoId,
        onChange: (e) => setAlunoDestinoId(e.value),
      },
      showTextarea: true,
      showDateInput: true,
    },
    devolucao: {
      titulo: "Devolver bolsa",
      onSave: handleDevolverBolsa,
      showTextarea: true,
      showDateInput: true,
    },
    ativarVinculo: {
      titulo: "Ativar vínculo entre aluno e a solicitação de bolsa",
      onSave: () => handleAtivarVinculo(vinculoId),
      showDateInput: true,
    },
    pendenteVinculo: {
      titulo: "Tornar pendente o vínculo entre aluno e a solicitação de bolsa",
      onSave: () => handleTornarPendente(vinculoId),
      showDateInput: true,
      showTextarea: true,
      showStatusDropdown: true, // Nova propriedade para mostrar o dropdown de status
      statusDropdownProps: {
        value: statusPendencia,
        onChange: (e) => setStatusPendencia(e.value),
        options: [
          { label: "Pendente", value: "PENDENTE" },
          { label: "CV em preenchimento", value: "CV_PENDENTE" },
        ],
      },
    },
    substituicao: {
      titulo: "Substituição de aluno",
      onSave: handleSubstituirAluno,
      isSubstituicao: true,
      showTextarea: true,
      showDateInput: true,
      tenant: tenant,
      substituicaoProps: {
        setCpfVerificado,
        cpfVerificado,
        setNovoAluno,
        tenant,
      },
    },
    toggleParticipacao: {
      titulo: `${
        statusAcao === "ATIVA"
          ? "Tornar Participação Pendente"
          : "Ativar Participação"
      }`,
      onSave: handleConfirmarAtivarPendente,
      showDateInput: true,
      showTextarea: statusAcao === "ATIVA" ? true : false,
    },
    cancelamento: {
      titulo: "Cancelar Participação",
      onSave: handleConfirmarCancelamento,
      showTextarea: true,
      showDateInput: true,
    },
  };
  const handleOpenModal = (option) => {
    setAlunoDestinoId(null);
    setJustificativa("");
    setDateValue("");
    setModalOpen(true);
    setOption(option);
    setSaving(false);
    setCpfVerificado();
    setNovoAluno();
  };
  const renderModalOpcoes = () => (
    <>
      {opcoes[option] && (
        <InsertUpdateDate
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            // Reseta o status para PENDENTE quando fechar o modal
            if (option === "pendenteVinculo") {
              setStatusPendencia("PENDENTE");
            }
          }}
          title={opcoes[option].titulo}
          onSave={opcoes[option].onSave}
          isLoading={saving}
          loadingData={opcoes[option].loadingData}
          showDropdown={opcoes[option].showDropdown}
          dropdownProps={opcoes[option].dropdownProps}
          showTextarea={opcoes[option].showTextarea}
          textareaProps={{
            value: justificativa,
            onChange: (e) => setJustificativa(e.target.value),
          }}
          showDateInput={opcoes[option].showDateInput}
          dateInputProps={{
            value: dateValue,
            onChange: (e) => setDateValue(e.target.value),
          }}
          // Novas props para o dropdown de status
          showStatusDropdown={opcoes[option].showStatusDropdown}
          statusDropdownProps={opcoes[option].statusDropdownProps}
          isSubstituicao={opcoes[option].isSubstituicao}
          substituicaoProps={opcoes[option].substituicaoProps}
        />
      )}
    </>
  );

  // ================ EFEITOS ================
  useEffect(() => {
    setLoading(true);
    fetch().catch((err) => {
      console.error("Erro ao buscar dados iniciais:", err);
      setLoading(false);
    });
  }, [tenant, participacaoId]);

  // ================ RENDERIZAÇÃO PRINCIPAL ================
  return (
    <>
      <Toast ref={toast} />
      {renderModalOpcoes()}
      {renderModalPendenciaVinculo()}
      {renderModalCancelVinculo()}

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
                      {false && (
                        <div className={styles.content2} onClick={() => {}}>
                          <RiArrowRightSLine />
                        </div>
                      )}
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
                          <span>
                            {item.planoDeTrabalho.inscricao?.participacoes?.map(
                              (orientador) =>
                                `${orientador.user.nome} (CPF: ${orientador.user.cpf})`
                            )}
                          </span>
                        </p>
                      </div>
                      {false && (
                        <div className={styles.content2} onClick={() => {}}>
                          <RiArrowRightSLine />
                        </div>
                      )}
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
                          handleOpenModal("substituicao");
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
                        onClick={() => {
                          setStatusAcao(
                            item.statusParticipacao === "ATIVA"
                              ? "ATIVA"
                              : "PENDENTE"
                          );
                          handleToggleAtivarPendente();
                        }}
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
                        onClick={() => handleOpenModal("cancelamento")}
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
                    <p>
                      <strong>CPF: </strong>
                      {item.user?.cpf}
                    </p>
                    <p className="mb-2">
                      <strong>Curso:</strong>{" "}
                      {item.user?.UserTenant[0]?.curso?.curso}
                    </p>
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
                                  setVinculoId(vinculo.id);
                                  handleOpenModal("pendenteVinculo");
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
                                onClick={() => {
                                  setVinculoId(vinculo.id);
                                  handleOpenModal("ativarVinculo");
                                }}
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
                                      handleOpenModal("transferencia");
                                    }}
                                  >
                                    <RiExchangeLine />
                                    <p>Transferir</p>
                                  </div>

                                  <div
                                    className={`${styles.action} ${styles.error}`}
                                    onClick={() => {
                                      handleOpenModal("devolucao");
                                      setSolicitacaoBolsaId(
                                        vinculo.solicitacaoBolsa?.id
                                      );
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
