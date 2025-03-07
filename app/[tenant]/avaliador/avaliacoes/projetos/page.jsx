"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  associarAvaliadorSubmissao,
  desvincularAvaliadorSubmissao,
  getResumo,
  getSubmissoesEmAvaliacao,
  getSubmissoesSemAvaliacao,
} from "@/app/api/client/submissao"; // Supondo que essa função está na API do client
import {
  Ri24HoursFill,
  RiDeleteBinLine,
  RiEditLine,
  RiFileList3Line,
  RiQuillPenLine,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import {
  associarAvaliadorInscricaoProjeto,
  desassociarAvaliadorInscricaoProjeto,
  getAvaliacoesPendentes,
  getProjetosAguardandoAvaliacao,
  getProjetosEmAvaliacao,
} from "@/app/api/client/avaliador";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState({}); // Erros individuais por submissão
  const [loadingSubmissao, setLoadingSubmissao] = useState({}); // Carregamento individual por submissão
  const [selectedAreas, setSelectedAreas] = useState([]); // Estado para áreas selecionadas (usando nomes)
  const [submissoes, setSubmissoes] = useState({
    submissoesData: [],
    areasPendentesDeAvaliacao: {},
  }); // Estado para submissões e áreas pendentes de avaliação
  const [resumoSubmissao, setResumoSubmissao] = useState({});
  const [submissoesEmAvaliacao, setSubmissoesEmAvaliacao] = useState([]);
  const [filteredSubmissoes, setFilteredSubmissoes] = useState([]); // Submissões filtradas exibidas
  const [loadingResumo, setLoadingResumo] = useState({}); // Estado separado para o carregamento de resumo
  const [loadingDevolver, setLoadingDevolver] = useState({});
  const [modalParams, setModalParams] = useState(null);
  const router = useRouter();

  // Função de busca dos dados ao renderizar o componente
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getProjetosAguardandoAvaliacao(params.tenant);
      setSubmissoes(data);
      setFilteredSubmissoes(data.submissoesData); // Inicializa com todas as submissões
      const submissaoEmAvaliacao = await getProjetosEmAvaliacao(params.tenant);
      setSubmissoesEmAvaliacao(submissaoEmAvaliacao);
      console.log(submissaoEmAvaliacao);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Inicializa sem filtros
  }, []);

  // Função de filtro por área, usando o nome da área
  const handleAreaSelection = (areaName) => {
    const isSelected = selectedAreas.includes(areaName);
    let updatedSelectedAreas;

    if (isSelected) {
      // Remove a área se já estiver selecionada
      updatedSelectedAreas = selectedAreas.filter((name) => name !== areaName);
    } else {
      // Adiciona a área se não estiver selecionada
      updatedSelectedAreas = [...selectedAreas, areaName];
    }

    setSelectedAreas(updatedSelectedAreas);

    if (updatedSelectedAreas.length === 0) {
      // Se nenhuma área for selecionada, mostrar todas as submissões
      setFilteredSubmissoes(submissoes.submissoesData);
    } else {
      // Filtra localmente para submissões das áreas selecionadas
      const filtered = submissoes.submissoesData.filter((item) => {
        const areaNome = item.projeto?.area?.area || "Área não definida";
        return updatedSelectedAreas.includes(areaNome);
      });
      console.log(filtered);
      setFilteredSubmissoes(filtered);
    }
  };

  // Função para tratar o clique na submissão
  const handleClickOnSquare = async (tenant, idInscricaoProjeto) => {
    setError({}); // Limpa qualquer erro anterior
    setLoadingSubmissao((prevLoading) => ({
      ...prevLoading,
      [idInscricaoProjeto]: true, // Define o estado de carregamento para esta submissão
    }));

    try {
      const updatedSubmissao = await associarAvaliadorInscricaoProjeto(
        tenant,
        idInscricaoProjeto
      );
      if (updatedSubmissao) {
        // Remove a submissão da lista de submissões que aguardam avaliação
        setFilteredSubmissoes((prevSubmissoes) =>
          prevSubmissoes.filter(
            (submissao) => submissao.id !== idInscricaoProjeto
          )
        );

        // Adiciona a submissão à lista de submissões em avaliação
        setSubmissoesEmAvaliacao((prevSubmissoes) => [
          ...prevSubmissoes,
          updatedSubmissao, // Assumindo que a submissão atualizada é retornada da função
        ]);
        // Rola a página para o topo
        window.scrollTo({
          top: 0,
          behavior: "smooth", // Opção para rolar suavemente
        });
        //router.push(`/avaliador/home/${params.idInstituicao}/avaliacao/${idSubmissao}/${updatedSubmissao.planoDeTrabalho?.inscricao?.edital?.tenant?.id}`);
      }
    } catch (err) {
      // Define o erro para a submissão específica
      console.log("Aqui");
      console.log(err.response?.data?.message);
      setError((prevErrors) => ({
        ...prevErrors,
        [idInscricaoProjeto]:
          err.response?.data?.message || "Erro ao associar submissão",
      }));
    } finally {
      setLoadingSubmissao((prevLoading) => ({
        ...prevLoading,
        [idInscricaoProjeto]: false, // Remove o estado de carregamento para esta submissão
      }));
    }
  };
  // Função para tratar a desvinculação do avaliador
  const handleDesvincularAvaliador = async (eventoId, idSubmissao) => {
    setError({});
    setLoadingDevolver((prevLoading) => ({
      ...prevLoading,
      [idSubmissao]: true, // Define o carregamento do botão "Devolver"
    }));

    try {
      const updatedSubmissao = await desassociarAvaliadorInscricaoProjeto(
        eventoId,
        idSubmissao
      );
      if (updatedSubmissao) {
        setSubmissoesEmAvaliacao((prevSubmissoes) =>
          prevSubmissoes.filter((submissao) => submissao.id !== idSubmissao)
        );
        setFilteredSubmissoes((prevSubmissoes) => [
          ...prevSubmissoes,
          updatedSubmissao,
        ]);
      }
    } catch (err) {
      setError((prevErrors) => ({
        ...prevErrors,
        [idSubmissao]:
          err.response?.data?.error || "Erro ao desvincular submissão",
      }));
    } finally {
      setLoadingDevolver((prevLoading) => ({
        ...prevLoading,
        [idSubmissao]: false, // Remove o estado de carregamento do botão "Devolver"
      }));
    }
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setModalParams(null); // Limpa os parâmetros quando o modal fecha
  };

  const ModalContent = ({ modalParams, onClose }) => {
    const { resumo } = modalParams; // Resumo já disponível nos parâmetros
    console.log(resumo);
    return (
      <Modal isOpen={true} onClose={onClose}>
        <div className={`${styles.icon} mb-2`}>
          <RiFileList3Line />
        </div>
        <h4>{resumo?.planoDeTrabalho?.titulo}</h4>

        {resumo?.planoDeTrabalho?.registroAtividades &&
          resumo?.planoDeTrabalho?.registroAtividades.length > 0 &&
          (resumo?.planoDeTrabalho?.registroAtividades[0].respostas?.length ===
          0 ? (
            <p>Resumo não enviado</p> // Verifica se respostas é um array vazio
          ) : (
            resumo?.planoDeTrabalho?.registroAtividades[0].respostas?.map(
              (item, i) => {
                if (item.campo.label !== "Colaboradores") {
                  return (
                    <div key={i}>
                      <h6>{item.campo.label}</h6>
                      <p>{item.value}</p>
                    </div>
                  );
                }
              }
            )
          ))}
      </Modal>
    );
  };

  return (
    <>
      {isModalOpen && modalParams && (
        <div className={styles.modal}>
          <ModalContent
            modalParams={modalParams}
            onClose={closeModalAndResetData}
          />
        </div>
      )}
      <div className={styles.navContent}>
        <h6 className="mb-1">Trabalhos aguardando a sua avaliação</h6>
        {submissoesEmAvaliacao && submissoesEmAvaliacao.length > 0 && (
          <>
            <div className={`${styles.squares} ${styles.minhasAvaliacoes}`}>
              {submissoesEmAvaliacao.length > 0 &&
                submissoesEmAvaliacao.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.square}  ${styles.squareWarning}`}
                  >
                    <div className={styles.squareContent}>
                      <div className={styles.info}>
                        <p className={styles.area}>
                          {item?.projeto?.area?.area || "sem área"} -{" "}
                          {item?.projeto?.inscricao?.edital?.tenant?.sigla.toUpperCase()}{" "}
                          - {item?.inscricao?.edital?.titulo.toUpperCase()}
                        </p>
                      </div>
                      <div className={styles.submissaoData}>
                        <h6>{item?.projeto?.titulo}</h6>
                      </div>
                      {error[item.id] && (
                        <div className={styles.error}>
                          <p>{error[item.id]}</p>
                        </div>
                      )}
                    </div>

                    <div className={styles.actions}>
                      <div className={styles.item1}>
                        <div
                          className={`${styles.squareHeader} ${styles.action} ${styles.actionError}`}
                          onClick={() =>
                            handleDesvincularAvaliador(params.tenant, item.id)
                          }
                        >
                          <RiDeleteBinLine />
                          <p>
                            {loadingDevolver[item.id]
                              ? "Devolvendo..."
                              : "Devolver"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`${styles.squareHeader}  ${styles.action} ${styles.actionPrimary}`}
                        onClick={() =>
                          router.push(
                            `/${params.tenant}/avaliador/avaliacoes/projetos/${item.id}`
                          )
                        }
                      >
                        <RiQuillPenLine />
                        <p>Avaliar agora</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
        {(!submissoesEmAvaliacao || submissoesEmAvaliacao.length === 0) && (
          <div className={styles.noData}>
            {loading && <p className="p-4">Carregando...</p>}
            {!loading && (
              <NoData description="Os trabalhos que vocês selecionar para avaliar aparecerão aqui! Avalie um trabalho por vez." />
            )}
          </div>
        )}

        <h6>Filtre por área</h6>

        <div className={styles.totais}>
          {Object.entries(submissoes.areasPendentesDeAvaliacao).map(
            ([areaNome, total], index) => (
              <div
                key={index}
                className={`${styles.total} ${
                  selectedAreas.includes(areaNome) ? styles.selected : ""
                } ${styles.light}`}
                onClick={() => handleAreaSelection(areaNome)} // Usa o nome da área para filtro
              >
                <p>{total}</p>
                <h6>{areaNome}</h6>
              </div>
            )
          )}
        </div>
        <h6 className="mb-1">Selecione um trabalho para avaliar</h6>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className={styles.squares}>
            {filteredSubmissoes.length > 0 ? (
              filteredSubmissoes.map((item, index) => (
                <div
                  key={index}
                  className={styles.square}
                  onClick={() => handleClickOnSquare(params.tenant, item.id)} // Chama a função ao clicar na submissão
                >
                  <div className={styles.squareContent}>
                    <div className={styles.info}>
                      <p className={styles.area}>
                        {item?.projeto?.area?.area || "sem área"} - Edital{" "}
                        {item?.inscricao?.edital?.titulo}
                      </p>
                    </div>
                    {false && (
                      <div className={styles.info}>
                        <p className={styles.area}>
                          Projeto inscrito em {item?.InscricaoProjeto?.length}{" "}
                          edita
                          {item?.InscricaoProjeto?.length > 1 ? "is" : "l"} (
                          {item?.InscricaoProjeto?.map(
                            (insc) =>
                              insc.inscricao?.edital?.titulo &&
                              insc.inscricao.edital.titulo.toUpperCase()
                          )
                            .filter(Boolean)
                            .join(", ")}
                          )
                        </p>
                      </div>
                    )}
                    <div className={styles.submissaoData}>
                      <h6>
                        [ID_{item?.projeto?.id}] {item?.projeto?.titulo}
                      </h6>
                      {loadingSubmissao[item.id] && (
                        <p className={styles.waiting}>
                          Aguarde... Fazendo a vinculação do projeto
                        </p> // Mensagem de carregamento
                      )}
                    </div>
                    {error[item.id] && (
                      <div className={styles.error}>
                        <p>{error[item.id]}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>Nenhuma submissão encontrada</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
