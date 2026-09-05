"use client";
import {
  RiAddCircleLine,
  RiAlarmLine,
  RiAlertLine,
  RiArticleLine,
  RiCalendarLine,
  RiEditLine,
  RiFileCheckLine,
  RiGroupLine,
  RiMapPinLine,
  RiMedalLine,
  RiMenLine,
  RiMenuLine,
  RiPercentLine,
  RiPresentationLine,
  RiQuillPenLine,
  RiRobot2Line,
  RiShieldStarFill,
  RiSpeedUpLine,
  RiStarLine,
  RiSurveyLine,
  RiThumbDownLine,
  RiTimeLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { getSubsessaoById } from "@/app/api/client/subsessoes";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalSubmissaoAdmin from "@/components/ModalSubmissaoAdmin";

import BuscadorBack from "@/components/BuscadorBack";
import {
  vincularSubmissao,
  gerarSquareParaSubsessao,
} from "@/app/api/client/square";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const [itens, setItens] = useState(null);
  const [subsessao, setSubsessao] = useState(null);
  const [subsessaoFiltered, setSubsessaoFiltered] = useState(null);
  const [searchValue, setSearchValue] = useState(""); // Para armazenar o valor de busca
  const [squareSelected, setSquareSelected] = useState(null);
  const [submissaoSelected, setSubmissaoSelected] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(null);
  const [isModalOpenSubmissao, setIsModalOpenSubmissao] = useState(null);
  const [isUpdated, setIsUpdated] = useState(false);

  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingAlocacao, setLoadingAlocacao] = useState(false);
  const [loadingGerarPoster, setLoadingGerarPoster] = useState(false);

  // ROTEAMENTO
  const router = useRouter();
  const toast = useRef(null);

  const showSuccess = (message) => {
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: message,
      life: 3000,
    });
  };

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  // Função de busca dos dados ao renderizar o componente
  const fetchData = async (eventoSlug, idSubsessao, filters = {}) => {
    setLoading(true); // Define o estado de carregamento como verdadeiro
    try {
      const subsessao = await getSubsessaoById(
        eventoSlug,
        idSubsessao,
        filters
      );
      // Ordena os items dentro de subsessao.Square pelo campo "numero" de forma crescente
      subsessao.Square.sort((a, b) => a.numero - b.numero);
      setSubsessao(subsessao);
      const subsessaoFiltered = subsessao.Submissao;
      setSubsessaoFiltered(subsessaoFiltered);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false); // Define o estado de carregamento como falso ao finalizar
    }
  };
  // Função que será passada para o modal, responsável por atualizar os dados
  const onDataUpdated = async () => {
    await fetchData(params.eventoSlug, params.idSubsessao);
  };
  useEffect(() => {
    fetchData(params.eventoSlug, params.idSubsessao); // Inicializa sem filtros
  }, [params.eventoSlug, params.idSubsessao]);

  // Função para formatar data
  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar hora
  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);
    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");
    return `${horas}h${minutos}`;
  };

  const closeModalAndResetData = async () => {
    if (isUpdated) {
      await fetchData(params.eventoSlug, params.idSubsessao); // Só faz fetch se houver atualização
      setIsUpdated(false); // Reseta o estado após atualizar os dados
    }
    setIsModalOpen(false);
    setIsModalOpenSubmissao(false);
  };

  // Função para lidar com a busca
  const handleSearch = (value) => {
    setSearchValue(value); // Atualiza o valor de busca

    const filteredItems = subsessao.Submissao.filter((item) =>
      item.Resumo.participacoes.some(
        (participacao) =>
          participacao.user.nome &&
          participacao.user.nome.toLowerCase().includes(value.toLowerCase())
      )
    );

    // Atualiza o estado com os itens filtrados
    setSubsessaoFiltered(filteredItems);
  };
  const handleGerarPosters = async () => {
    setLoadingGerarPoster(true);
    try {
      const resultado = await gerarSquareParaSubsessao(
        params.eventoSlug,
        params.idSubsessao
      );
      if (resultado.status === "success") {
        showSuccess(resultado.message);
        await fetchData(params.eventoSlug, params.idSubsessao);
      } else {
        showError("Erro ao gerar pôsteres: " + resultado.message);
      }
    } catch (error) {
      console.error("Erro ao gerar pôsteres:", error);
      showError(
        "Erro ao gerar pôsteres. Verifique o console para mais detalhes."
      );
    } finally {
      setLoadingGerarPoster(false);
    }
  };

  const alocarSubmissao = async (item) => {
    try {
      setLoading(true);

      const updatedSquare = await vincularSubmissao(
        params.eventoSlug,
        item.id, // id da submissão
        squareSelected.id // id do square selecionado
      );

      if (updatedSquare) {
        // Atualiza o estado local sem precisar buscar novamente
        setSubsessao((prevSubsessao) => {
          // Encontra o Square que foi atualizado
          const updatedSquares = prevSubsessao.Square.map((square) => {
            if (square.id === squareSelected.id) {
              return { ...square, submissaoId: item.id, submissao: item };
            }
            return square;
          });

          return { ...prevSubsessao, Square: updatedSquares };
        });

        closeModalAndResetData();
      }
    } catch (error) {
      console.error("Erro ao alocar submissão:", error);
    } finally {
      setLoading(false); // Para o estado de carregamento
    }
  };
  const alocarSubmissoesSequencialmente = async () => {
    setLoadingAlocacao(true);
    setTotal(subsessaoFiltered.length);
    setProgress(0);
    subsessaoFiltered.forEach(async (item, i) => {
      try {
        const updatedSquare = await vincularSubmissao(
          params.eventoSlug,
          item.id, // id da submissão
          squareSelected.id + i // id do square selecionado
        );

        if (updatedSquare) {
          // Atualiza o estado local sem precisar buscar novamente
          setSubsessao((prevSubsessao) => {
            // Encontra o Square que foi atualizado
            const updatedSquares = prevSubsessao.Square.map((square) => {
              if (square.id === squareSelected.id) {
                return { ...square, submissaoId: item.id, submissao: item };
              }
              return square;
            });

            return { ...prevSubsessao, Square: updatedSquares };
          });
        }
      } catch (error) {
        console.error("Erro ao alocar submissão:", error);
      }
      setProgress(i + 1); // Atualiza o progresso
    });

    setLoadingAlocacao(false);
  };
  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiAddCircleLine />
      </div>
      <h4>Inserir Trabalho</h4>
      <div className={`${styles.buscador} mb-2`}>
        <BuscadorBack onSearch={handleSearch} />
        {loading && <p className="mt-2">Carregando...</p>}{" "}
        {/* Exibe o indicador de carregamento dentro do modal */}
      </div>
      {!loading && (
        <div className={styles.squares}>
          {false && (
            <Button
              className="btn-secondary mb-2"
              icon={RiRobot2Line}
              type="button"
              disabled={loadingAlocacao}
              onClick={alocarSubmissoesSequencialmente}
            >
              {loading
                ? `Alocando: ${progress} de ${total} (${Math.round(
                    (progress / total) * 100
                  )}%)`
                : "Alocar automaticamente"}
            </Button>
          )}
          {subsessaoFiltered?.map((item) => (
            <div
              key={item.id}
              className={styles.square}
              onClick={() => alocarSubmissao(item)}
            >
              <div className={`${styles.squareContent} m-0`}>
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
                    item?.status === "SELECIONADA"
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
                    {item.Resumo?.area?.area
                      ? item.Resumo?.area?.area
                      : "sem área"}
                    - {getInstituicaoSigla(item)}-{" "}
                    {item.categoria?.toUpperCase()}
                  </p>
                </div>
                <div className={styles.submissaoData}>
                  <h6>{item.Resumo.titulo}</h6>
                  <p className={styles.participacoes}>
                    <strong>Orientadores: </strong>
                    {item.Resumo?.participacoes
                      .filter(
                        (item) =>
                          item.cargo === "ORIENTADOR" ||
                          item.cargo === "COORIENTADOR"
                      )
                      .map(
                        (item, i) => `${i > 0 ? ", " : ""}${item.user.nome} `
                      )}
                  </p>
                  <p className={styles.participacoes}>
                    <strong>Alunos: </strong>
                    {item.Resumo?.participacoes
                      .filter(
                        (item) =>
                          item.cargo === "AUTOR" || item.cargo === "COAUTOR"
                      )
                      .map(
                        (item, i) => `${i > 0 ? ", " : ""}${item.user.nome} `
                      )}
                  </p>
                </div>
              </div>
              {(item?.premio ||
                item?.indicacaoPremio ||
                item?.premio ||
                item?.notaFinal) && (
                <div className={styles.premios}>
                  {item?.premio && (
                    <div className={`${styles.squareHeader} `}>
                      <RiShieldStarFill />
                      <p>Premiado</p>
                    </div>
                  )}
                  {item?.indicacaoPremio && (
                    <div className={`${styles.squareHeader} `}>
                      <RiMedalLine />
                      <p>Indicado ao Prêmio</p>
                    </div>
                  )}
                  {item?.mencaoHonrosa && (
                    <div className={`${styles.squareHeader} `}>
                      <RiStarLine />
                      <p>Menção Honrosa</p>
                    </div>
                  )}
                  {item?.notaFinal && (
                    <div className={`${styles.squareHeader} `}>
                      <RiSpeedUpLine />
                      <p>{item?.notaFinal}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );

  const renderModalSubmissao = () => (
    <ModalSubmissaoAdmin
      isOpen={isModalOpenSubmissao}
      onClose={closeModalAndResetData}
      eventoSlug={params.eventoSlug}
      idSubmissao={submissaoSelected?.id}
      onDataUpdated={onDataUpdated} // Passa o callback
    />
  );

  if (loading && !subsessao) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.navContent}>
      <Toast ref={toast} position="top-right" />
      {renderModalContent()}
      {renderModalSubmissao()}

      <div className={styles.pageCard}>
        <section className={styles.pageSection}>
          <div className={styles.sectionHead}>
            <h6>{subsessao?.sessaoApresentacao?.titulo?.toUpperCase()}</h6>
            {subsessao && (
              <p>
                {formatarData(subsessao?.inicio)} - de{" "}
                {formatarHora(subsessao?.inicio)} às{" "}
                {formatarHora(subsessao?.fim)}
              </p>
            )}
          </div>

          {subsessao && (
            <div className={styles.statsGrid}>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiPercentLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>
                    {(subsessao.info.avaliadas / subsessao.info.total).toFixed(
                      2
                    )}
                    % (faltam {subsessao.info.total - subsessao.info.avaliadas})
                  </h6>
                  <p>Avaliados</p>
                </div>
              </div>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiAlarmLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{subsessao.info.distribuidas}</h6>
                  <p>Aguardando Checkin</p>
                </div>
              </div>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiPresentationLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{subsessao.info.aguardando}</h6>
                  <p>Aguardando Avaliação</p>
                </div>
              </div>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiQuillPenLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{subsessao.info.emAvaliacao}</h6>
                  <p>em Avaliação</p>
                </div>
              </div>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiMedalLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{subsessao.info.indicadosPremio}</h6>
                  <p>Indicados ao Prêmio</p>
                </div>
              </div>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiStarLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{subsessao.info.mencaoHonrosa}</h6>
                  <p>Menção Honrosa</p>
                </div>
              </div>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiThumbDownLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{subsessao.info.notasMenores4}</h6>
                  <p>Notas baixas</p>
                </div>
              </div>
              <div className={styles.statTile}>
                <div className={styles.icon}>
                  <RiAlertLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{subsessao.info.submissoesNaoAlocadas}</h6>
                  <p>Trabalhos sem Pôster</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 mb-2">
            <BuscadorBack onSearch={handleSearch} />
          </div>
          <div className={styles.actions}>
            {subsessao?.Square.length < 1 && (
              <Button
                onClick={handleGerarPosters}
                icon={RiMapPinLine}
                className="btn-primary"
                type="button"
                disabled={loadingGerarPoster}
              >
                {loadingGerarPoster
                  ? "Gerando..."
                  : `Gerar ${subsessao?.sessaoApresentacao?.capacidade} Pôsteres`}
              </Button>
            )}
          </div>
          {loading && <p className="mb-2">Carregando...</p>}
          <div className={styles.squares}>
        {subsessaoFiltered?.map((item) => (
          <div key={item.id} className={styles.square}>
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

            <div
              className={styles.squareContent}
              onClick={() => {
                setSubmissaoSelected(item);
                setIsModalOpenSubmissao(true);
              }}
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
                      : item?.status
                  }`}
                >
                  {item?.status === "DISTRIBUIDA" ||
                  item?.status === "SELECIONADA"
                    ? "checkin pendente"
                    : item?.status === "AGUARDANDO_AVALIACAO"
                    ? "aguardando avaliação"
                    : item?.status === "AVALIADA"
                    ? "avaliação concluída"
                    : item?.status === "EM_AVALIACAO"
                    ? "em avaliação"
                    : item?.status === "AUSENTE"
                    ? "ausente"
                    : item?.status}
                </p>
                <p className={styles.area}>
                  {item.Resumo?.area?.area
                    ? item.Resumo?.area?.area
                    : "sem área"}{" "}
                  - {getInstituicaoSigla(item)}-{" "}
                  {item.categoria?.toUpperCase()}
                </p>
              </div>
              <div className={styles.submissaoData}>
                <h6>
                  ID {item.id}: {item.Resumo?.titulo}
                </h6>
                <p className={styles.participacoes}>
                  <strong>Orientadores: </strong>
                  {item.Resumo?.participacoes
                    .filter(
                      (item) =>
                        item.cargo === "ORIENTADOR" ||
                        item.cargo === "COORIENTADOR"
                    )
                    .map((item, i) => `${i > 0 ? ", " : ""}${item.user.nome} `)}
                </p>
                <p className={styles.participacoes}>
                  <strong>Alunos: </strong>
                  {item.Resumo?.participacoes
                    .filter(
                      (item) =>
                        item.cargo === "AUTOR" || item.cargo === "COAUTOR"
                    )
                    .map((item, i) => `${i > 0 ? ", " : ""}${item.user.nome} `)}
                </p>
              </div>
            </div>

            {(item.premio ||
              item.indicacaoPremio ||
              item.premio ||
              item.notaFinal) && (
              <div className={styles.premios}>
                {item.premio && (
                  <div className={`${styles.squareHeader} `}>
                    <RiShieldStarFill />
                    <p>Premiado</p>
                  </div>
                )}
                {item.indicacaoPremio && (
                  <div className={`${styles.squareHeader} `}>
                    <RiMedalLine />
                    <p>Indicado ao Prêmio</p>
                  </div>
                )}
                {item.mencaoHonrosa && (
                  <div className={`${styles.squareHeader} `}>
                    <RiStarLine />
                    <p>Menção Honrosa</p>
                  </div>
                )}
                {item.notaFinal && (
                  <div className={`${styles.squareHeader} `}>
                    <RiSpeedUpLine />
                    <p>
                      <strong>Nota: </strong>
                      {item.notaFinal}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Page;
