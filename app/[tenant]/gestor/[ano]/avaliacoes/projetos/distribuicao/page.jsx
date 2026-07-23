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
import {
  RiSettings5Line,
  RiTimeLine,
  RiSearchLine,
  RiFileExcelLine,
} from "@remixicon/react";
import { Checkbox } from "primereact/checkbox";
import { RiDeleteBinLine } from "@remixicon/react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { GestorDesassociarAvaliadorInscricaoProjeto } from "@/app/api/client/avaliador";
import NoData from "@/components/NoData";
import calcularTempoDesdeAtribuicao from "@/lib/calcularTempoDesdeAtribuicao";
import Modal from "@/components/Modal";
import FormularioFichaAvaliacao from "@/components/FormularioFichaAvaliacao";
import NotificarAvaliador from "@/components/NotificarAvaliador";
import Button from "@/components/Button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { getCookie, setCookie } from "cookies-next";

// Busca/ordenação persistidos em cookie por tenant+ano (mesmo padrão de
// app/[tenant]/gestor/[ano]/avaliacoes/projetos/acompanhamento/page.jsx),
// pra o gestor não perder os filtros ao recarregar a página. `null` (ex.:
// "Todas as áreas") vira string vazia no cookie e volta a virar `null` na leitura.
const usePersistedFiltro = (tenant, ano, chave, valorInicial) => {
  const cookieKey = `distribuicao_${chave}_${tenant}_${ano}`;
  const [valor, setValor] = useState(valorInicial);

  useEffect(() => {
    const cookieValor = getCookie(cookieKey);
    if (cookieValor !== undefined) {
      setValor(cookieValor === "" ? null : cookieValor);
    }
  }, [cookieKey]);

  const atualizarValor = (novoValor) => {
    setValor(novoValor);
    setCookie(cookieKey, novoValor === null ? "" : novoValor, {
      maxAge: 60 * 60 * 24 * 365,
    });
  };

  return [valor, atualizarValor];
};

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
  const [showConfirmDesvincularTodos, setShowConfirmDesvincularTodos] =
    useState(false);
  const [desvinculandoProgresso, setDesvinculandoProgresso] = useState(null); // { atual, total } | null
  const [
    showConfirmDesvincularTodosGeral,
    setShowConfirmDesvincularTodosGeral,
  ] = useState(false);
  const [desvinculandoProgressoGeral, setDesvinculandoProgressoGeral] =
    useState(null); // { atual, total } | null
  const [activeModal, setActiveModal] = useState(null);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  const { tenant, ano } = params;
  const [buscaProjeto, setBuscaProjeto] = usePersistedFiltro(
    tenant,
    ano,
    "buscaProjeto",
    "",
  );
  const [areaFiltro, setAreaFiltro] = usePersistedFiltro(
    tenant,
    ano,
    "areaFiltro",
    null,
  );
  const [ordenarProjeto, setOrdenarProjeto] = usePersistedFiltro(
    tenant,
    ano,
    "ordenarProjeto",
    "padrao",
  );
  const [buscaAvaliadorProjeto, setBuscaAvaliadorProjeto] = usePersistedFiltro(
    tenant,
    ano,
    "buscaAvaliadorProjeto",
    "",
  );
  const [ordenarAvaliadorProjeto, setOrdenarAvaliadorProjeto] =
    usePersistedFiltro(tenant, ano, "ordenarAvaliadorProjeto", "nome-asc");
  const [buscaArea, setBuscaArea] = usePersistedFiltro(
    tenant,
    ano,
    "buscaArea",
    "",
  );
  const [ordenarArea, setOrdenarArea] = usePersistedFiltro(
    tenant,
    ano,
    "ordenarArea",
    "nome-asc",
  );
  const [buscaAvaliadorArea, setBuscaAvaliadorArea] = usePersistedFiltro(
    tenant,
    ano,
    "buscaAvaliadorArea",
    "",
  );
  const [ordenarAvaliadorArea, setOrdenarAvaliadorArea] = usePersistedFiltro(
    tenant,
    ano,
    "ordenarAvaliadorArea",
    "nome-asc",
  );
  const [buscaAvaliadorGeral, setBuscaAvaliadorGeral] = usePersistedFiltro(
    tenant,
    ano,
    "buscaAvaliadorGeral",
    "",
  );
  const [ordenarAvaliadorGeral, setOrdenarAvaliadorGeral] = usePersistedFiltro(
    tenant,
    ano,
    "ordenarAvaliadorGeral",
    "nome-asc",
  );
  const [buscaPendenteGeral, setBuscaPendenteGeral] = usePersistedFiltro(
    tenant,
    ano,
    "buscaPendenteGeral",
    "",
  );
  const [ordenarPendenteGeral, setOrdenarPendenteGeral] = usePersistedFiltro(
    tenant,
    ano,
    "ordenarPendenteGeral",
    "tempo-desc",
  );
  const [avaliadoresProjetoSelecionado, setAvaliadoresProjetoSelecionado] =
    useState([]);
  const [showModalAssociacao, setShowModalAssociacao] = useState(false);

  const OPCOES_ORDENACAO_AVALIADOR = [
    { label: "Nome (A-Z)", value: "nome-asc" },
    { label: "Nome (Z-A)", value: "nome-desc" },
    { label: "Área (A-Z)", value: "area-asc" },
    { label: "Mais fichas atribuídas", value: "atribuidas-desc" },
    { label: "Menos fichas atribuídas", value: "atribuidas-asc" },
    { label: "Mais fichas avaliadas", value: "avaliadas-desc" },
    { label: "Menos fichas avaliadas", value: "avaliadas-asc" },
    { label: "Mais pendentes", value: "pendentes-desc" },
    { label: "Menos pendentes", value: "pendentes-asc" },
  ];

  const OPCOES_ORDENACAO_AREA = [
    { label: "Nome (A-Z)", value: "nome-asc" },
    { label: "Nome (Z-A)", value: "nome-desc" },
    { label: "Mais projetos pendentes", value: "pendentes-desc" },
    { label: "Menos projetos pendentes", value: "pendentes-asc" },
  ];

  const OPCOES_ORDENACAO_PROJETO = [
    { label: "Padrão", value: "padrao" },
    { label: "Título (A-Z)", value: "titulo-asc" },
    { label: "Título (Z-A)", value: "titulo-desc" },
    { label: "Área (A-Z)", value: "area-asc" },
    { label: "Mais avaliadores atribuídos", value: "avaliadores-desc" },
    { label: "Menos avaliadores atribuídos", value: "avaliadores-asc" },
  ];

  const OPCOES_ORDENACAO_PENDENTE_GERAL = [
    { label: "Mais antigo primeiro", value: "tempo-desc" },
    { label: "Mais recente primeiro", value: "tempo-asc" },
    { label: "Avaliador (A-Z)", value: "avaliador-asc" },
    { label: "Projeto (A-Z)", value: "projeto-asc" },
  ];

  const normalizar = (valor) => (valor || "").toString().toLowerCase();

  const filtrarAvaliadoresPorBusca = (lista, termo) => {
    if (!termo) return lista;
    const termoNormalizado = normalizar(termo);
    return lista.filter((avaliador) => {
      const nomeMatch = normalizar(avaliador.user.nome).includes(
        termoNormalizado,
      );
      const areaMatch = avaliador.user.userArea.some((ua) =>
        normalizar(ua.area.area).includes(termoNormalizado),
      );
      return nomeMatch || areaMatch;
    });
  };

  const ordenarAvaliadores = (lista, criterio) => {
    const [campo, direcao] = criterio.split("-");
    const multiplicador = direcao === "desc" ? -1 : 1;

    return [...lista].sort((a, b) => {
      switch (campo) {
        case "nome":
          return (
            multiplicador *
            a.user.nome.localeCompare(b.user.nome, "pt-BR", {
              sensitivity: "base",
            })
          );
        case "area": {
          const areaA = a.user.userArea[0]?.area?.area || "";
          const areaB = b.user.userArea[0]?.area?.area || "";
          return (
            multiplicador *
            areaA.localeCompare(areaB, "pt-BR", { sensitivity: "base" })
          );
        }
        case "atribuidas":
          return (
            multiplicador *
            ((a.projetosAtribuidos || 0) - (b.projetosAtribuidos || 0))
          );
        case "avaliadas":
          return (
            multiplicador *
            ((a.projetosAvaliados || 0) - (b.projetosAvaliados || 0))
          );
        case "pendentes":
          return (
            multiplicador *
            ((a.projetosPendentes || 0) - (b.projetosPendentes || 0))
          );
        default:
          return 0;
      }
    });
  };

  const filtrarAreasPorBusca = (lista, termo) => {
    if (!termo) return lista;
    const termoNormalizado = normalizar(termo);
    return lista.filter((item) =>
      normalizar(item.area).includes(termoNormalizado),
    );
  };

  const ordenarAreas = (lista, criterio) => {
    const [campo, direcao] = criterio.split("-");
    const multiplicador = direcao === "desc" ? -1 : 1;

    return [...lista].sort((a, b) => {
      if (campo === "pendentes") {
        return multiplicador * (a.count - b.count);
      }
      return (
        multiplicador *
        a.area.localeCompare(b.area, "pt-BR", { sensitivity: "base" })
      );
    });
  };

  const ordenarProjetos = (lista, criterio) => {
    if (criterio === "padrao") return lista;
    const [campo, direcao] = criterio.split("-");
    const multiplicador = direcao === "desc" ? -1 : 1;

    return [...lista].sort((a, b) => {
      switch (campo) {
        case "titulo":
          return (
            multiplicador *
            (a.projeto?.titulo || "").localeCompare(
              b.projeto?.titulo || "",
              "pt-BR",
              {
                sensitivity: "base",
              },
            )
          );
        case "area": {
          const areaA = a.projeto.area?.area || "";
          const areaB = b.projeto.area?.area || "";
          return (
            multiplicador *
            areaA.localeCompare(areaB, "pt-BR", { sensitivity: "base" })
          );
        }
        case "avaliadores":
          return (
            multiplicador *
            ((a.InscricaoProjetoAvaliador?.length || 0) -
              (b.InscricaoProjetoAvaliador?.length || 0))
          );
        default:
          return 0;
      }
    });
  };

  const filtrarPendentesGeralPorBusca = (lista, termo) => {
    if (!termo) return lista;
    const termoNormalizado = normalizar(termo);
    return lista.filter(
      ({ atribuicao, avaliador }) =>
        normalizar(avaliador.user.nome).includes(termoNormalizado) ||
        normalizar(atribuicao.inscricaoProjeto?.projeto?.titulo).includes(
          termoNormalizado,
        ),
    );
  };

  const ordenarPendentesGeral = (lista, criterio) => {
    const [campo, direcao] = criterio.split("-");

    if (campo === "tempo") {
      const multiplicador = direcao === "asc" ? -1 : 1;
      return [...lista].sort(
        (a, b) =>
          multiplicador *
          (new Date(a.atribuicao.createdAt) - new Date(b.atribuicao.createdAt)),
      );
    }
    if (campo === "avaliador") {
      return [...lista].sort((a, b) =>
        a.avaliador.user.nome.localeCompare(b.avaliador.user.nome, "pt-BR", {
          sensitivity: "base",
        }),
      );
    }
    if (campo === "projeto") {
      return [...lista].sort((a, b) =>
        (a.atribuicao.inscricaoProjeto?.projeto?.titulo || "").localeCompare(
          b.atribuicao.inscricaoProjeto?.projeto?.titulo || "",
          "pt-BR",
          { sensitivity: "base" },
        ),
      );
    }
    return lista;
  };

  const renderBadgesAvaliador = (avaliador) => (
    <div className={style.badges}>
      <span className={style.badge}>
        Atribuídas:{" "}
        {avaliador.projetosAtribuidos ??
          avaliador.user.InscricaoProjetoAvaliador?.length ??
          0}
      </span>
      <span className={`${style.badge} ${style.badgeAvaliadas}`}>
        Avaliadas: {avaliador.projetosAvaliados ?? 0}
      </span>
      {(avaliador.projetosPendentes ?? 0) > 0 && (
        <span className={`${style.badge} ${style.badgePendentes}`}>
          Pendentes: {avaliador.projetosPendentes}
        </span>
      )}
    </div>
  );
  const handleSelecionarAvaliador = (avaliador) => {
    const isSelected = avaliadoresProjetoSelecionado.some(
      (a) => a.id === avaliador.id,
    );

    if (!isSelected) {
      setAvaliadoresProjetoSelecionado([
        ...avaliadoresProjetoSelecionado,
        avaliador,
      ]);
      setShowModalAssociacao(true);
    } else {
      setAvaliadoresProjetoSelecionado(
        avaliadoresProjetoSelecionado.filter((a) => a.id !== avaliador.id),
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
          setTodasAreas,
        );
        await getAvaliadoresComProjetosPendentes(params.tenant, params.ano);
        await processarInscricoes(
          params.tenant,
          setInscricoesProjetos,
          params.ano,
        );
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
          "enviada",
          params.ano,
        );
        const projetosNaoDistribuidos = response.filter(
          (projeto) => projeto.statusAvaliacao === "AGUARDANDO_AVALIACAO",
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
          {},
        );

        const areasArray = Object.entries(areasAgrupadas).map(
          ([area, count]) => ({
            area,
            count,
          }),
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
          (areaSelecionada === "Sem área definida" && !projeto.projeto.area)),
    );
  };

  const getAvaliadoresPorArea = () => {
    if (!areaSelecionada) return [];

    // Projetos "Sem área definida" podem ser avaliados por qualquer avaliador.
    if (areaSelecionada === "Sem área definida") return avaliadores;

    return avaliadores.filter((avaliador) =>
      avaliador.user.userArea.some((ua) => ua.area.area === areaSelecionada),
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
          "Nenhum projeto não distribuído encontrado para esta área",
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
        body,
      );
      if (response) {
        const { resultados } = response;
        const sucesso = resultados.filter((r) => r.success);
        const falhas = resultados.filter((r) => !r.success);

        if (sucesso.length > 0) {
          showToast(
            "success",
            sucesso.length === resultados.length
              ? "Atribuição concluída"
              : "Atribuição parcial",
            `${sucesso.length} de ${resultados.length} projeto(s) atribuídos com sucesso.`,
          );
        }

        if (falhas.length > 0) {
          falhas.forEach((r) => {
            const conflitosDetalhados =
              r.conflitos?.join("; ") || r.error || "Motivo não informado";
            showToast(
              "error",
              `Falha na atribuição do projeto ID ${r.inscricaoProjetoId}`,
              conflitosDetalhados,
            );
          });
        }

        if (sucesso.length === 0 && falhas.length === 0) {
          showToast("info", "Aviso", "Nenhuma atribuição foi realizada.");
        }
      }

      await processarInscricoes(
        params.tenant,
        setInscricoesProjetos,
        params.ano,
      );
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

  const processarInscricoes = async (tenant, setInscricoesProjetos, ano) => {
    const inscricoesProjetos = await getInscricaoProjetoByTenant(
      tenant,
      "enviada",
      ano,
    );

    const inscricoesComColunasVirtuais = inscricoesProjetos.map((inscricao) => {
      const quantidadeFichas = inscricao.FichaAvaliacao?.length || 0;
      const notaMedia =
        quantidadeFichas > 0
          ? (
              inscricao.FichaAvaliacao.reduce(
                (sum, ficha) => sum + (ficha.notaTotal || 0),
                0,
              ) / quantidadeFichas
            ).toFixed(2)
          : "N/A";

      const avaliadores = inscricao.InscricaoProjetoAvaliador.map(
        (avaliador) => avaliador.avaliador.nome,
      ).join(", ");

      const quantidadeAvaliadores =
        inscricao.InscricaoProjetoAvaliador?.length || 0;

      const notas = inscricao.FichaAvaliacao.map(
        (ficha) => ficha.notaTotal || 0,
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

  // Conta quantos dos projetos atribuídos a ESTE avaliador já têm uma
  // ficha enviada por ele (não basta o projeto ter fichas de outros
  // avaliadores — por isso o filtro por avaliadorId, igual à checagem
  // já feita mais abaixo para o painel do avaliador selecionado).
  const calcularProjetosAvaliados = (avaliador) => {
    return avaliador.user.InscricaoProjetoAvaliador.reduce(
      (total, atribuicao) => {
        const jaAvaliou = atribuicao.inscricaoProjeto?.FichaAvaliacao?.some(
          (ficha) => ficha.avaliadorId === avaliador.user.id,
        );
        return total + (jaAvaliou ? 1 : 0);
      },
      0,
    );
  };

  const atualizarAvaliadores = async (
    tenant,
    setAvaliadores,
    setTodasAreas,
  ) => {
    const avaliadores = await getCargos(tenant, {
      cargo: "avaliador",
      ano: params.ano,
    });

    const avaliadoresComColunasVirtuais = avaliadores
      .filter((a) => a.user.avaliadorAnoStatus === "CONFIRMADO")
      .map((avaliador) => {
        const projetosAvaliados = calcularProjetosAvaliados(avaliador);
        const projetosAtribuidos =
          avaliador.user.InscricaoProjetoAvaliador.length;
        return {
          ...avaliador,
          projetosAvaliados,
          projetosAtribuidos,
          projetosPendentes: projetosAtribuidos - projetosAvaliados,
          planosTrabalhoAvaliados: avaliador.user.planosTrabalhoAvaliados ?? 0,
        };
      });

    setAvaliadores(avaliadoresComColunasVirtuais || []);

    const areasUnicas = [
      ...new Set(
        avaliadores.flatMap((avaliador) =>
          avaliador.user.userArea.map((ua) => ua.area.area),
        ),
      ),
    ];
    setTodasAreas(areasUnicas.map((area) => ({ label: area, value: area })));

    return avaliadoresComColunasVirtuais || [];
  };

  // Recarrega avaliadores/inscrições e, se houver um avaliador selecionado no painel,
  // re-sincroniza essa seleção com os dados frescos (senão o painel fica com um retrato
  // desatualizado — as atribuições que acabaram de ser removidas voltariam a aparecer).
  const recarregarERessincronizarSelecao = async () => {
    await processarInscricoes(params.tenant, setInscricoesProjetos, params.ano);
    const avaliadoresAtualizados = await atualizarAvaliadores(
      params.tenant,
      setAvaliadores,
      setTodasAreas,
    );
    setAvaliadorSelecionado((atual) =>
      atual
        ? avaliadoresAtualizados.find((a) => a.id === atual.id) || null
        : null,
    );
  };

  const projetosParaDistribuir = getProjetosNaoDistribuidosPorArea().length;
  const podeAtribuir = avaliadoresList.length > 0 && projetosParaDistribuir > 0;
  const handleDesassociarAvaliador = async (
    inscricaoProjetoId,
    avaliadorId,
  ) => {
    // Armazena o ID da vinculação que está sendo removida
    setRemovendoVinculacao(inscricaoProjetoId);

    try {
      await GestorDesassociarAvaliadorInscricaoProjeto(
        params.tenant,
        inscricaoProjetoId,
        avaliadorId,
      );

      // Atualiza os dados após a remoção bem-sucedida
      await recarregarERessincronizarSelecao();

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

  const getPendentesDoAvaliadorSelecionado = () =>
    avaliadorSelecionado?.user.InscricaoProjetoAvaliador.filter(
      (atribuicao) =>
        (atribuicao.inscricaoProjeto?.FichaAvaliacao?.length || 0) === 0,
    ) || [];

  const getTodasPendentesGeral = () =>
    avaliadores.flatMap((avaliador) =>
      avaliador.user.InscricaoProjetoAvaliador.filter(
        (atribuicao) =>
          (atribuicao.inscricaoProjeto?.FichaAvaliacao?.length || 0) === 0,
      ).map((atribuicao) => ({
        inscricaoProjetoId: atribuicao.inscricaoProjetoId,
        avaliadorId: avaliador.user.id,
        label: `${atribuicao.inscricaoProjeto?.projeto?.titulo || "Projeto sem título"} (${avaliador.user.nome})`,
      })),
    );

  // Desvincula uma lista de { inscricaoProjetoId, avaliadorId, label } sequencialmente,
  // reportando progresso a cada item (não aborta no primeiro erro — segue e reporta no final).
  const desvincularEmLote = async (items, setProgresso) => {
    setProgresso({ atual: 0, total: items.length });
    let sucesso = 0;
    const falhas = [];
    for (const item of items) {
      try {
        await GestorDesassociarAvaliadorInscricaoProjeto(
          params.tenant,
          item.inscricaoProjetoId,
          item.avaliadorId,
        );
        sucesso++;
      } catch (error) {
        falhas.push(item.label);
      } finally {
        setProgresso((prev) => ({ ...prev, atual: prev.atual + 1 }));
      }
    }
    return { sucesso, falhas };
  };

  const reportarResultadoDesvinculacao = (sucesso, falhas) => {
    if (falhas.length === 0) {
      showToast(
        "success",
        "Sucesso",
        `${sucesso} vinculação(ões) removida(s) com sucesso!`,
      );
    } else {
      showToast(
        "warn",
        "Concluído com erros",
        `${sucesso} removida(s); ${falhas.length} falharam (${falhas.join(", ")}).`,
      );
    }
  };

  const handleDesvincularTodos = async () => {
    const pendentes = getPendentesDoAvaliadorSelecionado();
    setShowConfirmDesvincularTodos(false);
    if (pendentes.length === 0) return;

    const avaliadorId = avaliadorSelecionado.user.id;
    const items = pendentes.map((atribuicao) => ({
      inscricaoProjetoId: atribuicao.inscricaoProjetoId,
      avaliadorId,
      label:
        atribuicao.inscricaoProjeto?.projeto?.titulo ||
        `ID ${atribuicao.inscricaoProjetoId}`,
    }));

    const { sucesso, falhas } = await desvincularEmLote(
      items,
      setDesvinculandoProgresso,
    );

    await recarregarERessincronizarSelecao();
    setDesvinculandoProgresso(null);
    reportarResultadoDesvinculacao(sucesso, falhas);
  };

  const handleDesvincularTodosGeral = async () => {
    const pendentes = getTodasPendentesGeral();
    setShowConfirmDesvincularTodosGeral(false);
    if (pendentes.length === 0) return;

    const { sucesso, falhas } = await desvincularEmLote(
      pendentes,
      setDesvinculandoProgressoGeral,
    );

    await recarregarERessincronizarSelecao();
    setDesvinculandoProgressoGeral(null);
    reportarResultadoDesvinculacao(sucesso, falhas);
  };

  // Listas filtradas/ordenadas reaproveitadas tanto pela renderização quanto
  // pela exportação em Excel, pra não duplicar a lógica de filtro/ordenação.
  const projetosNaoDistribuidosFiltrados = ordenarProjetos(
    inscricoesProjetos.filter((projeto) => {
      const statusMatch = projeto.statusAvaliacao === "AGUARDANDO_AVALIACAO";
      const buscaMatch =
        !buscaProjeto ||
        projeto.projeto?.titulo
          ?.toLowerCase()
          .includes(buscaProjeto.toLowerCase()) ||
        projeto.inscricao?.proponente?.nome
          ?.toLowerCase()
          .includes(buscaProjeto.toLowerCase());
      const areaMatch =
        areaFiltro === null ||
        (areaFiltro === "Sem área definida"
          ? !projeto.projeto.area
          : projeto.projeto.area?.area === areaFiltro);
      return statusMatch && buscaMatch && areaMatch;
    }),
    ordenarProjeto,
  );

  const avaliadoresDisponiveisParaProjeto = projetoSelecionado
    ? ordenarAvaliadores(
        filtrarAvaliadoresPorBusca(
          avaliadores.filter(
            (avaliador) =>
              (!projetoSelecionado.projeto.area ||
                avaliador.user.userArea.some(
                  (ua) =>
                    ua.area.area === projetoSelecionado.projeto.area?.area,
                )) &&
              !projetoSelecionado.InscricaoProjetoAvaliador?.some(
                (ipa) => ipa.avaliadorId === avaliador.user.id,
              ),
          ),
          buscaAvaliadorProjeto,
        ),
        ordenarAvaliadorProjeto,
      )
    : [];

  const areasComProjetosFiltradas = ordenarAreas(
    filtrarAreasPorBusca(areasComProjetos, buscaArea),
    ordenarArea,
  );

  const avaliadoresDaAreaFiltrados = areaSelecionada
    ? ordenarAvaliadores(
        filtrarAvaliadoresPorBusca(
          getAvaliadoresPorArea(),
          buscaAvaliadorArea,
        ),
        ordenarAvaliadorArea,
      )
    : [];

  const avaliadoresGeralFiltrados = ordenarAvaliadores(
    filtrarAvaliadoresPorBusca(avaliadores, buscaAvaliadorGeral),
    ordenarAvaliadorGeral,
  );

  const projetosAvaliadosPeloAvaliadorSelecionado = avaliadorSelecionado
    ? inscricoesProjetos.filter((inscricao) =>
        inscricao.FichaAvaliacao?.some(
          (ficha) => ficha.avaliadorId === avaliadorSelecionado.user.id,
        ),
      )
    : [];

  const pendentesGeralFiltrados = ordenarPendentesGeral(
    filtrarPendentesGeralPorBusca(
      avaliadores.flatMap((avaliador) =>
        avaliador.user.InscricaoProjetoAvaliador.filter(
          (atribuicao) =>
            (atribuicao.inscricaoProjeto?.FichaAvaliacao?.length || 0) === 0,
        ).map((atribuicao) => ({
          atribuicao,
          avaliador,
        })),
      ),
      buscaPendenteGeral,
    ),
    ordenarPendenteGeral,
  );

  // Gera e baixa um .xlsx com uma ou mais abas a partir de dados já em memória
  // (mesmo padrão usado em app/.../avaliacoes/projetos/avaliadores/page.jsx).
  const exportarExcel = async (nomeArquivo, planilhas) => {
    const workbook = new ExcelJS.Workbook();
    planilhas.forEach(({ nome, colunas, linhas }) => {
      const worksheet = workbook.addWorksheet(nome);
      // Colunas marcadas com wrapText: true (ex.: texto com "\n" pra
      // simular várias linhas dentro da mesma célula) precisam desse
      // alinhamento pro Excel de fato quebrar a linha na exibição.
      worksheet.columns = colunas.map((coluna) =>
        coluna.wrapText
          ? {
              ...coluna,
              style: { alignment: { wrapText: true, vertical: "top" } },
            }
          : coluna,
      );
      linhas.forEach((linha) => worksheet.addRow(linha));
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), nomeArquivo);
  };

  const colunasAvaliador = [
    { header: "Nome", key: "nome", width: 30 },
    { header: "CPF", key: "cpf", width: 16 },
    { header: "Email", key: "email", width: 35 },
    { header: "Área(s)", key: "areas", width: 35 },
    { header: "Atribuídas", key: "atribuidas", width: 12 },
    { header: "Avaliadas", key: "avaliadas", width: 12 },
    { header: "Pendentes", key: "pendentes", width: 12 },
    { header: "Planos de trabalho avaliados", key: "planosAvaliados", width: 16 },
  ];

  const linhaAvaliador = (avaliador) => ({
    nome: avaliador.user.nome,
    cpf: avaliador.user.cpf,
    email: avaliador.user.email,
    areas: avaliador.user.userArea.map((ua) => ua.area.area).join(", "),
    atribuidas:
      avaliador.projetosAtribuidos ??
      avaliador.user.InscricaoProjetoAvaliador?.length ??
      0,
    avaliadas: avaliador.projetosAvaliados ?? 0,
    pendentes: avaliador.projetosPendentes ?? 0,
    planosAvaliados: avaliador.planosTrabalhoAvaliados ?? 0,
  });

  const exportarDistribuicaoPorProjeto = () => {
    exportarExcel("distribuicao-por-projeto.xlsx", [
      {
        nome: "Projetos",
        colunas: [
          { header: "ID", key: "id", width: 10 },
          { header: "Título", key: "titulo", width: 40 },
          { header: "Área", key: "area", width: 25 },
          { header: "Orientador", key: "orientador", width: 30 },
          { header: "Email do orientador", key: "emailOrientador", width: 35 },
          { header: "Avaliadores atribuídos", key: "avaliadores", width: 20 },
        ],
        linhas: projetosNaoDistribuidosFiltrados.map((projeto) => ({
          id: projeto.id,
          titulo: projeto.projeto?.titulo || "Projeto sem título",
          area: projeto.projeto.area?.area || "Sem área definida",
          orientador: projeto.inscricao?.proponente?.nome || "",
          emailOrientador: projeto.inscricao?.proponente?.email || "",
          avaliadores: projeto.InscricaoProjetoAvaliador?.length || 0,
        })),
      },
      {
        nome: "Avaliadores disponíveis",
        colunas: colunasAvaliador,
        linhas: avaliadoresDisponiveisParaProjeto.map(linhaAvaliador),
      },
    ]);
  };

  const exportarDistribuicaoPorArea = () => {
    // Com área selecionada, a aba de avaliadores é a mesma lista já filtrada
    // pra tela. Sem área selecionada, essa lista fica vazia na tela (o
    // usuário ainda não escolheu uma área) — pro Excel, nesse caso,
    // exportamos todos os avaliadores mesmo assim, já que o dado é útil
    // sem depender da seleção.
    const avaliadoresParaExportar = areaSelecionada
      ? avaliadoresDaAreaFiltrados
      : ordenarAvaliadores(
          filtrarAvaliadoresPorBusca(avaliadores, buscaAvaliadorArea),
          ordenarAvaliadorArea,
        );

    const areaSelecionadaInfo = areaSelecionada
      ? areasComProjetos.find((a) => a.area === areaSelecionada)
      : null;

    // Com área selecionada: quantos projetos dessa área ainda faltam
    // distribuir (mesmo valor pra todo mundo, já que a lista já está
    // restrita a quem avalia essa área). Sem área selecionada: para cada
    // área do avaliador, quantos projetos dela ainda faltam distribuir.
    const linhaComProjetosPendentesPorArea = (avaliador) => {
      const base = linhaAvaliador(avaliador);
      if (areaSelecionada) {
        return {
          ...base,
          projetosPendentesArea: areaSelecionadaInfo?.count ?? 0,
        };
      }
      const areasComPendencias = avaliador.user.userArea
        .map((ua) => ({
          area: ua.area.area,
          count:
            areasComProjetos.find((a) => a.area === ua.area.area)?.count ??
            0,
        }))
        .filter(({ count }) => count > 0)
        .sort((a, b) => b.count - a.count);

      const projetosPendentesArea = areasComPendencias.length
        ? `<ul>\n${areasComPendencias
            .map(
              ({ area, count }) =>
                `<li>${area} - ${count} projetos pendentes</li>`,
            )
            .join("\n")}\n</ul>`
        : "Nenhuma área com pendências";

      return { ...base, projetosPendentesArea };
    };

    exportarExcel("distribuicao-por-area.xlsx", [
      {
        nome: "Áreas",
        colunas: [
          { header: "Área", key: "area", width: 30 },
          {
            header: "Projetos não distribuídos",
            key: "count",
            width: 22,
          },
        ],
        linhas: areasComProjetosFiltradas.map((item) => ({
          area: item.area,
          count: item.count,
        })),
      },
      {
        nome: "Avaliadores",
        colunas: [
          { header: "Nome", key: "nome", width: 30 },
          { header: "Email", key: "email", width: 35 },
          { header: "Área(s)", key: "areas", width: 35 },
          {
            header: areaSelecionada
              ? "Projetos pendentes na área"
              : "Projetos pendentes por área",
            key: "projetosPendentesArea",
            width: areaSelecionada ? 22 : 55,
            wrapText: !areaSelecionada,
          },
          { header: "Atribuídas", key: "atribuidas", width: 12 },
          { header: "Avaliadas", key: "avaliadas", width: 12 },
          { header: "Pendentes", key: "pendentes", width: 12 },
        ],
        linhas: avaliadoresParaExportar.map(linhaComProjetosPendentesPorArea),
      },
    ]);
  };

  const exportarAvaliadoresXProjetos = () => {
    const pendentes = getPendentesDoAvaliadorSelecionado().map(
      (atribuicao) => {
        const tempo = calcularTempoDesdeAtribuicao(atribuicao.createdAt);
        return {
          projeto:
            atribuicao.inscricaoProjeto?.projeto?.titulo ||
            "Projeto sem título",
          id: atribuicao.inscricaoProjeto?.id,
          status: "Pendente",
          tempoOuNota: tempo.display,
          mediaGeral: "",
        };
      },
    );

    const avaliados = projetosAvaliadosPeloAvaliadorSelecionado.map(
      (inscricao) => {
        const fichaDoAvaliador = inscricao.FichaAvaliacao?.find(
          (ficha) => ficha.avaliadorId === avaliadorSelecionado.user.id,
        );
        return {
          projeto: inscricao.projeto?.titulo || "Projeto sem título",
          id: inscricao.id,
          status: "Avaliado",
          tempoOuNota: fichaDoAvaliador?.notaTotal?.toFixed(2) ?? "",
          mediaGeral: inscricao.notaMedia,
        };
      },
    );

    exportarExcel("avaliadores-x-projetos.xlsx", [
      {
        nome: "Avaliadores",
        colunas: colunasAvaliador,
        linhas: avaliadoresGeralFiltrados.map(linhaAvaliador),
      },
      {
        nome: "Projetos do avaliador selecionado",
        colunas: [
          { header: "Projeto", key: "projeto", width: 40 },
          { header: "ID", key: "id", width: 10 },
          { header: "Status", key: "status", width: 14 },
          {
            header: "Tempo desde atribuição / Sua nota",
            key: "tempoOuNota",
            width: 25,
          },
          { header: "Média geral", key: "mediaGeral", width: 14 },
        ],
        linhas: [...pendentes, ...avaliados],
      },
    ]);
  };

  const exportarAvaliacoesPendentesGeral = () => {
    exportarExcel("avaliacoes-pendentes-geral.xlsx", [
      {
        nome: "Pendentes",
        colunas: [
          { header: "Projeto", key: "projeto", width: 40 },
          { header: "ID", key: "id", width: 10 },
          { header: "Avaliador", key: "avaliador", width: 30 },
          { header: "Email do avaliador", key: "emailAvaliador", width: 35 },
          { header: "Aguardando há", key: "aguardando", width: 20 },
          { header: "Atribuído em", key: "atribuidoEm", width: 20 },
        ],
        linhas: pendentesGeralFiltrados.map(({ atribuicao, avaliador }) => {
          const tempo = calcularTempoDesdeAtribuicao(atribuicao.createdAt);
          return {
            projeto:
              atribuicao.inscricaoProjeto?.projeto?.titulo ||
              "Projeto sem título",
            id: atribuicao.inscricaoProjeto?.id,
            avaliador: avaliador.user.nome,
            emailAvaliador: avaliador.user.email,
            aguardando: tempo.display,
            atribuidoEm: new Date(atribuicao.createdAt).toLocaleString(
              "pt-BR",
            ),
          };
        }),
      },
    ]);
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
                  avaliadoresProjetoSelecionado.slice(0, -1),
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
                    body,
                  );

                  // Verifica se a resposta tem a estrutura de resultados
                  if (response && response.resultados) {
                    const resultado = response.resultados[0]; // Pega o primeiro resultado (só tem um projeto)

                    if (resultado.success) {
                      showToast(
                        "success",
                        "Associação realizada",
                        `Avaliador associado ao projeto com sucesso!`,
                      );

                      // Atualiza os dados
                      await processarInscricoes(
                        params.tenant,
                        setInscricoesProjetos,
                        params.ano,
                      );
                      await atualizarAvaliadores(
                        params.tenant,
                        setAvaliadores,
                        setTodasAreas,
                      );

                      // Limpa seleções
                      setAvaliadoresProjetoSelecionado([]);
                      setProjetoSelecionado(null);
                    } else {
                      // TRATAMENTO ESPECÍFICO PARA O FORMATO DE ERRO
                      let mensagemErro =
                        resultado.error || "Erro na associação do avaliador";

                      // Adiciona conflitos se existirem, separados por ;
                      if (
                        resultado.conflitos &&
                        resultado.conflitos.length > 0
                      ) {
                        mensagemErro += `; ${resultado.conflitos.join("; ")}`;
                      }

                      showToast(
                        "error",
                        `Falha na associação do projeto ID ${resultado.inscricaoProjetoId}`,
                        mensagemErro,
                      );

                      // Remove o avaliador em caso de erro
                      setAvaliadoresProjetoSelecionado(
                        avaliadoresProjetoSelecionado.slice(0, -1),
                      );
                    }
                  } else if (response) {
                    // Caso a resposta não tenha a estrutura esperada, mas não é um erro
                    showToast(
                      "success",
                      "Associação realizada",
                      `Avaliador associado ao projeto com sucesso!`,
                    );

                    await processarInscricoes(
                      params.tenant,
                      setInscricoesProjetos,
                      params.ano,
                    );
                    await atualizarAvaliadores(
                      params.tenant,
                      setAvaliadores,
                      setTodasAreas,
                    );

                    setAvaliadoresProjetoSelecionado([]);
                    setProjetoSelecionado(null);
                  }
                } catch (error) {
                  // Remove o avaliador em caso de erro
                  setAvaliadoresProjetoSelecionado(
                    avaliadoresProjetoSelecionado.slice(0, -1),
                  );

                  // Tratamento de erros de rede ou outros erros inesperados
                  const errorData = error.response?.data;

                  if (errorData?.resultados) {
                    // Se o erro vier no formato de resultados
                    const resultado = errorData.resultados[0];
                    let mensagemErro = resultado.error || "Erro na associação";
                    if (resultado.conflitos && resultado.conflitos.length > 0) {
                      mensagemErro += `; ${resultado.conflitos.join("; ")}`;
                    }
                    showToast(
                      "error",
                      `Falha na associação do projeto ID ${resultado.inscricaoProjetoId}`,
                      mensagemErro,
                    );
                  } else {
                    const errorMessage =
                      errorData?.message ||
                      error.message ||
                      "Erro ao associar avaliador ao projeto.";
                    showToast("error", "Erro", errorMessage);
                  }
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
      <Modal
        isOpen={showConfirmDesvincularTodos}
        onClose={() => setShowConfirmDesvincularTodos(false)}
        size="small"
      >
        <div className={style.modalAssociacao}>
          <h5 className="mb-2">Desvincular todos os projetos?</h5>
          <p>
            Isso vai remover a vinculação de{" "}
            <strong>{avaliadorSelecionado?.user.nome}</strong> com{" "}
            <strong>{getPendentesDoAvaliadorSelecionado().length}</strong>{" "}
            projeto(s) ainda não avaliado(s). Essa ação não afeta projetos já
            avaliados por ele(a).
          </p>

          <div className={style.modalActions}>
            <Button
              className="button btn-secondary"
              onClick={() => setShowConfirmDesvincularTodos(false)}
            >
              Cancelar
            </Button>
            <Button
              className="button btn-primary"
              onClick={handleDesvincularTodos}
            >
              Desvincular tudo
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showConfirmDesvincularTodosGeral}
        onClose={() => setShowConfirmDesvincularTodosGeral(false)}
        size="small"
      >
        <div className={style.modalAssociacao}>
          <h5 className="mb-2">Desvincular todas as avaliações pendentes?</h5>
          <p>
            Isso vai remover a vinculação de{" "}
            <strong>{getTodasPendentesGeral().length}</strong> atribuições ainda
            não avaliadas, de <strong>todos os avaliadores</strong>. Essa ação
            não afeta projetos já avaliados.
          </p>

          <div className={style.modalActions}>
            <Button
              className="button btn-secondary"
              onClick={() => setShowConfirmDesvincularTodosGeral(false)}
            >
              Cancelar
            </Button>
            <Button
              className="button btn-primary"
              onClick={handleDesvincularTodosGeral}
            >
              Desvincular tudo
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
          <div className="flex-space mb-2">
            <h5>Distribuição por projeto específico</h5>
            <RiFileExcelLine
              className={`${style.icon} cursor-pointer`}
              onClick={exportarDistribuicaoPorProjeto}
              title="Baixar em Excel"
            />
          </div>
          <div className={`${style.distribuicao}`}>
            <div className={`${style.distribuicaoCard} ${style.projetos}`}>
              <div className={style.scrollableContainer}>
                <div className={style.listToolbar}>
                  <span className={style.searchBox}>
                    <RiSearchLine className={style.searchIcon} />
                    <InputText
                      placeholder="Buscar projeto ou orientador..."
                      value={buscaProjeto}
                      onChange={(e) => setBuscaProjeto(e.target.value)}
                    />
                  </span>

                  <div className={style.toolbarDropdowns}>
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
                      className={style.sortDropdown}
                    />

                    <Dropdown
                      value={ordenarProjeto}
                      options={OPCOES_ORDENACAO_PROJETO}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setOrdenarProjeto(e.value)}
                      placeholder="Ordenar por"
                      className={style.sortDropdown}
                    />
                  </div>
                </div>

                <ul>
                  {projetosNaoDistribuidosFiltrados.map((projeto, index) => (
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
                          {projeto.projeto?.titulo || "Projeto sem título"} - ID{" "}
                          {projeto.id}
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

                    <div className={style.listToolbar}>
                      <span className={style.searchBox}>
                        <RiSearchLine className={style.searchIcon} />
                        <InputText
                          placeholder="Buscar avaliador ou área..."
                          value={buscaAvaliadorProjeto}
                          onChange={(e) =>
                            setBuscaAvaliadorProjeto(e.target.value)
                          }
                        />
                      </span>
                      <div className={style.toolbarDropdowns}>
                        <Dropdown
                          value={ordenarAvaliadorProjeto}
                          options={OPCOES_ORDENACAO_AVALIADOR}
                          optionLabel="label"
                          optionValue="value"
                          onChange={(e) => setOrdenarAvaliadorProjeto(e.value)}
                          placeholder="Ordenar por"
                          className={style.sortDropdown}
                        />
                      </div>
                    </div>

                    <ul>
                      {avaliadores.length === 0 ? (
                        <li>
                          <div className={style.content}>
                            <NoData description="Nenhum avaliador disponível" />
                          </div>
                        </li>
                      ) : (
                        avaliadoresDisponiveisParaProjeto.map(
                          (avaliador, index) => (
                          <li
                            key={index}
                            onClick={() => handleSelecionarAvaliador(avaliador)}
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
                                    +{avaliador.user.userArea.length - 1} outras
                                    áreas
                                  </span>
                                )}
                              </p>
                              {renderBadgesAvaliador(avaliador)}
                            </div>
                          </li>
                          ),
                        )
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
          <div className="flex-space mb-2">
            <h5>Distribuição por área</h5>
            <RiFileExcelLine
              className={`${style.icon} cursor-pointer`}
              onClick={exportarDistribuicaoPorArea}
              title="Baixar em Excel"
            />
          </div>
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
                <div className={style.listToolbar}>
                  <span className={style.searchBox}>
                    <RiSearchLine className={style.searchIcon} />
                    <InputText
                      placeholder="Buscar área..."
                      value={buscaArea}
                      onChange={(e) => setBuscaArea(e.target.value)}
                    />
                  </span>
                  <div className={style.toolbarDropdowns}>
                    <Dropdown
                      value={ordenarArea}
                      options={OPCOES_ORDENACAO_AREA}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setOrdenarArea(e.value)}
                      placeholder="Ordenar por"
                      className={style.sortDropdown}
                    />
                  </div>
                </div>
                <ul>
                  {areasComProjetos.length > 0 ? (
                    areasComProjetosFiltradas.map((item, index) => (
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
                <div className={style.listToolbar}>
                  <span className={style.searchBox}>
                    <RiSearchLine className={style.searchIcon} />
                    <InputText
                      placeholder="Buscar avaliador ou área..."
                      value={buscaAvaliadorArea}
                      onChange={(e) => setBuscaAvaliadorArea(e.target.value)}
                    />
                  </span>
                  <div className={style.toolbarDropdowns}>
                    <Dropdown
                      value={ordenarAvaliadorArea}
                      options={OPCOES_ORDENACAO_AVALIADOR}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setOrdenarAvaliadorArea(e.value)}
                      placeholder="Ordenar por"
                      className={style.sortDropdown}
                    />
                  </div>
                </div>
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
                    avaliadoresDaAreaFiltrados.map((avaliador, index) => (
                      <li
                        key={index}
                        onClick={(e) => {
                          if (e.target.tagName !== "INPUT") {
                            const isChecked = avaliadoresList.some(
                              (a) => a.id === avaliador.id,
                            );
                            if (isChecked) {
                              setAvaliadoresList(
                                avaliadoresList.filter(
                                  (a) => a.id !== avaliador.id,
                                ),
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
                                    (a) => a.id !== avaliador.id,
                                  ),
                                );
                              }
                            }}
                            checked={avaliadoresList.some(
                              (a) => a.id === avaliador.id,
                            )}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
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
                                +{avaliador.user.userArea.length - 1} outras
                                áreas
                              </span>
                            )}
                          </p>
                          {renderBadgesAvaliador(avaliador)}
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
          <div className="flex-space mb-2">
            <h5>Avaliadores x Projetos</h5>
            <RiFileExcelLine
              className={`${style.icon} cursor-pointer`}
              onClick={exportarAvaliadoresXProjetos}
              title="Baixar em Excel"
            />
          </div>
          <div className={`${style.distribuicao}`}>
            <div className={`${style.distribuicaoCard} ${style.avaliadores}`}>
              <div className={style.scrollableContainer}>
                <div className={style.listToolbar}>
                  <span className={style.searchBox}>
                    <RiSearchLine className={style.searchIcon} />
                    <InputText
                      placeholder="Buscar avaliador ou área..."
                      value={buscaAvaliadorGeral}
                      onChange={(e) => setBuscaAvaliadorGeral(e.target.value)}
                    />
                  </span>
                  <div className={style.toolbarDropdowns}>
                    <Dropdown
                      value={ordenarAvaliadorGeral}
                      options={OPCOES_ORDENACAO_AVALIADOR}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setOrdenarAvaliadorGeral(e.value)}
                      placeholder="Ordenar por"
                      className={style.sortDropdown}
                    />
                  </div>
                </div>
                <ul>
                  {avaliadoresGeralFiltrados.map((avaliador, index) => (
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
                        <h6>{avaliador.user.nome}</h6>
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
                        {renderBadgesAvaliador(avaliador)}
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
                    <div className={`${style.listHeaderComAcao} mt-2 mb-2`}>
                      <h6 className="ml-2">Aguardando avaliação</h6>
                      {desvinculandoProgresso ? (
                        <span className={style.progressoDesvincular}>
                          <i className="pi pi-spinner pi-spin" />
                          Desvinculando {desvinculandoProgresso.atual}/
                          {desvinculandoProgresso.total}...
                        </span>
                      ) : (
                        !desvinculandoProgressoGeral &&
                        getPendentesDoAvaliadorSelecionado().length > 0 && (
                          <Button
                            className={`button btn-secondary ${style.desvincularTudoBtn}`}
                            onClick={() => setShowConfirmDesvincularTodos(true)}
                          >
                            Desvincular tudo
                          </Button>
                        )
                      )}
                    </div>
                    <ul>
                      {avaliadorSelecionado.user.InscricaoProjetoAvaliador.filter(
                        (atribuicao) =>
                          (atribuicao.inscricaoProjeto?.FichaAvaliacao
                            ?.length || 0) === 0 &&
                          removendoVinculacao !== atribuicao.inscricaoProjetoId,
                      )
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt) - new Date(b.createdAt),
                        )
                        .map((atribuicao, idx) => {
                          const tempo = calcularTempoDesdeAtribuicao(
                            atribuicao.createdAt,
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
                                ) : desvinculandoProgresso ||
                                  desvinculandoProgressoGeral ? (
                                  <RiDeleteBinLine
                                    className={style.deleteIcon}
                                    style={{
                                      opacity: 0.4,
                                      cursor: "not-allowed",
                                    }}
                                    title="Aguarde a desvinculação em massa terminar"
                                  />
                                ) : (
                                  <RiDeleteBinLine
                                    className={style.deleteIcon}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDesassociarAvaliador(
                                        atribuicao.inscricaoProjetoId,
                                        avaliadorSelecionado.user.id,
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
                      {projetosAvaliadosPeloAvaliadorSelecionado.length > 0 ? (
                        projetosAvaliadosPeloAvaliadorSelecionado
                          .map((inscricao, idx) => {
                            const fichasDoAvaliador =
                              inscricao.FichaAvaliacao?.filter(
                                (ficha) =>
                                  ficha.avaliadorId ===
                                  avaliadorSelecionado.user.id,
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
                                          2,
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
          <div className={style.listHeaderComAcao}>
            <h5 className="mb-2">Avaliações pendentes (geral)</h5>
            <RiFileExcelLine
              className={`${style.icon} cursor-pointer`}
              onClick={exportarAvaliacoesPendentesGeral}
              title="Baixar em Excel"
            />
          </div>
          <div className={style.distribuicao}>
            <div className={`${style.distribuicaoCard} ${style.projetos}`}>
              <div className={style.scrollableContainer}>
                <div className={style.listToolbar}>
                  <span className={style.searchBox}>
                    <RiSearchLine className={style.searchIcon} />
                    <InputText
                      placeholder="Buscar avaliador ou projeto..."
                      value={buscaPendenteGeral}
                      onChange={(e) => setBuscaPendenteGeral(e.target.value)}
                    />
                  </span>
                  <div className={style.toolbarDropdowns}>
                    <Dropdown
                      value={ordenarPendenteGeral}
                      options={OPCOES_ORDENACAO_PENDENTE_GERAL}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => setOrdenarPendenteGeral(e.value)}
                      placeholder="Ordenar por"
                      className={style.sortDropdown}
                    />
                  </div>
                </div>
                <ul>
                  {pendentesGeralFiltrados.map(({ atribuicao, avaliador }, idx) => {
                    const tempo = calcularTempoDesdeAtribuicao(
                      atribuicao.createdAt,
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
                              <strong>Avaliador:</strong> {avaliador.user.nome}
                            </p>
                          </div>
                        </div>
                        <div className={style.actions}>
                          {removendoVinculacao === projetoId ? (
                            <i
                              className="pi pi-spinner pi-spin"
                              style={{ marginLeft: "10px" }}
                            />
                          ) : desvinculandoProgresso ||
                            desvinculandoProgressoGeral ? (
                            <RiDeleteBinLine
                              className={style.deleteIcon}
                              style={{ opacity: 0.4, cursor: "not-allowed" }}
                              title="Aguarde a desvinculação em massa terminar"
                            />
                          ) : (
                            <RiDeleteBinLine
                              className={style.deleteIcon}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDesassociarAvaliador(
                                  projetoId,
                                  avaliador.user.id,
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
                      (ap.inscricaoProjeto?.FichaAvaliacao?.length || 0) > 0,
                  ),
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
