"use client";
import { RiCouponLine, RiIdCardLine } from "@remixicon/react";
import styles from "./InscricaoButton.module.scss";
import { useState, useEffect, useRef, useMemo } from "react";
import Modal from "../Modal";

import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import {
  getTenantsByEventoSlug,
  getPlanosOuProjetos,
  getEventoBySlugForInscricao,
  criarInscricaoEvento,
} from "@/app/api/client/eventos";
import SearchableSelect2 from "../SearchableSelect2";
import Input from "../Input";
import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { RenderPlanoCard } from "./RenderPlanoCard";
import { RenderResumoCard } from "./RenderResumoCard";
import { RenderApresentacaoCard } from "./RenderApresentacaoCard";
import { RenderParticipantesCard } from "./RenderParticipantesCard";
import { RenderPalavrasChaveCard } from "./RenderPalavrasChaveCard";
import { RenderSubmissoesCard } from "./RenderSubmissoesCard";

export const InscricaoButton = ({ params }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlano, setSelectedPlano] = useState("");
  const [registrosAtividade, setRegistrosAtividade] = useState("");
  const [evento, setEvento] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [submitting, setSubmitting] = useState(false); // Novo estado para controle de envio
  const [inscricaoSuccess, setInscricaoSuccess] = useState(false); // Novo estado para sucesso
  const [showConfirmation, setShowConfirmation] = useState(false); // Novo estado para controlar a exibição da confirmação
  const [resumoData, setResumoData] = useState(null);
  const [palavrasChaveData, setPalavrasChaveData] = useState([]);
  const [participantesData, setParticipantesData] = useState([]);
  const [apresentacaoData, setApresentacaoData] = useState(null);
  const [loadingSubmissoes, setLoadingSubmissoes] = useState(false);
  const [submissoesLoaded, setSubmissoesLoaded] = useState(false);
  const [type, setType] = useState(false);

  const stepperRef = useRef(null);
  const toast = useRef(null);

  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      cpf: "",
    },
  });

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  const showSuccess = (message) => {
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: message,
      life: 5000,
    });
  };

  const cpfValue = watch("cpf");

  const tenantsMap = useMemo(() => {
    const map = new Map();
    tenants.forEach((tenant) => map.set(tenant.value, tenant));
    return map;
  }, [tenants]);

  const resetForm = () => {
    setIsModalOpen(false);
    setSelectedTenant(null);
    setActiveStep(0);
    setPlanos([]);
    setError(null);
    setResumoData(null);
    setPalavrasChaveData([]);
    setParticipantesData([]);
    setApresentacaoData(null);
    setType();
    setSelectedPlano();
  };

  const handleConfirmarEnviar = () => {
    setShowConfirmation(true);
    handleSubmitInscricao();
  };
  // Função para enviar a inscrição
  const handleSubmitInscricao = async () => {
    if (
      !params.edicao ||
      !selectedTenant.slug ||
      !cpfValue ||
      !palavrasChaveData ||
      !participantesData ||
      !resumoData ||
      !apresentacaoData
    ) {
      showError("Dados incompletos para realizar a inscrição");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        planoProjetoId: selectedPlano ? selectedPlano.id : null,
        type: type,
        slugEvento: params.edicao,
        tenant: selectedTenant.slug,
        cpf: cpfValue,
        resumos: resumoData,
        palavrasChave: palavrasChaveData,
        participantes: participantesData,
        apresentacao: apresentacaoData,
      };

      const response = await criarInscricaoEvento(payload);
      console.log(payload);
      if (response) {
        showSuccess("Inscrição realizada com sucesso!");
        setInscricaoSuccess(true);
        setActiveStep(8); // Avança para o passo de confirmação
      }
    } catch (error) {
      console.error("Erro ao enviar inscrição:", error);
      showError(
        error.response?.data?.message ||
          "Erro ao realizar inscrição. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await getTenantsByEventoSlug(params.edicao);
        const formattedTenants = data
          .map((tenant) => ({
            ...tenant,
            label: `${tenant.slug.toUpperCase()} - ${tenant.nome}`,
            value: tenant.slug,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Ordenação por label

        setTenants(formattedTenants);
      } catch (error) {
        console.error("Erro ao buscar instituições:", error);
        showError(
          "Erro ao carregar lista de instituições. Tente novamente mais tarde."
        );
      }
    };

    fetchTenants();
  }, [params]);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const eventoData = await getEventoBySlugForInscricao(params.edicao);

        setEvento(eventoData.data);
      } catch (error) {
        console.error("Erro ao buscar dados do evento:", error);
        showError(
          "Erro ao carregar informações do evento. Tente novamente mais tarde."
        );
      }
    };

    if (params.edicao) {
      fetchEvento();
    }
  }, [params.edicao]);

  const handleTenantChange = (value) => {
    const tenant = tenantsMap.get(value);
    setSelectedTenant(tenant);
    setPlanos([]);
    setError(null);
    setResumoData(null);
    setPalavrasChaveData([]);
    setParticipantesData([]);
    setApresentacaoData(null);
    setSelectedPlano();
    setType();
  };

  const onSubmit = async (data) => {
    if (!selectedTenant || !data.cpf) return;

    setLoading(true);
    setError(null);

    try {
      const planosData = await getPlanosOuProjetos(
        data.cpf,
        params.edicao,
        selectedTenant.value
      );
      setPlanos(planosData.data);
      setType(planosData.type);
      if (planosData.type === "PLANO" || planosData.type === "PROJETO") {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      const errorMessage =
        "Erro ao buscar planos. Verifique o CPF e tente novamente.";
      setError(error.response.data.message || errorMessage);
      showError(error.response.data.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanoSelected = (plano, registros) => {
    setSelectedPlano(plano);
    setRegistrosAtividade(registros);

    // Verifica se é um PLANO e tem registros de atividade
    if (type === "PLANO" && registros?.registroAtividades?.length > 0) {
      const registroAtividade = registros.registroAtividades[0];

      // Objeto para armazenar as partes do resumo
      const partesResumo = {};

      // Processa cada resposta do registro de atividade
      registroAtividade.respostas?.forEach((resposta) => {
        const label = resposta.campo?.label;

        // Mapeia os campos do resumo baseado no label
        if (
          label === "Introdução" ||
          label === "Metodologia" ||
          label === "Resultados" ||
          label === "Conclusão"
        ) {
          partesResumo[label] = resposta.value;
        }
      });

      // Cria o payload do resumo no formato esperado
      const resumoPayload = {
        titulo: plano.titulo, // Usa o título do plano
        partesResumo: Object.keys(partesResumo).map((nome) => ({
          nome,
          conteudo: partesResumo[nome],
          maxCaracteres: 3000, // Valor padrão ou pode pegar do moldeResumo
          obrigatorio: true,
        })),
      };

      // Atualiza o estado com os dados do resumo
      setResumoData(resumoPayload);

      // Extrai palavras-chave se necessário (opcional)
      const palavrasChaveResposta = registroAtividade.respostas?.find(
        (r) => r.campo?.label === "Palavras-chaves"
      );

      if (palavrasChaveResposta) {
        const palavrasChave = palavrasChaveResposta.value
          .split(";")
          .map((p) => p.trim())
          .filter((p) => p);

        setPalavrasChaveData(palavrasChave);
      }
    }

    // LÓGICA PARA POPULAR PARTICIPANTES =================================
    const participantesData = [];
    if (type === "PLANO") {
      // 1. Adiciona AUTORES (participantes com status ATIVA)
      if (plano.participacoes) {
        plano.participacoes
          .filter((p) => p.statusParticipacao === "ATIVA")
          .forEach((participacao) => {
            participantesData.push({
              cpf: participacao.user?.cpf,
              nome: participacao.user?.nome,
              tipo: "AUTOR",
              instituicao: selectedTenant?.nome || "",
            });
          });
      }

      // 2. Adiciona ORIENTADORES (da inscrição)
      if (plano.inscricao?.participacoes) {
        plano.inscricao.participacoes.forEach((participacao) => {
          participantesData.push({
            cpf: participacao.user?.cpf,
            nome: participacao.user?.nome,
            tipo: "ORIENTADOR",
            instituicao: selectedTenant?.nome || "",
          });
        });
      }
    }

    if (type === "PROJETO") {
      // Atualiza o título
      setResumoData({
        titulo: plano.projeto?.titulo,
      });
      // 1. Adiciona AUTORES (participantes com status ATIVA)
      if (plano.inscricao.participacoes) {
        plano.inscricao.participacoes
          .filter(
            (p) =>
              !["RECUSADA", "SUBSTITUIDA", "CANCELADA", "INATIVA"].includes(
                p.statusParticipacao
              )
          )
          .filter((p) => p.tipo === "aluno")
          .forEach((participacao) => {
            participantesData.push({
              cpf: participacao.user?.cpf,
              nome: participacao.user?.nome,
              tipo: "AUTOR",
              instituicao: selectedTenant?.nome || "",
            });
          });
      }

      // 2. Adiciona ORIENTADORES (da inscrição)
      if (plano.inscricao.participacoes) {
        plano.inscricao.participacoes
          .filter(
            (p) =>
              !["RECUSADA", "SUBSTITUIDA", "CANCELADA", "INATIVA"].includes(
                p.statusParticipacao
              )
          )
          .filter((p) => p.tipo === "orientador")
          .forEach((participacao) => {
            participantesData.push({
              cpf: participacao.user?.cpf,
              nome: participacao.user?.nome,
              tipo: "ORIENTADOR",
              instituicao: selectedTenant?.nome || "",
            });
          });
      }
    }

    // Atualiza o estado com os participantes
    setParticipantesData(participantesData);
    // ===================================================================

    setActiveStep(3);
  };
  return (
    <>
      <Toast ref={toast} position="top-right" />

      <div
        className={`w-100 ${styles.action} ${styles.primary}`}
        onClick={() => setIsModalOpen(true)}
      >
        <RiCouponLine />
        <h6>Inscreva-se aqui!</h6>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        size="medium"
        showIconClose={true}
      >
        <div className={styles.dialogEventoContent}>
          <h5 className="mb-4">Faça sua inscrição!</h5>

          <div className="card">
            <Stepper
              ref={stepperRef}
              style={{ flexBasis: "50rem" }}
              orientation="vertical"
              activeStep={activeStep}
            >
              <StepperPanel header="Selecione sua instituição">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <SearchableSelect2
                      label="Instituição"
                      options={tenants}
                      onChange={handleTenantChange}
                      value={selectedTenant?.value}
                      extendedOpt={true}
                    />
                  </div>
                </div>
                <div className="flex pt-3">
                  <Button
                    label="Próximo"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => {
                      reset({ cpf: "" });
                      setActiveStep(1);
                    }}
                    disabled={!selectedTenant}
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Informe seu CPF">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <div className="flex flex-column gap-2">
                        <Input
                          control={control}
                          name="cpf"
                          label="Digite seu CPF"
                          icon={RiIdCardLine}
                          inputType="text"
                          placeholder="Digite seu CPF"
                        />
                      </div>
                      {cpfValue && cpfValue.length >= 11 && (
                        <div className="mt-4">
                          <h5 className="mb-1">Minhas inscrições:</h5>
                          {loadingSubmissoes ? (
                            <div className="flex justify-content-center">
                              <ProgressSpinner />
                            </div>
                          ) : (
                            <RenderSubmissoesCard
                              params={params}
                              setLoadingSubmissoes={setLoadingSubmissoes}
                              cpf={cpfValue}
                              eventoSlug={params.edicao}
                              onBack={() => setActiveStep(7)} // Volta para confirmação
                              onDeleteSuccess={() => {
                                // Atualiza qualquer estado necessário após exclusão
                              }}
                            />
                          )}
                        </div>
                      )}
                      <div className="flex pt-3 gap-1">
                        <Button
                          label="Voltar"
                          severity="secondary"
                          icon="pi pi-arrow-left"
                          onClick={() => {
                            setSelectedTenant();
                            setActiveStep(0);
                          }}
                          type="button"
                        />
                        <Button
                          label={loading ? "Buscando..." : "Nova Inscrição"}
                          icon={loading ? null : "pi pi-arrow-right"}
                          iconPos="right"
                          type="submit"
                          disabled={!cpfValue || loading}
                        >
                          {loading && (
                            <ProgressSpinner
                              style={{ width: "20px", height: "20px" }}
                              strokeWidth="6"
                              animationDuration=".5s"
                            />
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </StepperPanel>

              <StepperPanel header="Selecione um Plano ou Projeto">
                <div className="flex flex-column gap-3">
                  {loading ? (
                    <div className="flex justify-content-center">
                      <ProgressSpinner />
                    </div>
                  ) : error ? (
                    <div className="p-error">{error}</div>
                  ) : planos?.length === 0 ? (
                    <div>
                      {`Ops! Entre em contato com a secretaria de Iniciação Científica da sua instituição de ensino, pois o CPF informado não está vinculado a um projeto de IC da instituição ${
                        selectedTenant?.nome
                      } (${selectedTenant?.slug.toUpperCase()})`}{" "}
                    </div>
                  ) : (
                    planos?.map((plano) => (
                      <RenderPlanoCard
                        key={plano.id}
                        type={type}
                        plano={plano}
                        onPlanoSelected={handlePlanoSelected}
                        eventoSlug={params.edicao}
                      />
                    ))
                  )}
                </div>
                <div className="flex pt-3">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => {
                      setSelectedTenant();
                      setActiveStep(0);
                    }}
                    type="button"
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Envie seu resumo">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <RenderResumoCard
                      type={type}
                      eventoData={evento}
                      initialData={resumoData} // Passa os dados salvos
                      onSubmitSuccess={(payload) => {
                        setResumoData(payload); // Salva os dados
                        setActiveStep(4);
                      }}
                    />
                  </div>
                </div>

                <div className="flex pt-3 gap-1">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => setActiveStep(0)} // Volta para seleção de plano
                    type="button"
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Informe palavras-chave">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <RenderPalavrasChaveCard
                      initialPalavrasChave={palavrasChaveData} // Passa as palavras-chave salvas
                      onSavePalavrasChave={(palavrasChave) => {
                        setPalavrasChaveData(palavrasChave); // Salva os dados
                        setActiveStep(5); // Avança para participantes
                      }}
                    />
                  </div>
                </div>

                <div className="flex pt-3 gap-1">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => setActiveStep(3)} // Volta para resumo
                    type="button"
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Informe os participantes">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <RenderParticipantesCard
                      cpf={cpfValue}
                      type={type}
                      initialParticipantes={participantesData} // Passa participantes salvos
                      onSaveParticipantes={(participantesSalvos) => {
                        setParticipantesData(participantesSalvos);
                        setActiveStep(6); // Avança para apresentação
                      }}
                    />
                  </div>
                </div>

                <div className="flex pt-3 gap-1">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => setActiveStep(4)} // Volta para palavras-chave
                    type="button"
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Selecione a sessão de apresentação">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <RenderApresentacaoCard
                      eventoData={evento}
                      initialData={apresentacaoData} // Passa dados salvos
                      onSubmitSuccess={(payload) => {
                        setApresentacaoData(payload); // Salva os dados
                        console.log({
                          slugEvento: params.edicao,
                          tenant: selectedTenant.slug,
                          //selectedPlanoOrProjeto:selectedPlano,
                          cpf: cpfValue,
                          resumos: resumoData,
                          palavrasChave: palavrasChaveData,
                          participantes: participantesData,
                          apresentacao: apresentacaoData,
                        });
                        setActiveStep(7);
                      }}
                    />
                  </div>
                </div>

                <div className="flex pt-3 gap-1">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => setActiveStep(5)} // Volta para participantes
                    type="button"
                  />
                </div>
              </StepperPanel>
              <StepperPanel header="Confirmar e Enviar">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <Card className="p-1">
                      <p>
                        Confirmo que todos os dados inseridos estão corretos e
                        estou ciente de que após o envio não será possível
                        editar.
                      </p>
                      <div className="flex justify-content-end gap-2 mt-4">
                        <Button
                          label="Voltar"
                          severity="secondary"
                          icon="pi pi-arrow-left"
                          onClick={() => setActiveStep(6)}
                        />
                        <Button
                          label={
                            submitting ? "Enviando..." : "Confirmar e Enviar"
                          }
                          icon={submitting ? null : "pi pi-send"}
                          onClick={handleSubmitInscricao}
                          disabled={submitting}
                        >
                          {submitting && (
                            <ProgressSpinner
                              style={{ width: "20px", height: "20px" }}
                              strokeWidth="6"
                              animationDuration=".5s"
                            />
                          )}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </StepperPanel>

              <StepperPanel header="Minhas Inscrições">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <RenderSubmissoesCard
                      params={params}
                      cpf={cpfValue}
                      eventoSlug={params.edicao}
                      onBack={() => setActiveStep(7)} // Volta para confirmação
                      onDeleteSuccess={() => {
                        // Atualiza qualquer estado necessário após exclusão
                      }}
                    />
                  </div>
                </div>
              </StepperPanel>
            </Stepper>
          </div>
        </div>
      </Modal>
    </>
  );
};
