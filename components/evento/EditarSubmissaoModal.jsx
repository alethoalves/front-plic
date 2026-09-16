"use client";
import { useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import styles from "./InscricaoButton.module.scss";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import {
  getEventoBySlugForInscricao,
  atualizarSubmissaoByUser,
} from "@/app/api/client/eventos";
import { RenderResumoCard } from "./RenderResumoCard";
import { RenderPalavrasChaveCard } from "./RenderPalavrasChaveCard";
import { RenderParticipantesCard } from "./RenderParticipantesCard";
import { RenderApresentacaoCard } from "./RenderApresentacaoCard";

export const EditarSubmissaoModal = ({
  isOpen,
  submissao,
  cpf,
  eventoSlug,
  onClose,
  onUpdateSuccess,
}) => {
  const toast = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [evento, setEvento] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [resumoData, setResumoData] = useState(null);
  const [palavrasChaveData, setPalavrasChaveData] = useState([]);
  const [participantesData, setParticipantesData] = useState([]);
  const [apresentacaoData, setApresentacaoData] = useState(null);

  const showError = (message) => {
    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  const showSuccess = (message) => {
    toast.current?.show({
      severity: "success",
      summary: "Sucesso",
      detail: message,
      life: 5000,
    });
  };

  // Pré-preenche o formulário com os dados atuais da inscrição sempre que o
  // modal é aberto com uma nova submissão.
  useEffect(() => {
    if (!isOpen || !submissao) return;

    setActiveStep(0);
    setResumoData({
      titulo: submissao.Resumo?.titulo,
      partesResumo: submissao.Resumo?.conteudo,
    });
    setPalavrasChaveData(
      submissao.Resumo?.PalavraChave?.map((pc) => pc.palavra) || []
    );
    // Participantes ficam todos editáveis/removíveis na edição (nenhum
    // "travado" por vínculo de plano/projeto, ver RenderParticipantesCard).
    setParticipantesData(
      submissao.Resumo?.participacoes?.map((p) => ({
        userId: p.user?.id,
        nome: p.user?.nome,
        tipo: p.cargo,
      })) || []
    );
    setApresentacaoData({
      categoria: submissao.categoria,
      sessaoId: submissao.subsessao?.sessaoApresentacaoId,
      areaId: submissao.Resumo?.areaId,
      subsessaoId: submissao.subsessaoId,
    });
  }, [isOpen, submissao]);

  useEffect(() => {
    if (!isOpen || !eventoSlug) return;

    const fetchEvento = async () => {
      try {
        const eventoData = await getEventoBySlugForInscricao(eventoSlug);
        setEvento(eventoData.data);
      } catch (error) {
        console.error("Erro ao buscar dados do evento:", error);
        showError(
          "Erro ao carregar informações do evento. Tente novamente mais tarde."
        );
      }
    };

    fetchEvento();
  }, [isOpen, eventoSlug]);

  const handleSalvarAlteracoes = async () => {
    setSubmitting(true);
    try {
      await atualizarSubmissaoByUser(submissao.id, cpf, {
        resumos: resumoData,
        palavrasChave: palavrasChaveData,
        participantes: participantesData,
        apresentacao: apresentacaoData,
      });
      showSuccess("Inscrição atualizada com sucesso!");
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      console.error("Erro ao atualizar inscrição:", error);
      showError(
        error.response?.data?.message ||
          "Erro ao atualizar inscrição. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!submissao) return null;

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="medium"
        showIconClose={true}
      >
        <div className={styles.dialogEventoContent}>
          <h5 className="mb-4">Editar inscrição</h5>
          <div className="card">
            <Stepper
              style={{ flexBasis: "50rem" }}
              orientation="vertical"
              activeStep={activeStep}
            >
              <StepperPanel header="Editar resumo">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    {evento && (
                      <RenderResumoCard
                        eventoData={evento}
                        initialData={resumoData}
                        onSubmitSuccess={(payload) => {
                          setResumoData(payload);
                          setActiveStep(1);
                        }}
                      />
                    )}
                  </div>
                </div>
              </StepperPanel>

              <StepperPanel header="Editar palavras-chave">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <RenderPalavrasChaveCard
                      initialPalavrasChave={palavrasChaveData}
                      onSavePalavrasChave={(palavras) => {
                        setPalavrasChaveData(palavras);
                        setActiveStep(2);
                      }}
                    />
                  </div>
                </div>
                <div className="flex pt-3 gap-1">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    type="button"
                    onClick={() => setActiveStep(0)}
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Editar participantes">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <RenderParticipantesCard
                      cpf={cpf}
                      proponenteUserId={submissao.createdById}
                      initialParticipantes={participantesData}
                      onSaveParticipantes={(participantes) => {
                        setParticipantesData(participantes);
                        setActiveStep(3);
                      }}
                    />
                  </div>
                </div>
                <div className="flex pt-3 gap-1">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    type="button"
                    onClick={() => setActiveStep(1)}
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Editar sessão de apresentação">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    {evento && (
                      <RenderApresentacaoCard
                        eventoData={evento}
                        initialData={apresentacaoData}
                        onSubmitSuccess={(payload) => {
                          setApresentacaoData(payload);
                          setActiveStep(4);
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex pt-3 gap-1">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    type="button"
                    onClick={() => setActiveStep(2)}
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Confirmar alterações">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <Card className="p-1">
                      <p>
                        Confirme para salvar as alterações feitas nesta
                        inscrição.
                      </p>
                      <div className="flex justify-content-end gap-2 mt-4">
                        <Button
                          label="Voltar"
                          severity="secondary"
                          icon="pi pi-arrow-left"
                          onClick={() => setActiveStep(3)}
                        />
                        <Button
                          label={
                            submitting ? "Salvando..." : "Salvar Alterações"
                          }
                          icon={submitting ? null : "pi pi-check"}
                          onClick={handleSalvarAlteracoes}
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
            </Stepper>
          </div>
        </div>
      </Modal>
    </>
  );
};
