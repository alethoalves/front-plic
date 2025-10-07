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
  RiFileDownloadLine, // Adicionei este ícone para o certificado
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
  updateAreaPlanoDeTrabalho,
  updatePlanoDeTrabalho,
} from "@/app/api/client/planoDeTrabalho";
import { generateAndDownloadCertificatePlanoPDF } from "@/app/api/client/certificadoPlanoDeTrabalho";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [camposForm, setCamposForm] = useState([]);
  const [
    registroAtividadesEditaisVigentes,
    setRegistrosAtividadesEditaisVigentes,
  ] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const toast = useRef(null);

  const router = useRouter();
  const perfil = getCookie("perfilSelecionado");
  const [areas, setAreas] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [updatingPlano, setUpdatingPlano] = useState(null);
  const [openAreaDropdowns, setOpenAreaDropdowns] = useState({});

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
        const response = await getRegistroAtividadesByCpf(
          params.tenant,
          perfil
        );
        const getAreasResponse = await getAreas(params.tenant);
        setAreas(transformedArray(getAreasResponse));
        setFilteredAreas(transformedArray(getAreasResponse));

        const registrosOrdenados = response.registrosAtividade.sort(
          (a, b) =>
            new Date(a.atividade.dataInicio) - new Date(b.atividade.dataInicio)
        );
        const grupos = groupByPlanoDeTrabalho(registrosOrdenados);
        setRegistrosAtividadesEditaisVigentes(grupos);

        // Inicializar todos os accordions como fechados
        const initialExpandedState = {};
        grupos.forEach((plano) => {
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
  }, [params.tenant, isModalOpen]);

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
                  id: planoResponse?.area.id,
                  area: planoResponse?.area.area,
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

  // Função para emitir certificado - você precisará implementar a lógica real
  const handleEmitirCertificado = async (plano) => {
    try {
      console.log("Emitindo certificado para o plano:", plano.id);

      // Chama a função de geração de certificado
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
        detail: error.message || "Falha ao gerar certificado",
        life: 5000,
      });
    }
  };

  const groupByPlanoDeTrabalho = (registros) => {
    const grupos = {};

    registros.forEach((registro) => {
      const planoId = registro.planoDeTrabalho.id;
      if (!grupos[planoId]) {
        grupos[planoId] = {
          ...registro.planoDeTrabalho,
          atividades: [],
        };
      }
      grupos[planoId].atividades.push(registro);
    });

    return Object.values(grupos);
  };

  const handleCreateOrEditSuccess = useCallback((updatedRegistro) => {
    setRegistrosAtividadesEditaisVigentes((prev) =>
      prev.map((registro) =>
        registro.id === updatedRegistro.id
          ? { ...registro, ...updatedRegistro }
          : registro
      )
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

  const openModalAndSetData = async (data) => {
    setItemToEdit(data);
    setCamposForm([]);
    setModalLoading(true);
    setIsModalOpen(true);

    try {
      // Se houver alguma operação assíncrona aqui, coloque
    } catch (err) {
      console.error("Erro:", err);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar formulário",
        life: 5000,
      });
    } finally {
      setModalLoading(false);
    }
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

      const updatedResponse = await getRegistroAtividadesByCpf(
        params.tenant,
        perfil
      );
      setRegistrosAtividadesEditaisVigentes(
        updatedResponse.registrosAtividade.sort(
          (a, b) =>
            new Date(a.atividade.dataInicio) - new Date(b.atividade.dataInicio)
        )
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
                  {resposta.value.split("/").pop()}
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

  return (
    <>
      {renderModalContent()}
      <Toast ref={toast} position="top-right" />

      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <RiAwardFill />
            </div>
            <div className={styles.headerContent}>
              <h6>Certificados de Conclusão</h6>
              <p>
                Gere os certificados de conclusão dos projetos de iniciação
                científica
              </p>
            </div>
          </div>

          <div className={styles.mainContent}>
            {loading && (
              <div className={styles.loading}>
                <RiFileTextLine className={styles.loadingIcon} />
                <p>Carregando atividades...</p>
              </div>
            )}

            {!loading && registroAtividadesEditaisVigentes?.length > 0 ? (
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
                          <h6 className={styles.planoTitulo}>{plano.titulo}</h6>
                          <p className={styles.planoEdital}>
                            {plano.inscricao.edital.titulo}
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

                    {/* CONTEÚDO DO ACCORDION - CORRIGIDO */}
                    <div
                      className={`${styles.planoContent} ${
                        expandedItems[plano.id] ? styles.planoContentOpen : ""
                      }`}
                    >
                      {/* Informações do Plano */}
                      <div className={styles.planoMeta}>
                        <div className={styles.metaItem}>
                          <RiUser2Line className={styles.metaIcon} />
                          <div className={styles.metaContent}>
                            <span className={styles.metaLabel}>
                              Orientador(es):
                            </span>
                            <div className={styles.metaValue}>
                              {plano.inscricao.participacoes
                                .filter(
                                  (item) =>
                                    item.tipo === "orientador" ||
                                    item.tipo === "coorientador"
                                )
                                .map((item, index) => (
                                  <span
                                    key={index}
                                    className={styles.personItem}
                                  >
                                    {item.user.nome} ({item.statusParticipacao})
                                  </span>
                                ))}
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
                                  {item.user.nome} ({item.statusParticipacao})
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

                      {/* BOTÃO DE EMITIR CERTIFICADO - ADICIONADO AQUI */}
                      <div className={styles.certificadoSection}>
                        <Button
                          className={styles.certificadoButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmitirCertificado(plano);
                          }}
                        >
                          <RiFileDownloadLine size={16} />
                          Emitir Certificado de Conclusão
                        </Button>
                      </div>

                      {/* Atividades do Plano */}
                      <div className={styles.atividadesSection}>
                        <h6 className={styles.sectionTitle}>Atividades</h6>
                        <div className={styles.atividadesList}>
                          {plano.atividades.map((atividade) => (
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
                                  atividade.exigirValidacaoOrientador && (
                                    <button
                                      className={`${styles.actionButton} ${styles.approveButton}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAprovarAtividade(atividade);
                                      }}
                                      disabled={approvingId === atividade.id}
                                    >
                                      {approvingId === atividade.id ? (
                                        "Aprovando..."
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
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <NoData description="Não há atividades cadastradas para o seu perfil nesta instituição." />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
