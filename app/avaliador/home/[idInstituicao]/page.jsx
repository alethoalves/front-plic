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
      const data = await getSubmissoesSemAvaliacao(params.idInstituicao);
      setSubmissoes(data);
      setFilteredSubmissoes(data.submissoesData); // Inicializa com todas as submissões
      const submissaoEmAvaliacao = await getSubmissoesEmAvaliacao(
        params.idInstituicao
      );
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
        const areaNome =
          item.planoDeTrabalho?.area?.area || "Área não definida";
        return updatedSelectedAreas.includes(areaNome);
      });
      console.log(filtered);
      setFilteredSubmissoes(filtered);
    }
  };

  // Função para tratar o clique na submissão
  const handleClickOnSquare = async (eventoId, idSubmissao) => {
    setError({}); // Limpa qualquer erro anterior
    setLoadingSubmissao((prevLoading) => ({
      ...prevLoading,
      [idSubmissao]: true, // Define o estado de carregamento para esta submissão
    }));

    try {
      const updatedSubmissao = await associarAvaliadorSubmissao(
        eventoId,
        idSubmissao
      );
      if (updatedSubmissao) {
        // Remove a submissão da lista de submissões que aguardam avaliação
        setFilteredSubmissoes((prevSubmissoes) =>
          prevSubmissoes.filter((submissao) => submissao.id !== idSubmissao)
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
      }
    } catch (err) {
      // Define o erro para a submissão específica
      setError((prevErrors) => ({
        ...prevErrors,
        [idSubmissao]:
          err.response?.data?.error || "Erro ao associar submissão",
      }));
    } finally {
      setLoadingSubmissao((prevLoading) => ({
        ...prevLoading,
        [idSubmissao]: false, // Remove o estado de carregamento para esta submissão
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
      const updatedSubmissao = await desvincularAvaliadorSubmissao(
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
  const handleLerResumo = async (eventoId, submissaoId, tenantId) => {
    // Define o estado de carregamento do resumo para esta submissão
    setLoadingResumo((prevLoading) => ({
      ...prevLoading,
      [submissaoId]: true, // Define o carregamento para a submissão específica
    }));

    try {
      const resumo = await getResumo(eventoId, submissaoId, tenantId);

      // Define os parâmetros e abre o modal após a busca ser concluída com sucesso
      if (resumo) {
        setModalParams({ eventoId, submissaoId, tenantId, resumo });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Erro ao buscar o resumo:", error);
      // Trate o erro, se necessário
    } finally {
      // Remove o estado de carregamento para esta submissão
      setLoadingResumo((prevLoading) => ({
        ...prevLoading,
        [submissaoId]: false, // Define como não carregando mais para esta submissão
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
        <div className={styles.instituicao}>
          <div className={styles.logo}>
            <Image
              priority
              sizes="300 500 700"
              src={`/image/cicdf.png`}
              fill={true}
              alt="logo da instituição"
            />
          </div>
          <div className={styles.descricao}>
            <h5>Congresso de Iniciação Científica da UnB e do DF</h5>
          </div>
        </div>
        {submissoesEmAvaliacao && submissoesEmAvaliacao.length > 0 && (
          <>
            <p className="mb-1">Trabalhos aguardando a sua avaliação</p>
            <div className={styles.squares}>
              {submissoesEmAvaliacao.length > 0 &&
                submissoesEmAvaliacao.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.square} ${styles.squareWarning}`}
                  >
                    {item.square.map((squareItem) => (
                      <div key={squareItem.id} className={styles.squareHeader}>
                        <p>Pôster nº</p>
                        <h6>{squareItem.numero}</h6>
                      </div>
                    ))}
                    {item.square.length == 0 && (
                      <div className={styles.squareHeader}>
                        <p>Pôster nº</p>
                        <h6>-</h6>
                      </div>
                    )}

                    <div className={styles.squareContent}>
                      <div className={styles.info}>
                        <p className={styles.area}>
                          {item?.planoDeTrabalho?.area?.area || "sem área"} -{" "}
                          {item?.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}{" "}
                          -{" "}
                          {item?.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                        </p>
                      </div>
                      <div className={styles.submissaoData}>
                        <h6>{item?.planoDeTrabalho?.titulo}</h6>
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
                            handleDesvincularAvaliador(
                              item.planoDeTrabalho?.inscricao?.edital?.eventoId,
                              item.id
                            )
                          }
                        >
                          <RiDeleteBinLine />
                          <p>
                            {loadingDevolver[item.id]
                              ? "Devolvendo..."
                              : "Devolver"}
                          </p>
                        </div>

                        <div
                          className={`${styles.squareHeader} ${styles.action}`}
                          onClick={() =>
                            handleLerResumo(
                              params.idInstituicao,
                              item.id,
                              item.planoDeTrabalho?.inscricao?.edital?.tenant
                                ?.id
                            )
                          }
                        >
                          <RiFileList3Line />
                          <p>
                            {loadingResumo[item.id]
                              ? "Buscando resumo..."
                              : "Ler Resumo"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`${styles.squareHeader}  ${styles.action} ${styles.actionPrimary}`}
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

        <p>Filtre por área</p>

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
        <p className="mb-1">Selecione um trabalho para avaliar</p>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className={styles.squares}>
            {filteredSubmissoes.length > 0 ? (
              filteredSubmissoes.map((item, index) => (
                <div
                  key={index}
                  className={styles.square}
                  onClick={() =>
                    handleClickOnSquare(
                      item.planoDeTrabalho?.inscricao?.edital?.eventoId,
                      item.id
                    )
                  } // Chama a função ao clicar na submissão
                >
                  {item.square.map((squareItem) => (
                    <div key={squareItem.id} className={styles.squareHeader}>
                      <p>Pôster nº</p>
                      <h6>{squareItem.numero}</h6>
                    </div>
                  ))}

                  <div className={styles.squareContent}>
                    <div className={styles.info}>
                      <p className={styles.area}>
                        {item?.planoDeTrabalho?.area?.area || "sem área"} -{" "}
                        {item?.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}{" "}
                        -{" "}
                        {item?.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                      </p>
                    </div>
                    <div className={styles.submissaoData}>
                      <h6>{item?.planoDeTrabalho?.titulo}</h6>
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
