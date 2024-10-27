"use client";
import {
  RiAddCircleLine,
  RiAlarmLine,
  RiAlertLine,
  RiArticleLine,
  RiCalendarLine,
  RiFileCheckLine,
  RiGroupLine,
  RiMapPinLine,
  RiMedalLine,
  RiMenLine,
  RiMenuLine,
  RiPercentLine,
  RiQuillPenLine,
  RiSpeedUpLine,
  RiStarLine,
  RiSurveyLine,
  RiThumbDownLine,
  RiTimeLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSubsessaoById } from "@/app/api/client/subsessoes";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalSubmissaoAdmin from "@/components/ModalSubmissaoAdmin";

import BuscadorBack from "@/components/BuscadorBack";
import { vincularSubmissao } from "@/app/api/client/square";

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

  // ROTEAMENTO
  const router = useRouter();

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
      const subsessaoFiltered = subsessao.Submissao.filter(
        (item) => item.square.length < 1
      );
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
  const handleSearch = async (value) => {
    setSearchValue(value); // Atualiza o valor de busca

    // Cria os filtros com o valor de busca aplicado a nome, cpf, e título
    const filters = {
      nome: value,
      cpf: value,
      titulo: value,
    };

    // Refaz a busca com os filtros aplicados
    fetchData(params.eventoSlug, params.idSubsessao, filters);
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
                      item?.status === "DISTRIBUIDA"
                        ? styles.error
                        : item?.status === "AGUARDANDO_AVALIACAO"
                        ? styles.warning
                        : item?.status === "AVALIADA"
                        ? styles.success
                        : styles.success
                    }`}
                  >
                    {item.status === "DISTRIBUIDA"
                      ? "checkin pendente"
                      : item.status === "AGUARDANDO_AVALIACAO"
                      ? "aguardando avaliação"
                      : item.status === "AVALIADA"
                      ? "avaliação concluída"
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
                <div className={styles.submissaoData}>
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

  return (
    <div className={styles.navContent}>
      {renderModalContent()}
      {renderModalSubmissao()}
      <h6 className="mb-1">
        {subsessao?.sessaoApresentacao?.titulo.toUpperCase()}
      </h6>
      {subsessao && (
        <p>
          {formatarData(subsessao?.inicio)} - de{" "}
          {formatarHora(subsessao?.inicio)} às {formatarHora(subsessao?.fim)}
        </p>
      )}
      {subsessao && (
        <div className={styles.dashboard}>
          <div className={styles.subsessao}>
            <div className={styles.description}>
              <div className={styles.icon}>
                <RiPercentLine />
              </div>
              <div className={styles.infoBoxDescription}>
                <p>Avaliados</p>
                <h6>
                  {(subsessao.info.avaliadas / subsessao.info.total).toFixed(2)}
                  % (faltam {subsessao.info.total - subsessao.info.avaliadas})
                </h6>
              </div>
            </div>
            <div className={styles.description}>
              <div className={styles.icon}>
                <RiAlarmLine />
              </div>
              <div className={styles.infoBoxDescription}>
                <p>Aguardando Checkin</p>
                <h6>{subsessao.info.aguardando}</h6>
              </div>
            </div>
            <div className={styles.description}>
              <div className={styles.icon}>
                <RiQuillPenLine />
              </div>
              <div className={styles.infoBoxDescription}>
                <p>em Avaliação</p>
                <h6>{subsessao.info.emAvaliacao}</h6>
              </div>
            </div>
            <div className={styles.description}>
              <div className={styles.icon}>
                <RiMedalLine />
              </div>
              <div className={styles.infoBoxDescription}>
                <p>Indicados ao Prêmio</p>
                <h6>{subsessao.info.indicadosPremio}</h6>
              </div>
            </div>
            <div className={styles.description}>
              <div className={styles.icon}>
                <RiStarLine />
              </div>
              <div className={styles.infoBoxDescription}>
                <p>Menção Honrosa</p>
                <h6>{subsessao.info.mencaoHonrosa}</h6>
              </div>
            </div>
            <div className={styles.description}>
              <div className={styles.icon}>
                <RiThumbDownLine />
              </div>
              <div className={styles.infoBoxDescription}>
                <p>Notas baixas</p>
                <h6>{subsessao.info.notasMenores4}</h6>
              </div>
            </div>
            <div className={styles.description}>
              <div className={styles.icon}>
                <RiAlertLine />
              </div>
              <div className={styles.infoBoxDescription}>
                <p>Trabalhos sem Pôster</p>
                <h6>{subsessao.info.submissoesNaoAlocadas}</h6>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.actions}>
        {subsessao?.Square.length < 1 && (
          <Button
            onClick={() => {}}
            icon={RiMapPinLine}
            className="btn-primary"
            type="submit"
          >
            Gerar {subsessao?.sessaoApresentacao?.capacidade} Pôsteres
          </Button>
        )}
      </div>
      {loading && <p className="mb-2">Carregando...</p>}
      <div className={styles.squares}>
        {subsessao?.Square.map((item) => (
          <div key={item.id} className={styles.square}>
            <div className={styles.squareHeader}>
              <p>Pôster nº</p>
              <h6>{item.numero}</h6>
            </div>
            {!item.submissaoId ? (
              <div
                onClick={async () => {
                  setSearchValue();
                  setIsModalOpen(true);
                  setSquareSelected(item);
                  await fetchData(params.eventoSlug, params.idSubsessao, {});
                }}
                className={styles.squareContentEmpty}
              >
                <p>Inserir trabalho</p>
              </div>
            ) : (
              <>
                <div
                  className={styles.squareContent}
                  onClick={() => {
                    setSubmissaoSelected(item.submissao);
                    setIsModalOpenSubmissao(true);
                  }}
                >
                  <div className={styles.info}>
                    <p
                      className={`${styles.status} ${
                        item.submissao?.status === "DISTRIBUIDA"
                          ? styles.error
                          : item.submissao?.status === "AGUARDANDO_AVALIACAO"
                          ? styles.warning
                          : item.submissao?.status === "AVALIADA"
                          ? styles.success
                          : styles.success
                      }`}
                    >
                      {item.submissao?.status === "DISTRIBUIDA"
                        ? "checkin pendente"
                        : item.submissao?.status === "AGUARDANDO_AVALIACAO"
                        ? "aguardando avaliação"
                        : item.submissao?.status === "AVALIADA"
                        ? "avaliação concluída"
                        : item.submissao?.status}
                    </p>
                    <p className={styles.area}>
                      {item.submissao?.planoDeTrabalho?.area?.area
                        ? item.submissao?.planoDeTrabalho?.area?.area
                        : "sem área"}{" "}
                      -{" "}
                      {item.submissao?.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}
                      -{" "}
                      {item.submissao?.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{item.submissao?.planoDeTrabalho?.titulo}</h6>
                    <p className={styles.participacoes}>
                      <strong>Orientadores: </strong>
                      {item.submissao?.planoDeTrabalho?.inscricao.participacoes
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
                      {item.submissao?.planoDeTrabalho?.participacoes.map(
                        (item, i) =>
                          `${i > 0 ? ", " : ""}${item.user.nome} (${
                            item.status
                          })`
                      )}
                    </p>
                  </div>
                </div>

                {(item.submissao.premio ||
                  item.submissao.indicacaoPremio ||
                  item.submissao?.premio ||
                  item.submissao?.notaFinal) && (
                  <div className={styles.premios}>
                    {item.submissao.premio && (
                      <div className={`${styles.squareHeader} `}>
                        <RiShieldStarFill />
                        <p>Premiado</p>
                      </div>
                    )}
                    {item.submissao.indicacaoPremio && (
                      <div className={`${styles.squareHeader} `}>
                        <RiMedalLine />
                        <p>Indicado ao Prêmio</p>
                      </div>
                    )}
                    {item.submissao?.mencaoHonrosa && (
                      <div className={`${styles.squareHeader} `}>
                        <RiStarLine />
                        <p>Menção Honrosa</p>
                      </div>
                    )}
                    {item.submissao?.notaFinal && (
                      <div className={`${styles.squareHeader} `}>
                        <RiSpeedUpLine />
                        <p>
                          <stron>Nota: </stron>
                          {item.submissao?.notaFinal}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
