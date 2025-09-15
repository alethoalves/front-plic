"use client";
import Header from "@/components/Header";
import styles from "./page.module.scss";
import Button from "@/components/Button";
import { useState, useEffect } from "react";
import {
  RiEditLine,
  RiImportLine,
  RiShieldStarFill,
  RiMedalLine,
  RiStarLine,
  RiSpeedUpLine,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import { getSubmissoesSemPage } from "@/app/api/client/submissao";
import { createPageForSubmissao, getAllPages } from "@/app/api/client/pages";

const Page = () => {
  const [loadingPages, setLoadingPages] = useState(false); // Loading para páginas
  const [loadingSubmissoes, setLoadingSubmissoes] = useState(false); // Loading para submissões
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submissoes, setSubmissoes] = useState([]); // Estado para armazenar submissões
  const [pages, setPages] = useState([]); // Estado para armazenar as páginas
  const [processingId, setProcessingId] = useState(null); // Armazena o ID da submissão em processamento

  useEffect(() => {
    fetchAllPages();
  }, []);

  const fetchAllPages = async () => {
    setLoadingPages(true); // Inicia o carregamento das páginas
    try {
      const data = await getAllPages();
      setPages(data);
    } catch (error) {
      console.error("Erro ao buscar páginas:", error);
    } finally {
      setLoadingPages(false); // Finaliza o carregamento das páginas
    }
  };

  const fetchSubmissoes = async () => {
    setLoadingSubmissoes(true); // Inicia o carregamento das submissões
    try {
      const data = await getSubmissoesSemPage();
      setSubmissoes(data);
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
    } finally {
      setLoadingSubmissoes(false); // Finaliza o carregamento das submissões
    }
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setSubmissoes([]); // Limpa as submissões ao fechar o modal
  };

  const openModal = () => {
    setIsModalOpen(true);
    fetchSubmissoes(); // Busca submissões ao abrir o modal
  };

  const handleCreatePage = async (submissao) => {
    setProcessingId(submissao.id); // Define o ID da submissão em processamento
    try {
      await createPageForSubmissao({
        ...submissao,
        titulo: submissao.planoDeTrabalho.titulo,
      });

      // Atualiza as páginas e remove a submissão do estado local
      fetchAllPages();
      setSubmissoes((prev) => prev.filter((item) => item.id !== submissao.id));
    } catch (error) {
      console.error("Erro ao criar página para a submissão:", error);
      alert("Erro ao processar submissão. Tente novamente.");
    } finally {
      setProcessingId(null); // Limpa o estado de processamento
    }
  };

  const renderModalImportSubmissoes = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4 className="mb-1">Submissões</h4>
      <p>As submissões abaixo estão aptas para serem importadas.</p>
      {loadingSubmissoes ? (
        <p className="mt-2">Carregando submissões...</p>
      ) : submissoes.length > 0 ? (
        <div className={styles.squares}>
          {submissoes.map((item) => (
            <div key={item.id} className={styles.square}>
              <div
                onClick={() => handleCreatePage(item)}
                className={`${styles.squareContent} m-0`}
              >
                <div className={styles.info}>
                  <p
                    className={`${styles.status} ${
                      item?.status === "DISTRIBUIDA" ||
                      item?.status === "SELECIONADA"
                        ? styles.error
                        : item?.status === "AGUARDANDO_AVALIACAO"
                        ? styles.warning
                        : item?.status === "AVALIADA"
                        ? styles.success
                        : item?.status === "AUSENTE"
                        ? styles.inativada
                        : styles.success
                    }`}
                  >
                    {item.status === "DISTRIBUIDA" ||
                    item.status === "SELECIONADA"
                      ? "checkin pendente"
                      : item.status === "AGUARDANDO_AVALIACAO"
                      ? "aguardando avaliação"
                      : item.status === "AVALIADA"
                      ? "avaliação concluída"
                      : item.status === "AUSENTE"
                      ? "ausente"
                      : item.status}
                  </p>
                  <p className={styles.area}>
                    {item.planoDeTrabalho?.area?.area
                      ? item.planoDeTrabalho?.area?.area
                      : "sem área"}
                    -{" "}
                    {item.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}
                    -{" "}
                    {item.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                  </p>
                </div>
                <div className={styles.submissoaoData}>
                  <h6>{item.planoDeTrabalho.titulo}</h6>
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
                          `${i > 0 ? ", " : ""}${item.user.nome} (${
                            item.status
                          })`
                      )}
                  </p>
                  <p className={styles.participacoes}>
                    <strong>Alunos: </strong>
                    {item.planoDeTrabalho?.participacoes.map(
                      (item, i) =>
                        `${i > 0 ? ", " : ""}${item.user.nome} (${item.status})`
                    )}
                  </p>
                </div>
                {processingId === item.id && (
                  <div className={styles.processing}>
                    <p>Carregando...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Nenhuma submissão encontrada.</p>
      )}
    </Modal>
  );

  return (
    <main className={styles.main}>
      {renderModalImportSubmissoes()}

      <div className={styles.header}>
        <h1>Publicações</h1>
        <div className={styles.actions}>
          <Button
            className="btn-primary"
            type="button"
            icon={RiImportLine}
            disabled={loadingSubmissoes}
            onClick={openModal}
          >
            Importar
          </Button>
        </div>
      </div>

      <h6 className="mb-2 mt-2">
        Clique para visualizar um esboço da página do seu artigo
      </h6>
      {loadingPages ? (
        <p>Carregando páginas...</p>
      ) : (
        <div className={styles.list}>
          {pages.map((page) => (
            <div key={page.id} className={styles.itemList}>
              <p>
                <strong>{page.titulo}</strong> - Slug: {page.slug}
              </p>
              {page.submissao && (
                <p>
                  Submissão: {page.submissao.id} -{" "}
                  {page.submissao.planoDeTrabalho?.titulo || "Sem título"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Page;
