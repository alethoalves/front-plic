"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import styles from "./page.module.scss";
import { getEventosByTenant } from "@/app/api/client/eventos";
import {
  generateAndDownloadCertificatePDF,
  getUserSubmissions,
} from "@/app/api/client/certificado";
import {
  RiMedalLine,
  RiPresentationFill,
  RiShieldStarFill,
  RiStarLine,
} from "@remixicon/react";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [submissoes, setSubmissoes] = useState([]);
  const [isModalEventoOpen, setIsModalEventoOpen] = useState(false);
  const [loadingCertificate, setLoadingCertificate] = useState(null);

  const router = useRouter();

  // Busca eventos ao carregar o componente
  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true);
      try {
        const eventosData = await getEventosByTenant(params.tenant);
        setEventos(eventosData);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, [params.tenant]);

  // Busca submissões ao abrir o modal
  useEffect(() => {
    const fetchSubmissoes = async () => {
      if (isModalEventoOpen && eventoSelecionado) {
        setLoading(true);
        try {
          const submissoesData = await getUserSubmissions(eventoSelecionado.id);
          setSubmissoes(submissoesData);
        } catch (error) {
          console.error("Erro ao buscar submissões:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSubmissoes();
  }, [isModalEventoOpen, eventoSelecionado]);
  const handleCertificateDownload = async (eventoId, tipo, id) => {
    try {
      setLoadingCertificate(id); // Define o ID do certificado em carregamento
      await generateAndDownloadCertificatePDF(eventoId, tipo, id);
      setLoadingCertificate(null); // Limpa o estado de carregamento após a conclusão
    } catch (error) {
      console.error("Erro ao baixar o certificado:", error);
      setLoadingCertificate(null); // Limpa o estado mesmo em caso de erro
      alert("Erro ao gerar ou baixar o certificado. Tente novamente.");
    }
  };
  const closeModal = () => {
    setIsModalEventoOpen(false);
    setEventoSelecionado(null);
    setSubmissoes([]);
  };

  const renderModalEventoContent = () => {
    return (
      <Modal isOpen={isModalEventoOpen} onClose={closeModal} noPadding={true}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h4>Certificados</h4>
            <p>{eventoSelecionado?.nomeEvento}</p>
          </div>
          <div className={styles.modalContent}>
            {loading ? (
              <p className={styles.squares}>Carregando...</p>
            ) : submissoes?.length > 0 ? (
              <div className={styles.squares}>
                {submissoes?.map((item) => (
                  <div key={item.id} className={styles.square}>
                    <div className={styles.squareContent}>
                      <div className={styles.submissaoData}>
                        <h6>{item.planoDeTrabalho?.titulo}</h6>
                        <p className={styles.participacoes}>
                          <strong>Orientadores: </strong>
                          {item.planoDeTrabalho?.inscricao.participacoes
                            .filter(
                              (item) =>
                                item.tipo === "orientador" ||
                                item.tipo === "coorientador"
                            )
                            .map(
                              (item, i) =>
                                `${i > 0 ? ", " : ""}${item.user.nome} `
                            )}
                        </p>
                        <p className={styles.participacoes}>
                          <strong>Alunos: </strong>
                          {item.planoDeTrabalho?.participacoes.map(
                            (item, i) =>
                              `${i > 0 ? ", " : ""}${item.user.nome} `
                          )}
                        </p>
                      </div>
                    </div>

                    {
                      <div className={styles.premios}>
                        {/* Certificado de Apresentação */}
                        <div
                          className={`${styles.squareHeader} ${
                            loadingCertificate === item.id ? styles.loading : ""
                          }`}
                          onClick={() =>
                            !loadingCertificate &&
                            handleCertificateDownload(
                              eventoSelecionado.id,
                              "EXPOSITOR",
                              item.id
                            )
                          }
                        >
                          <RiPresentationFill />
                          {loadingCertificate === item.id ? (
                            <p>Carregando...</p>
                          ) : (
                            <p>Certificado de apresentação</p>
                          )}
                        </div>

                        {/* Certificado de Premiado */}
                        {item.premio && (
                          <div
                            className={`${styles.squareHeader} ${
                              loadingCertificate === item.id
                                ? styles.loading
                                : ""
                            }`}
                            onClick={() =>
                              !loadingCertificate &&
                              handleCertificateDownload(
                                eventoSelecionado.id,
                                "PREMIADO",
                                item.id
                              )
                            }
                          >
                            <RiShieldStarFill />
                            {loadingCertificate === item.id ? (
                              <p>Carregando...</p>
                            ) : (
                              <p>Certificado de Premiado</p>
                            )}
                          </div>
                        )}

                        {/* Certificado de Indicado ao Prêmio */}
                        {item.indicacaoPremio && (
                          <div
                            className={`${styles.squareHeader} ${
                              loadingCertificate === item.id
                                ? styles.loading
                                : ""
                            }`}
                            onClick={() =>
                              !loadingCertificate &&
                              handleCertificateDownload(
                                eventoSelecionado.id,
                                "INDICADO",
                                item.id
                              )
                            }
                          >
                            <RiMedalLine />
                            {loadingCertificate === item.id ? (
                              <p>Carregando...</p>
                            ) : (
                              <p>Certificado de Indicado ao Prêmio</p>
                            )}
                          </div>
                        )}

                        {/* Certificado de Menção Honrosa */}
                        {item.mencaoHonrosa && (
                          <div
                            className={`${styles.squareHeader} ${
                              loadingCertificate === item.id
                                ? styles.loading
                                : ""
                            }`}
                            onClick={() =>
                              !loadingCertificate &&
                              handleCertificateDownload(
                                eventoSelecionado.id,
                                "MENCAO",
                                item.id
                              )
                            }
                          >
                            <RiStarLine />
                            {loadingCertificate === item.id ? (
                              <p>Carregando...</p>
                            ) : (
                              <p>Certificado de Menção Honrosa</p>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.squares}>Nenhum certificado encontrado</p>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <>
      {renderModalEventoContent()}

      <div className={styles.navContent}>
        {eventos[0] && (
          <div className={styles.content}>
            <div className={styles.header}>
              <h4>Certificados</h4>
              <p className="mt-1">Selecione um evento</p>
            </div>
            <div className={styles.mainContent}>
              <div className={styles.tela1}>
                {eventos
                  ?.filter(
                    (item) =>
                      Array.isArray(item.evento.sessao) &&
                      item.evento.sessao.length > 0
                  )
                  .map((item) => (
                    <div
                      key={`tenant_${item.tenantId}_evento${item.eventoId}`}
                      className={`${styles.evento} ${styles.boxButton}`}
                      onClick={() => {
                        setEventoSelecionado(item.evento); // Mantém o item selecionado
                        setIsModalEventoOpen(true);
                      }}
                    >
                      <h6>{item.evento.nomeEvento}</h6>
                      <p>{`Edição de ${item.evento.edicaoEvento}`}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
