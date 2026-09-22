"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiArrowLeftSLine, RiAddLine, RiCloseLine } from "@remixicon/react";
import { getEventoBySlug } from "@/app/api/client/eventos";
import {
  getSubmissoesSemAvaliacao,
  getAreasPendentesWizard,
  trocarSubmissaoAvaliador,
} from "@/app/api/client/submissaoAvaliador";
import { salvarUltimasAreas } from "@/components/avaliarWizard/sessaoAvaliador";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
import Button from "@/components/Button";
import CabecalhoWizard from "@/components/avaliarWizard/CabecalhoWizard";
import wizardStyles from "@/components/avaliarWizard/wizard.module.scss";
import styles from "../page.module.scss";

// "Ver trabalhos específicos" — auto-alocação manual, rota própria (suporta
// o botão físico "voltar" do Android). Reaproveita exatamente a mesma lógica
// de clique-para-reivindicar da tela antiga (avaliacoes/page.jsx), só com
// cards maiores/mobile-first. Ao escolher, volta pro wizard principal, que
// detecta o trabalho já atribuído e segue o ciclo normalmente.
const AutoAlocacaoConteudo = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroItem, setErroItem] = useState({});
  const [loadingItem, setLoadingItem] = useState({});
  const [eventoId, setEventoId] = useState(null);
  const [submissoes, setSubmissoes] = useState([]);

  const [areasDisponiveis, setAreasDisponiveis] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [painelAdicionarAberto, setPainelAdicionarAberto] = useState(false);
  const [selecaoPainel, setSelecaoPainel] = useState([]);

  const buscarSubmissoes = async (eventoIdAtual, areasIds) => {
    const dados = await getSubmissoesSemAvaliacao(eventoIdAtual, areasIds);
    setSubmissoes(dados?.submissoesData || []);
  };

  useEffect(() => {
    const areasIds = (searchParams.get("areas") || "")
      .split(",")
      .filter(Boolean)
      .map((id) => parseInt(id, 10));

    const carregar = async () => {
      setCarregando(true);
      setErro("");
      try {
        const evento = await getEventoBySlug(params.edicao);
        setEventoId(evento.id);
        setAreasSelecionadas(areasIds);
        const [areas] = await Promise.all([
          getAreasPendentesWizard(evento.id),
          buscarSubmissoes(evento.id, areasIds),
        ]);
        setAreasDisponiveis(areas || []);
      } catch (error) {
        setErro("Não foi possível carregar os trabalhos disponíveis agora.");
      } finally {
        setCarregando(false);
      }
    };
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centraliza qualquer mudança na seleção de área (remover uma flag ou
  // aplicar novas do painel "+"): refiltra a lista, persiste em
  // localStorage (mesmo mecanismo que o wizard principal lê ao reabrir) e
  // sincroniza a URL, sem sair da tela.
  const aplicarAreas = async (novasIds) => {
    setCarregando(true);
    setErro("");
    try {
      setAreasSelecionadas(novasIds);
      salvarUltimasAreas(eventoId, novasIds);
      router.replace(
        `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliar/auto-alocacao?areas=${novasIds.join(",")}`,
        { scroll: false },
      );
      await buscarSubmissoes(eventoId, novasIds);
    } catch (error) {
      setErro("Não foi possível atualizar os trabalhos disponíveis agora.");
    } finally {
      setCarregando(false);
    }
  };

  const handleRemoverArea = (areaId) => {
    if (areasSelecionadas.length <= 1) return;
    aplicarAreas(areasSelecionadas.filter((id) => id !== areaId));
  };

  const handleAbrirPainelAdicionar = () => {
    setSelecaoPainel([]);
    setPainelAdicionarAberto(true);
  };

  const handleAlternarSelecaoPainel = (areaId) => {
    setSelecaoPainel((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId],
    );
  };

  const handleAplicarPainel = () => {
    setPainelAdicionarAberto(false);
    aplicarAreas([...areasSelecionadas, ...selecaoPainel]);
  };

  const areasNaoSelecionadas = areasDisponiveis.filter(
    (area) => !areasSelecionadas.includes(area.id),
  );

  const handleEscolher = async (submissao) => {
    setErroItem((prev) => ({ ...prev, [submissao.id]: "" }));
    setLoadingItem((prev) => ({ ...prev, [submissao.id]: true }));
    try {
      // Libera o trabalho anterior (se houver) e assume este numa
      // transação só no backend — não depende de saber aqui no front qual
      // é o trabalho anterior, então não escolher nada e voltar mantém o
      // trabalho original intacto, e não há risco de um id desatualizado
      // travar a troca.
      await trocarSubmissaoAvaliador(eventoId, submissao.id);
      router.push(
        `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliar`
      );
    } catch (error) {
      setErroItem((prev) => ({
        ...prev,
        [submissao.id]:
          error.response?.data?.error ||
          "Não foi possível reivindicar este trabalho. Ele pode já ter sido pego por outro avaliador.",
      }));
      setLoadingItem((prev) => ({ ...prev, [submissao.id]: false }));
    }
  };

  return (
    <div className={styles.mainDiv}>
      <CabecalhoWizard eventoSlug={params.eventoSlug} edicao={params.edicao} />

      <div className={wizardStyles.card}>
        <button
          type="button"
          className={wizardStyles.linkCabecalho}
          onClick={() => router.back()}
        >
          <RiArrowLeftSLine />
          Voltar
        </button>
        <h1 className="h-editorial-sm mb-1 mt-2">Escolha um trabalho</h1>
        <p className="mb-2">
          Trabalhos aguardando avaliação nas áreas que você escolheu.
        </p>

        {areasDisponiveis.length > 0 && (
          <div className={wizardStyles.areasSelecionadas}>
            {areasSelecionadas.map((areaId) => {
              const area = areasDisponiveis.find((a) => a.id === areaId);
              if (!area) return null;
              return (
                <span key={area.id} className={wizardStyles.flagArea}>
                  {area.nome}
                  {areasSelecionadas.length > 1 && (
                    <button
                      type="button"
                      className={wizardStyles.flagAreaRemover}
                      onClick={() => handleRemoverArea(area.id)}
                      aria-label={`Remover área ${area.nome}`}
                    >
                      <RiCloseLine />
                    </button>
                  )}
                </span>
              );
            })}
            {areasNaoSelecionadas.length > 0 && !painelAdicionarAberto && (
              <button
                type="button"
                className={wizardStyles.botaoAdicionarArea}
                onClick={handleAbrirPainelAdicionar}
                aria-label="Incluir outras áreas"
              >
                <RiAddLine />
              </button>
            )}
          </div>
        )}

        {painelAdicionarAberto && (
          <div className={wizardStyles.painelAdicionarArea}>
            <div className={wizardStyles.chips}>
              {areasNaoSelecionadas.map((area) => {
                const selecionada = selecaoPainel.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    className={`${wizardStyles.chip} ${selecionada ? wizardStyles.chipSelecionado : ""}`}
                    onClick={() => handleAlternarSelecaoPainel(area.id)}
                  >
                    <span>{area.nome}</span>
                    <span className={wizardStyles.chipContador}>
                      {area.quantidade}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={wizardStyles.painelAdicionarAcoes}>
              <Button
                className="btn-secondary"
                onClick={() => setPainelAdicionarAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                className="btn-primary"
                onClick={handleAplicarPainel}
                disabled={selecaoPainel.length === 0}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {carregando && <p className="text-center">Carregando...</p>}
        {!carregando && erro && <p className={wizardStyles.erro}>{erro}</p>}
        {!carregando && !erro && submissoes.length === 0 && (
          <p className="text-center">
            Nenhum trabalho disponível nas áreas escolhidas no momento.
          </p>
        )}
      </div>

      {!carregando && submissoes.length > 0 && (
        <div className={wizardStyles.listaTrabalhos}>
          {submissoes.map((item) => (
            <div
              key={item.id}
              className={wizardStyles.itemTrabalho}
              onClick={() => handleEscolher(item)}
            >
              <div className={wizardStyles.itemPoster}>
                {item.square?.length > 0 ? item.square[0].numero : "-"}
              </div>
              <div className={wizardStyles.itemInfo}>
                <p className={wizardStyles.metaTrabalho}>
                  {item?.Resumo?.area?.area || "sem área"} ·{" "}
                  {getInstituicaoSigla(item)}
                </p>
                <h6>{item?.Resumo?.titulo}</h6>
                {loadingItem[item.id] && <p>Reivindicando...</p>}
                {erroItem[item.id] && (
                  <p className={wizardStyles.erro}>{erroItem[item.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// useSearchParams exige um limite de Suspense em volta (requisito do Next.js
// App Router) — o fallback só aparece por uma fração de segundo, já que os
// dados reais também dependem de uma chamada assíncrona.
const Page = ({ params }) => (
  <Suspense fallback={<div className={styles.mainDiv} />}>
    <AutoAlocacaoConteudo params={params} />
  </Suspense>
);

export default Page;
