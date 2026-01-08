"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProgressSpinner } from "primereact/progressspinner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { validarCertificado } from "@/app/api/client/certificado";
import styles from "./page.module.scss";

const CertificateValidationPage = () => {
  const [certificateCode, setCertificateCode] = useState("");
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

  const certificateRef = useRef(null);

  const generatePDF = async () => {
    if (!certificateData?.html) return;

    setPdfLoading(true);

    try {
      // Criar um container temporário fora da tela
      const container = document.createElement("div");
      container.innerHTML = certificateData.html;
      container.style.width = "1123px";
      container.style.height = "794px";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.style.fontFamily = "Arial, sans-serif";
      document.body.appendChild(container);

      // Aguardar um momento para garantir que todas as imagens estão carregadas
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Converter para canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      // Remover o container temporário
      document.body.removeChild(container);

      // Criar PDF
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const pdf = new jsPDF("landscape", "px", [canvasWidth, canvasHeight]);
      const imgData = canvas.toDataURL("image/png", 1.0);

      pdf.addImage(imgData, "PNG", 0, 0, canvasWidth, canvasHeight);

      // Gerar nome do arquivo baseado no tipo de certificado
      const fileName = generateFileName();

      pdf.save(fileName);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setError("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setPdfLoading(false);
    }
  };

  const generateFileName = () => {
    const { certificado, tipo, codigo } = certificateData;
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (tipo) {
      case "submissao":
        const trabalho = certificado?.submissao?.Resumo?.titulo || "trabalho";
        const autores =
          certificado?.submissao?.Resumo?.participacoes
            ?.filter((p) => p.cargo === "AUTOR")
            ?.map((p) => p.user.nome.split(" ")[0])
            ?.join("_") || "autores";
        return `certificado_${trabalho
          .substring(0, 30)
          .replace(/\s+/g, "_")}_${autores}_${codigo}.pdf`;

      case "avaliador":
        const nomeAvaliador = certificado?.user?.nome || "avaliador";
        return `certificado_avaliador_${nomeAvaliador.replace(
          /\s+/g,
          "_"
        )}_${codigo}.pdf`;

      case "planoDeTrabalho":
        const nomeParticipante =
          getPlanoDeTrabalhoParticipantName() || "participante";
        return `certificado_conclusao_${nomeParticipante.replace(
          /\s+/g,
          "_"
        )}_${codigo}.pdf`;

      default:
        return `certificado_${codigo}_${timestamp}.pdf`;
    }
  };

  const getPlanoDeTrabalhoParticipantName = () => {
    const { certificado } = certificateData;

    // Tenta encontrar o nome do aluno nas participações
    if (certificado?.planoDeTrabalho?.inscricao?.participacoes) {
      const participacaoAluno =
        certificado.planoDeTrabalho.inscricao.participacoes.find(
          (p) => p.tipo === "aluno"
        );
      if (participacaoAluno?.user?.nome) {
        return participacaoAluno.user.nome;
      }

      // Se não encontrar aluno, tenta encontrar orientador
      const participacaoOrientador =
        certificado.planoDeTrabalho.inscricao.participacoes.find(
          (p) => p.tipo === "orientador"
        );
      if (participacaoOrientador?.user?.nome) {
        return participacaoOrientador.user.nome;
      }
    }

    return null;
  };

  const handleValidation = async (e) => {
    e.preventDefault();

    if (!certificateCode.trim()) {
      setError("Por favor, insira um código de autenticação");
      return;
    }

    setLoading(true);
    setError("");
    setCertificateData(null);
    setValidationStatus("idle");

    try {
      // Chamada real para a API
      const result = await validarCertificado(certificateCode);

      // Verificar se a API retornou sucesso
      if (result.status === "success") {
        setCertificateData(result);
        setValidationStatus("valid");
      } else {
        setError("Certificado não encontrado ou inválido");
        setValidationStatus("invalid");
      }
    } catch (err) {
      setError("Erro ao validar certificado. Tente novamente.");
      setValidationStatus("error");
      console.error("Erro na validação:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCertificateCode("");
    setCertificateData(null);
    setError("");
    setValidationStatus("idle");
  };

  // Componente para exibir as ações do certificado
  const CertificateActions = ({ data }) => {
    if (!data) return null;

    return (
      <div className={styles.certificateActions}>
        <button
          onClick={generatePDF}
          disabled={pdfLoading}
          className={styles.pdfButton}
        >
          {pdfLoading ? (
            <>
              <ProgressSpinner
                style={{
                  width: "16px",
                  height: "16px",
                  marginRight: "8px",
                }}
                strokeWidth="4"
                animationDuration=".5s"
              />
              Gerando PDF...
            </>
          ) : (
            <>
              <i className="pi pi-file-pdf" style={{ marginRight: "8px" }} />
              Baixar como PDF
            </>
          )}
        </button>

        <div className={styles.verificationInfo}>
          <p>
            <strong>Código de verificação:</strong> {data.codigo}
          </p>
          <p className={styles.smallText}>
            Use este código para verificar a autenticidade do certificado
          </p>
        </div>
      </div>
    );
  };

  // Componente para exibir o certificado renderizado
  const CertificateDisplay = ({ data }) => {
    if (!data?.html) return null;

    return (
      <div className={styles.certificateContainer}>
        <div className={styles.certificateHeader}>
          <h3>Certificado Válido</h3>
          <CertificateActions data={data} />
        </div>

        <div className={styles.certificatePreview}>
          <div
            ref={certificateRef}
            dangerouslySetInnerHTML={{ __html: data.html }}
          />
        </div>

        <div className={styles.certificateInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Código:</span>
            <span className={styles.infoValue}>{data.codigo}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Tipo:</span>
            <span className={styles.infoValue}>
              {getCertificateTypeText(data)}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Evento:</span>
            <span className={styles.infoValue}>
              {data.certificado?.evento?.nomeEvento ||
                data.certificado?.submissao?.evento?.nomeEvento ||
                "Não especificado"}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Edição:</span>
            <span className={styles.infoValue}>
              {data.certificado?.evento?.edicaoEvento ||
                data.certificado?.submissao?.evento?.edicaoEvento ||
                ""}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Data de Emissão:</span>
            <span className={styles.infoValue}>
              {new Date(data.certificado?.createdAt).toLocaleDateString(
                "pt-BR"
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getCertificateTypeText = (data) => {
    const tipo = data.tipo || data.certificado?.tipo;

    switch (tipo) {
      case "EXPOSITOR":
        return "Expositor de Trabalho";
      case "AVALIADOR":
        return "Avaliador";
      case "CONCLUSAO":
        return "Conclusão de Plano de Trabalho";
      case "MENCAO":
        return "Menção Honrosa";
      default:
        return tipo || "Certificado";
    }
  };

  // Componente para exibir os dados detalhados da API baseado no tipo
  const CertificateDetails = ({ data }) => {
    if (!data?.certificado) return null;

    const { tipo } = data;
    const apiData = data.certificado;

    switch (tipo) {
      case "submissao":
        return <SubmissaoDetails data={apiData} />;
      case "avaliador":
        return (
          <AvaliadorDetails data={apiData} qntAvaliacoes={data.qntAvaliacoes} />
        );
      case "planoDeTrabalho":
        return <PlanoDeTrabalhoDetails data={apiData} />;
      default:
        return null;
    }
  };

  // Componente para detalhes de submissão
  const SubmissaoDetails = ({ data }) => {
    const resumo = data.submissao?.Resumo;
    const participacoes = resumo?.participacoes || [];
    const autores = participacoes.filter((p) => p.cargo === "AUTOR");
    const orientadores = participacoes.filter((p) => p.cargo === "ORIENTADOR");

    return (
      <div className={styles.apiDetails}>
        <h4>Informações Detalhadas - Certificado de Apresentação</h4>

        <div className={styles.detailsGrid}>
          {resumo && (
            <div className={styles.detailItem}>
              <strong>Trabalho:</strong>
              <span style={{ fontWeight: "bold", color: "#333" }}>
                {resumo.titulo}
              </span>
              <span>Área: {resumo.area?.area}</span>
              <span>Grande Área: {resumo.area?.grandeArea?.grandeArea}</span>
            </div>
          )}

          {autores.length > 0 && (
            <div className={styles.detailItem}>
              <strong>Autores:</strong>
              {autores.map((autor, index) => (
                <span key={index}>
                  <strong>{autor.cargo}:</strong> {autor.user.nome}
                </span>
              ))}
            </div>
          )}

          {orientadores.length > 0 && (
            <div className={styles.detailItem}>
              <strong>Orientadores:</strong>
              {orientadores.map((orientador, index) => (
                <span key={index}>
                  <strong>{orientador.cargo}:</strong> {orientador.user.nome}
                </span>
              ))}
            </div>
          )}

          {data.submissao && (
            <div className={styles.detailItem}>
              <strong>Avaliação:</strong>
              <span>Status: {data.submissao.status}</span>
              <span>Categoria: {data.submissao.categoria}</span>
              <span>Nota Final: {data.submissao.notaFinal}</span>
              <span>
                Menção Honrosa: {data.submissao.mencaoHonrosa ? "Sim" : "Não"}
              </span>
            </div>
          )}

          {data.evento && (
            <div className={styles.detailItem}>
              <strong>Evento:</strong>
              <span>{data.evento.nomeEvento}</span>
              <span>Edição: {data.evento.edicaoEvento}</span>
              {data.evento.inicio && (
                <span>
                  Período:{" "}
                  {new Date(data.evento.inicio).toLocaleDateString("pt-BR")} a{" "}
                  {new Date(data.evento.fim).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente para detalhes de avaliador
  const AvaliadorDetails = ({ data, qntAvaliacoes }) => {
    return (
      <div className={styles.apiDetails}>
        <h4>Informações Detalhadas - Certificado de Avaliador</h4>

        <div className={styles.detailsGrid}>
          {data.user && (
            <div className={styles.detailItem}>
              <strong>Avaliador:</strong>
              <span style={{ fontWeight: "bold", color: "#333" }}>
                {data.user.nome}
              </span>
            </div>
          )}

          {qntAvaliacoes && (
            <div className={styles.detailItem}>
              <strong>Atuação como Avaliador:</strong>
              <span>Quantidade de Avaliações: {qntAvaliacoes}</span>
            </div>
          )}

          {data.evento && (
            <div className={styles.detailItem}>
              <strong>Evento:</strong>
              <span>{data.evento.nomeEvento}</span>
              <span>Edição: {data.evento.edicaoEvento}</span>
            </div>
          )}

          {data.layoutCertificado && (
            <div className={styles.detailItem}>
              <strong>Informações do Certificado:</strong>
              <span>
                Tipo:{" "}
                {data.layoutCertificado.tipo === "planoDeTrabalho"
                  ? "Conclusão"
                  : data.layoutCertificado.tipo}
              </span>
              <span>
                Formato:{" "}
                {data.layoutCertificado.horizontal ? "Horizontal" : "Vertical"}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente para detalhes de plano de trabalho
  const PlanoDeTrabalhoDetails = ({ data }) => {
    const plano = data.planoDeTrabalho;
    const participacoes = plano?.inscricao?.participacoes || [];
    const aluno = participacoes.find((p) => p.tipo === "aluno");
    const orientador = participacoes.find((p) => p.tipo === "orientador");
    const atividades = plano?.registroAtividades || [];

    return (
      <div className={styles.apiDetails}>
        <h4>Informações Detalhadas - Certificado de Conclusão</h4>

        <div className={styles.detailsGrid}>
          {plano && (
            <div className={styles.detailItem}>
              <strong>Plano de Trabalho:</strong>
              <span style={{ fontWeight: "bold", color: "#333" }}>
                {plano.titulo}
              </span>
              <span>Status: {plano.statusClassificacao}</span>
              <span>Nota Plano: {plano.notaPlano}</span>
              <span>Área: {plano.area?.area}</span>
              <span>Grande Área: {plano.area?.grandeArea?.grandeArea}</span>
            </div>
          )}

          {aluno && (
            <div className={styles.detailItem}>
              <strong>Bolsista/Aluno:</strong>
              <span style={{ fontWeight: "bold", color: "#333" }}>
                {aluno.user.nome}
              </span>
              <span>Início: {aluno.inicio || "Não informado"}</span>
              <span>Tipo: {aluno.tipo}</span>
              <span>
                Solicitou Bolsa: {aluno.solicitarBolsa ? "Sim" : "Não"}
              </span>
            </div>
          )}

          {orientador && (
            <div className={styles.detailItem}>
              <strong>Orientador:</strong>
              <span style={{ fontWeight: "bold", color: "#333" }}>
                {orientador.user.nome}
              </span>
              <span>Tipo: {orientador.tipo}</span>
            </div>
          )}

          {atividades.length > 0 && (
            <div className={styles.detailItem}>
              <strong>Atividades Registradas:</strong>
              <span>Total de Atividades: {atividades.length}</span>
              {atividades.slice(0, 3).map((atividade, index) => (
                <span key={index}>
                  Atividade {index + 1}:{" "}
                  {new Date(atividade.createdAt).toLocaleDateString("pt-BR")} -{" "}
                  {atividade.status}
                </span>
              ))}
              {atividades.length > 3 && (
                <span style={{ fontStyle: "italic" }}>
                  ... e mais {atividades.length - 3} atividades
                </span>
              )}
            </div>
          )}

          {data.tenant && (
            <div className={styles.detailItem}>
              <strong>Instituição:</strong>
              <span>{data.tenant.nome}</span>
              <span>Sigla: {data.tenant.sigla}</span>
            </div>
          )}

          {plano?.inscricao?.edital && (
            <div className={styles.detailItem}>
              <strong>Edital:</strong>
              <span>{plano.inscricao.edital.titulo}</span>
              <span>Ano: {plano.inscricao.edital.ano}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoContainer}>
            <h1 className={styles.title}>Validador de Certificados</h1>
            <p className={styles.subtitle}>
              Verifique a autenticidade dos certificados emitidos pela
              plataforma PLIC
            </p>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.validationSection}>
            <div className={styles.validationCard}>
              <form
                onSubmit={handleValidation}
                className={styles.validationForm}
              >
                <div className={styles.inputGroup}>
                  <label
                    htmlFor="certificateCode"
                    className={styles.inputLabel}
                  >
                    Código de Autenticação
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      id="certificateCode"
                      value={certificateCode}
                      onChange={(e) => setCertificateCode(e.target.value)}
                      placeholder="Ex: d8JCqJqW"
                      className={styles.inputField}
                      disabled={loading}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <span className={styles.inputHint}>
                      Insira o código do certificado
                    </span>
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    disabled={loading || !certificateCode.trim()}
                    className={`${styles.validateButton} ${
                      loading ? styles.loading : ""
                    }`}
                  >
                    {loading ? (
                      <>
                        <ProgressSpinner
                          style={{
                            width: "20px",
                            height: "20px",
                            marginRight: "8px",
                          }}
                          strokeWidth="4"
                          animationDuration=".5s"
                        />
                        Validando...
                      </>
                    ) : (
                      "Validar Certificado"
                    )}
                  </button>

                  {certificateData && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className={styles.resetButton}
                    >
                      Nova Consulta
                    </button>
                  )}
                </div>
              </form>

              {validationStatus === "valid" && (
                <div className={`${styles.statusCard} ${styles.valid}`}>
                  <div className={styles.statusIcon}>✓</div>
                  <div className={styles.statusContent}>
                    <h3 className={styles.statusTitle}>
                      Certificado Válido e Autêntico
                    </h3>
                    <p className={styles.statusMessage}>
                      Este certificado foi emitido pela plataforma PLIC e está
                      registrado em nosso sistema.
                    </p>
                  </div>
                </div>
              )}

              {validationStatus === "invalid" && (
                <div className={`${styles.statusCard} ${styles.invalid}`}>
                  <div className={styles.statusIcon}>✗</div>
                  <div className={styles.statusContent}>
                    <h3 className={styles.statusTitle}>Certificado Inválido</h3>
                    <p className={styles.statusMessage}>
                      O código inserido não corresponde a nenhum certificado
                      válido em nosso sistema.
                    </p>
                  </div>
                </div>
              )}

              {error && validationStatus === "error" && (
                <div className={`${styles.statusCard} ${styles.error}`}>
                  <div className={styles.statusIcon}>⚠</div>
                  <div className={styles.statusContent}>
                    <h3 className={styles.statusTitle}>Erro na Validação</h3>
                    <p className={styles.statusMessage}>{error}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {certificateData && validationStatus === "valid" && (
            <section className={styles.resultsSection}>
              {/* Exibir o certificado renderizado */}
              <CertificateDisplay data={certificateData} />

              {/* Mostrar detalhes da API baseado no tipo */}
              <CertificateDetails data={certificateData} />

              <div className={styles.legalInfo}>
                <h4>Informações Importantes</h4>
                <ul>
                  <li>
                    Este certificado é válido somente se autenticado neste
                    sistema
                  </li>
                  <li>
                    A autenticidade pode ser verificada a qualquer momento
                    usando o código acima
                  </li>
                  <li>
                    Para verificar novamente, acesse:
                    www.plic.app.br/autenticacao
                  </li>
                  <li>
                    Em caso de dúvidas, entre em contato: suporte@plic.com.br
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p className={styles.footerText}>
              © {new Date().getFullYear()} PLIC - Plataforma de Certificação
              Digital. Todos os direitos reservados.
            </p>
            <div className={styles.footerLinks}>
              <Link href="/politica-privacidade">Política de Privacidade</Link>
              <Link href="/termos-uso">Termos de Uso</Link>
              <Link href="/contato">Contato</Link>
              <Link href="/ajuda">Ajuda</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default CertificateValidationPage;
