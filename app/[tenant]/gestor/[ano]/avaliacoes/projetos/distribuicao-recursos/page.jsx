"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "primereact/card";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import {
  RiSearchLine,
  RiTimeLine,
  RiDeleteBinLine,
  RiArrowGoBackLine,
  RiScales3Line,
  RiSettings5Line,
  RiToggleFill,
  RiToggleLine,
} from "@remixicon/react";

import style from "./page.module.scss";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import Button from "@/components/Button";
import NoData from "@/components/NoData";
import Skeleton from "@/components/Skeleton";
import TabelaRecursosGestor from "@/components/tabelas/TabelaRecursosGestor";
import calcularTempoDesdeAtribuicao from "@/lib/calcularTempoDesdeAtribuicao";
import {
  listarPlanosComRecursoGestor,
  listarAvaliadoresElegiveisParaFamiliaRecurso,
  atribuicaoDeRecursosPeloGestor,
  reverterAnaliseRecursoGestor,
  atualizarHabilitarRecurso,
} from "@/app/api/client/recurso";
import { getCargos } from "@/app/api/client/cargo";
import { getEditais, updateEdital } from "@/app/api/client/edital";
import { atualizarHabilitarNotaFinal } from "@/app/api/client/resultado";

const ABAS = [
  { id: "distribuicao", label: "Distribuição" },
  { id: "resultados", label: "Resultados e Recursos" },
];

// Mesmo padrão de opções de ordenação de
// avaliacoes/projetos/distribuicao-projetos/page.jsx — valor no formato
// "campo-direcao", separado só pra decidir asc/desc onde faz sentido.
const OPCOES_ORDENACAO_FAMILIA = [
  { label: "Título (A-Z)", value: "titulo-asc" },
  { label: "Título (Z-A)", value: "titulo-desc" },
  { label: "Área (A-Z)", value: "area-asc" },
  { label: "Mais pendentes primeiro", value: "pendentes-desc" },
  { label: "Menos pendentes primeiro", value: "pendentes-asc" },
];

const OPCOES_ORDENACAO_NOME = [
  { label: "Nome (A-Z)", value: "nome-asc" },
  { label: "Nome (Z-A)", value: "nome-desc" },
];

const OPCOES_ORDENACAO_AREA = [
  { label: "Nome (A-Z)", value: "nome-asc" },
  { label: "Nome (Z-A)", value: "nome-desc" },
  { label: "Mais famílias pendentes", value: "pendentes-desc" },
  { label: "Menos famílias pendentes", value: "pendentes-asc" },
];

const OPCOES_ORDENACAO_AVALIADOR_AREA = [
  { label: "Nome (A-Z)", value: "nome-asc" },
  { label: "Nome (Z-A)", value: "nome-desc" },
  { label: "Área (A-Z)", value: "area-asc" },
];

const OPCOES_ORDENACAO_AVALIADOR_RECURSO = [
  { label: "Nome (A-Z)", value: "nome-asc" },
  { label: "Nome (Z-A)", value: "nome-desc" },
  { label: "Mais em análise", value: "emanalise-desc" },
  { label: "Mais analisados", value: "analisados-desc" },
];

const OPCOES_ORDENACAO_EM_ANALISE_GERAL = [
  { label: "Mais antigo primeiro", value: "tempo-asc" },
  { label: "Mais recente primeiro", value: "tempo-desc" },
  { label: "Avaliador (A-Z)", value: "avaliador-asc" },
  { label: "Família (A-Z)", value: "familia-asc" },
];

const Page = ({ params }) => {
  const toast = useRef(null);

  const [abaAtiva, setAbaAtiva] = useState("distribuicao");

  // Lê ?aba=resultados na URL (usado pelo link "Voltar para Resultados e
  // Recursos" da página de análise) sem useSearchParams — evitaria exigir um
  // boundary de Suspense sem necessidade real nesta página 100% client-side.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const aba = new URLSearchParams(window.location.search).get("aba");
      if (aba === "resultados") setAbaAtiva("resultados");
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [familias, setFamilias] = useState([]);
  const [avaliadores, setAvaliadores] = useState([]);

  // Aba "Resultados e Recursos" — configuração por edital (Resultado/Recurso/Nota Final)
  const [editais, setEditais] = useState([]);
  const [loadingEditais, setLoadingEditais] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [modalConfigAberto, setModalConfigAberto] = useState(false);

  // Card 1 — distribuição individual
  const [buscaFamilia, setBuscaFamilia] = useState("");
  const [ordenarFamilia, setOrdenarFamilia] = useState("titulo-asc");
  const [familiaSelecionada, setFamiliaSelecionada] = useState(null);
  const [avaliadoresElegiveis, setAvaliadoresElegiveis] = useState([]);
  const [buscaAvaliadorElegivel, setBuscaAvaliadorElegivel] = useState("");
  const [ordenarAvaliadorElegivel, setOrdenarAvaliadorElegivel] = useState("nome-asc");
  const [carregandoElegiveis, setCarregandoElegiveis] = useState(false);
  const [avaliadorParaConfirmar, setAvaliadorParaConfirmar] = useState(null);
  const [associando, setAssociando] = useState(false);

  // Card 2 — distribuição em lote por área
  const [buscaArea, setBuscaArea] = useState("");
  const [ordenarArea, setOrdenarArea] = useState("nome-asc");
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [buscaAvaliadorArea, setBuscaAvaliadorArea] = useState("");
  const [ordenarAvaliadorArea, setOrdenarAvaliadorArea] = useState("nome-asc");
  const [avaliadoresList, setAvaliadoresList] = useState([]);
  const [checked, setChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Card 3 — Avaliadores x Recursos
  const [buscaAvaliadorRecurso, setBuscaAvaliadorRecurso] = useState("");
  const [ordenarAvaliadorRecurso, setOrdenarAvaliadorRecurso] = useState("nome-asc");
  const [avaliadorRecursoSelecionado, setAvaliadorRecursoSelecionado] = useState(null);
  const [familiaParaDevolver, setFamiliaParaDevolver] = useState(null);
  const [devolvendo, setDevolvendo] = useState(false);
  const [erroDevolver, setErroDevolver] = useState("");
  const [devolvendoTudoAberto, setDevolvendoTudoAberto] = useState(false);
  const [devolvendoProgresso, setDevolvendoProgresso] = useState(null);

  // Card 4 — Recursos em análise (geral)
  const [buscaEmAnaliseGeral, setBuscaEmAnaliseGeral] = useState("");
  const [ordenarEmAnaliseGeral, setOrdenarEmAnaliseGeral] = useState("tempo-asc");

  const fetchFamilias = async () => {
    setLoading(true);
    try {
      const planos = await listarPlanosComRecursoGestor(params.tenant, params.ano);
      setFamilias(planos || []);
    } catch (error) {
      console.error("Erro ao buscar famílias com recurso:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvaliadores = async () => {
    try {
      const cargos = await getCargos(params.tenant, { cargo: "avaliador", ano: params.ano });
      setAvaliadores((cargos || []).filter((a) => a.user.avaliadorAnoStatus === "CONFIRMADO"));
    } catch (error) {
      console.error("Erro ao buscar avaliadores:", error);
    }
  };

  useEffect(() => {
    fetchFamilias();
    fetchAvaliadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tenant, params.ano]);

  const fetchEditais = useCallback(async () => {
    setLoadingEditais(true);
    try {
      const data = await getEditais(params.tenant, params.ano);
      setEditais(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar editais:", error);
    } finally {
      setLoadingEditais(false);
    }
  }, [params.tenant, params.ano]);

  useEffect(() => {
    fetchEditais();
  }, [fetchEditais]);

  // Usa sempre o edital retornado pelo backend pra atualizar o estado local
  // (não só mescla o campo tocado): a cascata do backend (desligar resultado
  // desliga recurso/nota final; recurso e nota final são mutuamente
  // exclusivos) altera campos que o front não pediu explicitamente, então a
  // resposta do servidor é a fonte da verdade.
  const handleToggleResultado = async (edital) => {
    const novoValor = !edital.habilitarResultados;
    setSavingId(edital.id);
    try {
      const editalAtualizado = await updateEdital(params.tenant, edital.id, {
        habilitarResultados: novoValor,
      });
      setEditais((prev) =>
        prev.map((e) => (e.id === edital.id ? { ...e, ...editalAtualizado } : e))
      );
    } catch (error) {
      console.error("Erro ao atualizar edital:", error);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleRecurso = async (edital) => {
    const novoValor = !edital.habilitarRecurso;
    setSavingId(edital.id);
    try {
      const editalAtualizado = await atualizarHabilitarRecurso(
        params.tenant,
        edital.id,
        novoValor
      );
      setEditais((prev) =>
        prev.map((e) => (e.id === edital.id ? { ...e, ...editalAtualizado } : e))
      );
    } catch (error) {
      console.error("Erro ao atualizar habilitação de recurso:", error);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleNotaFinal = async (edital) => {
    const novoValor = !edital.habilitarNotaFinal;
    setSavingId(edital.id);
    try {
      const editalAtualizado = await atualizarHabilitarNotaFinal(
        params.tenant,
        edital.id,
        novoValor
      );
      setEditais((prev) =>
        prev.map((e) => (e.id === edital.id ? { ...e, ...editalAtualizado } : e))
      );
    } catch (error) {
      console.error("Erro ao atualizar habilitação de nota final:", error);
    } finally {
      setSavingId(null);
    }
  };

  // Famílias ainda disponíveis pra distribuir: têm item pendente e ninguém
  // as reivindicou ainda (emAnaliseCom null) — mesmo espírito de "projetos
  // não distribuídos" na tela de projetos.
  const familiasDisponiveis = familias.filter((f) => f.pendentes > 0 && !f.emAnaliseCom);

  const familiasFiltradas = familiasDisponiveis
    .filter((f) => (f.titulo || "").toLowerCase().includes(buscaFamilia.toLowerCase()))
    .sort((a, b) => {
      const [campo, direcao] = ordenarFamilia.split("-");
      const mult = direcao === "desc" ? -1 : 1;
      if (campo === "area") {
        return mult * (a.area?.area || "").localeCompare(b.area?.area || "", "pt-BR", { sensitivity: "base" });
      }
      if (campo === "pendentes") {
        return mult * (a.pendentes - b.pendentes);
      }
      return mult * (a.titulo || "").localeCompare(b.titulo || "", "pt-BR", { sensitivity: "base" });
    });

  const avaliadoresElegiveisFiltrados = avaliadoresElegiveis
    .filter((a) => a.nome.toLowerCase().includes(buscaAvaliadorElegivel.toLowerCase()))
    .sort((a, b) => {
      const mult = ordenarAvaliadorElegivel === "nome-desc" ? -1 : 1;
      return mult * a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
    });

  const handleSelecionarFamilia = async (familia) => {
    setFamiliaSelecionada(familia);
    setAvaliadoresElegiveis([]);
    setBuscaAvaliadorElegivel("");
    setCarregandoElegiveis(true);
    try {
      const lista = await listarAvaliadoresElegiveisParaFamiliaRecurso(params.tenant, familia.id, params.ano);
      setAvaliadoresElegiveis(lista || []);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Não foi possível carregar avaliadores elegíveis.",
        life: 4000,
      });
    } finally {
      setCarregandoElegiveis(false);
    }
  };

  const handleConfirmarAssociacaoIndividual = async () => {
    if (!familiaSelecionada || !avaliadorParaConfirmar) return;
    setAssociando(true);
    try {
      const resposta = await atribuicaoDeRecursosPeloGestor(params.tenant, {
        familias: [familiaSelecionada.id],
        avaliadores: [avaliadorParaConfirmar.id],
        recursosPorAvaliador: 1,
      });
      const resultado = resposta?.resultados?.[0];
      if (resultado?.success) {
        toast.current?.show({
          severity: "success",
          summary: "Associação realizada",
          detail: `Avaliador associado à família com sucesso!`,
          life: 4000,
        });
        setFamiliaSelecionada(null);
        setAvaliadoresElegiveis([]);
        await fetchFamilias();
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Falha na associação",
          detail: resultado?.conflitos?.join("; ") || resultado?.error || "Não foi possível associar.",
          life: 5000,
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Não foi possível associar o avaliador.",
        life: 5000,
      });
    } finally {
      setAssociando(false);
      setAvaliadorParaConfirmar(null);
    }
  };

  // Áreas com famílias disponíveis, agrupadas por areaId (mesma família nunca
  // aparece em duas áreas, então basta contar por areaId).
  const areasComFamilias = Object.values(
    familiasDisponiveis.reduce((acc, f) => {
      const chave = f.areaId ?? "sem-area";
      if (!acc[chave]) {
        acc[chave] = { areaId: f.areaId, nome: f.area?.area || "Sem área definida", count: 0 };
      }
      acc[chave].count++;
      return acc;
    }, {}),
  );

  const familiasDaAreaSelecionada = areaSelecionada
    ? familiasDisponiveis.filter((f) => (f.areaId ?? "sem-area") === (areaSelecionada.areaId ?? "sem-area"))
    : [];

  const areasComFamiliasFiltradas = areasComFamilias
    .filter((item) => item.nome.toLowerCase().includes(buscaArea.toLowerCase()))
    .sort((a, b) => {
      const [campo, direcao] = ordenarArea.split("-");
      const mult = direcao === "desc" ? -1 : 1;
      if (campo === "pendentes") return mult * (a.count - b.count);
      return mult * a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
    });

  const avaliadoresDaArea = areaSelecionada
    ? avaliadores.filter((a) =>
        areaSelecionada.areaId
          ? a.user.userArea.some((ua) => ua.area?.id === areaSelecionada.areaId)
          : true,
      )
    : [];

  const avaliadoresDaAreaFiltrados = avaliadoresDaArea
    .filter((a) => {
      const termo = buscaAvaliadorArea.toLowerCase();
      if (!termo) return true;
      const nomeArea = a.user.userArea?.[0]?.area?.area || "";
      return a.user.nome.toLowerCase().includes(termo) || nomeArea.toLowerCase().includes(termo);
    })
    .sort((a, b) => {
      const [campo, direcao] = ordenarAvaliadorArea.split("-");
      const mult = direcao === "desc" ? -1 : 1;
      if (campo === "area") {
        const areaA = a.user.userArea?.[0]?.area?.area || "";
        const areaB = b.user.userArea?.[0]?.area?.area || "";
        return mult * areaA.localeCompare(areaB, "pt-BR", { sensitivity: "base" });
      }
      return mult * a.user.nome.localeCompare(b.user.nome, "pt-BR", { sensitivity: "base" });
    });

  const handleSelectAll = (e) => {
    setChecked(e.checked);
    setAvaliadoresList(e.checked ? avaliadoresDaAreaFiltrados.map((a) => a.user) : []);
  };

  const handleAtribuicaoEmLote = async () => {
    if (!areaSelecionada || avaliadoresList.length === 0) return;
    setIsProcessing(true);
    try {
      const recursosPorAvaliador = Math.max(
        1,
        Math.ceil(familiasDaAreaSelecionada.length / avaliadoresList.length),
      );
      const resposta = await atribuicaoDeRecursosPeloGestor(params.tenant, {
        familias: familiasDaAreaSelecionada.map((f) => f.id),
        avaliadores: avaliadoresList.map((a) => a.id),
        recursosPorAvaliador,
      });
      const resultados = resposta?.resultados || [];
      const sucesso = resultados.filter((r) => r.success);
      const falhas = resultados.filter((r) => !r.success);

      if (sucesso.length > 0) {
        toast.current?.show({
          severity: "success",
          summary: sucesso.length === resultados.length ? "Distribuição concluída" : "Distribuição parcial",
          detail: `${sucesso.length} de ${resultados.length} família(s) distribuída(s) com sucesso.`,
          life: 4000,
        });
      }
      falhas.forEach((r) => {
        toast.current?.show({
          severity: "error",
          summary: `Falha na distribuição da família ID ${r.planoId}`,
          detail: r.conflitos?.join("; ") || r.error || "Motivo não informado",
          life: 6000,
        });
      });
      if (sucesso.length === 0 && falhas.length === 0) {
        toast.current?.show({ severity: "info", summary: "Aviso", detail: "Nenhuma distribuição foi realizada." });
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.message || "Erro ao distribuir recursos.",
        life: 5000,
      });
    } finally {
      setIsProcessing(false);
      setAvaliadoresList([]);
      setChecked(false);
      await fetchFamilias();
    }
  };

  // ─── Card 3: Avaliadores x Recursos ───────────────────────────────────────
  const familiasEmAnalisePorAvaliador = (avaliadorId) =>
    familias.filter((f) => f.emAnaliseCom?.id === avaliadorId);
  const familiasAnalisadasPorAvaliador = (avaliadorId) =>
    familias.filter((f) => f.decididoPor?.id === avaliadorId);

  const avaliadoresRecursoFiltrados = avaliadores
    .filter((a) => {
      const termo = buscaAvaliadorRecurso.toLowerCase();
      if (!termo) return true;
      const nomeArea = a.user.userArea?.[0]?.area?.area || "";
      return a.user.nome.toLowerCase().includes(termo) || nomeArea.toLowerCase().includes(termo);
    })
    .sort((a, b) => {
      if (ordenarAvaliadorRecurso === "nome-desc") {
        return b.user.nome.localeCompare(a.user.nome, "pt-BR", { sensitivity: "base" });
      }
      if (ordenarAvaliadorRecurso === "emanalise-desc") {
        return (
          familiasEmAnalisePorAvaliador(b.user.id).length - familiasEmAnalisePorAvaliador(a.user.id).length
        );
      }
      if (ordenarAvaliadorRecurso === "analisados-desc") {
        return (
          familiasAnalisadasPorAvaliador(b.user.id).length - familiasAnalisadasPorAvaliador(a.user.id).length
        );
      }
      return a.user.nome.localeCompare(b.user.nome, "pt-BR", { sensitivity: "base" });
    });

  const handleDevolverFamilia = async () => {
    if (!familiaParaDevolver) return;
    setDevolvendo(true);
    setErroDevolver("");
    try {
      await reverterAnaliseRecursoGestor(params.tenant, familiaParaDevolver.id);
      setFamiliaParaDevolver(null);
      await fetchFamilias();
    } catch (error) {
      setErroDevolver(error.response?.data?.message || "Não foi possível devolver este recurso.");
    } finally {
      setDevolvendo(false);
    }
  };

  const handleDevolverTodasDoAvaliador = async () => {
    if (!avaliadorRecursoSelecionado) return;
    const pendentesDoAvaliador = familiasEmAnalisePorAvaliador(avaliadorRecursoSelecionado.user.id);
    setDevolvendoProgresso({ atual: 0, total: pendentesDoAvaliador.length });
    let sucesso = 0;
    const falhas = [];
    for (const familia of pendentesDoAvaliador) {
      try {
        await reverterAnaliseRecursoGestor(params.tenant, familia.id);
        sucesso++;
      } catch (error) {
        falhas.push(familia.titulo);
      }
      setDevolvendoProgresso((prev) => ({ ...prev, atual: prev.atual + 1 }));
    }
    setDevolvendoProgresso(null);
    setDevolvendoTudoAberto(false);
    if (falhas.length === 0) {
      toast.current?.show({ severity: "success", summary: "Sucesso", detail: `${sucesso} recurso(s) devolvido(s) com sucesso!` });
    } else {
      toast.current?.show({
        severity: "warn",
        summary: "Concluído com erros",
        detail: `${sucesso} devolvido(s); ${falhas.length} falharam (${falhas.join(", ")}).`,
      });
    }
    await fetchFamilias();
  };

  // ─── Card 4: Recursos em análise (geral) ─────────────────────────────────
  const familiasEmAnaliseGeral = familias
    .filter((f) => f.emAnaliseCom)
    .filter((f) => {
      const termo = buscaEmAnaliseGeral.toLowerCase();
      if (!termo) return true;
      return (
        f.titulo?.toLowerCase().includes(termo) ||
        f.emAnaliseCom?.nome?.toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => {
      if (ordenarEmAnaliseGeral === "tempo-desc") {
        return new Date(b.emAnaliseDesde) - new Date(a.emAnaliseDesde);
      }
      if (ordenarEmAnaliseGeral === "avaliador-asc") {
        return (a.emAnaliseCom?.nome || "").localeCompare(b.emAnaliseCom?.nome || "", "pt-BR", { sensitivity: "base" });
      }
      if (ordenarEmAnaliseGeral === "familia-asc") {
        return (a.titulo || "").localeCompare(b.titulo || "", "pt-BR", { sensitivity: "base" });
      }
      return new Date(a.emAnaliseDesde) - new Date(b.emAnaliseDesde);
    });

  return (
    <main>
      <Toast ref={toast} position="top-right" />
      <Header
        className="mb-3"
        titulo="Avaliação de Recursos"
        subtitulo={`Ano ${params.ano}`}
        descricao={
          abaAtiva === "resultados"
            ? "Controle, por edital deste ano, a divulgação de resultados, recursos e nota final para alunos e orientadores."
            : "Distribua famílias de recurso (projeto + planos-irmãos) entre avaliadores, individualmente ou em lote por área."
        }
      />

      <div className={style.abas}>
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={`${style.aba} ${abaAtiva === aba.id ? style.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {abaAtiva === "resultados" && (
        <div className="mt-3">
          <div className="flex-space mb-3">
            <p>
              Habilite, por edital, se alunos e orientadores veem o resultado, se podem abrir
              recurso, e se a nota final (já com os extras de recurso) é exibida.
            </p>
            <Button
              className={`btn-secondary ${style.configButton}`}
              icon={RiSettings5Line}
              onClick={() => setModalConfigAberto(true)}
            >
              Configurações
            </Button>
          </div>

          <Modal
            isOpen={modalConfigAberto}
            onClose={() => setModalConfigAberto(false)}
            size="medium"
          >
            <h4 className="mb-3">Configurações de resultados e recursos</h4>
            <p className="mb-3">
              Controle, por edital deste ano, se o item &ldquo;Resultados e Recursos&rdquo; aparece para
              alunos e orientadores.
            </p>
            <div className={style.list}>
              {loadingEditais ? (
                <>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </>
              ) : editais.length > 0 ? (
                editais.map((edital) => (
                  <div className={style.item} key={edital.id}>
                    <div className={style.itemInfo}>
                      <div className={style.icon}>
                        <RiScales3Line />
                      </div>
                      <div>
                        <h6>{edital.titulo}</h6>
                        <p>{edital.ano}</p>
                      </div>
                    </div>
                    <div className={style.toggles}>
                      <div className={style.toggleGroup}>
                        <span className={style.toggleGroupLabel}>Resultado</span>
                        <button
                          type="button"
                          className={`${style.toggleBtn} ${
                            edital.habilitarResultados ? style.toggleAtivo : ""
                          }`}
                          onClick={() => handleToggleResultado(edital)}
                          disabled={savingId === edital.id}
                        >
                          {edital.habilitarResultados ? (
                            <RiToggleFill size={28} />
                          ) : (
                            <RiToggleLine size={28} />
                          )}
                          <span>
                            {edital.habilitarResultados ? "Habilitado" : "Desabilitado"}
                          </span>
                        </button>
                      </div>
                      <div className={style.toggleGroup}>
                        <span className={style.toggleGroupLabel}>Recurso</span>
                        <button
                          type="button"
                          className={`${style.toggleBtn} ${
                            edital.habilitarRecurso ? style.toggleAtivo : ""
                          }`}
                          onClick={() => handleToggleRecurso(edital)}
                          disabled={savingId === edital.id || !edital.habilitarResultados}
                          title={
                            !edital.habilitarResultados
                              ? "Habilite a divulgação do resultado antes de habilitar recurso"
                              : undefined
                          }
                        >
                          {edital.habilitarRecurso ? (
                            <RiToggleFill size={28} />
                          ) : (
                            <RiToggleLine size={28} />
                          )}
                          <span>
                            {edital.habilitarRecurso ? "Habilitado" : "Desabilitado"}
                          </span>
                        </button>
                      </div>
                      <div className={style.toggleGroup}>
                        <span className={style.toggleGroupLabel}>Nota Final</span>
                        <button
                          type="button"
                          className={`${style.toggleBtn} ${
                            edital.habilitarNotaFinal ? style.toggleAtivo : ""
                          }`}
                          onClick={() => handleToggleNotaFinal(edital)}
                          disabled={savingId === edital.id || !edital.habilitarResultados}
                          title={
                            !edital.habilitarResultados
                              ? "Habilite a divulgação do resultado antes de habilitar a nota final"
                              : undefined
                          }
                        >
                          {edital.habilitarNotaFinal ? (
                            <RiToggleFill size={28} />
                          ) : (
                            <RiToggleLine size={28} />
                          )}
                          <span>
                            {edital.habilitarNotaFinal ? "Habilitado" : "Desabilitado"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <NoData description={`Nenhum edital encontrado em ${params.ano}.`} />
              )}
            </div>
          </Modal>

          <TabelaRecursosGestor tenant={params.tenant} ano={params.ano} />
        </div>
      )}

      {abaAtiva === "distribuicao" && (
        <>
      <Modal
        isOpen={!!avaliadorParaConfirmar}
        onClose={() => setAvaliadorParaConfirmar(null)}
      >
        <h4 className="mb-2">Confirmar associação</h4>
        <p className="mb-3">
          Associar <strong>{avaliadorParaConfirmar?.nome}</strong> à família{" "}
          <strong>{familiaSelecionada?.titulo}</strong>?
        </p>
        <Button
          className="btn-primary"
          onClick={handleConfirmarAssociacaoIndividual}
          loading={associando}
          disabled={associando}
        >
          Confirmar
        </Button>
      </Modal>

      <Card className="mb-4 p-2">
        <h5 className="mb-2">Distribuição por recurso específico</h5>
        <div className={style.distribuicao}>
          <div className={style.distribuicaoCard}>
            <div className={style.scrollableContainer}>
              <div className={style.listToolbar}>
                <span className={style.searchBox}>
                  <RiSearchLine className={style.searchIcon} />
                  <InputText
                    placeholder="Buscar família..."
                    value={buscaFamilia}
                    onChange={(e) => setBuscaFamilia(e.target.value)}
                  />
                </span>
                <div className={style.toolbarDropdowns}>
                  <Dropdown
                    value={ordenarFamilia}
                    options={OPCOES_ORDENACAO_FAMILIA}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => setOrdenarFamilia(e.value)}
                    placeholder="Ordenar por"
                    className={style.sortDropdown}
                  />
                </div>
              </div>
              <ul>
                {loading ? (
                  <li>
                    <div className={style.content}>
                      <p>Carregando...</p>
                    </div>
                  </li>
                ) : familiasFiltradas.length > 0 ? (
                  familiasFiltradas.map((familia) => (
                    <li
                      key={familia.id}
                      onClick={() => handleSelecionarFamilia(familia)}
                      className={familiaSelecionada?.id === familia.id ? style.selected : ""}
                    >
                      <div className={style.content}>
                        <h6>{familia.titulo}</h6>
                        <p>
                          <strong>Área:</strong> {familia.area?.area || "Sem área definida"}
                        </p>
                        <p>
                          <strong>Pendentes:</strong> {familia.pendentes} de {familia.totalRecursos}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li>
                    <div className={style.content}>
                      <NoData description="Nenhuma família disponível para distribuir." />
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className={style.distribuicaoCard}>
            <div className={style.scrollableContainer}>
              {!familiaSelecionada ? (
                <div className={style.content}>
                  <NoData description="Selecione uma família para ver os avaliadores elegíveis." />
                </div>
              ) : carregandoElegiveis ? (
                <div className={style.content}>
                  <p>Carregando avaliadores elegíveis...</p>
                </div>
              ) : avaliadoresElegiveis.length === 0 ? (
                <div className={style.content}>
                  <NoData description="Nenhum avaliador elegível encontrado para esta família (conflito de interesse ou sem área compatível)." />
                </div>
              ) : (
                <>
                  <div className={style.listToolbar}>
                    <span className={style.searchBox}>
                      <RiSearchLine className={style.searchIcon} />
                      <InputText
                        placeholder="Buscar avaliador..."
                        value={buscaAvaliadorElegivel}
                        onChange={(e) => setBuscaAvaliadorElegivel(e.target.value)}
                      />
                    </span>
                    <div className={style.toolbarDropdowns}>
                      <Dropdown
                        value={ordenarAvaliadorElegivel}
                        options={OPCOES_ORDENACAO_NOME}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setOrdenarAvaliadorElegivel(e.value)}
                        placeholder="Ordenar por"
                        className={style.sortDropdown}
                      />
                    </div>
                  </div>
                  <ul>
                    {avaliadoresElegiveisFiltrados.map((avaliador) => (
                      <li key={avaliador.id} onClick={() => setAvaliadorParaConfirmar(avaliador)}>
                        <div className={style.content}>
                          <h6>{avaliador.nome}</h6>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-2">
        <h5 className="mb-2">Distribuição por área</h5>
        {avaliadoresList.length > 0 && areaSelecionada && (
          <div className={style.actions}>
            <button
              className="button btn-primary"
              onClick={handleAtribuicaoEmLote}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <p>Carregando...</p>
              ) : (
                <p>
                  {`Atribuir ${familiasDaAreaSelecionada.length} recurso(s) da área ${areaSelecionada.nome} para ${avaliadoresList.length} avaliador(es)`}
                </p>
              )}
            </button>
          </div>
        )}
        <div className={style.distribuicao}>
          <div className={style.distribuicaoCard}>
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
                {areasComFamiliasFiltradas.length > 0 ? (
                  areasComFamiliasFiltradas.map((item) => (
                    <li
                      key={item.areaId ?? "sem-area"}
                      onClick={() => {
                        setAreaSelecionada(item);
                        setAvaliadoresList([]);
                        setChecked(false);
                      }}
                      className={areaSelecionada?.areaId === item.areaId ? style.selected : ""}
                    >
                      <div className={style.content}>
                        <h6>
                          {item.nome} <span>{item.count}</span>
                        </h6>
                      </div>
                    </li>
                  ))
                ) : (
                  <li>
                    <div className={style.content}>
                      <NoData description="Nenhuma família pendente de distribuição." />
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className={style.distribuicaoCard}>
            <div className={style.scrollableContainer}>
              {!areaSelecionada ? (
                <div className={style.content}>
                  <NoData description="Clique em uma área." />
                </div>
              ) : avaliadoresDaArea.length === 0 ? (
                <div className={style.content}>
                  <NoData description="Nenhum avaliador encontrado para esta área." />
                </div>
              ) : (
                <>
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
                        options={OPCOES_ORDENACAO_AVALIADOR_AREA}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setOrdenarAvaliadorArea(e.value)}
                        placeholder="Ordenar por"
                        className={style.sortDropdown}
                      />
                    </div>
                  </div>
                  <div className="flex align-items-center pl-2 pt-2 pr-2 mb-2">
                    <Checkbox onChange={handleSelectAll} checked={checked} />
                    <p className="ml-2">Selecionar todos</p>
                  </div>
                  <ul>
                    {avaliadoresDaAreaFiltrados.map((avaliador) => (
                      <li
                        key={avaliador.user.id}
                        onClick={(e) => {
                          if (e.target.tagName !== "INPUT") {
                            const isChecked = avaliadoresList.some((a) => a.id === avaliador.user.id);
                            setAvaliadoresList(
                              isChecked
                                ? avaliadoresList.filter((a) => a.id !== avaliador.user.id)
                                : [...avaliadoresList, avaliador.user],
                            );
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className={style.checkbox}>
                          <Checkbox
                            onChange={(e) => {
                              setAvaliadoresList(
                                e.checked
                                  ? [...avaliadoresList, avaliador.user]
                                  : avaliadoresList.filter((a) => a.id !== avaliador.user.id),
                              );
                            }}
                            checked={avaliadoresList.some((a) => a.id === avaliador.user.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className={style.content}>
                          <h6>{avaliador.user.nome}</h6>
                          <p>
                            <strong>{avaliador.user.userArea[0]?.area?.area || "Sem área"}</strong>
                            {avaliador.user.userArea.length > 1 && (
                              <span> +{avaliador.user.userArea.length - 1} outras áreas</span>
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <ModalDelete
        isOpen={!!familiaParaDevolver}
        title="Reverter análise de recurso"
        onClose={() => {
          setFamiliaParaDevolver(null);
          setErroDevolver("");
        }}
        confirmationText={`Tem certeza que deseja reverter a análise de todos os recursos de "${familiaParaDevolver?.titulo ?? ""}"? Os ${familiaParaDevolver?.totalRecursos ?? 0} recurso(s) da família (projeto e planos respectivos) voltam a ficar pendentes, e as decisões já tomadas são apagadas.`}
        errorDelete={erroDevolver}
        handleDelete={handleDevolverFamilia}
        icon={RiArrowGoBackLine}
        txtBtn={devolvendo ? "Revertendo..." : "Reverter"}
      />

      <ModalDelete
        isOpen={devolvendoTudoAberto}
        title="Devolver tudo"
        onClose={() => setDevolvendoTudoAberto(false)}
        confirmationText={`Tem certeza que deseja devolver TODOS os ${familiasEmAnalisePorAvaliador(avaliadorRecursoSelecionado?.user.id).length} recurso(s) em análise por ${avaliadorRecursoSelecionado?.user.nome}?`}
        handleDelete={handleDevolverTodasDoAvaliador}
        icon={RiDeleteBinLine}
        txtBtn={devolvendoProgresso ? `Devolvendo ${devolvendoProgresso.atual}/${devolvendoProgresso.total}...` : "Devolver tudo"}
      />

      <Card className="mb-4 p-2">
        <h5 className="mb-2">Avaliadores x Recursos</h5>
        <div className={style.distribuicao}>
          <div className={style.distribuicaoCard}>
            <div className={style.scrollableContainer}>
              <div className={style.listToolbar}>
                <span className={style.searchBox}>
                  <RiSearchLine className={style.searchIcon} />
                  <InputText
                    placeholder="Buscar avaliador ou área..."
                    value={buscaAvaliadorRecurso}
                    onChange={(e) => setBuscaAvaliadorRecurso(e.target.value)}
                  />
                </span>
                <div className={style.toolbarDropdowns}>
                  <Dropdown
                    value={ordenarAvaliadorRecurso}
                    options={OPCOES_ORDENACAO_AVALIADOR_RECURSO}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => setOrdenarAvaliadorRecurso(e.value)}
                    placeholder="Ordenar por"
                    className={style.sortDropdown}
                  />
                </div>
              </div>
              <ul>
                {avaliadoresRecursoFiltrados.map((avaliador) => {
                  const emAnalise = familiasEmAnalisePorAvaliador(avaliador.user.id);
                  const analisados = familiasAnalisadasPorAvaliador(avaliador.user.id);
                  return (
                    <li
                      key={avaliador.user.id}
                      onClick={() => setAvaliadorRecursoSelecionado(avaliador)}
                      className={avaliadorRecursoSelecionado?.user.id === avaliador.user.id ? style.selected : ""}
                    >
                      <div className={style.content}>
                        <h6>{avaliador.user.nome}</h6>
                        <p>
                          <strong>{avaliador.user.userArea?.[0]?.area?.area || "Sem área"}</strong>
                        </p>
                        <div className={style.badges}>
                          <span className={style.badge}>Em análise: {emAnalise.length}</span>
                          <span className={`${style.badge} ${style.badgeAvaliadas}`}>Analisados: {analisados.length}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className={style.distribuicaoCard}>
            <div className={style.scrollableContainer}>
              {!avaliadorRecursoSelecionado ? (
                <div className={style.content}>
                  <NoData description="Selecione um avaliador." />
                </div>
              ) : (
                <>
                  <div className={`${style.listHeaderComAcao} mt-2 mb-2`}>
                    <h6 className="ml-2">Em análise</h6>
                    {devolvendoProgresso ? (
                      <span className={style.progressoDesvincular}>
                        Devolvendo {devolvendoProgresso.atual}/{devolvendoProgresso.total}...
                      </span>
                    ) : (
                      familiasEmAnalisePorAvaliador(avaliadorRecursoSelecionado.user.id).length > 0 && (
                        <Button
                          className={`button btn-secondary ${style.desvincularTudoBtn}`}
                          onClick={() => setDevolvendoTudoAberto(true)}
                        >
                          Devolver tudo
                        </Button>
                      )
                    )}
                  </div>
                  <ul>
                    {familiasEmAnalisePorAvaliador(avaliadorRecursoSelecionado.user.id).length > 0 ? (
                      familiasEmAnalisePorAvaliador(avaliadorRecursoSelecionado.user.id).map((familia) => {
                        const tempo = calcularTempoDesdeAtribuicao(familia.emAnaliseDesde);
                        return (
                          <li key={familia.id}>
                            <div className={style.content}>
                              <h6>{familia.titulo}</h6>
                              <p className={style.timeInfo}>
                                <strong>Em análise há:</strong> {tempo.display}
                              </p>
                            </div>
                            <div className={style.actions}>
                              <RiDeleteBinLine
                                className={style.deleteIcon}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFamiliaParaDevolver(familia);
                                }}
                                title="Devolver recurso"
                              />
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        <div className={style.content}>
                          <h6>Nenhum recurso em análise</h6>
                        </div>
                      </li>
                    )}
                  </ul>

                  <h6 className="mt-2 ml-2 mb-2">Analisados</h6>
                  <ul>
                    {familiasAnalisadasPorAvaliador(avaliadorRecursoSelecionado.user.id).length > 0 ? (
                      familiasAnalisadasPorAvaliador(avaliadorRecursoSelecionado.user.id).map((familia) => {
                        // Soma o extra de projeto + do próprio plano (mesmo
                        // padrão usado em TabelaPlanoDeTrabalhoAcompanhamento.jsx
                        // etc.) — a "nota extra" é o quanto essa família ganhou
                        // de pontos com os recursos deferidos.
                        const notaExtraTotal =
                          (familia.notaExtraRecursoProjeto || 0) + (familia.notaExtraRecursoPlano || 0);
                        return (
                          <li key={familia.id}>
                            <div className={style.content}>
                              <h6>{familia.titulo}</h6>
                              <p>
                                <strong>Área:</strong> {familia.area?.area || "—"}
                              </p>
                              <div className={style.badges}>
                                <span
                                  className={`${style.badge} ${
                                    notaExtraTotal > 0 ? style.badgeExtraPositiva : style.badgeExtraZero
                                  }`}
                                  title="Nota extra concedida no recurso (projeto + plano)"
                                >
                                  +{notaExtraTotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className={style.actions}>
                              <button
                                type="button"
                                className={style.acaoReverter}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFamiliaParaDevolver(familia);
                                }}
                                title="Reverter análise de todos os recursos (volta pra pendente)"
                              >
                                <RiArrowGoBackLine />
                              </button>
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        <div className={style.content}>
                          <h6>Nenhum recurso analisado</h6>
                        </div>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-2">
        <h5 className="mb-2">Recursos em análise (geral)</h5>
        <div className={style.distribuicao}>
          <div className={style.distribuicaoCard}>
            <div className={style.scrollableContainer}>
              <div className={style.listToolbar}>
                <span className={style.searchBox}>
                  <RiSearchLine className={style.searchIcon} />
                  <InputText
                    placeholder="Buscar avaliador ou família..."
                    value={buscaEmAnaliseGeral}
                    onChange={(e) => setBuscaEmAnaliseGeral(e.target.value)}
                  />
                </span>
                <div className={style.toolbarDropdowns}>
                  <Dropdown
                    value={ordenarEmAnaliseGeral}
                    options={OPCOES_ORDENACAO_EM_ANALISE_GERAL}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => setOrdenarEmAnaliseGeral(e.value)}
                    placeholder="Ordenar por"
                    className={style.sortDropdown}
                  />
                </div>
              </div>
              <ul>
                {familiasEmAnaliseGeral.length > 0 ? (
                  familiasEmAnaliseGeral.map((familia) => {
                    const tempo = calcularTempoDesdeAtribuicao(familia.emAnaliseDesde);
                    return (
                      <li key={familia.id}>
                        <div className={`${style.content} ${style.contentAvaliacoesPendentes}`}>
                          <div className={style.time}>
                            <RiTimeLine />
                            <p className={style.timeInfo}>Em análise há:</p>
                            <h6>{tempo.display}</h6>
                          </div>
                          <div>
                            <h6>{familia.titulo}</h6>
                            <p className={style.timeInfo}>
                              <strong>Avaliador:</strong> {familia.emAnaliseCom?.nome}
                            </p>
                          </div>
                        </div>
                        <div className={style.actions}>
                          <RiDeleteBinLine
                            className={style.deleteIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFamiliaParaDevolver(familia);
                            }}
                            title="Devolver recurso"
                          />
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li>
                    <div className={style.content}>
                      <h6>Nenhum recurso em análise no momento</h6>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </Card>
        </>
      )}
    </main>
  );
};

export default Page;
