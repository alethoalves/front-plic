"use client";
import {
  RiArrowDownSLine,
  RiCalendarEventFill,
  RiCheckDoubleLine,
  RiDraftLine,
  RiFoldersLine,
  RiGroupLine,
  RiUser2Line,
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

  const toggleAccordion = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const router = useRouter();
  const perfil = getCookie("perfilSelecionado");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getRegistroAtividadesByCpf(
          params.tenant,
          perfil
        );
        const registrosOrdenados = response.registrosAtividade.sort(
          (a, b) =>
            new Date(a.atividade.dataInicio) - new Date(b.atividade.dataInicio)
        );
        const grupos = groupByPlanoDeTrabalho(registrosOrdenados);
        setRegistrosAtividadesEditaisVigentes(grupos);
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
          <div className="p-4 text-center">
            <p>Carregando...</p>
          </div>
        ) : (
          <>
            <h4>{itemToEdit?.atividade?.titulo}</h4>
            <p>
              Preencha cada campo e salve, ao finalizar, feche este modal e
              verifique o status da atividade!
            </p>
            <div className={`${styles.campos} mt-2`}>
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
      return <p>Nenhuma resposta enviada ainda.</p>;
    }

    return (
      <Accordion multiple activeIndex={[]}>
        {respostas.map((resposta, index) => (
          <AccordionTab
            key={`resposta-${index}`}
            header={resposta.campo?.label}
            headerClassName={styles.accordionHeader}
          >
            <div
              className={styles.respostaContent}
              onClick={(e) => e.stopPropagation()}
            >
              {resposta.campo?.tipo === "arquivo" ||
              resposta.campo?.tipo === "link" ? (
                <a
                  href={resposta.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                  onClick={(e) => e.stopPropagation()}
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
          </AccordionTab>
        ))}
      </Accordion>
    );
  };
  const isWithinEditPeriod = (dataFinal) => {
    const dataFinalObj = new Date(dataFinal);
    const hoje = new Date();
    const tresDiasDepois = new Date(dataFinalObj);
    tresDiasDepois.setDate(dataFinalObj.getDate() + 3); // Adiciona 3 dias ao prazo final

    return hoje <= tresDiasDepois;
  };
  return (
    <>
      {renderModalContent()}
      <Toast ref={toast} position="top-right" />

      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h4>Cronograma de atividades:</h4>
            <p className="mt-1">
              As atividades abaixo são obrigatórias para conclusão do programa
              de iniciação científica.
            </p>
          </div>
          {loading ? (
            <div className="p-4 text-center">
              <p>Carregando...</p>
            </div>
          ) : registroAtividadesEditaisVigentes?.length > 0 ? (
            <div className={styles.mainContent}>
              <div className={styles.mainContent}>
                <div className={styles.tela1}>
                  {registroAtividadesEditaisVigentes.map((plano) => (
                    <div key={plano.id} className={styles.boxButton}>
                      <div
                        className={`${styles.labelWithIcon} ${styles.registroHeader}`}
                        onClick={() => toggleAccordion(plano.id)}
                      >
                        <RiFoldersLine />
                        <div className={styles.label}>
                          <div className={styles.description}>
                            <h6 className={styles.destaque}>
                              {plano.titulo} ({plano.inscricao.edital.titulo})
                            </h6>
                          </div>
                        </div>
                        <div className={styles.toogle}>
                          <RiArrowDownSLine
                            className={
                              expandedItems[plano.id] ? styles.rotated : ""
                            }
                          />
                        </div>
                      </div>

                      {expandedItems[plano.id] && (
                        <div className={styles.accordionContent}>
                          {/* Informações do Plano */}
                          <div className={`${styles.labelWithIcon} mb-2`}>
                            <RiUser2Line />
                            <div className={styles.label}>
                              <p>
                                <RiUser2Line />
                                Orientador(es):
                              </p>
                              <div className={styles.description}>
                                {plano.inscricao.participacoes
                                  .filter(
                                    (item) =>
                                      item.tipo === "orientador" ||
                                      item.tipo === "coorientador"
                                  )
                                  .map((item, index) => (
                                    <p className={styles.person} key={index}>
                                      {item.user.nome} (
                                      {item.statusParticipacao})
                                    </p>
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className={`${styles.labelWithIcon} mb-2`}>
                            <RiGroupLine />
                            <div className={styles.label}>
                              <p>
                                <RiGroupLine />
                                Aluno(s):
                              </p>
                              <div className={styles.description}>
                                {plano.participacoes.map((item, index) => (
                                  <p className={styles.person} key={index}>
                                    {item.user.nome} ({item.statusParticipacao})
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Atividades do Plano */}
                          <h5 className="mt-3 mb-2">Atividades:</h5>
                          {plano.atividades.map((atividade) => (
                            <div
                              key={atividade.id}
                              className={`${styles.atividadeItem} mb-3`}
                            >
                              <div className={styles.atividadeHeader}>
                                <RiDraftLine />
                                <div className={styles.atividadeInfo}>
                                  <div className={`${styles.status} `}>
                                    <div className={styles.label}>
                                      <div
                                        className={`${styles.status} ${
                                          atividade.status === "naoEntregue" &&
                                          styles.error
                                        } ${
                                          atividade.status === "concluido" &&
                                          styles.success
                                        } ${
                                          atividade.status ===
                                            "aguardandoAprovacaoOrientador" &&
                                          styles.warning
                                        }`}
                                      >
                                        <p>
                                          {atividade.status === "naoEntregue" &&
                                            "Não entregue"}
                                          {atividade.status === "concluido" &&
                                            "Entregue"}
                                          {atividade.status ===
                                            "aguardandoAprovacaoOrientador" &&
                                            "Aguardando orientador"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <h6 className={`${styles.destaque} mt-2`}>
                                    {atividade.atividade.titulo}
                                  </h6>
                                  <p className={styles.atividadePeriodo}>
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

                              {/* Respostas (se houver) */}
                              {atividade.respostas?.length > 0 && (
                                <div
                                  className={`${styles.respostasSection} mt-2`}
                                >
                                  {renderRespostas(atividade.respostas)}
                                </div>
                              )}
                              {isWithinEditPeriod(
                                atividade.atividade.dataFinal
                              ) && (
                                <Button
                                  className={`mt-2 button btn-secondary ${styles.openModalButton}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModalAndSetData(atividade);
                                  }}
                                >
                                  {atividade.respostas?.length > 0
                                    ? "Editar Atividade"
                                    : "Enviar Atividade"}
                                </Button>
                              )}
                              {perfil === "orientador" && (
                                <button
                                  className={`mt-2 button btn-secondary ${styles.openModalButton}`}
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
                                      <RiCheckDoubleLine
                                        size={16}
                                        className="mr-1"
                                      />
                                      <p>Aprovar atividade</p>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <NoData description="Não há atividades cadastradas para o seu perfil nesta instituição." />
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
