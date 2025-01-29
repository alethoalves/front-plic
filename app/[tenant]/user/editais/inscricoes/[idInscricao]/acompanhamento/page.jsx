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
  getInscricaoUserById,
  getInscricoesByUser,
  getMinhasInscricoes,
} from "@/app/api/client/inscricao";
import Link from "next/link";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricao, setInscricao] = useState();

  const [inscricaoSelected, setInscricaoSelected] = useState(null);
  const [errorMessages, setErrorMessages] = useState({}); // Alterado para armazenar erros por edital
  const [notFound, setNotFound] = useState(false);

  const router = useRouter();

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

  return (
    <>
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
                    <p>A inscrição deve ser finalizada até DD/MM/AAAA</p>
                  ) : (
                    ""
                  )}

                  {inscricao.status === "pendente" && (
                    <div className={styles.btn}>
                      <Link
                        className="button btn-primary mt-2"
                        href={`/${params.tenant}/user/editais/inscricoes/${params.idInscricao}`}
                      >
                        <p>Finalizar inscrição</p>
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
                      <div className={`${styles.btn} mt-2`}>
                        <Link
                          className="button btn-secondary mt-2"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/${params.tenant}/user/editais/inscricoes/${params.idInscricao}/comprovante`}
                        >
                          <p>Ver comprovante</p>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
                    Confira o resultados dos planos de trabalho e participações
                    relacionadas a sua inscrição
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
                          O recurso foi enviado no dia 24/03/2024 às 14:00:04
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Page;
