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
        setRegistrosAtividadesEditaisVigentes(
          response.registrosAtividade.sort(
            (a, b) =>
              new Date(a.atividade.dataInicio) -
              new Date(b.atividade.dataInicio)
          )
        );
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
          {registroAtividadesEditaisVigentes?.length > 0 ? (
            <div className={styles.mainContent}>
              <div className={styles.tela1}>
                {registroAtividadesEditaisVigentes?.map((registro) => (
                  <div key={registro.id} className={styles.boxButton}>
                    <div
                      className={`${styles.labelWithIcon} ${styles.registroHeader}`}
                      onClick={() => toggleAccordion(registro.id)}
                    >
                      <RiDraftLine />
                      <div className={styles.label}>
                        <div className={styles.description}>
                          <p
                            style={{ textTransform: "uppercase" }}
                            className={styles.destaque}
                          >
                            {registro.atividade.titulo}
                          </p>
                        </div>
                        <div className={styles.description}>
                          <div
                            className={`${styles.status} ${
                              registro.status === "naoEntregue" && styles.error
                            } ${
                              registro.status === "concluido" && styles.success
                            }
                            ${
                              registro.status ===
                                "aguardandoAprovacaoOrientador" &&
                              styles.warning
                            }`}
                          >
                            <p>
                              {registro.status === "naoEntregue" &&
                                "Não entregue"}
                              {registro.status === "concluido" && "Entregue"}
                              {registro.status ===
                                "aguardandoAprovacaoOrientador" &&
                                "Agurdando orientador"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className={styles.toogle}>
                        <RiArrowDownSLine
                          className={
                            expandedItems[registro.id] ? styles.rotated : ""
                          }
                        />
                      </div>
                    </div>
                    {expandedItems[registro.id] && (
                      <div
                        className={`${styles.accordionContent} ${
                          expandedItems[registro.id] ? styles.expanded : ""
                        }`}
                      >
                        <div className={`${styles.labelWithIcon} mb-2`}>
                          <RiCalendarEventFill />
                          <div className={styles.label}>
                            <p>
                              <RiCalendarEventFill />
                              Período para entrega:
                            </p>
                            <div className={styles.description}>
                              <p>
                                {formatDateForDisplay(
                                  registro.atividade.dataInicio
                                )}{" "}
                                a{" "}
                                {formatDateForDisplay(
                                  registro.atividade.dataFinal
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`${styles.labelWithIcon} mb-2`}>
                          <RiFoldersLine />
                          <div className={styles.label}>
                            <p>
                              <RiFoldersLine />
                              Plano de trabalho:
                            </p>
                            <div className={styles.description}>
                              <p>{registro.planoDeTrabalho.titulo}</p>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.labelWithIcon} mb-2`}>
                          <RiUser2Line />
                          <div className={styles.label}>
                            <p>
                              <RiUser2Line />
                              Orientador(es):
                            </p>
                            <div className={styles.description}>
                              {registro.planoDeTrabalho.inscricao.participacoes
                                .filter(
                                  (item) =>
                                    item.tipo === "orientador" ||
                                    item.tipo === "coorientador"
                                )
                                .map((item, index) => (
                                  <p className={styles.person} key={index}>
                                    {item.user.nome} ({item.statusParticipacao})
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
                              {registro.planoDeTrabalho.participacoes.map(
                                (item, index) => (
                                  <p className={styles.person} key={index}>
                                    {item.user.nome} ({item.statusParticipacao})
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Seção de Respostas em Accordion */}
                        {registro.respostas?.length > 0 && (
                          <div className={`${styles.respostasSection} mt-3`}>
                            <h5 className="mb-2">Respostas Enviadas:</h5>
                            {renderRespostas(registro.respostas)}
                          </div>
                        )}

                        <button
                          className={` mt-2 button btn-primary ${styles.openModalButton}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModalAndSetData(registro);
                          }}
                        >
                          {registro.respostas?.length > 0 ? (
                            <p>Editar Atividade</p>
                          ) : (
                            <p>Enviar Atividade</p>
                          )}
                        </button>
                        {perfil === "orientador" && (
                          <button
                            className={`mt-2 button btn-secondary ${styles.openModalButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAprovarAtividade(registro);
                            }}
                            disabled={approvingId === registro.id}
                          >
                            {approvingId === registro.id ? (
                              "Aprovando..."
                            ) : (
                              <>
                                <RiCheckDoubleLine size={16} className="mr-1" />
                                <p>Aprovar atividade</p>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
