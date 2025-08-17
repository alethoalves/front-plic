"use client";

import Link from "next/link";
import styles from "./publicacoes.module.scss";
import {
  RiArticleLine,
  RiAwardFill,
  RiCalendarEventFill,
  RiMapPinLine,
  RiFilterLine,
  RiGroupLine,
  RiEyeLine,
  RiSearchLine,
} from "@remixicon/react";
import { InscricaoButton } from "@/components/evento/InscricaoButton";
import { Accordion, AccordionTab } from "primereact/accordion";
import NoData from "@/components/NoData";
import { useEffect, useState } from "react";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { getFiltros, getPublicacoes } from "@/app/api/client/eventos";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";
import { formatarData, formatarHora } from "@/lib/formatarDatas";

const formatDate = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

const formatTime = (isoString) => {
  const timePart = isoString.split("T")[1] || "";
  const [hours, minutes] = timePart.split(":");
  return `${hours}:${minutes}`;
};

const formatDateFromISO = (isoString) => {
  const datePart = isoString.split("T")[0];
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}`;
};

export const Publicacoes = ({ eventoRoot, evento, programacao, params }) => {
  const [filtros, setFiltros] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedSubsessoes, setSelectedSubsessoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicacoes, setPublicacoes] = useState([]);
  const [filteredPublicacoes, setFilteredPublicacoes] = useState([]);
  const [loadingPublicacoes, setLoadingPublicacoes] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carrega filtros e publicações em paralelo
        const [dadosFiltros, dadosPublicacoes] = await Promise.all([
          getFiltros(evento.slug),
          getPublicacoes(evento.slug),
        ]);

        setFiltros(dadosFiltros);
        setPublicacoes(dadosPublicacoes);
        setFilteredPublicacoes(dadosPublicacoes);
        setLoading(false);
        setLoadingPublicacoes(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setLoading(false);
        setLoadingPublicacoes(false);
      }
    };

    carregarDados();
  }, [evento.slug]);

  // Função para filtrar as publicações com base nos critérios selecionados
  useEffect(() => {
    const filtrarPublicacoes = () => {
      let resultados = [...publicacoes];

      // Filtro por termo de busca (nome do autor/orientador ou título)
      if (searchTerm) {
        const termo = searchTerm.toLowerCase();
        resultados = resultados.filter((publicacao) => {
          const tituloMatch = publicacao.Resumo.titulo
            .toLowerCase()
            .includes(termo);
          const participantesMatch = publicacao.Resumo.participacoes.some(
            (participacao) =>
              participacao.user.nome.toLowerCase().includes(termo)
          );
          return tituloMatch || participantesMatch;
        });
      }

      // Filtro por áreas selecionadas
      if (selectedAreas.length > 0) {
        resultados = resultados.filter((publicacao) =>
          selectedAreas.includes(publicacao.Resumo.area.id)
        );
      }

      // Filtro por subsessões selecionadas
      if (selectedSubsessoes.length > 0) {
        resultados = resultados.filter((publicacao) =>
          selectedSubsessoes.includes(publicacao.subsessao.id)
        );
      }

      setFilteredPublicacoes(resultados);
    };

    filtrarPublicacoes();
  }, [searchTerm, selectedAreas, selectedSubsessoes, publicacoes]);

  const handleGrandeAreaSelect = (grandeAreaId) => {
    const grandeArea = filtros.grandesAreas.find(
      (ga) => ga.id === grandeAreaId
    );
    const areaIds = grandeArea.areas.map((area) => area.id);

    const todasSelecionadas = areaIds.every((id) => selectedAreas.includes(id));

    if (todasSelecionadas) {
      setSelectedAreas((prev) => prev.filter((id) => !areaIds.includes(id)));
    } else {
      setSelectedAreas((prev) => [
        ...prev.filter((id) => !areaIds.includes(id)),
        ...areaIds,
      ]);
    }
  };

  const handleAreaSelect = (areaId) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleSessaoSelect = (sessaoId) => {
    const sessao = filtros.sessoes.find((s) => s.id === sessaoId);
    const subsessaoIds = sessao.subsessoes.map((s) => s.id);

    const todasSelecionadas = subsessaoIds.every((id) =>
      selectedSubsessoes.includes(id)
    );

    if (todasSelecionadas) {
      setSelectedSubsessoes((prev) =>
        prev.filter((id) => !subsessaoIds.includes(id))
      );
    } else {
      setSelectedSubsessoes((prev) => [
        ...prev.filter((id) => !subsessaoIds.includes(id)),
        ...subsessaoIds,
      ]);
    }
  };

  const handleSubsessaoSelect = (subsessaoId) => {
    setSelectedSubsessoes((prev) =>
      prev.includes(subsessaoId)
        ? prev.filter((id) => id !== subsessaoId)
        : [...prev, subsessaoId]
    );
  };

  const limparFiltros = () => {
    setSelectedAreas([]);
    setSelectedSubsessoes([]);
    setSearchTerm("");
  };

  const isGrandeAreaCompleta = (grandeAreaId) => {
    const grandeArea = filtros.grandesAreas.find(
      (ga) => ga.id === grandeAreaId
    );
    return grandeArea.areas.every((area) => selectedAreas.includes(area.id));
  };

  const isSessaoCompleta = (sessaoId) => {
    const sessao = filtros.sessoes.find((s) => s.id === sessaoId);
    return sessao.subsessoes.every((subsessao) =>
      selectedSubsessoes.includes(subsessao.id)
    );
  };

  if (loading || loadingPublicacoes) return <div>Carregando...</div>;
  if (!filtros) return <div>Não foi possível carregar os filtros</div>;

  return (
    <main className={styles.main}>
      <article>
        <aside>
          <div className={`${styles.edicoesContent}`}>
            <h6 className={styles.sectionTitle}>Filtros</h6>

            {/* Filtro por Grandes Áreas e Áreas */}
            <div className={styles.filtroSection}>
              <h6 className={styles.filtroTitle}>Áreas de Conhecimento</h6>
              <div className={styles.filtroContent}>
                {filtros.grandesAreas.map((grandeArea) => (
                  <div key={grandeArea.id} className={styles.grandeAreaItem}>
                    <div
                      className={styles.grandeAreaHeader}
                      onClick={() => handleGrandeAreaSelect(grandeArea.id)}
                    >
                      <Checkbox
                        checked={isGrandeAreaCompleta(grandeArea.id)}
                        onChange={() => handleGrandeAreaSelect(grandeArea.id)}
                      />
                      <span>{grandeArea.grandeArea}</span>
                    </div>
                    <div className={styles.areasList}>
                      {grandeArea.areas.map((area) => (
                        <div key={area.id} className={styles.areaItem}>
                          <Checkbox
                            inputId={`area-${area.id}`}
                            checked={selectedAreas.includes(area.id)}
                            onChange={() => handleAreaSelect(area.id)}
                          />
                          <label htmlFor={`area-${area.id}`}>{area.area}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro por Sessões e Subsessões */}
            <div className={styles.filtroSection}>
              <h6 className={styles.filtroTitle}>Sessões</h6>
              <div className={styles.filtroContent}>
                {filtros.sessoes.map((sessao) => (
                  <div key={sessao.id} className={styles.sessaoItem}>
                    <div
                      className={styles.sessaoHeader}
                      onClick={() => handleSessaoSelect(sessao.id)}
                    >
                      <Checkbox
                        checked={isSessaoCompleta(sessao.id)}
                        onChange={() => handleSessaoSelect(sessao.id)}
                      />
                      <span>{sessao.titulo}</span>
                    </div>
                    <div className={styles.subsessoesList}>
                      {sessao.subsessoes.map((subsessao) => (
                        <div
                          key={subsessao.id}
                          className={styles.subsessaoItem}
                        >
                          <Checkbox
                            inputId={`subsessao-${subsessao.id}`}
                            checked={selectedSubsessoes.includes(subsessao.id)}
                            onChange={() => handleSubsessaoSelect(subsessao.id)}
                          />
                          <label htmlFor={`subsessao-${subsessao.id}`}>
                            {`${formatarData(
                              subsessao.inicio
                            )} - ${formatarHora(subsessao.inicio)}`}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className={`${styles.content} ${styles.descriptionSection}`}>
          <div className={styles.sectionContent}>
            <div className={styles.descriptionContent}>
              <h4 className="mb-2">Publicações</h4>
              <h6
                className={`preserve-line-breaks ${styles.sectionTitle} ml-0 `}
              >
                {evento.nomeEvento}
              </h6>
            </div>
          </div>
          {/* Campo de busca por nome/título */}
          <div className={styles.sectionContent}>
            <div className={styles.descriptionContent}>
              <div className="p-inputgroup">
                <span className="p-inputgroup-addon">
                  <RiSearchLine size={16} />
                </span>
                <InputText
                  placeholder="Buscar por nome ou título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.descriptionContent}>
              {filteredPublicacoes?.length === 0 ||
              !filteredPublicacoes[0].Resumo ? (
                <NoData message="Nenhuma publicação encontrada com os filtros selecionados" />
              ) : (
                filteredPublicacoes?.map((publicacao) => (
                  <ul key={publicacao.id}>
                    <li>
                      <div className={styles.tags}>
                        <p>
                          {publicacao.categoria} - {publicacao.tenant?.sigla}
                        </p>
                        <p>{publicacao.Resumo?.area?.area}</p>
                      </div>
                      <h6
                        className={`preserve-line-breaks ${styles.sectionTitle} ml-0 mb-2`}
                      >
                        {publicacao.Resumo.titulo}
                      </h6>
                      <div className={styles.card}>
                        <div className={styles.cardContent}>
                          <div>
                            <div className={`${styles.cardItem} mt-2 mb-1`}>
                              <RiGroupLine />
                              <p>
                                {publicacao.Resumo?.participacoes?.map(
                                  (p, index) => (
                                    <span key={p.user.id}>
                                      {`${
                                        p.user.nome
                                      } (${p.cargo.toLowerCase()})`}
                                      {index <
                                      publicacao.Resumo.participacoes.length - 1
                                        ? ", "
                                        : ""}
                                    </span>
                                  )
                                )}
                              </p>
                            </div>
                            <Link
                              href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/publicacoes/${publicacao.id}`}
                              className={styles.edicaoLink}
                            >
                              <div className={styles.action}>
                                <RiEyeLine />
                                <p>Ver Trabalho</p>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                ))
              )}
            </div>
          </div>
        </section>
      </article>
    </main>
  );
};
