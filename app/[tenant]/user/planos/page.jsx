"use client";
import {
  RiArrowDownSLine,
  RiCalendarEventFill,
  RiCheckDoubleLine,
  RiDraftLine,
  RiEditLine,
  RiFlaskLine,
  RiFoldersLine,
  RiGroupLine,
  RiUser2Line,
  RiAlertLine,
  RiFileTextLine,
  RiTimeLine,
  RiAwardFill,
  RiFileDownloadLine,
  RiLoader4Line,
  RiMicroscopeLine,
  RiPencilLine,
  RiCloseLine,
  RiHistoryLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Campo from "@/components/Campo";
import NoData from "@/components/NoData";
import { getCookie } from "cookies-next";
import { getRegistroAtividadesByCpf } from "@/app/api/client/atividade";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";
import FormRegistroAtividadeCreateOrEdit from "@/components/Formularios/FormRegistroAtividadeCreateOrEdit";
import { Toast } from "primereact/toast";
import { Accordion, AccordionTab } from "primereact/accordion";
import { aprovarAtividade } from "@/app/api/client/registroAtividade";
import Button from "@/components/Button";
import { getAreas } from "@/app/api/client/area";
import { transformedArray } from "@/lib/transformedArray";
import { Dropdown } from "primereact/dropdown";
import SearchableSelect2 from "@/components/SearchableSelect2";
import {
  getPlanosDeTrabalhoByUser,
  updateAreaPlanoDeTrabalho,
  updatePlanoDeTrabalho,
  updateTituloPlanoDeTrabalho,
} from "@/app/api/client/planoDeTrabalho";
import { generateAndDownloadCertificatePlanoPDF } from "@/app/api/client/certificadoPlanoDeTrabalho";
import Link from "next/link";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [camposForm, setCamposForm] = useState([]);
  const [
    registroAtividadesEditaisVigentes,
    setRegistrosAtividadesEditaisVigentes,
  ] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const toast = useRef(null);

  const router = useRouter();
  const perfil = getCookie("perfilSelecionado");
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [updatingPlano, setUpdatingPlano] = useState(null);
  const [openAreaDropdowns, setOpenAreaDropdowns] = useState({});
  const [generatingCertificate, setGeneratingCertificate] = useState(null);

  // Novos estados para edição de título
  const [editingTitulo, setEditingTitulo] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [isTituloModalOpen, setIsTituloModalOpen] = useState(false);
  // Função corrigida para toggle do accordion
  const toggleAccordion = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getPlanosDeTrabalhoByUser(params.tenant);
        const getAreasResponse = await getAreas(params.tenant);
        setAreas(transformedArray(getAreasResponse));
        setFilteredAreas(transformedArray(getAreasResponse));

        // Para cada plano, ordenar suas atividades por data de início
        const planosComAtividadesOrdenadas = response.map((plano) => ({
          ...plano,
          registroAtividades:
            plano.registroAtividades?.sort(
              (a, b) =>
                new Date(a.atividade.dataInicio) -
                new Date(b.atividade.dataInicio)
            ) || [],
        }));

        setRegistrosAtividadesEditaisVigentes(
          planosComAtividadesOrdenadas || []
        );
        console.log(planosComAtividadesOrdenadas);
        // Inicializar todos os accordions como fechados
        const initialExpandedState = {};
        planosComAtividadesOrdenadas?.forEach((plano) => {
          initialExpandedState[plano.id] = false;
        });
        setExpandedItems(initialExpandedState);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao carregar atividades",
          life: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, isModalOpen]); // Adicione isTituloModalOpen como dependência

  // Função para abrir modal de edição de título
  const handleOpenEditTitulo = (plano) => {
    setEditingTitulo(plano);
    setNovoTitulo(plano.titulo);
    setJustificativa("");
    setIsTituloModalOpen(true);
  };

  // Função para fechar modal de edição de título
  const handleCloseEditTitulo = () => {
    setEditingTitulo(null);
    setNovoTitulo("");
    setJustificativa("");
    setIsTituloModalOpen(false);
  };

  // Função para atualizar título do plano
  const handleUpdateTitulo = async () => {
    if (!editingTitulo || !novoTitulo.trim() || !justificativa.trim()) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Preencha todos os campos obrigatórios",
        life: 5000,
      });
      return;
    }

    setUpdatingPlano(editingTitulo.id);
    try {
      const resultado = await updateTituloPlanoDeTrabalho(
        params.tenant,
        editingTitulo.id,
        novoTitulo.trim(),
        justificativa.trim()
      );

      // Atualizar o estado local com o novo título - CORRIGIDO
      setRegistrosAtividadesEditaisVigentes((prev) =>
        prev.map((plano) =>
          plano.id === editingTitulo.id
            ? {
                ...plano,
                titulo: resultado.dados.tituloNovo, // Alterado para resultado.dados.tituloNovo
              }
            : plano
        )
      );

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: resultado.message,
        life: 5000,
      });

      handleCloseEditTitulo();
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Erro ao atualizar título",
        life: 5000,
      });
    } finally {
      setUpdatingPlano(null);
    }
  };
  const onAreaChange = async (e, planoId) => {
    setUpdatingPlano(planoId);
    try {
      const planoResponse = await updateAreaPlanoDeTrabalho(
        params.tenant,
        planoId,
        e
      );

      setRegistrosAtividadesEditaisVigentes((prev) =>
        prev.map((plano) =>
          plano.id === planoId
            ? {
                ...plano,
                area: {
                  id: planoResponse?.area?.id,
                  area: planoResponse?.area?.area,
                  grandeArea: planoResponse?.area?.grandeArea,
                },
              }
            : plano
        )
      );

      setOpenAreaDropdowns((prev) => ({
        ...prev,
        [planoId]: false,
      }));

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Área atualizada com sucesso!",
        life: 5000,
      });
    } catch (error) {
      console.error("Erro ao atualizar área:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Erro ao atualizar área",
        life: 5000,
      });
    } finally {
      setUpdatingPlano(null);
    }
  };

  // Função para emitir certificado
  const handleEmitirCertificado = async (plano) => {
    setGeneratingCertificate(plano.id);
    try {
      console.log("Emitindo certificado para o plano:", plano.id);
      await generateAndDownloadCertificatePlanoPDF(params.tenant, plano.id);

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Certificado gerado e baixado com sucesso!",
        life: 5000,
      });
    } catch (error) {
      console.error("Erro ao emitir certificado:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Falha ao gerar certificado",
        life: 5000,
      });
    } finally {
      setGeneratingCertificate(null);
    }
  };

  // Função auxiliar para obter alunos ativos
  const getAlunosAtivos = (participacoes) => {
    return participacoes.filter(
      (participacao) =>
        participacao.tipo === "aluno" &&
        participacao.statusParticipacao === "ATIVA"
    );
  };

  // Função auxiliar para obter orientadores aprovados
  const getOrientadoresAprovados = (participacoes) => {
    return participacoes.filter(
      (participacao) =>
        (participacao.tipo === "orientador" ||
          participacao.tipo === "coorientador") &&
        participacao.statusParticipacao === "APROVADA"
    );
  };

  const handleCreateOrEditSuccess = useCallback((updatedRegistro) => {
    // Atualizar o registro específico nos planos
    setRegistrosAtividadesEditaisVigentes((prev) =>
      prev.map((plano) => ({
        ...plano,
        registroAtividades: plano.registroAtividades.map((atividade) =>
          atividade.id === updatedRegistro.id
            ? { ...atividade, ...updatedRegistro }
            : atividade
        ),
      }))
    );
    closeModalAndResetData();
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: "Atividade salva com sucesso!",
      life: 5000,
    });
  }, []);

  const handleFormError = useCallback((error) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: error.response?.data?.message || "Erro ao salvar atividade",
      life: 5000,
    });
  }, []);

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setCamposForm([]);
  };

  const renderModalContent = () => {
    return (
      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        {modalLoading ? (
          <div className={styles.loading}>
            <RiFileTextLine className={styles.loadingIcon} />
            <p>Carregando formulário...</p>
          </div>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <h6>{itemToEdit?.atividade?.titulo}</h6>
              <p>
                Preencha cada campo e salve, ao finalizar, feche este modal e
                verifique o status da atividade!
              </p>
            </div>
            <div className={styles.campos}>
              <FormRegistroAtividadeCreateOrEdit
                tenantSlug={params.tenant}
                initialData={itemToEdit}
                onClose={closeModalAndResetData}
                onSuccess={handleCreateOrEditSuccess}
                onError={handleFormError}
                idFormularioEdital={itemToEdit?.atividade?.formularioId}
              />
            </div>
          </>
        )}
      </Modal>
    );
  };

  const openModalAndSetData = async (atividade) => {
    setItemToEdit(atividade);
    setCamposForm([]);
    setModalLoading(true);
    setIsModalOpen(true);
    setModalLoading(false);
  };

  const handleAprovarAtividade = async (registro) => {
    setApprovingId(registro.id);
    try {
      await aprovarAtividade(params.tenant, registro.id);

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Atividade aprovada com sucesso!",
        life: 5000,
      });

      // Atualizar o estado local
      setRegistrosAtividadesEditaisVigentes((prev) =>
        prev.map((plano) => ({
          ...plano,
          registroAtividades: plano.registroAtividades.map((atividade) =>
            atividade.id === registro.id
              ? { ...atividade, validadoOrientador: true }
              : atividade
          ),
        }))
      );
    } catch (error) {
      console.error("Erro ao aprovar atividade:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Erro ao aprovar atividade",
        life: 5000,
      });
    } finally {
      setApprovingId(null);
    }
  };

  const renderRespostas = (respostas) => {
    if (!respostas || respostas.length === 0) {
      return (
        <div className={styles.emptyState}>
          <RiFileTextLine size={32} className={styles.emptyIcon} />
          <p>Nenhuma resposta enviada ainda.</p>
        </div>
      );
    }

    return (
      <div className={styles.respostasContainer}>
        {respostas.map((resposta, index) => (
          <div key={`resposta-${index}`} className={styles.respostaItem}>
            <div className={styles.respostaHeader}>
              <h6>{resposta.campo?.label}</h6>
            </div>
            <div className={styles.respostaContent}>
              {resposta.campo?.tipo === "arquivo" ||
              resposta.campo?.tipo === "link" ? (
                <a
                  href={resposta.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.respostaLinks}
                >
                  {resposta.campo.tipo === "arquivo" ? "📁 " : "🔗 "}
                  Ver anexo
                </a>
              ) : (
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {resposta.value || "Nenhum conteúdo fornecido"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const isWithinEditPeriod = (dataFinal) => {
    const dataFinalObj = new Date(dataFinal);
    const hoje = new Date();
    const tresDiasDepois = new Date(dataFinalObj);
    tresDiasDepois.setDate(dataFinalObj.getDate() + 3);

    return hoje <= tresDiasDepois;
  };

  const toggleAreaDropdown = (planoId) => {
    setOpenAreaDropdowns((prev) => ({
      ...prev,
      [planoId]: !prev[planoId],
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "concluido":
        return <RiCheckDoubleLine className={styles.statusIcon} />;
      case "aguardandoAprovacaoOrientador":
        return <RiTimeLine className={styles.statusIcon} />;
      default:
        return <RiAlertLine className={styles.statusIcon} />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "concluido":
        return styles.statusSuccess;
      case "aguardandoAprovacaoOrientador":
        return styles.statusWarning;
      case "naoEntregue":
        return styles.statusError;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "naoEntregue":
        return "Não entregue";
      case "concluido":
        return "Entregue";
      case "aguardandoAprovacaoOrientador":
        return "Aguardando orientador";
      default:
        return status;
    }
  };
  // Modal para edição de título
  const renderTituloModal = () => {
    return (
      <Modal isOpen={isTituloModalOpen} onClose={handleCloseEditTitulo}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTop}>
            <h6>Editar Título do Plano de Trabalho</h6>
          </div>
          <p>
            Atualize o título do plano de trabalho e forneça uma justificativa
            para a alteração.
          </p>
        </div>

        {/* ALERTA PROFISSIONAL ADICIONADO AQUI */}
        <div className={styles.alertaImportante}>
          <div className={styles.alertaIcon}>
            <RiAlertLine size={20} />
          </div>
          <div className={styles.alertaContent}>
            <h6 className={styles.alertaTitulo}>
              Atenção à Alteração de Título
            </h6>
            <p className={styles.alertaTexto}>
              A alteração do título{" "}
              <strong>
                não pode modificar o escopo principal do projeto e/ou do plano
                de trabalho
              </strong>
              , uma vez que ambos foram avaliados e aprovados com base em seus
              objetivos originais. Mudanças significativas no escopo
              invalidariam o processo de avaliação anterior.
            </p>
            <p className={styles.alertaTexto}>
              Todas as alterações de título, bem como sua frequência, estão
              sujeitas à análise tanto pelos avaliadores durante a execução da
              pesquisa quanto pela equipe gestora do programa de Iniciação
              Científica, podendo influenciar avaliações futuras.
            </p>
          </div>
        </div>

        <div className={styles.campos}>
          <div className={styles.campoGroup}>
            <label className={styles.label}>Novo Título *</label>
            <input
              type="text"
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              className={styles.input}
              placeholder="Digite o novo título"
              disabled={updatingPlano === editingTitulo?.id}
            />
          </div>

          <div className={styles.campoGroup}>
            <label className={styles.label}>Justificativa *</label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className={styles.textarea}
              placeholder="Explique detalhadamente o motivo da alteração do título, garantindo que o escopo principal do projeto permanece inalterado"
              rows={4}
              disabled={updatingPlano === editingTitulo?.id}
            />
            <div className={styles.contadorCaracteres}>
              {justificativa.length} caracteres
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button
              onClick={handleCloseEditTitulo}
              className={styles.cancelButton}
              disabled={updatingPlano === editingTitulo?.id}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateTitulo}
              className={styles.confirmButton}
              disabled={
                !novoTitulo.trim() ||
                !justificativa.trim() ||
                updatingPlano === editingTitulo?.id
              }
            >
              {updatingPlano === editingTitulo?.id ? (
                <>
                  <RiLoader4Line className={styles.loadingSpinner} />
                  Atualizando...
                </>
              ) : (
                <>
                  <RiCheckDoubleLine size={16} />
                  Confirmar Alteração
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };
  // Novos estados para edição de área
  const [editingArea, setEditingArea] = useState(null);
  const [novaArea, setNovaArea] = useState(null);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  // Função para abrir modal de edição de área
  const handleOpenEditArea = (plano) => {
    setEditingArea(plano);
    setNovaArea(plano.area?.id || null);
    setIsAreaModalOpen(true);
  };

  // Função para fechar modal de edição de área
  const handleCloseEditArea = () => {
    setEditingArea(null);
    setNovaArea(null);
    setIsAreaModalOpen(false);
  };
  // Função para atualizar área do plano
  const handleUpdateArea = async () => {
    if (!editingArea) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Plano não selecionado",
        life: 5000,
      });
      return;
    }

    setUpdatingPlano(editingArea.id);
    try {
      const planoResponse = await updateAreaPlanoDeTrabalho(
        params.tenant,
        editingArea.id,
        novaArea
      );

      // Atualizar o estado local com a nova área
      setRegistrosAtividadesEditaisVigentes((prev) =>
        prev.map((plano) =>
          plano.id === editingArea.id
            ? {
                ...plano,
                area: {
                  id: planoResponse?.area?.id,
                  area: planoResponse?.area?.area,
                  grandeArea: planoResponse?.area?.grandeArea,
                },
              }
            : plano
        )
      );

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Área atualizada com sucesso!",
        life: 5000,
      });

      handleCloseEditArea();
    } catch (error) {
      console.error("Erro ao atualizar área:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Erro ao atualizar área",
        life: 5000,
      });
    } finally {
      setUpdatingPlano(null);
    }
  };
  // Modal para edição de área
  const renderAreaModal = () => {
    return (
      <Modal isOpen={isAreaModalOpen} onClose={handleCloseEditArea}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTop}>
            <h6>Editar Área do Plano de Trabalho</h6>
          </div>
          <p>Selecione a nova área de conhecimento para o plano de trabalho.</p>
        </div>

        <div className={styles.campos}>
          <div className={styles.campoGroup}>
            <label className={styles.label}>Área de Conhecimento *</label>
            <div className={styles.searchableSelectContainer}>
              <SearchableSelect2
                options={areas}
                onChange={(e) => setNovaArea(e)}
                value={novaArea}
                extendedOpt={true}
              />
            </div>
            <div className={styles.areaInfo}>
              <span className={styles.areaInfoLabel}>Área atual:</span>
              <span className={styles.areaInfoValue}>
                {editingArea?.area?.area || "Nenhuma área definida"}
                {editingArea?.area?.grandeArea && (
                  <span className={styles.grandeArea}>
                    {" "}
                    ({editingArea.area.grandeArea.grandeArea})
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button
              onClick={handleCloseEditArea}
              className={styles.cancelButton}
              disabled={updatingPlano === editingArea?.id}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateArea}
              className={styles.confirmButton}
              disabled={!novaArea || updatingPlano === editingArea?.id}
            >
              {updatingPlano === editingArea?.id ? (
                <>
                  <RiLoader4Line className={styles.loadingSpinner} />
                  Atualizando...
                </>
              ) : (
                <>
                  <RiCheckDoubleLine size={16} />
                  Confirmar Alteração
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };
  return (
    <>
      {renderModalContent()}
      {renderTituloModal()}
      {renderAreaModal()}
      <Toast ref={toast} position="top-right" />

      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <RiMicroscopeLine />
            </div>
            <div className={styles.headerContent}>
              <h6>Minhas Pesquisas</h6>
              <p>
                Edite informações de suas pesquisas, gerencie a entrega de
                atividades e emita certificado de conclusão.
              </p>
            </div>
          </div>
          {/* MENU DE NAVEGAÇÃO RÁPIDA COM LINK */}
          <div className={styles.navegacaoRapida}>
            <div className={styles.navegacaoContent}>
              <span className={styles.navegacaoLabel}>Acesso rápido:</span>
              <div className={styles.navegacaoBotoes}>
                <Link
                  href={`/${params.tenant}/user/documentos`}
                  className={styles.botaoNavegacao}
                  title="Acessar Meus Documentos"
                >
                  <div className={styles.botaoNavegacaoIcon}>
                    <RiFoldersLine size={18} />
                  </div>
                  <span className={styles.botaoNavegacaoText}>
                    Meus Documentos
                  </span>
                </Link>

                <Link
                  href={`/${params.tenant}/user/historico`}
                  className={styles.botaoNavegacao}
                  title="Acessar Histórico e Declarações"
                >
                  <div className={styles.botaoNavegacaoIcon}>
                    <RiHistoryLine size={18} />
                  </div>
                  <span className={styles.botaoNavegacaoText}>
                    Histórico/Declarações
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.mainContent}>
            {loading && (
              <div className={styles.loading}>
                <RiFileTextLine className={styles.loadingIcon} />
                <p>Carregando planos de trabalho...</p>
              </div>
            )}

            {!loading && registroAtividadesEditaisVigentes.length === 0 && (
              <NoData description="Não há planos de trabalho cadastrados para o seu perfil nesta instituição." />
            )}

            {!loading && registroAtividadesEditaisVigentes.length > 0 && (
              <div className={styles.atividadesContainer}>
                {registroAtividadesEditaisVigentes.map((plano) => (
                  <div key={plano.id} className={styles.planoCard}>
                    <div
                      className={styles.planoHeader}
                      onClick={() => toggleAccordion(plano.id)}
                    >
                      <div className={styles.planoInfo}>
                        <div className={styles.planoIcon}>
                          <RiFoldersLine />
                        </div>
                        <div className={styles.planoDetails}>
                          <div className={styles.tituloContainer}>
                            <h6 className={styles.planoTitulo}>
                              {plano.titulo}
                            </h6>
                          </div>
                          <p className={styles.planoEdital}>
                            {plano.inscricao.edital.titulo} -{" "}
                            {plano.inscricao.edital.ano}
                          </p>
                        </div>
                      </div>
                      <div className={styles.planoToggle}>
                        <RiArrowDownSLine
                          className={
                            expandedItems[plano.id] ? styles.rotated : ""
                          }
                        />
                      </div>
                    </div>

                    <div
                      className={`${styles.planoContent} ${
                        expandedItems[plano.id] ? styles.planoContentOpen : ""
                      }`}
                    >
                      {/* Informações do Plano - SEMPRE VISÍVEL NO ACCORDION */}
                      <div className={styles.planoMeta}>
                        <div className={styles.metaItem}>
                          <RiUser2Line className={styles.metaIcon} />
                          <div className={styles.metaContent}>
                            <span className={styles.metaLabel}>
                              Orientador(es):
                            </span>
                            <div className={styles.metaValue}>
                              {plano.inscricao.participacoes.map(
                                (item, index) => (
                                  <span
                                    key={index}
                                    className={styles.personItem}
                                  >
                                    {item.user.nome} (status:{" "}
                                    {item.statusParticipacao})
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.metaItem}>
                          <RiGroupLine className={styles.metaIcon} />
                          <div className={styles.metaContent}>
                            <span className={styles.metaLabel}>Aluno(s):</span>
                            <div className={styles.metaValue}>
                              {plano.participacoes.map((item, index) => (
                                <span key={index} className={styles.personItem}>
                                  {item.user.nome} (status:{" "}
                                  {item.statusParticipacao})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className={styles.metaItem}>
                          <RiFlaskLine className={styles.metaIcon} />
                          <div className={styles.metaContent}>
                            <span className={styles.metaLabel}>
                              Área de conhecimento:
                            </span>
                            <div className={styles.areaSection}>
                              {updatingPlano === plano.id ? (
                                <div className={styles.loadingArea}>
                                  Carregando...
                                </div>
                              ) : (
                                <>
                                  <span className={styles.areaValue}>
                                    {plano.area?.area ||
                                      "Nenhuma área definida"}
                                    {plano.area?.grandeArea && (
                                      <span className={styles.grandeArea}>
                                        {" "}
                                        ({plano.area.grandeArea.grandeArea})
                                      </span>
                                    )}
                                  </span>
                                  <button
                                    className={styles.editAreaButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAreaDropdown(plano.id);
                                    }}
                                  >
                                    {openAreaDropdowns[plano.id]
                                      ? "Fechar"
                                      : "Editar"}
                                  </button>
                                </>
                              )}
                            </div>
                            {openAreaDropdowns[plano.id] && !updatingPlano && (
                              <div className={styles.areaDropdown}>
                                <SearchableSelect2
                                  options={areas}
                                  onChange={(e) => onAreaChange(e, plano.id)}
                                  extendedOpt={true}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* ÁREA DE EDIÇÃO PROFISSIONAL */}
                      <div className={styles.edicaoSection}>
                        <h6 className={styles.edicaoTitle}>
                          Editar Informações
                        </h6>
                        <div className={styles.edicaoBotoes}>
                          <button
                            className={styles.botaoEdicao}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditTitulo(plano);
                            }}
                            title="Editar título do plano"
                          >
                            <div className={styles.botaoIcon}>
                              <RiPencilLine size={20} />
                            </div>
                            <div className={styles.botaoContent}>
                              <span className={styles.botaoTitulo}>
                                Editar Título
                              </span>
                              <span className={styles.botaoDescricao}>
                                Alterar o título do plano de trabalho
                              </span>
                            </div>
                            <RiArrowDownSLine className={styles.botaoArrow} />
                          </button>

                          <button
                            className={styles.botaoEdicao}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditArea(plano); // Agora abre o modal
                            }}
                            title="Editar área de conhecimento"
                          >
                            <div className={styles.botaoIcon}>
                              <RiFlaskLine size={20} />
                            </div>
                            <div className={styles.botaoContent}>
                              <span className={styles.botaoTitulo}>
                                Editar Área
                              </span>
                              <span className={styles.botaoDescricao}>
                                Alterar a área de conhecimento
                              </span>
                            </div>
                            <RiArrowDownSLine className={styles.botaoArrow} />
                          </button>
                        </div>
                      </div>
                      {/* BOTÃO DE EMITIR CERTIFICADO - SEMPRE VISÍVEL */}
                      <div className={styles.certificadoSection}>
                        <Button
                          className={styles.certificadoButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmitirCertificado(plano);
                          }}
                          disabled={generatingCertificate === plano.id}
                        >
                          {generatingCertificate === plano.id ? (
                            <>
                              <RiLoader4Line
                                size={16}
                                className={styles.loadingSpinner}
                              />
                              Gerando Certificado...
                            </>
                          ) : (
                            <>
                              <RiFileDownloadLine size={16} />
                              Emitir Certificado
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Seção de Atividades - RENDERIZA MESMO SEM ATIVIDADES */}
                      <div className={styles.atividadesSection}>
                        <h6 className={styles.sectionTitle}>
                          Atividades{" "}
                          {plano.registroAtividades?.length > 0 &&
                            `(${plano.registroAtividades.length})`}
                        </h6>
                        <div className={styles.atividadesList}>
                          {plano.registroAtividades?.length > 0 ? (
                            plano.registroAtividades.map((atividade) => (
                              <div
                                key={atividade.id}
                                className={styles.atividadeCard}
                              >
                                <div className={styles.atividadeHeader}>
                                  <div className={styles.atividadeInfo}>
                                    <div className={styles.atividadeStatus}>
                                      <span
                                        className={`${
                                          styles.statusBadge
                                        } ${getStatusBadgeClass(
                                          atividade.status
                                        )}`}
                                      >
                                        {getStatusIcon(atividade.status)}
                                        {getStatusText(atividade.status)}
                                      </span>
                                    </div>
                                    <h6 className={styles.atividadeTitulo}>
                                      {atividade.atividade.titulo}
                                    </h6>
                                    <p className={styles.atividadePeriodo}>
                                      <RiCalendarEventFill
                                        className={styles.periodoIcon}
                                      />
                                      Período:{" "}
                                      {formatDateForDisplay(
                                        atividade.atividade.dataInicio
                                      )}{" "}
                                      a{" "}
                                      {formatDateForDisplay(
                                        atividade.atividade.dataFinal
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Respostas */}
                                {atividade.respostas?.length > 0 && (
                                  <div className={styles.respostasSection}>
                                    <h6 className={styles.respostasTitle}>
                                      Respostas Enviadas
                                    </h6>
                                    {renderRespostas(atividade.respostas)}
                                  </div>
                                )}

                                {/* Ações */}
                                <div className={styles.atividadeActions}>
                                  {(isWithinEditPeriod(
                                    atividade.atividade.dataFinal
                                  ) ||
                                    atividade.atividade
                                      .permitirEntregaForaPrazo) && (
                                    <Button
                                      className={styles.actionButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModalAndSetData(atividade);
                                      }}
                                    >
                                      <RiEditLine size={16} />
                                      {atividade.respostas?.length > 0
                                        ? "Editar Atividade"
                                        : "Enviar Atividade"}
                                    </Button>
                                  )}

                                  {perfil === "orientador" &&
                                    atividade.atividade
                                      .exigirValidacaoOrientador && (
                                      <button
                                        className={`${styles.actionButton} ${styles.approveButton}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAprovarAtividade(atividade);
                                        }}
                                        disabled={
                                          approvingId === atividade.id ||
                                          atividade.validadoOrientador
                                        }
                                      >
                                        {approvingId === atividade.id ? (
                                          "Aprovando..."
                                        ) : atividade.validadoOrientador ? (
                                          "✓ Aprovado"
                                        ) : (
                                          <>
                                            <RiCheckDoubleLine size={16} />
                                            Aprovar atividade
                                          </>
                                        )}
                                      </button>
                                    )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className={styles.emptyAtividades}>
                              <p>
                                Nenhuma atividade cadastrada para este plano
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
