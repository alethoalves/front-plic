"use client";

import { useRef, useState } from "react";
import styleSecao from "@/components/Formularios/FormConfiguracoesEvento.module.scss";
import styles from "./FormCertificados.module.scss";
import styleTextarea from "@/components/Textarea.module.scss";
import { RiContractLine, RiImageAddLine, RiMedalLine } from "@remixicon/react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Image from "next/image";
import {
  uploadAndSaveCertificateImage,
  updateTextoCertificado,
  resolverTextoPreview,
  temVersaoIngles,
  CAMPOS_POR_TIPO,
  CAMPOS_COMUNS,
} from "@/app/api/client/certificado";

const TEXTO_MAX_LENGTH = 3000;

// Dimensões reais do certificado gerado (ver generateCertificate no
// backend) — usadas só pra converter posicaoTextoX/Y (em px, nessa escala)
// em porcentagem, já que a imagem de upload aqui é exibida em tamanho
// variável, não nesse tamanho fixo.
const CERTIFICADO_LARGURA = 1123;
const CERTIFICADO_ALTURA = 794;

const TITULO_POR_TIPO = {
  PARTICIPACAO: "Participante",
  EXPOSITOR: "Apresentador",
  AVALIADOR: "Avaliador",
  PREMIADO: "Premiado",
  INDICADO: "Indicado ao Prêmio",
  MENCAO: "Menção Honrosa",
};

const DESCRICAO_POR_TIPO = {
  PARTICIPACAO: "Certificado de Participante",
  EXPOSITOR: "Certificado de Apresentador",
  AVALIADOR: "Certificado de Avaliador",
  PREMIADO: "Certificado de Premiado",
  INDICADO: "Certificado de Indicado ao Prêmio",
  MENCAO: "Certificado de Menção Honrosa",
};

// Cada layout tem uma versão em português e, opcionalmente, uma em inglês
// (imagem e texto próprios; a posição do texto é a mesma). A versão em inglês
// fica disponível pra download quando tem imagem e texto.
const IDIOMAS = [
  { id: "pt", label: "Português" },
  { id: "en", label: "Inglês" },
];
const CAMPO_TEXTO = { pt: "texto", en: "textoIngles" };
const CAMPO_IMAGEM = { pt: "imagemFundo", en: "imagemFundoIngles" };

// Layouts de certificado (imagem de fundo + texto) por tipo, pra este
// evento — cada tipo tem no máximo um layout (@@unique([eventoId, tipo])).
// Migrado de app/evento/[eventoSlug]/admin/certificados/ pra virar uma aba
// de Configurações, no mesmo espírito da migração de Sessões.
const FormCertificados = ({ eventoSlug, initialCertificados, evento }) => {
  const [certificados, setCertificados] = useState(initialCertificados || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoCertificado, setTipoCertificado] = useState(null);
  const [selectedCertificado, setSelectedCertificado] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [idioma, setIdioma] = useState("pt");
  // Texto em edição de cada idioma (trocar de aba não perde o que foi digitado)
  const [textos, setTextos] = useState({ pt: "", en: "" });
  const textoCertificado = textos[idioma];
  const setTextoCertificado = (valor) =>
    setTextos((atual) => ({
      ...atual,
      [idioma]: typeof valor === "function" ? valor(atual[idioma]) : valor,
    }));
  const imagemAtual = selectedCertificado?.[CAMPO_IMAGEM[idioma]];
  const [isSavingTexto, setIsSavingTexto] = useState(false);
  const [errorTexto, setErrorTexto] = useState("");
  const fileInputRef = useRef();

  const openModalAndSetData = (certificado) => {
    setIsModalOpen(true);
    setTipoCertificado(certificado.tipo);
    setSelectedCertificado(certificado);
    setError("");
    setIdioma("pt");
    setTextos({ pt: certificado.texto || "", en: certificado.textoIngles || "" });
    setErrorTexto("");
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setSelectedCertificado(null);
    setError("");
    setTextos({ pt: "", en: "" });
    setErrorTexto("");
  };

  const handleInserirCampo = (chave) => {
    setTextoCertificado((atual) => `${atual}<<[${chave}]>>`);
  };

  const handleSalvarTexto = async () => {
    setIsSavingTexto(true);
    setErrorTexto("");
    try {
      const response = await updateTextoCertificado(
        eventoSlug,
        selectedCertificado.id,
        textoCertificado,
        idioma
      );
      const atualizado = response.certificado;
      setCertificados((prev) =>
        prev.map((cert) => (cert.id === atualizado.id ? atualizado : cert))
      );
      setSelectedCertificado(atualizado);
    } catch (err) {
      setErrorTexto(err.message || "Erro ao salvar texto. Tente novamente.");
    } finally {
      setIsSavingTexto(false);
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      setError("Nenhum arquivo selecionado.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    try {
      const response = await uploadAndSaveCertificateImage(
        eventoSlug,
        selectedCertificado.id,
        formData,
        idioma
      );

      const campo = CAMPO_IMAGEM[idioma];
      setCertificados((prev) =>
        prev.map((cert) =>
          cert.id === selectedCertificado.id
            ? { ...cert, [campo]: response.fileUrl }
            : cert
        )
      );

      setSelectedCertificado((prev) => ({
        ...prev,
        [campo]: response.fileUrl,
      }));

      setError("");
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError("Erro ao fazer upload. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDivClick = () => {
    fileInputRef.current.click();
  };

  return (
    <section className={styleSecao.section}>
      <div className={styleSecao.sectionHead}>
        <div className={styleSecao.sectionIcon}>
          <RiContractLine />
        </div>
        <div>
          <h6>Certificados</h6>
          <p>Imagem de fundo e texto de cada tipo de certificado emitido neste evento.</p>
        </div>
      </div>

      <div className={styleSecao.sectionGrid}>
        <div className={styles.certificados}>
          {certificados.map((item) => (
            <div
              key={item.id}
              className={styles.certificado}
              onClick={() => openModalAndSetData(item)}
            >
              <div className={styles.certificadoImg}>
                {item.imagemFundo ? (
                  <Image
                    src={item.imagemFundo}
                    alt={`Certificado ${item.tipo}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <RiImageAddLine />
                )}
              </div>
              <div className={styles.descricao}>
                <p>
                  {DESCRICAO_POR_TIPO[item.tipo] || "Certificado de Menção Honrosa"}
                  {temVersaoIngles(item) && <span className={styles.badgeIngles}>EN</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        <div className={`${styles.icon} mb-2`}>{<RiMedalLine />}</div>
        <h4>{TITULO_POR_TIPO[tipoCertificado] || "Menção Honrosa"}</h4>

        <div className={styles.abas}>
          {IDIOMAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              className={`${styles.aba} ${idioma === aba.id ? styles.abaAtiva : ""}`}
              onClick={() => {
                setIdioma(aba.id);
                setError("");
                setErrorTexto("");
              }}
            >
              {aba.label}
            </button>
          ))}
        </div>
        {idioma === "en" && (
          <p className={`${styles.avisoIdioma} mt-2`}>
            Versão opcional. Com imagem e texto preenchidos, aparece o botão
            &quot;Baixar em inglês&quot; para quem tem este certificado (mesmo
            código de autenticação). Use uma imagem de fundo com título e cargos
            em inglês. Título do trabalho e categoria saem como cadastrados; área
            e grande área são traduzidas automaticamente.
          </p>
        )}

        <div className={`${styles.bgCertificado} mt-2`} onClick={handleDivClick}>
          <div className={styles.certificadoImg}>
            {imagemAtual ? (
              <Image
                priority
                fill
                src={imagemAtual}
                alt={`Certificado ${selectedCertificado.tipo}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <RiImageAddLine />
            )}
          </div>
          {imagemAtual && (
            <div
              className={styles.certificadoTextoOverlay}
              style={{
                left: `${((selectedCertificado?.posicaoTextoX ?? 50) / CERTIFICADO_LARGURA) * 100}%`,
                top: `${((selectedCertificado?.posicaoTextoY ?? 50) / CERTIFICADO_ALTURA) * 100}%`,
                width: `calc(100% - ${(((selectedCertificado?.posicaoTextoX ?? 50) / CERTIFICADO_LARGURA) * 100 * 2).toFixed(2)}%)`,
              }}
            >
              {resolverTextoPreview(textoCertificado, tipoCertificado, evento, {}, idioma)}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".jpg,.jpeg,.png,.svg"
            onChange={handleFileChange}
          />
        </div>
        {imagemAtual && (
          <p className={styles.previewLabel}>
            Prévia com dados de exemplo (nome/período do evento são reais) —
            clique na imagem pra trocar o fundo
          </p>
        )}
        {isUploading && <p className={styles.uploading}>Enviando arquivo...</p>}
        {error && <p className={styleSecao.statusErro}>{error}</p>}

        <div className={`${styleTextarea.textareaLabel} mt-3`}>
          <p>
            {idioma === "en" ? "Texto do certificado em inglês" : "Texto do certificado"}&nbsp;
            ({textoCertificado.length}/{TEXTO_MAX_LENGTH})
          </p>
          <textarea
            className={styleTextarea.textarea}
            value={textoCertificado}
            maxLength={TEXTO_MAX_LENGTH}
            onChange={(e) => setTextoCertificado(e.target.value)}
            placeholder={
              idioma === "en"
                ? "Ex.: We certify that <<[autores]>> presented the work <<[tituloResumo]>>... Os campos abaixo funcionam igual ao português."
                : "Texto exibido no certificado. Use os campos abaixo para inserir dados que variam por pessoa/edição."
            }
          />
        </div>

        <div className={`${styles.campos} mt-1`}>
          {[...(CAMPOS_POR_TIPO[tipoCertificado] || []), ...CAMPOS_COMUNS].map(
            (campo) => (
              <button
                key={campo.key}
                type="button"
                className={styles.campoChip}
                onClick={() => handleInserirCampo(campo.key)}
              >
                + {campo.label}
              </button>
            )
          )}
        </div>

        <div className={`${styles.btnSalvarTexto} mt-2`}>
          <Button
            className="btn-secondary"
            type="button"
            onClick={handleSalvarTexto}
            disabled={isSavingTexto}
          >
            {isSavingTexto ? "Salvando..." : idioma === "en" ? "Salvar texto em inglês" : "Salvar texto"}
          </Button>
        </div>
        {errorTexto && <p className={styleSecao.statusErro}>{errorTexto}</p>}
      </Modal>
    </section>
  );
};

export default FormCertificados;
