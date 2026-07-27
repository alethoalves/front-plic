"use client";
import {
  RiAlertLine,
  RiFoldersLine,
  RiFileTextLine,
  RiTimeLine,
  RiAddLine,
  RiArrowLeftLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import formStyles from "@/components/Formularios/Form.module.scss";
import textareaStyles from "@/components/Textarea.module.scss";
import { useEffect, useState } from "react";
import { getMyDocuments } from "@/app/api/client/documentos";
import {
  getEventosParaJustificarAusencia,
  getPlanosParaJustificarAusencia,
  justificarApresentacaoPosEvento,
} from "@/app/api/client/eventos";
import { getCurrentUserId } from "@/lib/headers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

// Único tipo de documento de autoatendimento disponível hoje — quando houver
// mais, vira uma lista de fato consultada no back (ver passo 1 do wizard).
const TIPOS_DOCUMENTO = [
  {
    tipo: "JUSTIFICAR_AUSENCIA_SUBMISSAO",
    label: "Justificar ausência em evento científico",
  },
];

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState(null);
  const [documentosPendentes, setDocumentosPendentes] = useState([]);
  const [documentosAguardandoValidacao, setDocumentosAguardandoValidacao] =
    useState([]);
  const [documentosAssinados, setDocumentosAssinados] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Wizard "Criar documento": 1 = tipo, 2 = evento, 3 = plano, 4 = formulário
  const [isCriarDocumentoOpen, setIsCriarDocumentoOpen] = useState(false);
  const [criarDocStep, setCriarDocStep] = useState(1);
  const [tipoDocumentoSelecionado, setTipoDocumentoSelecionado] = useState(null);
  const [eventosDisponiveis, setEventosDisponiveis] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [textoJustificativa, setTextoJustificativa] = useState("");
  const [arquivoComprovante, setArquivoComprovante] = useState(null);
  const [enviandoDocumento, setEnviandoDocumento] = useState(false);
  const [erroModal, setErroModal] = useState(null);

  // Função para organizar documentos por status
  const organizarDocumentos = (docs) => {
    const pendentes = [];
    const aguardandoValidacao = [];
    const assinados = [];

    docs.forEach((doc) => {
      const todasAssinaturasRealizadas = doc.assinaturas.every(
        (assinatura) => assinatura.dataAssinatura !== null
      );

      if (doc.status === "AGUARDANDO_VALIDACAO") {
        aguardandoValidacao.push(doc);
      } else if (todasAssinaturasRealizadas) {
        assinados.push(doc);
      } else {
        pendentes.push(doc);
      }
    });

    return { pendentes, aguardandoValidacao, assinados };
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return "Não assinado";

    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para obter ícone baseado no status
  const getStatusIcon = (status) => {
    switch (status) {
      case "AGUARDANDO_VALIDACAO":
        return <RiTimeLine className={styles.statusIcon} />;
      case "ACEITO":
        return <RiFileTextLine className={styles.statusIcon} />;
      default:
        return <RiAlertLine className={styles.statusIcon} />;
    }
  };

  // Componente para renderizar a lista de documentos
  const DocumentosList = ({ documentos, titulo, emptyMessage, statusType }) => (
    <div className={styles.documentosSection}>
      <h6 className={styles.sectionTitle}>
        {statusType === "aguardando" && (
          <RiTimeLine className={styles.sectionIcon} />
        )}
        {statusType === "assinados" && (
          <RiFileTextLine className={styles.sectionIcon} />
        )}
        {statusType === "pendentes" && (
          <RiAlertLine className={styles.sectionIcon} />
        )}
        {titulo}
      </h6>

      {documentos.length === 0 ? (
        <div className={styles.emptyState}>
          {statusType === "aguardando" && (
            <RiTimeLine size={48} className={styles.emptyIcon} />
          )}
          {statusType === "assinados" && (
            <RiFileTextLine size={48} className={styles.emptyIcon} />
          )}
          {statusType === "pendentes" && (
            <RiAlertLine size={48} className={styles.emptyIcon} />
          )}
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className={styles.documentosGrid}>
          {documentos.map((doc) => (
            <Link
              key={doc.id}
              href={`/${params.tenant}/user/documentos/${doc.id}`}
              className={styles.documentoCardLink}
            >
              <div className={styles.documentoCard}>
                <div className={styles.documentoCardHeader}>
                  <div className={styles.documentoInfo}>
                    <h6 className={styles.documentoTitulo}>
                      {doc.documentoTemplate.titulo}
                    </h6>
                    <p className={styles.documentoMeta}>
                      Criado em: {formatarData(doc.createdAt)}
                    </p>
                  </div>
                </div>

                <div className={styles.documentoDetails}>
                  {doc.participacao && (
                    <span className={styles.documentoDetail}>
                      Aluno: {doc.participacao.user.nome}
                    </span>
                  )}
                  {doc.inscricaoProjeto && (
                    <span className={styles.documentoDetail}>
                      Projeto: {doc.inscricaoProjeto.projeto.titulo}
                    </span>
                  )}
                </div>

                <div className={styles.documentoFooter}>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[`status-${doc.status.toLowerCase()}`]
                    }`}
                  >
                    {doc.status === "AGUARDANDO_VALIDACAO"
                      ? "Aguardando Validação"
                      : doc.status}
                  </span>
                  <div className={styles.documentoAction}>
                    <RiFileTextLine size={16} />
                    <span>Visualizar</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // Buscar dados
  const carregarDocumentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyDocuments(params.tenant);
      setDocumentos(response);
      const { pendentes, aguardandoValidacao, assinados } =
        organizarDocumentos(response);
      setDocumentosPendentes(pendentes);
      setDocumentosAguardandoValidacao(aguardandoValidacao);
      setDocumentosAssinados(assinados);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setError("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDocumentos();
  }, [params.tenant]);

  const fecharCriarDocumento = () => {
    setIsCriarDocumentoOpen(false);
    setCriarDocStep(1);
    setTipoDocumentoSelecionado(null);
    setEventosDisponiveis([]);
    setEventoSelecionado(null);
    setPlanosDisponiveis([]);
    setPlanoSelecionado(null);
    setTextoJustificativa("");
    setArquivoComprovante(null);
    setErroModal(null);
  };

  const abrirCriarDocumento = () => {
    setIsCriarDocumentoOpen(true);
    setCriarDocStep(1);
  };

  const selecionarTipoDocumento = async (tipo) => {
    setTipoDocumentoSelecionado(tipo);
    setCriarDocStep(2);
    setLoadingEventos(true);
    setErroModal(null);
    try {
      const eventos = await getEventosParaJustificarAusencia(params.tenant);
      setEventosDisponiveis(eventos || []);
    } catch (error) {
      console.error("Erro ao buscar eventos para justificar ausência:", error);
      setErroModal("Erro ao carregar eventos disponíveis. Tente novamente.");
    } finally {
      setLoadingEventos(false);
    }
  };

  const selecionarEvento = async (evento) => {
    setEventoSelecionado(evento);
    setCriarDocStep(3);
    setLoadingPlanos(true);
    setErroModal(null);
    try {
      const { planos } = await getPlanosParaJustificarAusencia(
        params.tenant,
        evento.id
      );
      setPlanosDisponiveis(planos || []);
    } catch (error) {
      console.error("Erro ao buscar planos para justificar ausência:", error);
      setErroModal(
        "Erro ao carregar seus planos de trabalho para este evento. Tente novamente."
      );
    } finally {
      setLoadingPlanos(false);
    }
  };

  const selecionarPlano = (plano) => {
    setPlanoSelecionado(plano);
    setCriarDocStep(4);
  };

  const voltarStepCriarDocumento = () => {
    setErroModal(null);
    if (criarDocStep === 4) {
      setPlanoSelecionado(null);
      setCriarDocStep(3);
    } else if (criarDocStep === 3) {
      setPlanosDisponiveis([]);
      setEventoSelecionado(null);
      setCriarDocStep(2);
    } else if (criarDocStep === 2) {
      setEventosDisponiveis([]);
      setTipoDocumentoSelecionado(null);
      setCriarDocStep(1);
    }
  };

  // Se o usuário logado não é o aluno do plano selecionado, é porque entrou
  // como orientador — nesse caso quem precisa assinar depois é o aluno, não
  // o orientador. O aviso do formulário reflete isso.
  const usuarioEhOrientadorDoPlano =
    !!planoSelecionado &&
    !planoSelecionado.participacoes?.some(
      (p) => p.userId === getCurrentUserId()
    );

  const enviarDocumento = async () => {
    if (!textoJustificativa.trim()) {
      setErroModal("É necessário descrever o motivo da ausência.");
      return;
    }
    setEnviandoDocumento(true);
    setErroModal(null);
    try {
      await justificarApresentacaoPosEvento(
        params.tenant,
        eventoSelecionado.id,
        planoSelecionado.id,
        textoJustificativa,
        arquivoComprovante
      );
      fecharCriarDocumento();
      await carregarDocumentos();
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      setErroModal(
        error.response?.data?.message ||
          "Erro ao enviar documento. Tente novamente."
      );
    } finally {
      setEnviandoDocumento(false);
    }
  };

  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <RiFoldersLine />
            </div>
            <div className={styles.headerContent}>
              <h6>Documentos</h6>
              <p>Gerencie e visualize seus documentos</p>
            </div>
          </div>
          <Button
            icon={RiAddLine}
            className="btn-primary"
            type="button"
            onClick={abrirCriarDocumento}
          >
            Criar documento
          </Button>
        </div>

        <div className={styles.mainContent}>
          {loading && (
            <div className={styles.loading}>
              <RiFileTextLine className={styles.loadingIcon} />
              <p>Carregando documentos...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <RiAlertLine className={styles.errorIcon} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && documentos && (
            <div className={styles.documentosContainer}>
              <DocumentosList
                documentos={documentosPendentes}
                titulo="Documentos Pendentes"
                emptyMessage="Nenhum documento pendente de assinatura"
                statusType="pendentes"
              />

              <DocumentosList
                documentos={documentosAguardandoValidacao}
                titulo="Aguardando Validação"
                emptyMessage="Nenhum documento aguardando validação"
                statusType="aguardando"
              />

              <DocumentosList
                documentos={documentosAssinados}
                titulo="Documentos Assinados"
                emptyMessage="Nenhum documento assinado"
                statusType="assinados"
              />
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isCriarDocumentoOpen} onClose={fecharCriarDocumento}>
        <div className={styles.criarDocumentoModal}>
          {criarDocStep === 1 && (
            <>
              <h5 className="mb-2">Criar documento</h5>
              <p className="mb-2">Selecione o tipo de documento.</p>
              <div className={styles.documentosGrid}>
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <div key={tipo.tipo} className={formStyles.planoImportItem}>
                    <div className={formStyles.planoImportContent}>
                      <h6>{tipo.label}</h6>
                    </div>
                    <div className={formStyles.planoImportAction}>
                      <Button
                        className="btn-primary"
                        type="button"
                        onClick={() => selecionarTipoDocumento(tipo)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {erroModal && (
                <div className="notification notification-error mt-2">
                  <p className="p5">{erroModal}</p>
                </div>
              )}
            </>
          )}

          {criarDocStep === 2 && (
            <>
              <div className={styles.stepHeader}>
                <div
                  className={formStyles.editCancel}
                  onClick={voltarStepCriarDocumento}
                >
                  <RiArrowLeftLine />
                </div>
                <h5>Selecione o evento</h5>
              </div>
              {loadingEventos && <p>Carregando eventos...</p>}
              {!loadingEventos && eventosDisponiveis.length === 0 && (
                <div className={styles.emptyState}>
                  <p>
                    Não há eventos com apresentação obrigatória configurados
                    para justificar.
                  </p>
                </div>
              )}
              {!loadingEventos && eventosDisponiveis.length > 0 && (
                <div className={styles.documentosGrid}>
                  {eventosDisponiveis.map((evento) => (
                    <div key={evento.id} className={formStyles.planoImportItem}>
                      <div className={formStyles.planoImportContent}>
                        <h6>{evento.nomeEvento}</h6>
                        <div className={formStyles.planoImportMeta}>
                          <p className="p5">Edição {evento.edicaoEvento}</p>
                        </div>
                      </div>
                      <div className={formStyles.planoImportAction}>
                        <Button
                          className="btn-primary"
                          type="button"
                          onClick={() => selecionarEvento(evento)}
                        >
                          Selecionar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {erroModal && (
                <div className="notification notification-error mt-2">
                  <p className="p5">{erroModal}</p>
                </div>
              )}
            </>
          )}

          {criarDocStep === 3 && (
            <>
              <div className={styles.stepHeader}>
                <div
                  className={formStyles.editCancel}
                  onClick={voltarStepCriarDocumento}
                >
                  <RiArrowLeftLine />
                </div>
                <h5>Selecione o plano de trabalho</h5>
              </div>
              <p className="mb-2">
                <strong>Evento:</strong> {eventoSelecionado?.nomeEvento}
              </p>
              {loadingPlanos && <p>Carregando planos...</p>}
              {!loadingPlanos && planosDisponiveis.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Nenhum plano de trabalho seu está vinculado a este evento.</p>
                </div>
              )}
              {!loadingPlanos && planosDisponiveis.length > 0 && (
                <div className={styles.documentosGrid}>
                  {planosDisponiveis.map((plano) => (
                    <div key={plano.id} className={formStyles.planoImportItem}>
                      <div className={formStyles.planoImportContent}>
                        <h6>{plano.titulo}</h6>
                        <div className={formStyles.planoImportMeta}>
                          <p className="p5">
                            Aluno: {plano.participacoes?.[0]?.user?.nome ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className={formStyles.planoImportAction}>
                        <Button
                          className="btn-primary"
                          type="button"
                          onClick={() => selecionarPlano(plano)}
                        >
                          Selecionar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {erroModal && (
                <div className="notification notification-error mt-2">
                  <p className="p5">{erroModal}</p>
                </div>
              )}
            </>
          )}

          {criarDocStep === 4 && (
            <>
              <div className={styles.stepHeader}>
                <div
                  className={formStyles.editCancel}
                  onClick={voltarStepCriarDocumento}
                >
                  <RiArrowLeftLine />
                </div>
                <h5>{tipoDocumentoSelecionado?.label}</h5>
              </div>
              <p className="mb-2">
                <strong>Plano:</strong> {planoSelecionado?.titulo}
              </p>
              <p className="mb-1">
                {usuarioEhOrientadorDoPlano
                  ? "A justificativa só é efetivada após a assinatura do aluno do plano de trabalho."
                  : "A justificativa só é efetivada após a assinatura do orientador do plano de trabalho."}
              </p>
              <textarea
                className={`${textareaStyles.textarea} mt-2`}
                rows={4}
                placeholder="Descreva o motivo da ausência"
                value={textoJustificativa}
                onChange={(e) => setTextoJustificativa(e.target.value)}
                disabled={enviandoDocumento}
              />
              <div className="mt-2">
                <label className="p5">Comprovante em PDF (opcional):</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setArquivoComprovante(e.target.files?.[0] || null)
                  }
                  disabled={enviandoDocumento}
                />
              </div>
              {erroModal && (
                <div className="notification notification-error mt-2">
                  <p className="p5">{erroModal}</p>
                </div>
              )}
              <div className="flex justify-content-end gap-2 mt-4">
                <Button
                  className="btn-secondary"
                  type="button"
                  onClick={fecharCriarDocumento}
                  disabled={enviandoDocumento}
                >
                  Cancelar
                </Button>
                <Button
                  className="btn-primary"
                  type="button"
                  onClick={enviarDocumento}
                  disabled={enviandoDocumento}
                >
                  {enviandoDocumento ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Page;
