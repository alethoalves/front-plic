"use client";
import { useState, useMemo, useRef } from "react";
import styles from "./FichaAvaliacaoManual.module.scss";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import {
  RiExternalLinkLine,
  RiFileTextLine,
  RiUploadLine,
  RiDatabaseLine,
} from "@remixicon/react";
import FileInput from "../FileInput";
import Modal from "@/components/Modal";
import generateLattesText from "@/lib/generateLattesText";

function extrairFolhas(grupos, prefixo = "") {
  const folhas = [];
  grupos?.forEach((grupo, i) => {
    const caminho = prefixo ? `${prefixo}.${i}` : String(i);
    if (grupo.notaPorItem !== undefined) {
      folhas.push({ path: caminho, item: grupo });
    } else if (grupo.grupos?.length > 0) {
      folhas.push(...extrairFolhas(grupo.grupos, caminho));
    }
  });
  return folhas;
}

function navegarPorCaminho(obj, caminho) {
  const partes = caminho.split(".");
  let atual = obj;
  for (const parte of partes) {
    if (!atual?.grupos) return null;
    atual = atual.grupos[parseInt(parte)];
  }
  return atual;
}

function reconstruirFicha(schema, quantidades) {
  const ficha = JSON.parse(JSON.stringify(schema));
  const preencherFolhas = (grupos, prefixo = "") => {
    grupos?.forEach((grupo, i) => {
      const caminho = prefixo ? `${prefixo}.${i}` : String(i);
      if (grupo.notaPorItem !== undefined) {
        const qty = quantidades[caminho] ?? 0;
        grupo.respostaCampos = Array(qty).fill([]);
      } else if (grupo.grupos?.length > 0) {
        preencherFolhas(grupo.grupos, caminho);
      }
    });
  };
  preencherFolhas(ficha.grupos);
  return ficha;
}

function calcularNota(grupo, quantidades, prefixo = "") {
  if (grupo.notaPorItem !== undefined) {
    const qty = quantidades[prefixo] ?? 0;
    return Math.min(qty * grupo.notaPorItem, grupo.notaMax ?? Infinity);
  }
  if (grupo.grupos?.length > 0) {
    let total = 0;
    grupo.grupos.forEach((sub, i) => {
      const caminho = prefixo ? `${prefixo}.${i}` : String(i);
      total += calcularNota(sub, quantidades, caminho);
    });
    return Math.min(total, grupo.notaMax ?? total);
  }
  return 0;
}

function calcularNotaRaiz(schema, quantidades) {
  if (!schema?.grupos) return 0;
  let total = 0;
  schema.grupos.forEach((grupo, i) => {
    total += calcularNota(grupo, quantidades, String(i));
  });
  return Math.min(total, schema.notaMax ?? total);
}

function aplicarFichaNasQuantidades(schema, ficha) {
  const folhas = extrairFolhas(schema?.grupos);
  const mapa = {};
  folhas.forEach(({ path }) => {
    const item = ficha ? navegarPorCaminho(ficha, path) : null;
    mapa[path] = item?.respostaCampos?.length ?? 0;
  });
  return mapa;
}

// ─── GrupoManual ─────────────────────────────────────────────────────────────
const GrupoManual = ({ grupo, caminho, quantidades, onChange, nivel = 0 }) => {
  const [expanded, setExpanded] = useState(nivel < 2);
  const notaAtual = calcularNota(grupo, quantidades, caminho);
  const isLeaf = grupo.notaPorItem !== undefined;
  const hasChildren = !isLeaf && grupo.grupos?.length > 0;

  const nivelClass =
    nivel === 0 ? styles.nivel0 : nivel === 1 ? styles.nivel1 : styles.nivel2;

  return (
    <div className={`${styles.grupo} ${nivelClass}`}>
      <div
        className={`${styles.grupoHeader} ${hasChildren ? styles.clicavel : ""}`}
        onClick={() => hasChildren && setExpanded((v) => !v)}
      >
        <div className={styles.grupoHeaderEsquerda}>
          {hasChildren && (
            <i
              className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"} ${styles.expandIcon}`}
            />
          )}
          <span className={styles.grupoLabel}>{grupo.label}</span>
        </div>

        <div className={styles.grupoHeaderDireita}>
          {isLeaf ? (
            <div
              className={styles.inputWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="number"
                min={0}
                value={quantidades[caminho] ?? 0}
                onChange={(e) =>
                  onChange(caminho, Math.max(0, parseInt(e.target.value) || 0))
                }
                className={styles.qtyInput}
              />
              <span className={styles.qtyLabel}>
                × {grupo.notaPorItem} pts = <strong>{notaAtual}</strong>/
                {grupo.notaMax}
              </span>
            </div>
          ) : (
            <span className={styles.notaResumo}>
              <strong>{notaAtual}</strong>/{grupo.notaMax} pts
            </span>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className={styles.subgrupos}>
          {grupo.grupos.map((sub, i) => {
            const subCaminho = `${caminho}.${i}`;
            return (
              <GrupoManual
                key={subCaminho}
                grupo={sub}
                caminho={subCaminho}
                quantidades={quantidades}
                onChange={onChange}
                nivel={nivel + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── FichaAvaliacaoManual ─────────────────────────────────────────────────────
const FichaAvaliacaoManual = ({
  schema,
  fichaAtual,
  onSave,
  onBack,
  loading = false,
  onFileUpload,
  onGerarFicha,
  cvLattes,
  onVerItensNaoContabilizados,
  loadingItensNaoContabilizados = false,
}) => {
  const toast = useRef(null);
  const ultimoCv = cvLattes?.length > 0 ? cvLattes[cvLattes.length - 1] : null;
  const identificadorExistente = ultimoCv?.identificadorLattes;
  const jaTemXml = cvLattes?.length > 0;

  const lattesUrlInicial = useMemo(() => {
    if (fichaAtual?.lattesUrl) return fichaAtual.lattesUrl;
    if (identificadorExistente)
      return `http://lattes.cnpq.br/${identificadorExistente}`;
    return "";
  }, [fichaAtual, identificadorExistente]);

  const initialQuantidades = useMemo(
    () => aplicarFichaNasQuantidades(schema, fichaAtual),
    [schema, fichaAtual],
  );

  const [quantidades, setQuantidades] = useState(initialQuantidades);
  const [confirmado, setConfirmado] = useState(false);
  const [lattesUrl, setLattesUrl] = useState(lattesUrlInicial);
  const [lattesUrlError, setLattesUrlError] = useState("");
  const [xmlModalOpen, setXmlModalOpen] = useState(false);
  const [uploadingXml, setUploadingXml] = useState(false);
  const [xmlUploadError, setXmlUploadError] = useState("");
  const [autoPreenchido, setAutoPreenchido] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [xmlStorageUrl, setXmlStorageUrl] = useState(ultimoCv?.url || null);

  const showError = (msg) => {
    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: msg,
      life: 5000,
    });
  };

  const showSuccess = (msg) => {
    toast.current?.show({
      severity: "success",
      summary: "Sucesso",
      detail: msg,
      life: 5000,
    });
  };

  const validarLattesUrl = (url) => {
    if (!url.trim()) return "";
    const regex = /^https?:\/\/lattes\.cnpq\.br\/\d+$/;
    if (!regex.test(url.trim())) {
      return "Formato esperado: http://lattes.cnpq.br/0000000000000000";
    }
    return "";
  };

  const isLattesUrlValida = lattesUrl.trim() && !validarLattesUrl(lattesUrl);

  const preencherComFicha = (ficha, idLattes) => {
    if (ficha) {
      setQuantidades(aplicarFichaNasQuantidades(schema, ficha));
      setConfirmado(false);
    }
    if (idLattes) {
      setLattesUrl(`http://lattes.cnpq.br/${idLattes}`);
      setLattesUrlError("");
    }
    setAutoPreenchido(true);
  };

  const handleUsarXmlExistente = async () => {
    if (!onGerarFicha) return;
    setGerando(true);
    try {
      const result = await onGerarFicha();
      preencherComFicha(result.fichaAvaliacao, identificadorExistente);
      showSuccess("Ficha preenchida com os dados do Lattes!");
      setXmlModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erro ao gerar ficha de avaliação.";
      showError(errorMessage);
    } finally {
      setGerando(false);
    }
  };

  const handleFileUploadNoModal = async (file) => {
    if (!file || !onFileUpload) return;

    const isZip =
      [
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",
      ].includes(file.type) || file.name.endsWith(".zip");
    const isXml =
      file.type === "text/xml" ||
      file.type === "application/xml" ||
      file.name.endsWith(".xml");
    if (!isXml && !isZip) {
      setXmlUploadError("Por favor, selecione um arquivo XML ou ZIP válido.");
      return;
    }

    setXmlUploadError("");
    setUploadingXml(true);

    try {
      const result = await onFileUpload(file);
      preencherComFicha(result?.fichaGerada, result?.identificadorLattes);
      if (result?.fileUrl) setXmlStorageUrl(result.fileUrl);
      showSuccess("XML importado e ficha preenchida com sucesso!");
      setXmlModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erro ao enviar o arquivo.";
      setXmlUploadError(errorMessage);
    } finally {
      setUploadingXml(false);
    }
  };

  const handleChange = (caminho, valor) => {
    setQuantidades((prev) => ({ ...prev, [caminho]: valor }));
    setConfirmado(false);
  };

  const handleSalvar = () => {
    const ficha = reconstruirFicha(schema, quantidades);
    ficha.lattesUrl = lattesUrl.trim();
    onSave(ficha);
  };

  const notaTotal = calcularNotaRaiz(schema, quantidades);

  if (!schema) return null;

  const lattesInfo = xmlStorageUrl ? generateLattesText(xmlStorageUrl) : null;

  return (
    <>
      <Toast ref={toast} position="top-right" />

      {(onFileUpload || onGerarFicha) && (
        <div className={styles.importarSection}>
          <h4 className={styles.importarTitulo}>
            Agilize o preenchimento da ficha de avaliação
          </h4>
          <p className={styles.importarSubtitulo}>
            Utilize o XML do Currículo Lattes para preencher automaticamente os
            dados abaixo.
          </p>

          <div
            className={styles.importarCard}
            onClick={() => setXmlModalOpen(true)}
          >
            <div className={styles.importarCardIcon}>
              <RiFileTextLine size={24} />
            </div>
            <div className={styles.importarCardTexto}>
              <span className={styles.importarCardLabel}>
                Importar do XML do Lattes
              </span>
              <span className={styles.importarCardDesc}>
                {jaTemXml
                  ? "Usar XML já cadastrado ou enviar um novo"
                  : "Enviar arquivo XML ou ZIP exportado do Lattes"}
              </span>
            </div>
            <i className="pi pi-chevron-right" />
          </div>

          {xmlStorageUrl && lattesInfo && (
            <div className={styles.xmlStorageLink}>
              <i className="pi pi-file" />
              <span>
                XML cadastrado
                {lattesInfo.formattedDate && (
                  <>
                    {" "}
                    — atualizado em {lattesInfo.formattedDate} às{" "}
                    {lattesInfo.formattedTime}
                  </>
                )}
              </span>
              <a href={xmlStorageUrl} target="_blank" rel="noopener noreferrer">
                Visualizar <RiExternalLinkLine size={14} />
              </a>
            </div>
          )}
        </div>
      )}

      {autoPreenchido && (
        <>
          <div className={styles.autoPreenchidoBanner}>
            <i className="pi pi-check-circle" />
            <span>
              Ficha preenchida automaticamente com os dados do Lattes. Revise e
              ajuste se necessário.
            </span>
          </div>
          <div className={styles.autoPreenchidoWarning}>
            <i className="pi pi-exclamation-triangle" />
            <span>
              Caso algum item do Currículo Lattes não tenha sido contabilizado
              na ficha, você pode ajustar as quantidades manualmente nos campos
              abaixo. Certifique-se de que os itens estejam devidamente
              registrados no Lattes.
            </span>
          </div>
        </>
      )}

      <Card className={styles.fichaCard}>
        <div className={styles.fichaHeader}>
          <div className={styles.fichaTitulo}>
            <h4>{schema.label || "Ficha de Avaliação"}</h4>
            <p className={styles.fichaSubtitulo}>
              Informe a quantidade de itens de cada categoria. A nota é
              calculada automaticamente.
            </p>
          </div>
          <div className={styles.notaTotal}>
            <span className={styles.notaTotalLabel}>Nota Total</span>
            <span className={styles.notaTotalValor}>
              {notaTotal}
              <span className={styles.notaTotalMax}>
                /{schema.notaMax ?? 0}
              </span>
            </span>
          </div>
        </div>

        {onVerItensNaoContabilizados && (
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
              onClick={onVerItensNaoContabilizados}
              loading={loadingItensNaoContabilizados}
            />
          </div>
        )}

        <div className={styles.grupos}>
          {schema.grupos?.map((grupo, i) => (
            <GrupoManual
              key={i}
              grupo={grupo}
              caminho={String(i)}
              quantidades={quantidades}
              onChange={handleChange}
              nivel={0}
            />
          ))}
        </div>

        <div className={styles.lattesLinkField}>
          <label htmlFor="lattesUrl" className={styles.lattesLinkLabel}>
            Link do Currículo Lattes
          </label>
          <input
            id="lattesUrl"
            type="url"
            placeholder="https://lattes.cnpq.br/..."
            value={lattesUrl}
            onChange={(e) => {
              setLattesUrl(e.target.value);
              setLattesUrlError(validarLattesUrl(e.target.value));
              setConfirmado(false);
            }}
            onBlur={() => setLattesUrlError(validarLattesUrl(lattesUrl))}
            className={`${styles.lattesLinkInput} ${lattesUrlError ? styles.lattesLinkInputError : ""}`}
          />
          {lattesUrlError && (
            <small className={styles.lattesLinkErrorMsg}>
              {lattesUrlError}
            </small>
          )}
        </div>

        <label className={styles.confirmacao}>
          <input
            type="checkbox"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
          />
          <span>
            Confirmo que as informações inseridas acima estão de acordo com o
            Currículo Lattes do aluno.
          </span>
        </label>

        <div className={styles.acoes}>
          {onBack && (
            <Button
              label="Voltar"
              icon="pi pi-arrow-left"
              className="p-button-text p-button-plain"
              onClick={onBack}
              disabled={loading}
            />
          )}
          <Button
            label={loading ? "Salvando..." : "Salvar Ficha"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-save"}
            className="btn-primary"
            onClick={handleSalvar}
            disabled={loading || !confirmado || !isLattesUrlValida}
          />
        </div>
      </Card>

      <Modal
        isOpen={xmlModalOpen}
        onClose={() => {
          setXmlModalOpen(false);
          setXmlUploadError("");
        }}
        size="small"
      >
        <div className={styles.xmlModal}>
          <h4>Importar XML do Currículo Lattes</h4>
          <p>
            Selecione uma das opções abaixo para preencher a ficha de avaliação
            automaticamente.
          </p>

          {jaTemXml && (
            <div className={styles.xmlModalOption}>
              <div className={styles.xmlModalOptionHeader}>
                <RiDatabaseLine size={20} />
                <div>
                  <span className={styles.xmlModalOptionLabel}>
                    Usar XML já cadastrado
                  </span>
                  {lattesInfo && (
                    <span className={styles.xmlModalOptionDesc}>
                      Última atualização: {lattesInfo.formattedDate} às{" "}
                      {lattesInfo.formattedTime}
                    </span>
                  )}
                </div>
              </div>
              <Button
                label={gerando ? "Processando..." : "Usar este XML"}
                icon={gerando ? "pi pi-spin pi-spinner" : "pi pi-check"}
                className="btn-primary"
                onClick={handleUsarXmlExistente}
                disabled={gerando || uploadingXml}
                style={{ width: "100%" }}
              />
            </div>
          )}

          <div className={styles.xmlModalOption}>
            <div className={styles.xmlModalOptionHeader}>
              <RiUploadLine size={20} />
              <div>
                <span className={styles.xmlModalOptionLabel}>
                  {jaTemXml
                    ? "Enviar novo XML do participante"
                    : "Enviar XML do Currículo Lattes"}
                </span>
                <span className={styles.xmlModalOptionDesc}>
                  Arquivo XML ou ZIP exportado da plataforma Lattes
                </span>
              </div>
            </div>
            <FileInput
              onFileSelect={handleFileUploadNoModal}
              label="Selecionar arquivo XML ou ZIP"
              disabled={uploadingXml || gerando}
              errorMessage={xmlUploadError}
            />
            {uploadingXml && (
              <div className={styles.xmlModalLoading}>
                <ProgressSpinner style={{ width: "24px", height: "24px" }} />
                <span>Enviando e processando currículo...</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FichaAvaliacaoManual;
