"use client";
import React, { useState, useRef, useEffect } from "react";
import { getInscricaoProjetoByTenant } from "@/app/api/client/projeto";
import style from "./page.module.scss";
import { Toast } from "primereact/toast";
import {
  atribuicaoDeProjetosPeloGestor,
  getAvaliadoresComProjetosPendentes,
} from "@/app/api/client/avaliador";
import { getCargos } from "@/app/api/client/cargo";
import { Card } from "primereact/card";
import { RiSettings5Line, RiTimeLine } from "@remixicon/react";
import { Checkbox } from "primereact/checkbox";
import { RiDeleteBinLine } from "@remixicon/react";
import { GestorDesassociarAvaliadorInscricaoProjeto } from "@/app/api/client/avaliador";
import NoData from "@/components/NoData";
import calcularTempoDesdeAtribuicao from "@/lib/calcularTempoDesdeAtribuicao";
import Modal from "@/components/Modal";
import FormularioFichaAvaliacao from "@/components/FormularioFichaAvaliacao";
import NotificarAvaliador from "@/components/NotificarAvaliador";
import Button from "@/components/Button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
const Page = ({ params }) => {
  const [avaliadoresList, setAvaliadoresList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inscricoesProjetos, setInscricoesProjetos] = useState([]);
  const [todasAreas, setTodasAreas] = useState([]);
  const [avaliadores, setAvaliadores] = useState([]);
  const toast = useRef(null);
  const [checked, setChecked] = useState(false);
  const [areasComProjetos, setAreasComProjetos] = useState([]);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [projetosPorAvaliador, setProjetosPorAvaliador] = useState(0);
  const [avaliadorSelecionado, setAvaliadorSelecionado] = useState(null);
  const [removendoVinculacao, setRemovendoVinculacao] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  const [buscaProjeto, setBuscaProjeto] = useState("");
  const [areaFiltro, setAreaFiltro] = useState(null);
  const [avaliadoresProjetoSelecionado, setAvaliadoresProjetoSelecionado] =
    useState([]);
  const [showModalAssociacao, setShowModalAssociacao] = useState(false);
  const handleSelecionarAvaliador = (avaliador) => {
    const isSelected = avaliadoresProjetoSelecionado.some(
      (a) => a.id === avaliador.id
    );

    if (!isSelected) {
      setAvaliadoresProjetoSelecionado([
        ...avaliadoresProjetoSelecionado,
        avaliador,
      ]);
      setShowModalAssociacao(true);
    } else {
      setAvaliadoresProjetoSelecionado(
        avaliadoresProjetoSelecionado.filter((a) => a.id !== avaliador.id)
      );
    }
  };
  // Carrega os avaliadores quando o componente é montado
  useEffect(() => {
    const fetchData = async () => {
      try {
        await atualizarAvaliadores(
          params.tenant,
          setAvaliadores,
          setTodasAreas
        );
        await getAvaliadoresComProjetosPendentes(params.tenant, params.ano);
        await processarInscricoes(params.tenant, setInscricoesProjetos);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    fetchData();
  }, [params.tenant]);

  useEffect(() => {
    const calcularAreasComProjetos = async () => {
      try {
        const response = await getInscricaoProjetoByTenant(
          params.tenant,
          "enviada"
        );
        const projetosNaoDistribuidos = response.filter(
          (projeto) => projeto.statusAvaliacao === "AGUARDANDO_AVALIACAO"
        );

        const areasAgrupadas = projetosNaoDistribuidos.reduce(
          (acc, projeto) => {
            const area = projeto.projeto.area?.area || "Sem área definida";
            if (!acc[area]) {
              acc[area] = 0;
            }
            acc[area]++;
            return acc;
          },
          {}
        );

        const areasArray = Object.entries(areasAgrupadas).map(
          ([area, count]) => ({
            area,
            count,
          })
        );

        setAreasComProjetos(areasArray);
      } catch (error) {
        console.error("Erro ao calcular áreas com projetos:", error);
        setAreasComProjetos([]);
      }
    };

    calcularAreasComProjetos();
  }, [inscricoesProjetos, params.tenant]);

  const getProjetosNaoDistribuidosPorArea = () => {
    if (!areaSelecionada) return [];

    return inscricoesProjetos.filter(
      (projeto) =>
        projeto.statusAvaliacao === "AGUARDANDO_AVALIACAO" &&
        (projeto.projeto.area?.area === areaSelecionada ||
          (areaSelecionada === "Sem área definida" && !projeto.projeto.area))
    );
  };

  const getAvaliadoresPorArea = () => {
    if (!areaSelecionada) return [];

    return avaliadores.filter((avaliador) =>
      avaliador.user.userArea.some((ua) => ua.area.area === areaSelecionada)
    );
  };

  const calcularProjetosPorAvaliador = () => {
    if (!areaSelecionada || avaliadoresList.length === 0) return 0;

    const area = areasComProjetos.find((a) => a.area === areaSelecionada);
    if (!area) return 0;

    return Math.ceil(area.count / avaliadoresList.length);
  };

  useEffect(() => {
    setProjetosPorAvaliador(calcularProjetosPorAvaliador());
  }, [areaSelecionada, avaliadoresList]);

  const handleSelectAll = (e) => {
    setChecked(e.checked);
    if (e.checked) {
      setAvaliadoresList(getAvaliadoresPorArea());
    } else {
      setAvaliadoresList([]);
    }
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const handleAtribuicao = async () => {
    setIsProcessing(true);

    try {
      const projetosArea = getProjetosNaoDistribuidosPorArea();

      if (projetosArea.length === 0) {
        showToast(
          "warn",
          "Aviso",
          "Nenhum projeto não distribuído encontrado para esta área"
        );
        return;
      }

      if (avaliadoresList.length === 0) {
        showToast("warn", "Aviso", "Nenhum avaliador selecionado");
        return;
      }

      const body = {
        inscricaoProjetos: projetosArea.map((p) => p.id),
        avaliadores: avaliadoresList.map((a) => a.user.id), // Envia o user.id em vez de a.id
        //projetosPorAvaliador: projetosPorAvaliador,
      };

      const response = await atribuicaoDeProjetosPeloGestor(
        params.tenant,
        body
      );
      console.log(response);
      if (response) {
        const { resultados } = response;
        console.log(response);
        const sucesso = resultados.filter((r) => r.success);
        const falhas = resultados.filter((r) => !r.success);

        if (sucesso.length > 0) {
          showToast(
            "success",
            sucesso.length === resultados.length
              ? "Atribuição concluída"
              : "Atribuição parcial",
            `${sucesso.length} de ${resultados.length} projeto(s) atribuídos com sucesso.`
          );
        }

        if (falhas.length > 0) {
          falhas.forEach((r) => {
            const conflitosDetalhados =
              r.conflitos?.join("; ") || r.error || "Motivo não informado";
            showToast(
              "error",
              `Falha na atribuição do projeto ID ${r.inscricaoProjetoId}`,
              conflitosDetalhados
            );
          });
        }

        if (sucesso.length === 0 && falhas.length === 0) {
          showToast("info", "Aviso", "Nenhuma atribuição foi realizada.");
        }
      }

      await processarInscricoes(params.tenant, setInscricoesProjetos);
      await atualizarAvaliadores(params.tenant, setAvaliadores, setTodasAreas);

      setAvaliadoresList([]);
      setChecked(false);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.associacoesFalhas?.length > 0) {
        errorData.associacoesFalhas.forEach((falha) => {
          showToast("error", "Erro", falha.message);
        });
      } else {
        const errorMessage =
          errorData?.message ||
          error.message ||
          "Erro ao realizar a atribuição.";
        showToast("error", "Erro", errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const processarInscricoes = async (tenant, setInscricoesProjetos) => {
    const inscricoesProjetos = await getInscricaoProjetoByTenant(
      tenant,
      "enviada"
    );

    const inscricoesComColunasVirtuais = inscricoesProjetos.map((inscricao) => {
      const quantidadeFichas = inscricao.FichaAvaliacao?.length || 0;
      const notaMedia =
        quantidadeFichas > 0
          ? (
              inscricao.FichaAvaliacao.reduce(
                (sum, ficha) => sum + (ficha.notaTotal || 0),
                0
              ) / quantidadeFichas
            ).toFixed(2)
          : "N/A";

      const avaliadores = inscricao.InscricaoProjetoAvaliador.map(
        (avaliador) => avaliador.avaliador.nome
      ).join(", ");

      const quantidadeAvaliadores =
        inscricao.InscricaoProjetoAvaliador?.length || 0;

      const notas = inscricao.FichaAvaliacao.map(
        (ficha) => ficha.notaTotal || 0
      );
      const diferencaNotas =
        notas.length > 0 ? Math.max(...notas) - Math.min(...notas) : "N/A";

      return {
        ...inscricao,
        quantidadeFichas,
        notaMedia,
        avaliadores,
        quantidadeAvaliadores,
        diferencaNotas,
      };
    });

    setInscricoesProjetos(inscricoesComColunasVirtuais || []);
  };

  const calcularProjetosAvaliados = (avaliador) => {
    return avaliador.user.InscricaoProjetoAvaliador.reduce(
      (total, inscricao) => {
        return total + (inscricao.inscricaoProjeto.FichaAvaliacao?.length || 0);
      },
      0
    );
  };

  const atualizarAvaliadores = async (
    tenant,
    setAvaliadores,
    setTodasAreas
  ) => {
    const avaliadores = await getCargos(tenant, {
      cargo: "avaliador",
      ano: params.ano,
    });

    const avaliadoresComColunasVirtuais = avaliadores
      .filter((a) => a.user.avaliadorAnoStatus === "CONFIRMADO")
      .map((avaliador) => ({
        ...avaliador,
        projetosAvaliados: calcularProjetosAvaliados(avaliador),
        projetosAtribuidos: avaliador.user.InscricaoProjetoAvaliador.length,
      }));

    setAvaliadores(avaliadoresComColunasVirtuais || []);

    const areasUnicas = [
      ...new Set(
        avaliadores.flatMap((avaliador) =>
          avaliador.user.userArea.map((ua) => ua.area.area)
        )
      ),
    ];
    setTodasAreas(areasUnicas.map((area) => ({ label: area, value: area })));
  };

  const projetosParaDistribuir = getProjetosNaoDistribuidosPorArea().length;
  const podeAtribuir = avaliadoresList.length > 0 && projetosParaDistribuir > 0;
  const handleDesassociarAvaliador = async (
    inscricaoProjetoId,
    avaliadorId
  ) => {
    // Armazena o ID da vinculação que está sendo removida
    setRemovendoVinculacao(inscricaoProjetoId);

    try {
      await GestorDesassociarAvaliadorInscricaoProjeto(
        params.tenant,
        inscricaoProjetoId,
        avaliadorId
      );

      // Atualiza os dados após a remoção bem-sucedida
      await processarInscricoes(params.tenant, setInscricoesProjetos);
      await atualizarAvaliadores(params.tenant, setAvaliadores, setTodasAreas);

      showToast("success", "Sucesso", "Vinculação removida com sucesso!");
    } catch (error) {
      // Se houver erro, volta o item para a lista
      setRemovendoVinculacao(null);

      const errorMessage =
        error.response?.data?.message ||
        "Erro ao remover a vinculação do avaliador.";
      showToast("error", "Erro", errorMessage);
    } finally {
      setRemovendoVinculacao(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        size="medium"
      >
        {(() => {
          switch (activeModal) {
            case "ficha":
              return <FormularioFichaAvaliacao params={params} />;
            case "notificarAvaliador":
              return <NotificarAvaliador params={params} />;
            default:
              return null;
          }
        })()}
      </Modal>
      <Modal
        isOpen={showModalAssociacao}
        onClose={() => setShowModalAssociacao(false)}
        size="small"
      >
        <div className={style.modalAssociacao}>
          <h5 className="mb-2">Confirmar Associação</h5>
          <p>
            Deseja associar o avaliador{" "}
            <strong>
              {
                avaliadoresProjetoSelecionado[
                  avaliadoresProjetoSelecionado.length - 1
                ]?.user.nome
              }
            </strong>{" "}
            ao projeto:
          </p>
          <p className={`${style.projetoNome} mt-2`}>
            <strong>
              {projetoSelecionado?.projeto?.titulo || "Projeto sem título"}
            </strong>
            ?
          </p>

          <div className={style.modalActions}>
            <Button
              className="button btn-secondary"
              onClick={() => {
                // Remove o último avaliador selecionado (que acionou o modal)
                setAvaliadoresProjetoSelecionado(
                  avaliadoresProjetoSelecionado.slice(0, -1)
                );
                setShowModalAssociacao(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="button btn-primary"
              onClick={async () => {
                setIsProcessing(true);

                try {
                  const body = {
                    inscricaoProjetos: [projetoSelecionado.id],
                    avaliadores: [
                      avaliadoresProjetoSelecionado[
                        avaliadoresProjetoSelecionado.length - 1
                      ].user.id,
                    ],
                  };

                  const response = await atribuicaoDeProjetosPeloGestor(
                    params.tenant,
                    body
                  );

                  if (response) {
                    showToast(
                      "success",
                      "Associação realizada",
                      `Avaliador associado ao projeto com sucesso!`
                    );

                    // Atualiza os dados
                    await processarInscricoes(
                      params.tenant,
                      setInscricoesProjetos
                    );
                    await atualizarAvaliadores(
                      params.tenant,
                      setAvaliadores,
                      setTodasAreas
                    );

                    // Limpa seleções
                    setAvaliadoresProjetoSelecionado([]);
                    setProjetoSelecionado(null);
                  }
                } catch (error) {
                  // Remove o avaliador em caso de erro
                  setAvaliadoresProjetoSelecionado(
                    avaliadoresProjetoSelecionado.slice(0, -1)
                  );

                  const errorMessage =
                    error.response?.data?.message ||
                    error.message ||
                    "Erro ao associar avaliador ao projeto.";
                  showToast("error", "Erro", errorMessage);
                } finally {
                  setIsProcessing(false);
                  setShowModalAssociacao(false);
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>
      <main>
        <Card className="mb-4 p-2">
          <div className={style.configuracoes}>
            <div className={style.icon}>
              <RiSettings5Line />
            </div>
            <ul>
              <li onClick={() => setActiveModal("ficha")}>
                <p>Formulários de Avaliação</p>
              </li>
              <li onClick={() => setActiveModal("notificarAvaliador")}>
                <p>Notificar Avaliadores</p>
              </li>
            </ul>
          </div>
        </Card>
        <Card className={`mb-4 p-2`}>
          <h5 className="mb-2">Distribuição por projeto específico</h5>
          <div className={`${style.distribuicao}`}>
            <div className={`${style.distribuicaoCard} ${style.projetos}`}>
              <div className={style.scrollableContainer}>
                {/* Adicionando os filtros */}
                <div className={style.filtrosContainer}>
                  {/* Input de busca por nome do projeto ou orientador */}
                  <span
                    className="p-input-icon-left"
                    style={{ width: "100%", marginBottom: "1rem" }}
                  >
                    <InputText
                      placeholder="Buscar projeto ou orientador..."
                      style={{ width: "100%" }}
                      onChange={(e) => setBuscaProjeto(e.target.value)}
                    />
                  </span>

                  {/* Select para filtrar por área */}
                  <Dropdown
                    value={areaFiltro}
                    options={[
                      { label: "Todas as áreas", value: null },
                      ...todasAreas.map((area) => ({
                        label: area.label,
                        value: area.value,
                      })),
                    ]}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => {
                      setAreaFiltro(e.value); // agora e.value é null, string, etc.
                      setProjetoSelecionado(null); // continua resetando o projeto selecionado
                    }}
                    placeholder="Filtrar por área"
                    style={{ width: "100%", marginBottom: "1rem" }}
                  />
                </div>

                <ul>
                  {inscricoesProjetos
                    .filter((projeto) => {
                      // Filtro por status
                      const statusMatch =
                        projeto.statusAvaliacao === "AGUARDANDO_AVALIACAO";

                      // Filtro por busca (projeto ou orientador)
                      const buscaMatch =
                        !buscaProjeto ||
                        projeto.projeto?.titulo
                          ?.toLowerCase()
                          .includes(buscaProjeto.toLowerCase()) ||
                        projeto.inscricao?.proponente?.nome
                          ?.toLowerCase()
                          .includes(buscaProjeto.toLowerCase());

                      // Filtro por área
                      // Por esta versão mais robusta:
                      const areaMatch =
                        areaFiltro === null || // Quando seleciona "Todas as áreas"
                        (areaFiltro === "Sem área definida"
                          ? !projeto.projeto.area
                          : projeto.projeto.area?.area === areaFiltro);

                      return statusMatch && buscaMatch && areaMatch;
                    })
                    .map((projeto, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setAvaliadorSelecionado(null);
                          setProjetoSelecionado(projeto);
                          setAvaliadoresProjetoSelecionado([]); // Limpa seleção ao mudar projeto
                        }}
                        className={
                          projetoSelecionado?.id === projeto.id
                            ? style.selected
                            : ""
                        }
                      >
                        <div className={style.content}>
                          <h6>
                            {projeto.projeto?.titulo || "Projeto sem título"} -
                            ID {projeto.id}
                          </h6>
                          <p>
                            <strong>Área:</strong>{" "}
                            {projeto.projeto.area?.area || "Sem área definida"}
                          </p>
                          {projeto.inscricao?.proponente?.nome && (
                            <p>
                              <strong>Orientador:</strong>{" "}
                              {projeto.inscricao?.proponente?.nome}
                            </p>
                          )}
                          {projeto.InscricaoProjetoAvaliador?.length > 0 && (
                            <p>
                              <strong>Avaliadores atribuídos:</strong>{" "}
                              {projeto.InscricaoProjetoAvaliador.length}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div className={`${style.distribuicaoCard} ${style.avaliadores}`}>
              <div className={style.scrollableContainer}>
                {projetoSelecionado ? (
                  <>
                    <div className="flex align-items-center mt-2 pl-2 mb-2">
                      <p>Selecione avaliadores para este projeto:</p>
                    </div>

                    <ul>
                      {avaliadores.length === 0 ? (
                        <li>
                          <div className={style.content}>
                            <NoData description="Nenhum avaliador disponível" />
                          </div>
                        </li>
                      ) : (
                        avaliadores
                          .filter(
                            (avaliador) =>
                              // Filtra por área do projeto
                              avaliador.user.userArea.some(
                                (ua) =>
                                  ua.area.area ===
                                  projetoSelecionado.projeto.area?.area
                              ) &&
                              // Exclui já associados
                              !projetoSelecionado.InscricaoProjetoAvaliador?.some(
                                (ipa) => ipa.avaliadorId === avaliador.user.id
                              )
                          )
                          .map((avaliador, index) => (
                            <li
                              key={index}
                              onClick={() =>
                                handleSelecionarAvaliador(avaliador)
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <div className={style.checkbox}></div>
                              <div className={style.content}>
                                <h6>{avaliador.user.nome}</h6>
                                <p>
                                  <strong>
                                    {avaliador.user.userArea[0]?.area?.area ||
                                      "Sem área"}
                                  </strong>
                                  {avaliador.user.userArea.length > 1 && (
                                    <span>
                                      {" "}
                                      +{avaliador.user.userArea.length - 1}{" "}
                                      outras áreas
                                    </span>
                                  )}
                                </p>
                                <p className={style.projetosInfo}>
                                  Projetos atribuídos:{" "}
                                  {avaliador.user.InscricaoProjetoAvaliador.filter(
                                    (ipa) =>
                                      ipa.inscricaoProjeto.inscricao.edital
                                        .tenant.sigla === params.tenant
                                  )?.length || 0}
                                </p>
                              </div>
                            </li>
                          ))
                      )}
                    </ul>
                  </>
                ) : (
                  <div className={style.content}>
                    <NoData description="Selecione um projeto para atribuir avaliadores." />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card className={`mb-4 p-2`}>
          <h5 className="mb-2">Distribuição por área</h5>
          {avaliadoresList?.length > 0 && areaSelecionada && (
            <div className={`${style.actions}`}>
              <button
                className="button btn-primary"
                onClick={handleAtribuicao}
                disabled={isProcessing || !podeAtribuir}
              >
                {isProcessing ? (
                  <p>Carregando...</p>
                ) : (
                  <p>
                    {`Atribuir ${
                      getProjetosNaoDistribuidosPorArea().length
                    } projetos da área ${areaSelecionada} para ${
                      avaliadoresList.length
                    } avaliadores`}
                  </p>
                )}
              </button>
            </div>
          )}
          <div className={`${style.distribuicao}`}>
            <div className={`${style.distribuicaoCard} ${style.projetos}`}>
              <div className={style.scrollableContainer}>
                <ul>
                  {areasComProjetos.length > 0 ? (
                    areasComProjetos.map((item, index) => (
                      <li
                        key={index}
                        onClick={() => setAreaSelecionada(item.area)}
                        className={
                          areaSelecionada === item.area ? style.selected : ""
                        }
                      >
                        <div className={style.content}>
                          <h6>
                            {item.area} <span>{item.count}</span>
                          </h6>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li>
                      <div className={style.content}>
                        <h6>Nenhum projeto não distribuído encontrado</h6>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className={`${style.distribuicaoCard} ${style.avaliadores}`}>
              <div className={style.scrollableContainer}>
                {areaSelecionada && getAvaliadoresPorArea().length > 0 && (
                  <div className="flex align-items-center pl-2 pt-2 pr-2 mb-2">
                    <Checkbox onChange={handleSelectAll} checked={checked} />
                    <p className="ml-2">Selecionar todos</p>
                  </div>
                )}
                <ul>
                  {!areaSelecionada ? (
                    <li>
                      <div className={style.content}>
                        <h6>Clique em uma área</h6>
                      </div>
                    </li>
                  ) : getAvaliadoresPorArea().length === 0 ? (
                    <li>
                      <div className={style.content}>
                        <h6>Nenhum avaliador encontrado para esta área</h6>
                      </div>
                    </li>
                  ) : (
                    getAvaliadoresPorArea().map((avaliador, index) => (
                      <li
                        key={index}
                        onClick={(e) => {
                          if (e.target.tagName !== "INPUT") {
                            const isChecked = avaliadoresList.some(
                              (a) => a.id === avaliador.id
                            );
                            if (isChecked) {
                              setAvaliadoresList(
                                avaliadoresList.filter(
                                  (a) => a.id !== avaliador.id
                                )
                              );
                            } else {
                              setAvaliadoresList([
                                ...avaliadoresList,
                                avaliador,
                              ]);
                            }
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className={style.checkbox}>
                          <Checkbox
                            onChange={(e) => {
                              if (e.checked) {
                                setAvaliadoresList([
                                  ...avaliadoresList,
                                  avaliador,
                                ]);
                              } else {
                                setAvaliadoresList(
                                  avaliadoresList.filter(
                                    (a) => a.id !== avaliador.id
                                  )
                                );
                              }
                            }}
                            checked={avaliadoresList.some(
                              (a) => a.id === avaliador.id
                            )}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className={style.content}>
                          <h6>
                            {avaliador.user.nome}{" "}
                            <span>
                              {avaliador.user.InscricaoProjetoAvaliador.filter(
                                (ipa) =>
                                  ipa.inscricaoProjeto.inscricao.edital.tenant
                                    .sigla === params.tenant
                              ).length || 0}
                            </span>
                          </h6>
                          <p>
                            <strong>{areaSelecionada || "Sem área"}</strong>
                            {avaliador.user.userArea.length > 1 && (
                              <span>
                                {" "}
                                +{avaliador.user.userArea.length - 1} outras
                                áreas
                              </span>
                            )}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </Card>
        <Card className={`mb-4 p-2`}>
          <h5 className="mb-2">Avaliadores x Projetos</h5>
          <div className={`${style.distribuicao}`}>
            <div className={`${style.distribuicaoCard} ${style.avaliadores}`}>
              <div className={style.scrollableContainer}>
                <ul>
                  {avaliadores.map((avaliador, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setAvaliadorSelecionado(avaliador);
                      }}
                      className={
                        avaliadorSelecionado?.id === avaliador.id
                          ? style.selected
                          : ""
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <div className={style.content}>
                        <h6>
                          {avaliador.user.nome}{" "}
                          <span>
                            {avaliador.user.InscricaoProjetoAvaliador.filter(
                              (ipa) =>
                                ipa.inscricaoProjeto.inscricao.edital.tenant
                                  .sigla === params.tenant
                            ).length || 0}
                          </span>
                        </h6>
                        <p>
                          <strong>
                            {avaliador.user.userArea[0]?.area?.area ||
                              "Sem área"}
                          </strong>
                          {avaliador.user.userArea.length > 1 && (
                            <span>
                              {" "}
                              +{avaliador.user.userArea.length - 1} outras áreas
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`${style.distribuicaoCard} ${style.projetos}`}>
              <div className={style.scrollableContainer}>
                {avaliadorSelecionado ? (
                  <>
                    <h6 className="mt-2 ml-2 mb-2">Aguardando avaliação</h6>
                    <ul>
                      {avaliadorSelecionado.user.InscricaoProjetoAvaliador.filter(
                        (atribuicao) =>
                          (atribuicao.inscricaoProjeto?.FichaAvaliacao
                            ?.length || 0) === 0 &&
                          removendoVinculacao !== atribuicao.inscricaoProjetoId
                      )
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt) - new Date(b.createdAt)
                        )
                        .map((atribuicao, idx) => {
                          const tempo = calcularTempoDesdeAtribuicao(
                            atribuicao.createdAt
                          );
                          return (
                            <li key={idx}>
                              <div className={style.content}>
                                <h6>
                                  {atribuicao.inscricaoProjeto?.projeto
                                    ?.titulo || "Projeto sem título"}{" "}
                                  - ID {atribuicao.inscricaoProjeto?.id}
                                </h6>
                                <p className={style.timeInfo}>
                                  <strong>Tempo desde atribuição:</strong>{" "}
                                  {tempo.display}
                                </p>
                              </div>
                              <div className={style.actions}>
                                {removendoVinculacao ===
                                atribuicao.inscricaoProjetoId ? (
                                  <i
                                    className="pi pi-spinner pi-spin"
                                    style={{ marginLeft: "10px" }}
                                  />
                                ) : (
                                  <RiDeleteBinLine
                                    className={style.deleteIcon}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDesassociarAvaliador(
                                        atribuicao.inscricaoProjetoId,
                                        avaliadorSelecionado.user.id
                                      );
                                    }}
                                    title="Remover vinculação"
                                  />
                                )}
                              </div>
                            </li>
                          );
                        })}
                    </ul>

                    <h6 className="mt-2 ml-2 mb-2">Avaliados</h6>
                    <ul>
                      {inscricoesProjetos.filter((inscricao) =>
                        inscricao.FichaAvaliacao?.some(
                          (ficha) =>
                            ficha.avaliadorId === avaliadorSelecionado.user.id
                        )
                      ).length > 0 ? (
                        inscricoesProjetos
                          .filter((inscricao) =>
                            inscricao.FichaAvaliacao?.some(
                              (ficha) =>
                                ficha.avaliadorId ===
                                avaliadorSelecionado.user.id
                            )
                          )
                          .map((inscricao, idx) => {
                            const fichasDoAvaliador =
                              inscricao.FichaAvaliacao?.filter(
                                (ficha) =>
                                  ficha.avaliadorId ===
                                  avaliadorSelecionado.user.id
                              ) || [];

                            return (
                              <li key={idx}>
                                <div className={style.content}>
                                  <h6>
                                    {inscricao.projeto?.titulo ||
                                      "Projeto sem título"}{" "}
                                  </h6>
                                  <p>
                                    <strong>Status:</strong>{" "}
                                    {inscricao.statusAvaliacao}
                                  </p>
                                  {fichasDoAvaliador.length > 0 && (
                                    <>
                                      <p>
                                        <strong>Sua nota:</strong>{" "}
                                        {fichasDoAvaliador[0].notaTotal.toFixed(
                                          2
                                        )}
                                      </p>
                                      <p>
                                        <strong>Média geral:</strong>{" "}
                                        {inscricao.notaMedia}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </li>
                            );
                          })
                      ) : (
                        <li>
                          <div className={style.content}>
                            <h6>Nenhum projeto avaliado</h6>
                          </div>
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <div className={style.content}>
                    <NoData description="Selecione um avaliador." />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card className={`mb-4 p-2`}>
          <h5 className="mb-2">Avaliações pendentes (geral)</h5>
          <div className={style.distribuicao}>
            <div className={`${style.distribuicaoCard} ${style.projetos}`}>
              <div className={style.scrollableContainer}>
                <ul>
                  {avaliadores
                    .flatMap((avaliador) =>
                      avaliador.user.InscricaoProjetoAvaliador.filter(
                        (atribuicao) =>
                          (atribuicao.inscricaoProjeto?.FichaAvaliacao
                            ?.length || 0) === 0
                      ).map((atribuicao) => ({
                        atribuicao,
                        avaliador,
                      }))
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.atribuicao.createdAt) -
                        new Date(b.atribuicao.createdAt)
                    )
                    .map(({ atribuicao, avaliador }, idx) => {
                      const tempo = calcularTempoDesdeAtribuicao(
                        atribuicao.createdAt
                      );
                      const projetoTitulo =
                        atribuicao.inscricaoProjeto?.projeto?.titulo ||
                        "Projeto sem título";
                      const projetoId = atribuicao.inscricaoProjeto?.id;

                      return (
                        <li key={idx}>
                          <div
                            className={`${style.content} ${style.contentAvaliacoesPendentes}`}
                          >
                            <div className={style.time}>
                              <RiTimeLine />
                              <p className={style.timeInfo}>Aguardando há:</p>
                              <h6>{tempo.display}</h6>
                            </div>
                            <div className={style.headerAvaliadoresPendente}>
                              <h6>
                                {projetoTitulo} - ID {projetoId}
                              </h6>
                              <p className={style.timeInfo}>
                                <strong>Avaliador:</strong>{" "}
                                {avaliador.user.nome}
                              </p>
                            </div>
                          </div>
                          <div className={style.actions}>
                            {removendoVinculacao === projetoId ? (
                              <i
                                className="pi pi-spinner pi-spin"
                                style={{ marginLeft: "10px" }}
                              />
                            ) : (
                              <RiDeleteBinLine
                                className={style.deleteIcon}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDesassociarAvaliador(
                                    projetoId,
                                    avaliador.user.id
                                  );
                                }}
                                title="Remover vinculação"
                              />
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
                {avaliadores.every((av) =>
                  av.user.InscricaoProjetoAvaliador.every(
                    (ap) =>
                      (ap.inscricaoProjeto?.FichaAvaliacao?.length || 0) > 0
                  )
                ) && (
                  <div className={style.content}>
                    <h6>Nenhuma avaliação pendente encontrada</h6>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </main>
      <Toast ref={toast} />
    </>
  );
};

export default Page;
