"use client";
import {
  RiTimeLine,
  RiCheckboxCircleLine,
  RiPenNibLine,
  RiArrowLeftLine,
  RiFileTextLine,
  RiAlertLine,
  RiEditLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import {
  getMyDocuments,
  assinarDocumento,
  salvarFormulario,
} from "@/app/api/client/documentos";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { renderizarTextoComLinks } from "@/lib/renderizaTextoComLink";

const DocumentoDetailPage = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [documento, setDocumento] = useState(null);
  const [assinando, setAssinando] = useState(null);
  const [error, setError] = useState(null);
  const [formularioData, setFormularioData] = useState({});
  const [editandoFormulario, setEditandoFormulario] = useState(false);
  const [arquivos, setArquivos] = useState({}); // ← Adicione este estado
  const router = useRouter();
  const toast = useRef(null);
  const fileUploadRef = useRef({});
  // Função para mostrar toast
  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  // Verificar se é documento do tipo FORMULÁRIO
  const isFormulario =
    documento?.documentoTemplate?.tipoDocumento === "FORMULARIO";

  // Verificar se o formulário já foi preenchido
  const isFormularioPreenchido = isFormulario && documento?.conteudo;

  // Parse do conteúdo do formulário (se existir)
  const parseFormularioContent = () => {
    if (!isFormularioPreenchido) return null;

    try {
      return JSON.parse(documento.conteudo);
    } catch (error) {
      console.error("Erro ao parsear conteúdo do formulário:", error);
      return null;
    }
  };

  // Função para renderizar formulário dinâmico
  const renderizarFormulario = () => {
    if (!isFormulario || !documento?.documentoTemplate?.formularioPadrao) {
      return (
        <Message
          severity="warn"
          text="Formulário não configurado corretamente."
        />
      );
    }

    try {
      const campos = documento.documentoTemplate.formularioPadrao;

      return (
        <Card className={styles.formularioCard}>
          <div className={styles.formularioHeader}>
            <RiFileTextLine size={24} />
            <h2>Preencha o formulário</h2>
          </div>
          <Divider />
          <div className={styles.formularioContent}>
            {campos.map((campo, index) =>
              renderizarCampoFormulario(campo, index)
            )}
          </div>
          <Divider />
          <div className={styles.formularioActions}>
            <Button
              label="Salvar Respostas"
              icon="pi pi-check"
              className="p-button-success"
              onClick={handleSalvarFormulario}
              loading={loading}
            />
          </div>
        </Card>
      );
    } catch (error) {
      console.error("Erro ao renderizar formulário:", error);
      return <Message severity="error" text="Erro ao carregar formulário." />;
    }
  };

  // Função para renderizar campo individual do formulário
  const renderizarCampoFormulario = (campo, index) => {
    const value = formularioData[campo.label] || campo.value || "";

    switch (campo.tipo) {
      case "text":
        return (
          <div key={index} className={styles.campoGroup}>
            <label className={styles.campoLabel}>
              {campo.label}
              {campo.obrigatorio && (
                <span className={styles.obrigatorio}>*</span>
              )}
            </label>
            <InputText
              value={value}
              onChange={(e) => handleCampoChange(campo.label, e.target.value)}
              maxLength={campo.max}
              placeholder={campo.placeholder}
              className={styles.campoInput}
              required={campo.obrigatorio}
            />
            {campo.descricao && (
              <small className={styles.campoDescricao}>{campo.descricao}</small>
            )}
          </div>
        );

      case "select":
        return (
          <div key={index} className={styles.campoGroup}>
            <label className={styles.campoLabel}>
              {campo.label}
              {campo.obrigatorio && (
                <span className={styles.obrigatorio}>*</span>
              )}
            </label>
            <Dropdown
              value={value}
              onChange={(e) => handleCampoChange(campo.label, e.value)}
              options={campo.opcoes}
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione..."
              className={styles.campoSelect}
              required={campo.obrigatorio}
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={index} className={styles.campoGroup}>
            <div className={styles.campoCheckboxContainer}>
              <Checkbox
                inputId={`checkbox-${index}`}
                checked={value}
                onChange={(e) => handleCampoChange(campo.label, e.checked)}
                required={campo.obrigatorio}
              />
              <label
                htmlFor={`checkbox-${index}`}
                className={styles.campoCheckboxLabel}
              >
                {campo.label}
                {campo.obrigatorio && (
                  <span className={styles.obrigatorio}>*</span>
                )}
              </label>
            </div>
            {campo.mensagem && (
              <small className={styles.campoDescricao}>{campo.mensagem}</small>
            )}
          </div>
        );

      case "arquivo":
        return (
          <div key={index} className={styles.campoGroup}>
            <label className={styles.campoLabel}>
              {campo.label}
              {campo.obrigatorio && (
                <span className={styles.obrigatorio}>*</span>
              )}
            </label>

            {/* Substituir FileUpload por input nativo */}
            <input
              type="file"
              accept=".pdf,application/pdf" // ← Aceitar apenas PDF
              onChange={(e) => handleFileUpload(campo.label, e)}
              className={styles.campoFileInput}
            />

            {formularioData[campo.label] && (
              <small className={styles.arquivoSelecionado}>
                Arquivo selecionado: {formularioData[campo.label]}
              </small>
            )}
            {campo.descricao && (
              <small className={styles.campoDescricao}>
                {renderizarTextoComLinks(campo.descricao)}
                {/* MODIFICAÇÃO AQUI: Mostrar apenas PDF como formato aceito */}
                <> (Apenas arquivos PDF)</>
              </small>
            )}
          </div>
        );
      case "group":
        return (
          <Panel key={index} header={campo.label} className={styles.groupPanel}>
            <div className={styles.groupFields}>
              {campo.campos.map((subCampo, subIndex) =>
                renderizarCampoFormulario(subCampo, `${index}-${subIndex}`)
              )}
            </div>
          </Panel>
        );

      default:
        return (
          <div key={index} className={styles.campoGroup}>
            <Message
              severity="warn"
              text={`Campo não suportado: ${campo.tipo}`}
            />
          </div>
        );
    }
  };

  // Handler para mudanças nos campos do formulário
  const handleCampoChange = (campo, value) => {
    setFormularioData((prev) => ({
      ...prev,
      [campo]: value,
    }));
  };

  const handleFileUpload = (campo, event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      showToast("error", "Erro", "Apenas arquivos PDF são permitidos.");
      event.target.value = ""; // Limpar o input
      return;
    }
    // Usar o campo ORIGINAL como chave para consistência
    setArquivos((prev) => ({
      ...prev,
      [campo]: file,
    }));

    // Mostrar nome do arquivo no formulário
    setFormularioData((prev) => ({
      ...prev,
      [campo]: file.name,
    }));
  };
  const sanitizeFieldName = (fieldName) => {
    return fieldName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, "_") // Substitui espaços por underscore
      .replace(/[^a-zA-Z0-9_]/g, "") // Remove outros caracteres especiais
      .toLowerCase();
  };
  const handleSalvarFormulario = async () => {
    try {
      setLoading(true);

      // 1. Coletar campos de arquivo do template
      const camposArquivo =
        documento.documentoTemplate.formularioPadrao.flatMap((campo) =>
          campo.tipo === "group"
            ? campo.campos.filter((sub) => sub.tipo === "arquivo")
            : campo.tipo === "arquivo"
            ? [campo]
            : []
        );

      // 2. Verificar arquivos obrigatórios
      const arquivosFaltantes = camposArquivo
        .filter((campo) => campo.obrigatorio && !arquivos[campo.label])
        .map((campo) => campo.label);

      if (arquivosFaltantes.length > 0) {
        showToast(
          "warn",
          "Atenção",
          `Selecione os arquivos: ${arquivosFaltantes.join(", ")}`
        );
        return;
      }

      // 3. Criar FormData CORRETAMENTE
      const formData = new FormData();
      formData.append("documentoRegistroId", documento.id.toString());
      formData.append("formularioData", JSON.stringify(formularioData));

      // Mapeamento para reconstruir no backend
      const fieldMapping = {};

      // Adicionar cada arquivo com fieldname SANITIZADO
      Object.entries(arquivos).forEach(([campoLabel, arquivo]) => {
        const campoSanitizado = sanitizeFieldName(campoLabel);
        fieldMapping[campoSanitizado] = campoLabel; // Guardar o mapeamento

        formData.append(campoSanitizado, arquivo);
        console.log(`Enviando: ${campoLabel} -> ${campoSanitizado}`);
      });

      // Adicionar o mapeamento para o backend reconstruir
      formData.append("fieldMapping", JSON.stringify(fieldMapping));

      // Debug
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(key, value.name, value.size, value.type);
        } else {
          console.log(key, value);
        }
      }

      // 4. Chamar API
      const response = await salvarFormulario(params.tenant, formData);

      // 5. Atualizar estado
      setDocumento(response.data.documento);
      setArquivos({});
      setEditandoFormulario(false);
    } catch (error) {
      console.error("Erro ao salvar formulário:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar formulário.";
    } finally {
      setLoading(false);
    }
  };

  // Função para renderizar dados preenchidos do formulário
  // Função para renderizar dados preenchidos do formulário - ATUALIZADA
  const renderizarDadosFormulario = () => {
    const dados = parseFormularioContent();
    if (!dados)
      return <Message severity="info" text="Nenhum dado preenchido." />;

    return (
      <Card className={styles.dadosCard}>
        <div className={styles.dadosHeader}>
          <RiCheckboxCircleLine size={24} />
          <h2>Dados Preenchidos</h2>
        </div>
        <Divider />
        <div className={styles.dadosContent}>
          {Object.entries(dados).map(([campo, valor], index) => (
            <div key={index} className={styles.dadoItem}>
              <strong>{campo}:</strong>
              <span>
                {typeof valor === "boolean" ? (
                  valor ? (
                    "Sim"
                  ) : (
                    "Não"
                  )
                ) : valor && valor.toString().startsWith("http") ? (
                  <a
                    href={valor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkArquivo}
                  >
                    Ver arquivo
                  </a>
                ) : (
                  valor
                )}
              </span>
            </div>
          ))}
        </div>
        {editandoFormulario && <Divider />}
      </Card>
    );
  };

  // Função para renderizar o conteúdo do documento
  const renderizarConteudoDocumento = () => {
    if (isFormulario) {
      if (editandoFormulario || !isFormularioPreenchido) {
        return renderizarFormulario();
      } else {
        return renderizarDadosFormulario();
      }
    }

    // Para documentos TERMO (comportamento original)
    const conteudo = documento?.conteudo || documento?.conteudoProcessado;
    if (!conteudo) return null;

    const isHTML = /<[a-z][\s\S]*>/i.test(conteudo);

    if (isHTML) {
      return (
        <div
          className={styles.documentoContent}
          dangerouslySetInnerHTML={{ __html: conteudo }}
        />
      );
    } else {
      return (
        <div className={styles.documentoContent}>
          <p>{conteudo}</p>
        </div>
      );
    }
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return "Não assinado";

    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para assinar documento
  // Função para assinar documento - ATUALIZADA
  const handleAssinar = async (assinatura) => {
    // Verificar se é formulário e se está preenchido ou editando
    if (isFormulario && (!isFormularioPreenchido || editandoFormulario)) {
      showToast("warn", "Atenção", "Salve o formulário antes de assinar.");
      return;
    }

    setAssinando(assinatura.id);

    try {
      const payload = {
        documentoRegistroId: assinatura.documentoRegistroId,
        tokenAssinatura: assinatura.tokenAssinatura,
        conteudo: documento.conteudo || documento.conteudoProcessado,
      };

      await assinarDocumento(params.tenant, payload);
      showToast("success", "Sucesso", "Documento assinado com sucesso!");

      // Recarregar os dados do documento
      await fetchDocumento();
    } catch (error) {
      console.error("Erro ao assinar documento:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao assinar o documento. Tente novamente.";
      showToast("error", "Erro", errorMessage);
    } finally {
      setAssinando(null);
    }
  };

  // Buscar dados do documento específico
  // Buscar dados do documento específico - MELHORADA
  const fetchDocumento = async () => {
    try {
      setLoading(true);
      const documentos = await getMyDocuments(params.tenant);
      const documentoEncontrado = documentos.find(
        (doc) => doc.id === parseInt(params.documentoId)
      );

      if (documentoEncontrado) {
        setDocumento(documentoEncontrado);

        // Preencher formulárioData se já existir conteúdo
        if (documentoEncontrado.conteudo && isFormulario) {
          try {
            const dados = JSON.parse(documentoEncontrado.conteudo);
            setFormularioData(dados);
          } catch (error) {
            console.error("Erro ao parsear dados do formulário:", error);
          }
        }
      } else {
        setError("Documento não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      setError("Erro ao carregar documento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumento();
  }, [params.tenant, params.documentoId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <ProgressSpinner />
        <p>Carregando documento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <RiAlertLine className={styles.errorIcon} />
        <p>{error}</p>
        <Link
          href={`/${params.tenant}/user/documentos`}
          className={styles.backButton}
        >
          <RiArrowLeftLine /> Voltar para documentos
        </Link>
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <div className={styles.documentoDetailContainer}>
          <Toast ref={toast} position="top-right" />

          <div className={styles.header}>
            <Link
              href={`/${params.tenant}/user/documentos`}
              className={styles.backLink}
            >
              <RiArrowLeftLine /> Voltar
            </Link>
          </div>

          <div className={styles.documentContent}>
            {renderizarConteudoDocumento()}
          </div>

          {/* Mostrar seção de assinaturas apenas se o formulário estiver preenchido ou for TERMO */}
          {(isFormularioPreenchido || !isFormulario) && (
            <div className={styles.assinaturasSection}>
              <h2 className={styles.assinaturasTitle}>
                <RiPenNibLine className={styles.sectionIcon} />
                Assinaturas
              </h2>

              <div className={styles.assinaturasList}>
                {documento.assinaturas.map((assinatura) => (
                  <div
                    key={assinatura.id}
                    className={`${styles.assinaturaItem} ${
                      assinatura.dataAssinatura
                        ? styles.assinaturaRealizada
                        : styles.assinaturaPendente
                    }`}
                  >
                    <div className={styles.assinaturaInfo}>
                      <div className={styles.assinaturaUser}>
                        <h6 className={styles.assinaturaNome}>
                          {assinatura?.user?.nome}
                        </h6>
                        <p className={styles.assinaturaTipo}>
                          {assinatura.tipoSignatario}
                        </p>
                      </div>

                      <div className={styles.assinaturaStatus}>
                        {assinatura.dataAssinatura ? (
                          <p className={styles.statusRealizada}>
                            <RiCheckboxCircleLine
                              className={styles.statusIcon}
                            />
                            Assinado em:{" "}
                            {formatarData(assinatura.dataAssinatura)}
                          </p>
                        ) : (
                          <p className={styles.statusPendente}>
                            <RiTimeLine className={styles.statusIcon} />
                            Aguardando assinatura
                          </p>
                        )}
                      </div>
                    </div>

                    {!assinatura.dataAssinatura && (
                      <div className={styles.assinaturaActions}>
                        <button
                          className={styles.assinarButton}
                          onClick={() => handleAssinar(assinatura)}
                          disabled={assinando === assinatura.id}
                        >
                          {assinando === assinatura.id ? (
                            <>
                              <RiPenNibLine className={styles.buttonIcon} />
                              Assinando...
                            </>
                          ) : (
                            <>
                              <RiPenNibLine className={styles.buttonIcon} />
                              Assinar Documento
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.documentoStatus}>
            <span
              className={`${styles.statusBadge} ${
                styles[`status-${documento.status.toLowerCase()}`]
              }`}
            >
              {documento.status === "AGUARDANDO_VALIDACAO"
                ? "Aguarde validação do Gestor, prazo de 10 dias úteis"
                : documento.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentoDetailPage;
