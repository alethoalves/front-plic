"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

import {
  deleteSubmissao,
  getSubmissoesEvento,
  getPendenciasApresentacao,
  justificarApresentacaoPosEvento,
} from "@/app/api/client/eventos";
import NoData from "@/components/NoData";
import {
  RiCalendarLine,
  RiCouponLine,
  RiFlaskLine,
  RiMapPinLine,
} from "@remixicon/react";

const Page = ({ params }) => {
  // Estados para gerenciamento do componente
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEventoOpen, setIsModalEventoOpen] = useState(false);
  const [error, setError] = useState(null);
  const [tela, setTela] = useState(0);
  const [submissao, setSubmissao] = useState([]);
  const [submissoes, setSubmissoes] = useState(null); // Mantém null até que os dados sejam carregados
  const [pendencias, setPendencias] = useState([]);
  const [isModalJustificarOpen, setIsModalJustificarOpen] = useState(false);
  const [alvoJustificativa, setAlvoJustificativa] = useState(null); // { eventoId, planoDeTrabalhoId, titulo }
  const [textoJustificativa, setTextoJustificativa] = useState("");
  const [arquivoJustificativa, setArquivoJustificativa] = useState(null);
  const [enviandoJustificativa, setEnviandoJustificativa] = useState(false);

  // ROTEAMENTO
  const router = useRouter();

  const carregarDados = async () => {
    setLoading(true);

    try {
      const submissoes = await getSubmissoesEvento(params.tenant);
      setSubmissoes(submissoes);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setSubmissoes([]);
    } finally {
      setLoading(false);
    }

    try {
      const pendenciasData = await getPendenciasApresentacao(params.tenant);
      setPendencias(pendenciasData || []);
    } catch (error) {
      console.error("Erro ao buscar pendências de apresentação:", error);
      setPendencias([]);
    }
  };

  // EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    carregarDados();
  }, [params.tenant, isModalOpen]);

  const abrirModalJustificar = (alvo) => {
    setAlvoJustificativa(alvo);
    setTextoJustificativa("");
    setArquivoJustificativa(null);
    setIsModalJustificarOpen(true);
  };

  const enviarJustificativa = async () => {
    if (!textoJustificativa.trim()) {
      setError("É necessário descrever o motivo da ausência.");
      return;
    }

    setEnviandoJustificativa(true);
    setError(null);
    try {
      await justificarApresentacaoPosEvento(
        params.tenant,
        alvoJustificativa.eventoId,
        alvoJustificativa.planoDeTrabalhoId,
        textoJustificativa,
        arquivoJustificativa
      );
      setIsModalJustificarOpen(false);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao enviar justificativa:", error);
      setError(
        error.response?.data?.message ||
          "Erro ao enviar justificativa. Tente novamente."
      );
    } finally {
      setEnviandoJustificativa(false);
    }
  };

  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);
    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");
    return `${horas}h${minutos}`;
  };

  const closeModalAndResetDataModalEvento = () => {
    setIsModalEventoOpen(false);
    setTela(0);
    setLoading(false);
    setError(null);
  };

  // Renderiza o conteúdo do modal
  const renderModalEventoContent = () => {
    return (
      <Modal
        isOpen={isModalEventoOpen}
        onClose={closeModalAndResetDataModalEvento}
        noPadding={true}
      >
        <div className={styles.modal}>
          <div
            className={`${styles.successMsg} ${
              tela === 1 ? styles.modalError : " "
            }`}
          >
            <h3>
              {tela === 0 ? "Inscrição confirmada!" : "Inscrição excluída!"}
            </h3>
            <div className={styles.successMsgContent}>
              <div className={styles.boxButton}>
                <div className={styles.infoBox}>
                  <div className={styles.description}>
                    <div className={styles.infoBoxDescription}>
                      <h6>{submissao?.evento?.nomeEvento}</h6>
                    </div>
                  </div>
                  <div className={styles.description}>
                    <div className={styles.icon}>
                      <RiFlaskLine />
                    </div>
                    <div className={styles.infoBoxDescription}>
                      <p>
                        <strong>Sessão: </strong>
                      </p>
                      <p>{submissao?.subsessao?.sessaoApresentacao?.titulo}</p>
                    </div>
                  </div>
                  <div className={styles.description}>
                    <div className={styles.icon}>
                      <RiCalendarLine />
                    </div>
                    <div className={styles.infoBoxDescription}>
                      <p>
                        <strong>Início: </strong>
                      </p>
                      <p>
                        {formatarData(submissao?.subsessao?.inicio)} -{" "}
                        {formatarHora(submissao?.subsessao?.inicio)}
                      </p>
                      <p className="mt-1">
                        <strong>Fim: </strong>
                      </p>
                      <p>
                        {formatarData(submissao?.subsessao?.fim)} -{" "}
                        {formatarHora(submissao?.subsessao?.fim)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.description}>
                    <div className={styles.icon}>
                      <RiMapPinLine />
                    </div>
                    <div className={styles.infoBoxDescription}>
                      <p>
                        <strong>Local: </strong>
                      </p>
                      <p>{submissao?.subsessao?.local}</p>
                    </div>
                  </div>
                </div>
              </div>
              {error && (
                <div className={`notification notification-error`}>
                  <p className="p5">{error}</p>
                </div>
              )}
              {tela === 0 && (
                <Button
                  className="btn-error"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await deleteSubmissao(
                        params.tenant,
                        submissao.id
                      );
                      const submissoes = await getSubmissoesEvento(
                        params.tenant
                      );
                      setSubmissoes(submissoes);
                      setTela(1);
                    } catch (error) {
                      //setSubmissoes([]);
                      console.error("Erro ao buscar dados:", error);
                      setError(error.response?.data?.message);
                      //setTela(1);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  CANCELAR INSCRIÇÃO
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <>
      {renderModalEventoContent()}

      <div className={styles.navContent}>
        {loading ? (
          <div className={styles.loading}>
            <p>Carregando...</p>
          </div>
        ) : submissoes === null ? ( // Aguarda o carregamento inicial
          <div className={styles.loading}>
            <p>Carregando...</p>
          </div>
        ) : submissoes.length > 0 ? (
          <div className={styles.content}>
            <div className={styles.header}>
              <h4>Inscrições em eventos:</h4>
              <p className="mt-1">
                Os projetos abaixo estão inscritos em eventos.
              </p>
            </div>
            <div className={styles.mainContent}>
              {submissoes.map((item) => (
                <div key={item.id} className={styles.submissao}>
                  <div className={`${styles.submissaoInfo} `}>
                    <div className={styles.icon}>
                      <RiCouponLine />
                    </div>
                    <h6>{item.evento.nomeEvento}</h6>
                    <p>
                      <strong>Projeto inscrito:</strong>
                    </p>
                    <p>{item.planoDeTrabalho.titulo}</p>
                  </div>
                  <div className={styles.submissaoActions}>
                    <div className={styles.status}>
                      <p>
                        {item.status === "DISTRIBUIDA" && "Aguardando Check-in"}
                        {item.status === "AGUARDANDO_AVALIACAO" &&
                          "Aguardando Check-in"}
                        {item.status === "EM_AVALIACAO" && "em Avaliação"}
                        {item.status === "AVALIADA" && "Avaliação realizada"}
                        {item.status === "SELECIONADA" && "Selecionada"}
                        {item.status === "AUSENTE" && "Ausente"}
                        {item.status === "AUSENTE_COM_JUSTIFICATIVA" &&
                          "Ausente (justificativa aceita)"}
                      </p>
                    </div>
                    {item.status === "AUSENTE" && (
                      <Button
                        onClick={() =>
                          abrirModalJustificar({
                            eventoId: item.evento.id,
                            planoDeTrabalhoId: item.planoDeTrabalho.id,
                            titulo: item.planoDeTrabalho.titulo,
                          })
                        }
                        className="btn-link"
                      >
                        Justificar ausência
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setTela(0);
                        setIsModalEventoOpen(true);
                        setSubmissao(item);
                      }}
                      className="btn-link"
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                className="btn-secondary mt-3"
                linkTo={`/${params.tenant}/user/eventos`}
                disabled={loading}
              >
                VER OUTROS EVENTOS
              </Button>
            </div>
          </div>
        ) : (
          <div className={` ${styles.noData} ${styles.margin}`}>
            <NoData description="Você não está inscrito em eventos. Inscreva-se!" />
            <Button
              className="btn-primary mt-3"
              linkTo={`/${params.tenant}/user/eventos`}
              disabled={loading}
            >
              VER EVENTOS DISPONÍVEIS
            </Button>
          </div>
        )}
      </div>

      {pendencias.filter((p) => !p.submissaoStatus).length > 0 && (
        <div className={styles.navContent}>
          <div className={styles.content}>
            <div className={styles.header}>
              <h4>Apresentação em congresso pendente:</h4>
              <p className="mt-1">
                Os projetos abaixo precisam apresentar em um evento
                obrigatório deste edital. Se você não vai submeter um resumo,
                justifique a ausência abaixo.
              </p>
            </div>
            <div className={styles.mainContent}>
              {pendencias
                .filter((p) => !p.submissaoStatus)
                .map((p) => (
                  <div key={`${p.planoDeTrabalho.id}-${p.evento.id}`} className={styles.submissao}>
                    <div className={`${styles.submissaoInfo} `}>
                      <div className={styles.icon}>
                        <RiCouponLine />
                      </div>
                      <h6>{p.evento?.nomeEvento}</h6>
                      <p>
                        <strong>Projeto:</strong>
                      </p>
                      <p>{p.planoDeTrabalho.titulo}</p>
                    </div>
                    <div className={styles.submissaoActions}>
                      <div className={styles.status}>
                        <p>
                          {p.justificativaStatus === "PENDENTE"
                            ? "Justificativa aguardando assinatura"
                            : "Resumo não submetido"}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          abrirModalJustificar({
                            eventoId: p.evento.id,
                            planoDeTrabalhoId: p.planoDeTrabalho.id,
                            titulo: p.planoDeTrabalho.titulo,
                          })
                        }
                        className="btn-link"
                      >
                        {p.justificativaStatus === "PENDENTE"
                          ? "Reenviar justificativa"
                          : "Justificar apresentação"}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalJustificarOpen}
        onClose={() => setIsModalJustificarOpen(false)}
      >
        <div className={styles.modal}>
          <h5 className="mb-3">Justificar ausência</h5>
          <p className="mb-2">
            <strong>Projeto:</strong> {alvoJustificativa?.titulo}
          </p>
          <p className="mb-1">
            A justificativa só é efetivada após a assinatura do orientador do
            plano de trabalho.
          </p>
          <textarea
            className="mt-2 w-full"
            rows={4}
            placeholder="Descreva o motivo da ausência"
            value={textoJustificativa}
            onChange={(e) => setTextoJustificativa(e.target.value)}
          />
          <div className="mt-2">
            <label className="p5">Comprovante em PDF (opcional):</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setArquivoJustificativa(e.target.files?.[0] || null)}
            />
          </div>
          {error && (
            <div className={`notification notification-error mt-2`}>
              <p className="p5">{error}</p>
            </div>
          )}
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              className="btn-secondary"
              onClick={() => setIsModalJustificarOpen(false)}
              disabled={enviandoJustificativa}
            >
              Cancelar
            </Button>
            <Button
              className="btn-primary"
              onClick={enviarJustificativa}
              disabled={enviandoJustificativa}
            >
              {enviandoJustificativa ? "Enviando..." : "Enviar justificativa"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Page;
