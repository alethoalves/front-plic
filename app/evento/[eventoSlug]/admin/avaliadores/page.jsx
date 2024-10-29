"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import BuscadorBack from "@/components/BuscadorBack";
import { consultarAvaliadoresEvento } from "@/app/api/client/avaliadoresEvento";
import { formatarData, formatarHora } from "@/lib/formatarDatas";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const [subsessao, setSubsessao] = useState(null);
  const [avaliadores, setAvaliadores] = useState(null);
  const [avaliadoresOriginais, setAvaliadoresOriginais] = useState(null); // Estado para lista completa de avaliadores
  const [areasDisponiveis, setAreasDisponiveis] = useState([]); // Armazena áreas únicas
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false); // Controle para ocultar/exibir filtros

  const [searchValue, setSearchValue] = useState(""); // Para armazenar o valor de busca

  // ROTEAMENTO
  const router = useRouter();

  // Função de busca dos dados ao renderizar o componente
  const fetchData = async (eventoSlug) => {
    setLoading(true);
    try {
      const avaliadores = await consultarAvaliadoresEvento(eventoSlug);

      // Ordena e configura os estados com a lista completa
      const sortedAvaliadores = avaliadores.sort((a, b) => {
        const subsessaoA =
          a.user.ConviteAvaliadorEvento[0]?.conviteSubsessao[0]
            ?.subsessaoApresentacao.id || 0;
        const subsessaoB =
          b.user.ConviteAvaliadorEvento[0]?.conviteSubsessao[0]
            ?.subsessaoApresentacao.id || 0;

        if (subsessaoA !== subsessaoB) return subsessaoA - subsessaoB;
        return a.user.nome.localeCompare(b.user.nome);
      });

      setAvaliadoresOriginais(sortedAvaliadores); // Mantém a lista original
      setAvaliadores(sortedAvaliadores); // Inicializa a lista filtrável
      setSubsessao(subsessao);

      // Extrai áreas únicas dinamicamente
      const uniqueAreas = Array.from(
        new Set(
          sortedAvaliadores.flatMap((avaliador) =>
            avaliador.user.userArea.map((userArea) => userArea.area.area)
          )
        )
      );
      setAreasDisponiveis(uniqueAreas);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };
  // Função para adicionar/remover uma área selecionada
  const toggleAreaSelection = (areaName) => {
    setAreasSelecionadas((prevSelecionadas) =>
      prevSelecionadas.includes(areaName)
        ? prevSelecionadas.filter((area) => area !== areaName)
        : [...prevSelecionadas, areaName]
    );
  };

  // Atualiza a lista de avaliadores com base nas áreas selecionadas
  useEffect(() => {
    if (areasSelecionadas.length === 0) {
      setAvaliadores(avaliadoresOriginais);
    } else {
      const filteredAvaliadores = avaliadoresOriginais.filter((avaliador) =>
        avaliador.user.userArea.some((userArea) =>
          areasSelecionadas.includes(userArea.area.area)
        )
      );
      setAvaliadores(filteredAvaliadores);
    }
  }, [areasSelecionadas, avaliadoresOriginais]);
  // Função para limpar os filtros
  const clearFilters = () => {
    setAreasSelecionadas([]); // Limpa todas as seleções de áreas
  };
  // Função para alternar a exibição dos filtros
  const toggleMostrarFiltros = () => {
    setMostrarFiltros((prevMostrarFiltros) => !prevMostrarFiltros);
    clearFilters();
  };

  useEffect(() => {
    fetchData(params.eventoSlug, params.idSubsessao); // Inicializa sem filtros
  }, [params.eventoSlug, params.idSubsessao]);

  // Função para lidar com a busca
  const handleSearch = (value) => {
    setSearchValue(value); // Atualiza o valor de busca

    const filteredItems = avaliadoresOriginais.filter(
      (item) =>
        item.user.nome &&
        item.user.nome.toLowerCase().includes(value.toLowerCase())
    );

    setAvaliadores(filteredItems); // Atualiza somente a lista filtrada
  };

  return (
    <div className={styles.navContent}>
      <p>Filtre por área</p>
      {/* Botão para ocultar/exibir filtros */}
      <button
        className="button btn-secondary mt-2"
        onClick={toggleMostrarFiltros}
      >
        {mostrarFiltros ? "Ocultar Filtros" : "Exibir Filtros"}
      </button>
      {/* Renderiza botões de filtro dinamicamente */}
      {mostrarFiltros && (
        <>
          {/* Renderiza botões de filtro dinamicamente */}
          <div className={styles.totais}>
            {areasDisponiveis.map((area, index) => (
              <div
                key={index}
                className={`${styles.total} ${
                  areasSelecionadas.includes(area) ? styles.selected : ""
                } ${styles.light}`}
                onClick={() => toggleAreaSelection(area)}
              >
                <p>
                  {
                    avaliadoresOriginais.filter((avaliador) =>
                      avaliador.user.userArea.some(
                        (userArea) => userArea.area.area === area
                      )
                    ).length
                  }
                </p>
                <h6>{area}</h6>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-2 mb-2">
        <BuscadorBack onSearch={handleSearch} />
      </div>
      <div className={styles.actions}></div>
      {loading && <p className="mb-2">Carregando...</p>}
      <div className={styles.squares}>
        {avaliadores?.map((item) => (
          <>
            <div key={item.id} className={styles.square}>
              <div className={styles.squareContent}>
                <div className={styles.info}>
                  {item.user?.userArea.map((item) => (
                    <p className={styles.area}>{item.area.area}</p>
                  ))}
                </div>
                <div className={styles.submissaoData}>
                  <h6>
                    ID {item.id} - {item.user?.nome}
                  </h6>
                  <p className={styles.participacoes}>
                    <strong>
                      {item.user?.email
                        ? item.user?.email
                        : item.user?.ConviteAvaliadorEvento[
                            item.user.ConviteAvaliadorEvento.length - 1
                          ].email}
                    </strong>
                  </p>
                  <p className={styles.participacoes}>
                    <strong>{item.user?.celular}</strong>
                  </p>
                </div>
              </div>
              {item.user.ConviteAvaliadorEvento.map((item) =>
                item.conviteSubsessao.map((e) => (
                  <div className={styles.squareContent}>
                    <div className={styles.submissaoData}>
                      <p className={styles.participacoes}>
                        <strong>
                          {e.subsessaoApresentacao.sessaoApresentacao.titulo}{" "}
                        </strong>
                        {formatarData(e.subsessaoApresentacao?.inicio)} -
                        {formatarHora(e.subsessaoApresentacao?.inicio)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {item.user.ConviteAvaliadorEvento.map(
                (item) =>
                  item.conviteSubsessao.length < 1 && (
                    <div className={styles.squareContent}>
                      <div className={styles.submissaoData}>
                        <p className={styles.participacoes}>
                          <strong>Avaliador não especificou áreas</strong>
                        </p>
                      </div>
                    </div>
                  )
              )}
            </div>
          </>
        ))}
      </div>
    </div>
  );
};

export default Page;
