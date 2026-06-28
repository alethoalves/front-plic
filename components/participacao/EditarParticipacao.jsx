"use client";
import { Button } from "primereact/button";
import {
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiSave2Line,
  RiYoutubeLine,
  RiFlaskLine,
  RiUserStarLine,
  RiCommunityLine,
  RiAlertLine,
  RiTimeLine,
  RiInformationLine,
} from "@remixicon/react";
import styles from "./EditarParticipacao.module.scss";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createDynamicSchema } from "@/lib/createDynamicSchema";
import { renderDynamicFields } from "@/lib/renderDynamicFields";
import generateLattesText from "@/lib/generateLattesText";
import FileInput from "../FileInput";
import {
  deleteParticipacao,
  upsertRespostasParticipacao,
} from "@/app/api/client/participacao";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import { getFormulario } from "@/app/api/client/formulario";
import { getUserTenant } from "@/app/api/client/userTenant";
import {
  gerarFichaAvaliacaoParticipacao,
  getItensAprovadosRejeitadosParticipacao,
  salvarFichaAvaliacaoManual,
} from "@/app/api/client/cvLattes";
import FichaAvaliacaoManual from "./FichaAvaliacaoManual";
import { xmlLattes } from "@/app/api/clientReq";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { Card } from "primereact/card";
import FormAlunoUserTenant from "./FormAlunoUserTenant";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import Image from "next/image";
import Modal from "@/components/Modal";
import ImportarLattesGestor from "@/components/ImportarLattesGestor";

const EditarParticipacao = ({
  participacaoInfo,
  setParticipacaoInfo,
  tenant,
  inscricaoSelected,
  setInscricao,
  closeModalAndResetData,
  handleValidateParticipacao,
  tipoParticipacao,
  gestorMode = false,
}) => {
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileInputErrors, setFileInputErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessages, setErrorMessages] = useState({});
  const [editalInfo, setEditalInfo] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [fichaAvaliacao, setFichaAvaliacao] = useState(null);
  const [domImported, setDomImported] = useState(false);
  const [userTenantData, setUserTenantData] = useState(null);
  const [itensNaoContabilizados, setItensNaoContabilizados] = useState(null);
  const [isItensModalOpen, setIsItensModalOpen] = useState(false);
  const [lattesJaExistenteModal, setLattesJaExistenteModal] = useState({ open: false, message: "", detail: "", hint: "" });
  const [loadingItensNaoContabilizados, setLoadingItensNaoContabilizados] =
    useState(false);
  // Perfil de avaliação do tipo de participação atual (extraído do schemaFichaAvaliacaoParticipacao)
  const [perfilSchema, setPerfilSchema] = useState(null);
  const toast = useRef(null);


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

  const getCamposByTipoParticipacao = () => {
    switch (tipoParticipacao) {
      case "orientador":
        return camposFormOrientador;
      case "coorientador":
        return camposFormCoorientador;
      case "aluno":
        return camposFormAluno;
      default:
        return [];
    }
  };

  const campos = getCamposByTipoParticipacao();

  const tipoAvaliacao = perfilSchema?.tipoAvaliacao || fichaAvaliacao?.tipoAvaliacao || "AUTOMATICA";

  const participacaoSchema = useMemo(
    () =>
      z.object({
        camposDinamicos: createDynamicSchema(campos || []),
      }),
    [campos],
  );

  const {
    register,
    control,
    formState: { errors, isDirty },
    handleSubmit,
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(participacaoSchema),
    defaultValues: {},
  });

  const lastHydratedSignatureRef = useRef("");

  const handleFormSubmit = async (data) => {
    setLoadingForm(true);
    setErrorForm("");
    try {
      const response = await upsertRespostasParticipacao(
        tenant,
        data,
        participacaoInfo.id,
      );

      if (response?.participacao) {
        setParticipacaoInfo((prev) => ({
          ...prev,
          ...response.participacao,
        }));

        setInscricao((prevState) => {
          if (!prevState?.participacoes) return prevState;

          return {
            ...prevState,
            participacoes: prevState.participacoes.map((participacao) =>
              participacao.id === response.participacao.id
                ? { ...participacao, ...response.participacao }
                : participacao,
            ),
          };
        });
      }

      showSuccess("Formulário salvo com sucesso!");
      closeModalAndResetData();
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Erro ao enviar o formulário.";
      setErrorForm(errorMessage);
      showError(errorMessage);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleSalvarFichaManual = async (fichaReconstruida) => {
    setLoadingForm(true);
    try {
      const result = await salvarFichaAvaliacaoManual(
        tenant,
        participacaoInfo.id,
        fichaReconstruida,
      );
      setFichaAvaliacao(result.fichaAvaliacao);
      setInscricao((prev) => ({
        ...prev,
        participacoes: prev.participacoes.map((p) =>
          p.id === participacaoInfo.id
            ? { ...p, fichaAvaliacao: result.fichaAvaliacao }
            : p,
        ),
      }));
      showSuccess("Ficha salva com sucesso!");
      if (tipoParticipacao === "aluno" || campos.length > 0) {
        setActiveStep((prev) => prev + 1);
      } else {
        closeModalAndResetData();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar a ficha de avaliação.";
      showError(errorMessage);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleGerarFichaAvaliacao = async () => {
    setLoadingForm(true);
    try {
      const result = await gerarFichaAvaliacaoParticipacao(
        tenant,
        participacaoInfo.id,
      );
      setFichaAvaliacao(result.fichaAvaliacao);
      showSuccess("Ficha de avaliação gerada com sucesso!");
      setActiveStep((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao gerar ficha de avaliação:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao gerar ficha de avaliação.";
      showError(errorMessage);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleVerItensNaoContabilizados = async () => {
    if (itensNaoContabilizados) {
      setIsItensModalOpen(true);
      return;
    }
    setLoadingItensNaoContabilizados(true);
    try {
      const result = await getItensAprovadosRejeitadosParticipacao(
        tenant,
        participacaoInfo.id,
      );
      setItensNaoContabilizados(result.fichaAvaliacao);
      setIsItensModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar itens não contabilizados:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao buscar itens não contabilizados.";
      showError(errorMessage);
    } finally {
      setLoadingItensNaoContabilizados(false);
    }
  };

  const handleNextStep = () => {
    if (!participacaoInfo?.user?.cvLattes?.length && !domImported) {
      showError("Por favor, envie um currículo antes de prosseguir.");
      return;
    }
    setActiveStep(1);
  };

  const handleFileUpload = async (file, userId) => {
    if (!file) {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Nenhum arquivo selecionado.",
      }));
      return;
    }

    const isZip = ["application/zip", "application/x-zip-compressed", "application/octet-stream"].includes(file.type) || file.name.endsWith(".zip");
    const isXml = file.type === "text/xml" || file.type === "application/xml" || file.name.endsWith(".xml");
    if (!isXml && !isZip) {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Por favor, selecione um arquivo XML ou ZIP válido.",
      }));
      return;
    }

    setFileInputErrors((prev) => ({ ...prev, [userId]: "" }));
    setLoading(true);

    try {
      const response = await xmlLattes(file, tenant, userId);
      if (response && response.fileUrl) {
        const updatedParticipacao = {
          ...participacaoInfo,
          user: {
            ...participacaoInfo.user,
            cvLattes: [
              ...participacaoInfo.user.cvLattes,
              { id: Date.now(), url: response.fileUrl, userId },
            ],
          },
        };

        setInscricao((prevState) => ({
          ...prevState,
          participacoes: prevState.participacoes.map((participacao) =>
            participacao.id === updatedParticipacao.id
              ? { ...participacao, ...updatedParticipacao }
              : participacao,
          ),
        }));

        setParticipacaoInfo((prev) => {
          const updated = { ...prev, ...updatedParticipacao };
          return updated;
        });

        try {
          await handleValidateParticipacao(tenant, updatedParticipacao);
        } catch (error) {
          console.error("Erro ao validar participação:", error);
        }
        showSuccess("Arquivo enviado e URL do Lattes atualizada com sucesso!");
        setActiveStep((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao enviar o arquivo.";
      if (error.response?.data?.code === "LATTES_IDENTICAL") {
        const { message, detail, hint } = error.response.data;
        setLattesJaExistenteModal({ open: true, message, detail: detail ?? "", hint: hint ?? "" });
      } else {
        setFileInputErrors((prev) => ({
          ...prev,
          [userId]: errorMessage,
        }));
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipacao = async (idParticipacao) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta participação?",
    );
    if (!confirmed) return;

    setDeletingId(idParticipacao);
    setErrorMessages((prev) => ({ ...prev, [idParticipacao]: "" }));

    try {
      await deleteParticipacao(tenant, idParticipacao);
      setInscricao((prevState) => ({
        ...prevState,
        participacoes: prevState.participacoes.filter(
          (participacao) => participacao?.id !== idParticipacao,
        ),
      }));
      showSuccess("Participação excluída com sucesso!");
      closeModalAndResetData();
    } catch (error) {
      console.error("Erro ao excluir participação:", error);
      setErrorMessages((prev) => ({
        ...prev,
        [idParticipacao]:
          error.response?.data?.message || "Erro ao excluir participação.",
      }));
      showError(
        error.response?.data?.message || "Erro ao excluir participação.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateOrEditSuccess = useCallback(
    async (updatedParticipacao) => {
      setInscricao((prevState) => {
        return {
          ...prevState,
          participacoes: prevState.participacoes.map((participacao) =>
            participacao.id === updatedParticipacao.id
              ? { ...participacao, ...updatedParticipacao }
              : participacao,
          ),
        };
      });

      setParticipacaoInfo((prev) => ({
        ...prev,
        ...updatedParticipacao,
      }));

      try {
        await handleValidateParticipacao(tenant, updatedParticipacao);
      } catch (error) {
        console.error("Erro ao validar participação:", error);
      }
    },
    [setInscricao, tenant],
  );

  useEffect(() => {
    if (!campos?.length) return;
    if (isDirty) return;

    const respostas = participacaoInfo?.respostas || [];
    const respostasSignature = `${participacaoInfo?.id || ""}-${respostas
      .map((resposta) => `${resposta.id}:${resposta.campoId}:${resposta.value}`)
      .join("|")}`;

    if (lastHydratedSignatureRef.current === respostasSignature) return;

    const camposDinamicos = {};

    respostas.forEach((resposta) => {
      if (!resposta?.campoId) return;

      const campoRelacionado = campos.find(
        (campo) => campo.id === resposta.campoId,
      );
      if (!campoRelacionado) return;

      let value = resposta.value;

      if (
        campoRelacionado.tipo === "multiselect" &&
        typeof resposta.value === "string"
      ) {
        try {
          const parsed = JSON.parse(resposta.value);
          if (Array.isArray(parsed)) {
            value = parsed;
          }
        } catch {
          value = [];
        }
      }

      camposDinamicos[`campo_${resposta.campoId}`] = value;
    });

    reset({ camposDinamicos });
    lastHydratedSignatureRef.current = respostasSignature;
  }, [
    campos,
    isDirty,
    participacaoInfo?.id,
    participacaoInfo?.respostas,
    reset,
  ]);

  // Componente recursivo para renderizar grupos de avaliação
  const GrupoAvaliacao = ({ grupo, nivel = 0 }) => {
    const [expanded, setExpanded] = useState(false);

    const temItensComResposta =
      grupo.respostaCampos?.length > 0 ||
      grupo.grupos?.some(
        (subGrupo) =>
          subGrupo.respostaCampos?.length > 0 ||
          subGrupo.grupos?.some((g) => g.respostaCampos?.length > 0),
      );

    const getNivelClass = () => {
      switch (nivel) {
        case 0:
          return styles.grupoPrincipal;
        case 1:
          return styles.grupoSecundario;
        default:
          return styles.grupoTerciario;
      }
    };

    return (
      <div className={`${styles.grupoAvaliacao} ${getNivelClass()}`}>
        {/* Cabeçalho do Grupo - Layout em Coluna */}
        <div
          className={`${styles.grupoHeader} ${temItensComResposta ? styles.clickable : ""}`}
          onClick={() => temItensComResposta && setExpanded(!expanded)}
        >
          <div className={styles.grupoHeaderTop}>
            {temItensComResposta && (
              <i
                className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"} ${styles.expandIcon}`}
              />
            )}
            <h5 className={styles.grupoLabel}>{grupo.label}</h5>
          </div>

          <div className={styles.grupoHeaderBottom}>
            <div className={styles.grupoNota}>
              <span className={styles.notaObtida}>{grupo.nota || 0}</span>
              <span className={styles.notaSeparador}>/</span>
              <span className={styles.notaMaxima}>{grupo.notaMax || 0}</span>
              <span className={styles.notaPontos}>pontos</span>
            </div>
          </div>
        </div>

        {/* Itens com resposta (respostaCampos) */}
        {expanded && grupo.respostaCampos?.length > 0 && (
          <div className={styles.itensResposta}>
            {grupo.respostaCampos.map((item, idx) => (
              <div key={idx} className={styles.itemResposta}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemIndex}>Item {idx + 1}</span>
                  <span className={styles.itemNota}>
                    +
                    {grupo.notaPorItem ||
                      (grupo.nota / grupo.respostaCampos.length).toFixed(1)}
                  </span>
                </div>
                <div className={styles.itemCampos}>
                  {item
                    .filter(
                      (campo) =>
                        campo.value !== undefined &&
                        campo.value !== null &&
                        campo.value !== "",
                    )
                    .map((campo, campoIdx) => (
                      <div key={campoIdx} className={styles.campoItem}>
                        <span className={styles.campoLabel}>{campo.label}</span>
                        <span className={styles.campoValor}>
                          {typeof campo.value === "object"
                            ? JSON.stringify(campo.value)
                            : String(campo.value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subgrupos */}
        {expanded && grupo.grupos?.length > 0 && (
          <div className={styles.subgrupos}>
            {grupo.grupos.map((subGrupo, idx) => (
              <GrupoAvaliacao key={idx} grupo={subGrupo} nivel={nivel + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Componente recursivo para renderizar os itens aprovados/rejeitados (com motivo)
  // de cada grupo, usado no modal "Ver itens não contabilizados"
  const GrupoItensNaoContabilizados = ({ grupo, nivel = 0 }) => {
    const [expanded, setExpanded] = useState(false);

    const temItens =
      grupo.itensAprovados?.length > 0 ||
      grupo.itensRejeitados?.length > 0 ||
      grupo.grupos?.some(
        (subGrupo) =>
          subGrupo.itensAprovados?.length > 0 ||
          subGrupo.itensRejeitados?.length > 0 ||
          subGrupo.grupos?.some(
            (g) => g.itensAprovados?.length > 0 || g.itensRejeitados?.length > 0,
          ),
      );

    const getNivelClass = () => {
      switch (nivel) {
        case 0:
          return styles.grupoPrincipal;
        case 1:
          return styles.grupoSecundario;
        default:
          return styles.grupoTerciario;
      }
    };

    const renderCampos = (campos) =>
      campos
        .filter(
          (campo) =>
            campo.value !== undefined &&
            campo.value !== null &&
            campo.value !== "",
        )
        .map((campo, campoIdx) => (
          <div key={campoIdx} className={styles.campoItem}>
            <span className={styles.campoLabel}>{campo.label}</span>
            <span className={styles.campoValor}>
              {typeof campo.value === "object"
                ? JSON.stringify(campo.value)
                : String(campo.value)}
            </span>
          </div>
        ));

    return (
      <div className={`${styles.grupoAvaliacao} ${getNivelClass()}`}>
        <div
          className={`${styles.grupoHeader} ${temItens ? styles.clickable : ""}`}
          onClick={() => temItens && setExpanded(!expanded)}
        >
          <div className={styles.grupoHeaderTop}>
            {temItens && (
              <i
                className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"} ${styles.expandIcon}`}
              />
            )}
            <h5 className={styles.grupoLabel}>{grupo.label}</h5>
          </div>

          <div className={styles.grupoHeaderBottom}>
            <span style={{ color: "#16a34a", fontSize: "0.85rem", marginRight: 12 }}>
              {grupo.itensAprovados?.length || 0} aprovado(s)
            </span>
            <span style={{ color: "#dc2626", fontSize: "0.85rem" }}>
              {grupo.itensRejeitados?.length || 0} não contabilizado(s)
            </span>
          </div>
        </div>

        {expanded && grupo.itensAprovados?.length > 0 && (
          <div className={styles.itensResposta}>
            <p style={{ fontWeight: 600, color: "#16a34a", margin: "8px 0 4px" }}>
              Itens aprovados
            </p>
            {grupo.itensAprovados.map((item, idx) => (
              <div key={idx} className={styles.itemResposta}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemIndex}>Item {idx + 1}</span>
                </div>
                <div className={styles.itemCampos}>{renderCampos(item)}</div>
              </div>
            ))}
          </div>
        )}

        {expanded && grupo.itensRejeitados?.length > 0 && (
          <div className={styles.itensResposta}>
            <p style={{ fontWeight: 600, color: "#dc2626", margin: "8px 0 4px" }}>
              Itens não contabilizados
            </p>
            {grupo.itensRejeitados.map((rejeitado, idx) => (
              <div
                key={idx}
                className={styles.itemResposta}
                style={{ borderLeft: "3px solid #dc2626" }}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemIndex}>Item {idx + 1}</span>
                </div>
                <div className={styles.itemCampos}>
                  {renderCampos(rejeitado.campos)}
                </div>
                {rejeitado.motivosReprovacao?.length > 0 && (
                  <div
                    style={{ marginTop: 8, fontSize: "0.85rem", color: "#7f1d1d" }}
                  >
                    <strong>Motivo da reprovação:</strong>
                    <ul style={{ margin: "4px 0 0 16px" }}>
                      {rejeitado.motivosReprovacao.map((motivo, mIdx) => (
                        <li key={mIdx}>
                          Campo <strong>{motivo.campo}</strong> ({motivo.operador}
                          ): esperado{" "}
                          <strong>{JSON.stringify(motivo.valorEsperado)}</strong>,
                          encontrado{" "}
                          <strong>
                            {motivo.valorEncontrado === null ||
                            motivo.valorEncontrado === undefined ||
                            motivo.valorEncontrado === ""
                              ? "(ausente)"
                              : String(motivo.valorEncontrado)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {expanded && grupo.grupos?.length > 0 && (
          <div className={styles.subgrupos}>
            {grupo.grupos.map((subGrupo, idx) => (
              <GrupoItensNaoContabilizados
                key={idx}
                grupo={subGrupo}
                nivel={nivel + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let camposCarregados = [];

      try {
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);
        setEditalInfo(response.edital);
        if (response.edital.formOrientadorId) {
          const responseFormOrientador = await getFormulario(
            tenant,
            response.edital.formOrientadorId,
          );
          const sorted = responseFormOrientador.campos.sort(
            (a, b) => a.ordem - b.ordem,
          );
          setCamposFormOrientador(sorted);
          if (tipoParticipacao === "orientador") camposCarregados = sorted;
        }
        if (response.edital.formCoorientadorId) {
          const responseFormCoorientador = await getFormulario(
            tenant,
            response.edital.formCoorientadorId,
          );
          const sorted = responseFormCoorientador.campos.sort(
            (a, b) => a.ordem - b.ordem,
          );
          setCamposFormCoorientador(sorted);
          if (tipoParticipacao === "coorientador") camposCarregados = sorted;
        }
        if (response.edital.formAlunoId) {
          const responseFormAluno = await getFormulario(
            tenant,
            response.edital.formAlunoId,
          );
          const sorted = responseFormAluno.campos.sort(
            (a, b) => a.ordem - b.ordem,
          );
          setCamposFormAluno(sorted);
          if (tipoParticipacao === "aluno") camposCarregados = sorted;
        }

        let ut = null;
        if (tipoParticipacao === "aluno" && participacaoInfo?.user?.id && response.edital?.ano) {
          ut = await getUserTenant(tenant, participacaoInfo.user.id, response.edital.ano);
          setUserTenantData(ut);
        }

        // Extrair perfil de avaliação do edital para o tipo de participação atual
        let perfil = null;
        if (response.edital?.schemaFichaAvaliacaoParticipacao) {
          let schemaArray = response.edital.schemaFichaAvaliacaoParticipacao;
          if (typeof schemaArray === "string") schemaArray = JSON.parse(schemaArray);
          if (!Array.isArray(schemaArray)) schemaArray = [schemaArray];
          perfil = schemaArray.find((p) => p.tipoParticipacao === tipoParticipacao) || null;
        }
        setPerfilSchema(perfil);

        const tipoAvaliacao = perfil?.tipoAvaliacao || "AUTOMATICA";

        if (participacaoInfo?.fichaAvaliacao) {
          setFichaAvaliacao(participacaoInfo.fichaAvaliacao);

          if (tipoAvaliacao === "MANUAL") {
            // MANUAL: Ficha=step 0, Histórico=step 1 (aluno), Formulário=step 1/2
            if (tipoParticipacao === "aluno") {
              const historicoFeito = !!ut?.historicoEscolarUrl;
              if (historicoFeito && camposCarregados.length > 0) {
                setActiveStep(2);
              } else {
                setActiveStep(1);
              }
            } else if (camposCarregados.length > 0) {
              setActiveStep(1);
            } else {
              setActiveStep(0);
            }
          } else if (tipoParticipacao === "aluno") {
            const historicoFeito = !!ut?.historicoEscolarUrl;
            if (historicoFeito && camposCarregados.length > 0) {
              setActiveStep(4);
            } else {
              setActiveStep(3);
            }
          } else {
            setActiveStep(camposCarregados.length > 0 ? 3 : 2);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, participacaoInfo, inscricaoSelected]);
  // Adicione esta função junto com as outras funções do componente
  const handleWhatsAppContact = () => {
    const phoneNumber = "5561991651494"; // Formato internacional sem o +
    const message = encodeURIComponent(
      `Olá! Identifiquei um possível erro na leitura do meu currículo Lattes para a participação como ${tipoParticipacao}.\n\n` +
        `ID da Participação: ${participacaoInfo?.id || "N/A"}\n` +
        `CPF: ${participacaoInfo?.user?.cpf || "N/A"}\n` +
        `Nome: ${participacaoInfo?.user?.nome || "N/A"}\n\n` +
        `Por favor, descreva o erro identificado:`,
    );

    // Detecta se é mobile ou desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // URL para WhatsApp (funciona tanto no app quanto no web)
    const whatsappUrl = isMobile
      ? `whatsapp://send?phone=${phoneNumber}&text=${message}`
      : `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

    window.open(whatsappUrl, "_blank");
  };
  return (
    <>
      <Toast ref={toast} position="top-right" />
      {!loading ? (
        <div className={styles.editarParticipacao}>
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            style={{ flexBasis: "50rem" }}
          >
            {tipoAvaliacao === "MANUAL" && (
              <StepperPanel header="Ficha de Avaliação">
                <FichaAvaliacaoManual
                  schema={perfilSchema}
                  fichaAtual={fichaAvaliacao}
                  onSave={handleSalvarFichaManual}
                  loading={loadingForm}
                  cvLattes={participacaoInfo?.user?.cvLattes}
                  onGerarFicha={async () => {
                    const result = await gerarFichaAvaliacaoParticipacao(
                      tenant,
                      participacaoInfo.id,
                    );
                    setFichaAvaliacao(result.fichaAvaliacao);
                    return result;
                  }}
                  onFileUpload={async (file) => {
                    const response = await xmlLattes(file, tenant, participacaoInfo.user.id);
                    if (response?.fileUrl) {
                      const fichaResult = await gerarFichaAvaliacaoParticipacao(
                        tenant,
                        participacaoInfo.id,
                      );
                      setFichaAvaliacao(fichaResult.fichaAvaliacao);

                      const updatedParticipacao = {
                        ...participacaoInfo,
                        fichaAvaliacao: fichaResult.fichaAvaliacao,
                        user: {
                          ...participacaoInfo.user,
                          cvLattes: [
                            ...participacaoInfo.user.cvLattes,
                            {
                              id: Date.now(),
                              url: response.fileUrl,
                              userId: participacaoInfo.user.id,
                              identificadorLattes: response.identificadorLattes || null,
                            },
                          ],
                        },
                      };
                      setInscricao((prev) => ({
                        ...prev,
                        participacoes: prev.participacoes.map((p) =>
                          p.id === updatedParticipacao.id
                            ? { ...p, ...updatedParticipacao }
                            : p,
                        ),
                      }));
                      setParticipacaoInfo((prev) => ({ ...prev, ...updatedParticipacao }));

                      return { ...response, fichaGerada: fichaResult.fichaAvaliacao };
                    }
                    return response;
                  }}
                />
              </StepperPanel>
            )}
            {tipoAvaliacao !== "MANUAL" && (
            <StepperPanel header="Currículo">
              <div className={styles.curriculoStep}>
                {/* Card de informações do CV */}
                <Card className={styles.cvCard}>
                  <div className={styles.cvHeader}>
                    <div className={styles.cvIcon}>
                      <RiEyeLine size={24} />
                    </div>
                    <div className={styles.cvInfo}>
                      <h3>Currículo Lattes</h3>
                      {participacaoInfo?.user?.cvLattes?.length > 0 ? (
                        <a
                          href={
                            participacaoInfo.user.cvLattes[
                              participacaoInfo.user.cvLattes?.length - 1
                            ]?.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cvLink}
                        >
                          Clique para visualizar{" "}
                          <RiExternalLinkLine size={16} />
                        </a>
                      ) : (
                        <p className={styles.noCvText}>
                          Nenhum CV enviado ainda
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {participacaoInfo?.user?.cvLattes?.length > 0 && !loading && (
                  <div className={styles.updateInfo}>
                    <RiSave2Line size={16} />
                    <span>
                      Última atualização:{" "}
                      {
                        generateLattesText(
                          participacaoInfo.user.cvLattes[
                            participacaoInfo.user.cvLattes?.length - 1
                          ]?.url,
                        ).formattedDate
                      }{" "}
                      às{" "}
                      {
                        generateLattesText(
                          participacaoInfo.user.cvLattes[
                            participacaoInfo.user.cvLattes?.length - 1
                          ]?.url,
                        ).formattedTime
                      }
                    </span>
                  </div>
                )}
                {/* Área de upload */}
                <Card className={styles.uploadCard}>
                  <div className={styles.uploadArea}>
                    <FileInput
                      onFileSelect={(file) =>
                        handleFileUpload(file, participacaoInfo.user.id)
                      }
                      label={
                        participacaoInfo?.user?.cvLattes?.length > 0
                          ? "Atualizar Currículo Lattes"
                          : "Enviar pasta .ZIP do Currículo Lattes"
                      }
                      disabled={loading}
                      errorMessage={
                        fileInputErrors[participacaoInfo?.user?.id] || ""
                      }
                    />

                    {loading && (
                      <div className={styles.loadingWrapper}>
                        <ProgressSpinner
                          style={{ width: "30px", height: "30px" }}
                        />
                        <span>Enviando arquivo...</span>
                      </div>
                    )}
                  </div>
                </Card>
                {/* Guia passo a passo */}
                <Card className={styles.guideCard}>
                  <div className={styles.guideHeader}>
                    <h4>Como enviar ou atualizar seu Currículo Lattes</h4>
                    <p className={styles.guideSubtitle}>
                      Siga os passos abaixo para exportar e enviar seu CV Lattes
                      em formato XML/ZIP
                    </p>
                  </div>

                  <div className={styles.stepsList}>
                    {/* Passo 1 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>1</div>
                      <div className={styles.stepContent}>
                        <p>Acesse a plataforma Lattes</p>
                        <a
                          href="https://lattes.cnpq.br/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.stepLink}
                        >
                          <div className={styles.stepLogo}>
                            <Image
                              fill
                              src="/image/cnpqLogoMini.png"
                              alt="CNPq Logo"
                              sizes="24 24 700"
                            />
                          </div>
                          lattes.cnpq.br
                          <RiExternalLinkLine size={14} />
                        </a>
                      </div>
                    </div>

                    {/* Passo 2 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>2</div>
                      <div className={styles.stepContent}>
                        <p>Cadastre ou atualize seu currículo</p>
                        <div className={styles.stepActions}>
                          <a
                            href="https://wwws.cnpq.br/cvlattesweb/pkg_cv_estr.inicio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.stepLink}
                          >
                            Cadastrar novo currículo
                          </a>
                          <span className={styles.stepSeparator}>ou</span>
                          <a
                            href="https://lattes.cnpq.br/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.stepLink}
                          >
                            Atualizar currículo existente
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Passo 3 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>3</div>
                      <div className={styles.stepContent}>
                        <p>
                          Na página do seu currículo Lattes, clique em
                          "Exportar"
                        </p>
                        <div className={styles.stepImage}>
                          <Image
                            fill
                            src="/image/printLattesExportar.png"
                            alt="Botão exportar no Lattes"
                            sizes="100 100 700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Passo 4 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>4</div>
                      <div className={styles.stepContent}>
                        <p>
                          Selecione o formato <strong>XML</strong> e faça o
                          download
                        </p>
                        <div className={styles.fileFormatBadge}>
                          Será feito o download de uma pasta com o formato: .ZIP
                          ou um arquivo no formato .XML.
                        </div>
                      </div>
                    </div>

                    {/* Passo 5 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>5</div>
                      <div className={styles.stepContent}>
                        <p>Faça o upload da pasta .ZIP ou do arquivo .XML</p>
                      </div>
                    </div>
                  </div>
                </Card>
                {tipoParticipacao === "aluno" && (
                  <Card className={styles.tutoriaisCard}>
                    <div className={styles.tutoriaisHeader}>
                      <div className={styles.tutoriaisIcon}>
                        <RiYoutubeLine size={20} />
                      </div>
                      <div>
                        <h4>Vídeos Tutoriais</h4>
                        <p className={styles.tutoriaisSubtitle}>
                          Aprenda como cadastrar atividades no seu Currículo
                          Lattes
                        </p>
                      </div>
                    </div>

                    <div className={styles.tutoriaisList}>
                      {/* Iniciação Científica */}
                      <a
                        href="https://www.youtube.com/watch?v=gTfFHQXoRQQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.tutorialItem}
                      >
                        <div className={styles.tutorialIconWrapper}>
                          <RiFlaskLine size={18} />
                        </div>
                        <div className={styles.tutorialContent}>
                          <span className={styles.tutorialTitle}>
                            Como inserir Iniciação Científica no Lattes
                          </span>
                          <span className={styles.tutorialPlatform}>
                            YouTube
                            <RiExternalLinkLine size={12} />
                          </span>
                        </div>
                      </a>

                      {/* Monitoria */}
                      <a
                        href="https://www.youtube.com/watch?v=7Ir-Ee1GPDc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.tutorialItem}
                      >
                        <div className={styles.tutorialIconWrapper}>
                          <RiUserStarLine size={18} />
                        </div>
                        <div className={styles.tutorialContent}>
                          <span className={styles.tutorialTitle}>
                            Como inserir Monitoria no Lattes
                          </span>
                          <span className={styles.tutorialPlatform}>
                            YouTube
                            <RiExternalLinkLine size={12} />
                          </span>
                        </div>
                      </a>

                      {/* Projetos de Extensão */}
                      <a
                        href="https://www.youtube.com/watch?v=BmMuhb_wm-Q"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.tutorialItem}
                      >
                        <div className={styles.tutorialIconWrapper}>
                          <RiCommunityLine size={18} />
                        </div>
                        <div className={styles.tutorialContent}>
                          <span className={styles.tutorialTitle}>
                            Como inserir projetos de extensão no Lattes
                          </span>
                          <span className={styles.tutorialPlatform}>
                            YouTube
                            <RiExternalLinkLine size={12} />
                          </span>
                        </div>
                      </a>
                    </div>

                    <div className={styles.tutoriaisFooter}>
                      <RiYoutubeLine size={14} />
                      <span>
                        Clique nos links acima para abrir os tutoriais no
                        YouTube
                      </span>
                    </div>
                  </Card>
                )}
              </div>

              {gestorMode && (
                <Card className={styles.avaliacaoCard} style={{ marginTop: "16px" }}>
                  <div className={styles.avaliacaoHeader}>
                    <div className={styles.avaliacaoIcon}>
                      <span style={{ fontSize: "20px" }}>🔗</span>
                    </div>
                    <div>
                      <h4>Importar dados do Lattes (alternativa ao XML)</h4>
                      <p className={styles.avaliacaoSubtitle}>
                        Use quando o XML não está disponível
                      </p>
                    </div>
                  </div>
                  <ImportarLattesGestor
                    tenant={tenant}
                    participacaoId={participacaoInfo?.id}
                    onSuccess={() => {
                      setDomImported(true);
                      showSuccess("CV importado com sucesso.");
                      setActiveStep(1);
                    }}
                  />
                </Card>
              )}

              <div className={styles.stepFooter}>
                <Button
                  className="btn-primary"
                  label="Próximo"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={handleNextStep}
                />
              </div>
            </StepperPanel>
            )}
            {tipoAvaliacao !== "MANUAL" && (
            <StepperPanel header={`Gerar Ficha do ${tipoParticipacao}`}>
              <div className={styles.fichaAvaliacao}>
                <Card className={styles.avaliacaoCard}>
                  {/* Cabeçalho com ícone e título */}
                  <div className={styles.avaliacaoHeader}>
                    <div className={styles.avaliacaoIcon}>
                      <RiSave2Line size={24} />
                    </div>
                    <div>
                      <h4>Gerar Ficha de Avaliação</h4>
                      <p className={styles.avaliacaoSubtitle}>
                        {tipoParticipacao.charAt(0).toUpperCase() +
                          tipoParticipacao.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* Conteúdo Principal */}
                  <div className={styles.avaliacaoContent}>
                    <p className={styles.avaliacaoDescription}>
                      Com base nos dados extraídos do Currículo Lattes, o
                      sistema irá pré-preencher e gerar a ficha de avaliação
                      para a categoria de <strong>{tipoParticipacao}</strong>.
                    </p>

                    <div className={styles.avaliacaoInfoBox}>
                      <span className={styles.infoIcon}>ℹ️</span>
                      <span>
                        Após gerar a ficha, você poderá revisar as informações
                        no próximo passo.
                      </span>
                    </div>

                    <Button
                      icon={
                        loadingForm
                          ? "pi pi-spin pi-spinner"
                          : "pi pi-file-edit"
                      }
                      className={styles.btnGerarFicha}
                      label={
                        loadingForm
                          ? "Processando Currículo..."
                          : "Gerar Ficha de Avaliação"
                      }
                      onClick={handleGerarFichaAvaliacao}
                      disabled={loadingForm}
                      loading={loadingForm}
                    />
                  </div>

                  {/* Rodapé com Ações Secundárias */}
                  <div className={styles.avaliacaoFooter}>
                    <Button
                      label="Voltar para Currículo"
                      icon="pi pi-arrow-left"
                      className="p-button-text p-button-plain"
                      onClick={() => setActiveStep(0)}
                    />
                  </div>
                </Card>

              </div>
            </StepperPanel>
            )}
            {tipoAvaliacao !== "MANUAL" && (
            <StepperPanel header={`Ficha do ${tipoParticipacao}`}>
              <div className={styles.fichaAvaliacao}>
                {tipoAvaliacao === "HIBRIDA" ? (
                  <FichaAvaliacaoManual
                    schema={perfilSchema ?? fichaAvaliacao}
                    fichaAtual={fichaAvaliacao}
                    onSave={handleSalvarFichaManual}
                    onBack={() => setActiveStep(0)}
                    loading={loadingForm}
                    cvLattes={participacaoInfo?.user?.cvLattes}
                    onVerItensNaoContabilizados={handleVerItensNaoContabilizados}
                    loadingItensNaoContabilizados={loadingItensNaoContabilizados}
                  />
                ) : (
                <Card className={styles.fichaCard}>
                  {/* Cabeçalho com nota total */}
                  <div className={styles.fichaHeader}>
                    <div className={styles.fichaHeaderContent}>
                      <div className={styles.fichaTitleSection}>
                        <h4>{fichaAvaliacao?.label || "Ficha de Avaliação"}</h4>
                        <p className={styles.fichaSubtitle}>
                          {tipoParticipacao.charAt(0).toUpperCase() +
                            tipoParticipacao.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className={styles.notaTotal}>
                      <span className={styles.notaLabel}>Nota Total</span>
                      <span className={styles.notaValor}>
                        {fichaAvaliacao?.nota || 0}
                        <span className={styles.notaMaximo}>
                          /{fichaAvaliacao?.notaMax || 0}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      padding: "8px 0",
                    }}
                  >
                    <Button
                      label="Ver itens não contabilizados"
                      icon="pi pi-eye"
                      className="p-button-text p-button-plain"
                      onClick={handleVerItensNaoContabilizados}
                      loading={loadingItensNaoContabilizados}
                    />
                  </div>

                  {/* Conteúdo - Grupos de avaliação */}
                  <div className={styles.fichaContent}>
                    {fichaAvaliacao?.grupos?.length > 0 ? (
                      fichaAvaliacao.grupos.map((grupo, index) => (
                        <GrupoAvaliacao key={index} grupo={grupo} nivel={0} />
                      ))
                    ) : (
                      <div className={styles.fichaVazia}>
                        <p>Nenhum item de avaliação encontrado</p>
                      </div>
                    )}
                  </div>

                  {/* Botão de Contato WhatsApp */}
                  <div className={styles.whatsappContactSection}>
                    <Button
                      className={styles.whatsappButton}
                      onClick={handleWhatsAppContact}
                      icon="pi pi-whatsapp"
                      label="Identificou algum erro na leitura do lattes? Entre em contato"
                    />
                    <p className={styles.whatsappHint}>
                      Ao clicar, você será direcionado para o WhatsApp com uma
                      mensagem pré-preenchida
                    </p>
                  </div>

                  {/* Rodapé */}
                  <div className={styles.fichaFooter}>
                    <Button
                      label="Atualizar Currículo"
                      icon="pi pi-arrow-left"
                      className="p-button-text p-button-plain"
                      onClick={() => setActiveStep(0)}
                    />
                    {(campos.length > 0 || tipoParticipacao === "aluno") && (
                      <Button
                        label="Próximo"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        className="btn-primary"
                        onClick={() => setActiveStep((prev) => prev + 1)}
                      />
                    )}
                  </div>
                </Card>
                )}
              </div>
            </StepperPanel>
            )}
            {/* Step: Histórico Escolar (apenas aluno) */}
            {tipoParticipacao === "aluno" && (
              <StepperPanel header="Histórico Escolar">
                <FormAlunoUserTenant
                  tenantSlug={tenant}
                  participacaoInfo={participacaoInfo}
                  editalInfo={editalInfo}
                  userTenant={userTenantData}
                  onBack={() => setActiveStep((prev) => prev - 1)}
                  onSuccess={() => {
                    if (campos.length > 0) {
                      setActiveStep((prev) => prev + 1);
                    } else {
                      showSuccess("Dados salvos com sucesso!");
                      closeModalAndResetData();
                    }
                  }}
                />
              </StepperPanel>
            )}

            {/* Step: Campos Dinâmicos (Formulário) */}
            {campos.length > 0 && (
              <StepperPanel
                header={`Formulário - ${tipoParticipacao.toUpperCase()}`}
              >
                <div className={styles.formularioStep}>
                  <Card className={styles.formularioCard}>
                    {/* Cabeçalho do Formulário */}
                    <div className={styles.formularioHeader}>
                      <div className={styles.formularioIcon}>
                        <RiSave2Line size={20} />
                      </div>
                      <div className={styles.formularioTitleSection}>
                        <h4>Formulário Complementar</h4>
                        <p className={styles.formularioSubtitle}>
                          {tipoParticipacao.charAt(0).toUpperCase() +
                            tipoParticipacao.slice(1)}
                        </p>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className={styles.formularioDescription}>
                      <p>
                        Preencha os campos abaixo com informações complementares
                        para a categoria de <strong>{tipoParticipacao}</strong>.
                        Estes dados serão utilizados para complementar sua
                        avaliação.
                      </p>
                    </div>

                    {/* Formulário */}
                    <form
                      onSubmit={handleSubmit(handleFormSubmit)}
                      className={styles.formularioForm}
                    >
                      <div className={styles.camposDinamicos}>
                        {renderDynamicFields(
                          { campos: campos },
                          control,
                          loadingForm,
                          register,
                          errors,
                          watch,
                        )}
                      </div>

                      {/* Mensagem de Erro */}
                      {errorForm && (
                        <div className={styles.formularioError}>
                          <i className="pi pi-exclamation-triangle" />
                          <span>{errorForm}</span>
                        </div>
                      )}

                      {/* Ações do Formulário */}
                      <div className={styles.formularioActions}>
                        <Button
                          label="Voltar"
                          icon="pi pi-arrow-left"
                          className="p-button-outlined p-button-secondary"
                          onClick={() => setActiveStep((prev) => prev - 1)}
                          type="button"
                        />
                        <Button
                          icon={
                            loadingForm ? "pi pi-spin pi-spinner" : "pi pi-save"
                          }
                          className="btn-primary"
                          type="submit"
                          disabled={loadingForm}
                          label={
                            loadingForm ? "Salvando..." : "Salvar Formulário"
                          }
                        />
                      </div>
                    </form>
                  </Card>
                </div>
              </StepperPanel>
            )}
          </Stepper>

          {/* Botão de excluir fora do Stepper */}
          {!loading ||
            (false && (
              <div className={styles.excluirParticipacao}>
                <Button
                  className="btn-secondary"
                  type="button"
                  disabled={deletingId === participacaoInfo.id}
                  icon={RiDeleteBinLine}
                  onClick={() => handleDeleteParticipacao(participacaoInfo.id)}
                >
                  {deletingId === participacaoInfo.id
                    ? "Excluindo..."
                    : "Excluir participação"}
                </Button>
                {errorMessages[participacaoInfo.id] && (
                  <div className={`${styles.errorMsg}`}>
                    <p>{errorMessages[participacaoInfo.id]}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="p-4">Carregando...</div>
      )}

      <Modal
        isOpen={lattesJaExistenteModal.open}
        onClose={() => setLattesJaExistenteModal({ open: false, message: "", detail: "", hint: "" })}
        size="small"
        showIconClose={false}
      >
        <div className={styles.lattesAlertModal}>
          <div className={styles.lattesAlertHeader}>
            <div className={styles.lattesAlertIconWrapper}>
              <RiAlertLine size={24} />
            </div>
            <h4>CV Lattes já registrado</h4>
          </div>

          <p className={styles.lattesAlertMessage}>
            {lattesJaExistenteModal.message}
          </p>

          {lattesJaExistenteModal.detail && (
            <div className={styles.lattesAlertDetail}>
              <RiTimeLine size={18} />
              {lattesJaExistenteModal.detail}
            </div>
          )}

          {lattesJaExistenteModal.hint && (
            <div className={styles.lattesAlertHint}>
              <span className={styles.lattesAlertHintTitle}>O que fazer?</span>
              <p>{lattesJaExistenteModal.hint}</p>
            </div>
          )}

          <div className={styles.lattesAlertFooter}>
            <Button
              label="Entendi"
              onClick={() => setLattesJaExistenteModal({ open: false, message: "", detail: "", hint: "" })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isItensModalOpen}
        onClose={() => setIsItensModalOpen(false)}
        size="large"
      >
        <h4>Itens não contabilizados</h4>
        <p style={{ marginBottom: 16 }}>
          Veja abaixo, por grupo, quais itens do currículo Lattes foram
          aprovados e quais não foram contabilizados na nota, com o motivo da
          reprovação.
        </p>
        {itensNaoContabilizados?.grupos?.length > 0 ? (
          itensNaoContabilizados.grupos.map((grupo, index) => (
            <GrupoItensNaoContabilizados key={index} grupo={grupo} nivel={0} />
          ))
        ) : (
          <p>Nenhum item encontrado.</p>
        )}
      </Modal>
    </>
  );
};

export default EditarParticipacao;
