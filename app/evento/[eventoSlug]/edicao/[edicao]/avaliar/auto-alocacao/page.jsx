"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiArrowLeftSLine } from "@remixicon/react";
import { getEventoBySlug } from "@/app/api/client/eventos";
import {
  getSubmissoesSemAvaliacao,
  associarAvaliadorSubmissao,
  desvincularAvaliadorSubmissao,
} from "@/app/api/client/submissaoAvaliador";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
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
        const dados = await getSubmissoesSemAvaliacao(evento.id, areasIds);
        setSubmissoes(dados?.submissoesData || []);
      } catch (error) {
        setErro("Não foi possível carregar os trabalhos disponíveis agora.");
      } finally {
        setCarregando(false);
      }
    };
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se o avaliador chegou aqui vindo de "Escolher trabalho específico", ele
  // ainda está com o trabalho anterior (não foi devolvido na navegação — só
  // ao escolher de fato um novo, aqui, é que a troca acontece). Isso permite
  // "voltar" sem escolher nada e continuar com o trabalho original intacto.
  const substituirId = searchParams.get("substituir");

  const handleEscolher = async (submissao) => {
    setErroItem((prev) => ({ ...prev, [submissao.id]: "" }));
    setLoadingItem((prev) => ({ ...prev, [submissao.id]: true }));
    try {
      if (substituirId) {
        await desvincularAvaliadorSubmissao(eventoId, substituirId);
      }
      await associarAvaliadorSubmissao(eventoId, submissao.id);
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
