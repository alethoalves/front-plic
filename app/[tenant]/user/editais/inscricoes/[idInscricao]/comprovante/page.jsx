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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricao, setInscricao] = useState([]);

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
      {inscricao && inscricao.edital && !notFound && !loading && (
        <div className={styles.navContent} id="navContent">
          <div className={styles.content}>
            <div className={styles.header}>
              <h4>Comprovante de inscrição</h4>
            </div>
            <Button
              className="btn-primary mt-2 no-print"
              onClick={() => window.print()}
            >
              Imprimir ou Salvar em pdf
            </Button>
            <div className={styles.detalhesProjeto}>
              {/* Exibe Inscricão */}
              <div className={`${styles.conteudo} ${styles.fadeIn}`}>
                <div className={`${styles.card}`}>
                  <h6 className={`${styles.label}`}>Inscrição</h6>
                  <div className={`${styles.value}`}>
                    <p>ID - {inscricao.id}</p>
                  </div>
                </div>
              </div>
              {/* Exibe Edital */}
              <div className={`${styles.conteudo} ${styles.fadeIn}`}>
                <div className={`${styles.card}`}>
                  <h6 className={`${styles.label}`}>Edital</h6>
                  <div className={`${styles.value}`}>
                    <p>
                      {inscricao.edital.titulo} - {inscricao.edital.ano}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exibe Projetos e seus subcards */}
              {inscricao.InscricaoProjeto.map((item, index) => {
                const planosDoProjeto = inscricao.planosDeTrabalho.filter(
                  (plano) => plano.projetoId === item.projeto.id
                );

                return (
                  <div key={index}>
                    {/* Exibe o Projeto */}
                    <div className={`${styles.conteudo} ${styles.fadeIn}`}>
                      <div className={`${styles.card}`}>
                        <h6 className={`${styles.label}`}>
                          Projeto {index + 1}
                        </h6>
                        <div className={`${styles.value}`}>
                          <p>
                            <strong>Título: </strong>
                            {item.projeto.titulo}
                          </p>
                          <p>
                            <strong>Área: </strong>
                            {item.projeto.area.area}
                          </p>

                          {/* Exibe Conteúdo do Projeto dentro do card pai */}
                          <div
                            className={`${styles.conteudo} ${styles.fadeIn}`}
                          >
                            {item.projeto.Resposta.sort(
                              (a, b) => a.campo.ordem - b.campo.ordem
                            ).map((item) => {
                              // Função para extrair o nome do arquivo da URL
                              const extractFileName = (url) => {
                                const parts = url.split("/");
                                const lastPart = parts[parts.length - 1];
                                return lastPart.split("_")[1] || lastPart; // Remove o timestamp inicial
                              };

                              return (
                                <div className={`${styles.card}`} key={item.id}>
                                  <h6 className={`${styles.label}`}>
                                    {item.campo.label}
                                  </h6>
                                  <div className={`${styles.value}`}>
                                    {["link", "arquivo"].includes(
                                      item.campo.tipo
                                    ) ? (
                                      <a
                                        href={item.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.link}
                                      >
                                        {item.campo.tipo === "arquivo" && "📁 "}
                                        {item.campo.tipo === "link" && "🔗 "}
                                        {extractFileName(item.value)}
                                      </a>
                                    ) : (
                                      <p>{item.value}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Exibe Cronograma do Projeto dentro do card pai */}
                          <div
                            className={`${styles.conteudo} ${styles.fadeIn}`}
                          >
                            <div className={`${styles.card}`}>
                              <h6 className={`${styles.label}`}>
                                Cronograma do projeto
                              </h6>
                              {item.projeto.CronogramaProjeto.sort(
                                (a, b) =>
                                  new Date(a.inicio) - new Date(b.inicio)
                              ).map((atividade, i) => (
                                <div key={i} className={`${styles.value}`}>
                                  <p>
                                    <strong>{atividade.inicio}</strong> a{" "}
                                    <strong>{atividade.fim}</strong> -{" "}
                                    {atividade.atividade}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Exibe Planos de Trabalho dentro do card pai */}
                          {planosDoProjeto.map((plano, planoIndex) => (
                            <div
                              key={planoIndex}
                              className={`${styles.conteudo} ${styles.fadeIn}`}
                            >
                              <div className={`${styles.card}`}>
                                <h6 className={`${styles.label}`}>
                                  Plano de Trabalho {planoIndex + 1}
                                </h6>
                                <div className={`${styles.value}`}>
                                  <p>
                                    <strong>Título: </strong>
                                    {plano.titulo}
                                  </p>
                                  <p>
                                    <strong>Área: </strong>
                                    {plano.area.area}
                                  </p>
                                  <p>
                                    <strong>Aluno(s): </strong>
                                    {plano.participacoes
                                      .map((i) => i.user.nome)
                                      .join(", ")}
                                  </p>
                                  {false && (
                                    <p>
                                      <strong>Conteúdo: </strong>
                                    </p>
                                  )}
                                  {plano.Resposta.sort(
                                    (a, b) => a.campo.ordem - b.campo.ordem
                                  ).map((item) => {
                                    // Função para extrair o nome do arquivo da URL
                                    const extractFileName = (url) => {
                                      const parts = url.split("/");
                                      const lastPart = parts[parts.length - 1];
                                      return lastPart.split("_")[1] || lastPart; // Remove o timestamp inicial
                                    };

                                    return (
                                      <div
                                        className={`${styles.card}`}
                                        key={item.id}
                                      >
                                        <h6 className={`${styles.label}`}>
                                          {item.campo.label}
                                        </h6>
                                        <div className={`${styles.value}`}>
                                          {["link", "arquivo"].includes(
                                            item.campo.tipo
                                          ) ? (
                                            <a
                                              href={item.value}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={styles.link}
                                            >
                                              {item.campo.tipo === "arquivo" &&
                                                "📁 "}
                                              {item.campo.tipo === "link" &&
                                                "🔗 "}
                                              {extractFileName(item.value)}
                                            </a>
                                          ) : (
                                            <p>{item.value}</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Page;
