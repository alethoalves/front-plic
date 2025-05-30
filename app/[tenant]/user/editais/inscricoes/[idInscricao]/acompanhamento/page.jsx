"use client";
import {
  RiAlertLine,
  RiCalendarEventFill,
  RiCheckDoubleLine,
  RiCheckLine,
  RiCheckboxCircleLine,
  RiCheckboxLine,
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
import { useCallback, useEffect, useRef, useState } from "react";
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
  getInscricaoUserById,
  getInscricoesByUser,
  getMinhasInscricoes,
  reabrirInscricao,
} from "@/app/api/client/inscricao";
import Link from "next/link";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricao, setInscricao] = useState();

  const [inscricaoSelected, setInscricaoSelected] = useState(null);
  const [errorMessages, setErrorMessages] = useState({}); // Alterado para armazenar erros por edital
  const [notFound, setNotFound] = useState(false);

  const router = useRouter();
  const toastRef = useRef(null); // Toast do PrimeReact

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getInscricaoUserById(
          params.tenant,
          params.idInscricao
        );
        setInscricao(response);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.inscricaoSelected]);
  const handleCancelarInscricao = () => {
    confirmDialog({
      message:
        "Cancelar a inscrição fará com que ela volte para o status PENDENTE. Deseja continuar?",
      header: "Confirmar cancelamento",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoading(true);
          const { inscricao: updated, message } = await reabrirInscricao(
            params.tenant,
            params.idInscricao
          );

          setInscricao((prev) => ({ ...prev, status: updated.status }));
          toastRef.current?.show({
            severity: "success",
            summary: "Sucesso",
            detail: message || "Inscrição reaberta com sucesso!",
          });
        } catch (err) {
          toastRef.current?.show({
            severity: "error",
            summary: "Erro",
            detail:
              err.response?.data?.message ||
              "Erro ao cancelar / reabrir inscrição.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <>
      <Toast ref={toastRef} />
      <ConfirmDialog />
      {notFound && <NoData description="Inscrição não encontrada :/" />}
      {loading && <p>Carregando...</p>}
      {inscricao && !notFound && !loading && (
        <div className={styles.navContent}>
          <div className={styles.content}>
            <div className={styles.header}>
              <h4>Acompanhe a sua inscrição</h4>
              <div className={styles.info}>
                <p>
                  Edital: <strong>{inscricao.edital?.titulo}</strong>
                </p>
                <p>
                  Ano: <strong>{inscricao.edital?.ano}</strong>
                </p>
                <p>
                  Inscrição ID: <strong>{inscricao.id}</strong>
                </p>
              </div>
            </div>
            <div className={styles.acompanhamento}>
              {/* STATUS PENDENTE */}
              <div
                className={`${styles.status} ${
                  inscricao.status === "pendente"
                    ? styles.statusAtual
                    : styles.statusPassado
                }`}
              >
                <div className={styles.left}>
                  <div className={styles.circle}>
                    <RiCheckLine />
                  </div>
                </div>
                <div className={styles.right}>
                  <h6>Inscrição gerada</h6>
                  {inscricao.status === "pendente" ? (
                    <p>{`A inscrição deve ser finalizada até ${formatDateForDisplay(
                      inscricao.edital?.fimInscricao
                    )}`}</p>
                  ) : (
                    ""
                  )}

                  {inscricao.status === "pendente" && (
                    <div className={styles.btn}>
                      <Link
                        className="button btn-primary mt-2"
                        href={`/${params.tenant}/user/editais/inscricoes/${params.idInscricao}`}
                      >
                        <p>Editar e Finalizar inscrição</p>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              {/* STATUS ENVIADA */}
              <div
                className={`${styles.status} ${
                  inscricao.status === "enviada" ? styles.statusAtual : ""
                }`}
              >
                <div className={styles.left}>
                  <div className={styles.circle}>
                    <RiCheckLine />
                  </div>
                </div>
                <div className={styles.right}>
                  <h6>Inscrição enviada</h6>
                  {inscricao.status !== "pendente" && (
                    <>
                      <div className={`${styles.btn} flex gap-1 mt-2`}>
                        <Link
                          className="button btn-secondary"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/${params.tenant}/user/editais/inscricoes/${params.idInscricao}/comprovante`}
                        >
                          <p>Comprovante</p>
                        </Link>
                        <button
                          className="button btn-error"
                          onClick={handleCancelarInscricao}
                          disabled={loading}
                        >
                          <p>
                            {loading ? "Processando…" : "Cancelar inscrição"}
                          </p>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {false && (
                <>
                  <div className={`${styles.status} `}>
                    <div className={styles.left}>
                      <div className={styles.circle}>
                        <RiCheckLine />
                      </div>
                    </div>
                    <div className={styles.right}>
                      <h6>Inscrição em avaliação</h6>
                      <p>Aguarde o processo avaliativo</p>
                    </div>
                  </div>
                  <div className={`${styles.status} `}>
                    <div className={styles.left}>
                      <div className={styles.circle}>
                        <RiCheckLine />
                      </div>
                    </div>
                    <div className={styles.right}>
                      <h6>Inscrição avaliada</h6>
                      <p>
                        Confira o resultados dos planos de trabalho e
                        participações relacionadas a sua inscrição
                      </p>
                      <div className={styles.acompanhamento}>
                        <div className={`${styles.status} `}>
                          <div className={styles.left}>
                            <div className={styles.circle}>
                              <RiCheckLine />
                            </div>
                          </div>
                          <div className={styles.right}>
                            <h6>Recurso gerado</h6>
                            <p>O recurso deve ser enviado até 23/03/2024</p>
                          </div>
                        </div>
                        <div className={`${styles.status} `}>
                          <div className={styles.left}>
                            <div className={styles.circle}>
                              <RiCheckLine />
                            </div>
                          </div>
                          <div className={styles.right}>
                            <h6>Recurso enviado</h6>
                            <p>
                              O recurso foi enviado no dia 24/03/2024 às
                              14:00:04
                            </p>
                          </div>
                        </div>
                        <div className={`${styles.status} `}>
                          <div className={styles.left}>
                            <div className={styles.circle}>
                              <RiCheckLine />
                            </div>
                          </div>
                          <div className={styles.right}>
                            <h6>Recurso em análise</h6>
                            <p>Aguarde o processo avaliativo</p>
                          </div>
                        </div>
                        <div className={`${styles.status} `}>
                          <div className={styles.left}>
                            <div className={styles.circle}>
                              <RiCheckLine />
                            </div>
                          </div>
                          <div className={styles.right}>
                            <h6>Recurso analisado</h6>
                            <p>
                              Confira o resultados dos planos de trabalho e
                              participações relacionadas a sua inscrição
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.status} `}>
                    <div className={styles.left}>
                      <div className={styles.circle}>
                        <RiCheckLine />
                      </div>
                    </div>
                    <div className={styles.right}>
                      <h6>Resultado final</h6>
                      <p>
                        Confira o resultados final dos planos de trabalho e
                        participações relacionadas a sua inscrição
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Page;
