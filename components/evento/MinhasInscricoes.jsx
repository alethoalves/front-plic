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

export const MinhasInscricoes = ({ params }) => {
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
    reset();
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
        className={`w-100 ${styles.action} ${styles.secondary}`}
        onClick={() => setIsModalOpen(true)}
      >
        <RiCouponLine />
        <h6>Minhas Inscrições</h6>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        size="medium"
        showIconClose={true}
      >
        <div className={styles.dialogEventoContent}>
          <h5 className="mb-4">Veja suas inscrições!</h5>

          <div className="card">
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
                </form>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
