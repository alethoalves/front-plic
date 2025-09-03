"use client";
import {
  RiAlertLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiCalendarEventFill,
  RiCheckDoubleLine,
  RiDraftLine,
  RiEditLine,
  RiFolder2Line,
  RiFoldersLine,
  RiGroupLine,
  RiMenuLine,
  RiSurveyLine,
  RiUser2Line,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import {
  getRegistroAtividadesByCPF,
  getRegistroAtividadesByCpfEditaisVigentes,
  updateRegistroAtividade,
} from "@/app/api/client/registroAtividade";
import Campo from "@/components/Campo";
import { startSubmission } from "@/app/api/client/resposta";
import FormArea from "@/components/Formularios/FormArea";
import NoData from "@/components/NoData";
import { getEditais, getEditaisByUser } from "@/app/api/client/edital";
import { formatarData } from "@/lib/formatarDatas";
import FluxoInscricaoEdital from "@/components/FluxoInscricaoEdital";
import {
  createInscricaoByUser,
  getInscricoesByUser,
  getMinhasInscricoes,
} from "@/app/api/client/inscricao";
import Link from "next/link";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);

  const [inscricaoSelected, setInscricaoSelected] = useState(null);
  const [errorMessages, setErrorMessages] = useState({}); // Alterado para armazenar erros por edital

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const editais = await getEditais(params.tenant);
        setEditais(editais);
        const minhasInscricoes = await getMinhasInscricoes(params.tenant);
        setInscricoes(minhasInscricoes);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setInscricaoSelected(null);
  };

  const renderModalContent = () => {
    return (
      <Modal size="large" isOpen={isModalOpen} onClose={closeModalAndResetData}>
        <FluxoInscricaoEdital
          tenant={params.tenant}
          inscricaoSelected={inscricaoSelected}
        />
      </Modal>
    );
  };

  const createNewInscricao = async (editalId) => {
    setLoading(true);
    setErrorMessages((prev) => ({ ...prev, [editalId]: "" })); // Limpar erro anterior para o edital específico

    try {
      // Chamada à API para criar a inscrição
      const response = await createInscricaoByUser(params.tenant, { editalId });

      if (response) {
        // Atualiza a listagem de inscrições
        const minhasInscricoes = await getMinhasInscricoes(params.tenant);
        setInscricoes(minhasInscricoes);
      }
    } catch (error) {
      console.error("Error:", error);

      // Configura a mensagem de erro para o edital específico
      setErrorMessages((prev) => ({
        ...prev,
        [editalId]:
          error.response?.data?.message ?? "Erro na conexão com o servidor.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const openModalAndSetData = async (data) => {
    setInscricaoSelected(data);
    setIsModalOpen(true);
  };

  return (
    <>
      {renderModalContent()}
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h4>Editais</h4>
            <p className="mt-1">Inscreva-se nos editais abaixo.</p>
          </div>
          {editais?.length > 0 ? (
            <>
              <div className={styles.editais}>
                {editais.map((item) => {
                  const hoje = new Date();
                  const inicio = item.inicioInscricao
                    ? new Date(item.inicioInscricao)
                    : null;
                  const fim = item.fimInscricao
                    ? new Date(item.fimInscricao)
                    : null;

                  let statusMensagem = "";
                  let statusClasse = ""; // Classe CSS condicional
                  if (inicio && fim) {
                    if (hoje < inicio) {
                      statusMensagem = "Inscrições em breve";
                      statusClasse = styles.statusWarning; // Classe para inscrições em breve
                    } else if (hoje > fim) {
                      statusMensagem = "Inscrições encerradas";
                      statusClasse = styles.statusError; // Classe para inscrições encerradas
                    } else {
                      statusMensagem = "Inscrições abertas";
                    }
                  }

                  return (
                    <div key={item.id} className={styles.edital}>
                      <h6>
                        {item.ano} - {item.titulo}
                      </h6>
                      {inicio && fim ? (
                        <>
                          <p>Período de inscrição:</p>
                          <p>
                            <strong>
                              de {formatarData(item.inicioInscricao)}
                            </strong>{" "}
                            a <strong>{formatarData(item.fimInscricao)}</strong>
                          </p>
                        </>
                      ) : (
                        <p>Período de inscrição não disponível.</p>
                      )}
                      {statusMensagem &&
                        statusMensagem !== "Inscrições abertas" && (
                          <div
                            className={`${styles.statusMensagem} ${statusClasse} mt-1`}
                          >
                            <p>{statusMensagem}</p>
                          </div>
                        )}
                      {statusMensagem === "Inscrições abertas" &&
                        inscricoes.filter(
                          (inscricao) => inscricao.edital.id === item.id
                        ).length === 0 && (
                          <Button
                            className="btn-secondary mt-2"
                            icon={RiSurveyLine}
                            type="button"
                            disabled={loading}
                            onClick={() => createNewInscricao(item.id)}
                          >
                            {loading && "Aguarde..."}
                            {!loading && "Fazer inscrição"}
                          </Button>
                        )}
                      {inscricoes.filter(
                        (inscricao) => inscricao.edital.id === item.id
                      ).length > 0 && (
                        <div className={`${styles.minhasInscricoes}`}>
                          <h6>Minhas Inscrições</h6>
                          {inscricoes
                            .filter(
                              (inscricao) => inscricao.edital.id === item.id
                            )
                            .map((inscricaoFiltered) => {
                              let href;
                              if (inscricaoFiltered.status === "pendente") {
                                href = `/${params.tenant}/user/editais/inscricoes/${inscricaoFiltered.id}`;
                              } else {
                                href = `/${params.tenant}/user/editais/inscricoes/${inscricaoFiltered.id}/acompanhamento`;
                              }

                              return (
                                <Link
                                  className={styles.itens}
                                  key={inscricaoFiltered.id}
                                  href={href}
                                >
                                  <div
                                    key={inscricaoFiltered.id}
                                    className={`${styles.inscricaoItem}`}
                                  >
                                    <p>Inscrição nº {inscricaoFiltered.id}</p>
                                    <div className={styles.rightSide}>
                                      {inscricaoFiltered.status ===
                                        "pendente" && (
                                        <p
                                          className={`${styles.status} ${styles.statusError}`}
                                        >
                                          {inscricaoFiltered.status}
                                        </p>
                                      )}
                                      <RiArrowRightSLine />
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                        </div>
                      )}
                      {errorMessages[item.id] && ( // Mostrar erro apenas no edital correspondente
                        <div className={`${styles.errorMsg} `}>
                          <p>{errorMessages[item.id]}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <NoData description="Não há editais cadastrados." />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
