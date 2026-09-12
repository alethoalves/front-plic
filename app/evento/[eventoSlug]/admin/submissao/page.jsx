"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { RiUserAddLine, RiDeleteBinLine, RiTimeLine } from "@remixicon/react";
import Button from "@/components/Button";
import ModalDelete from "@/components/ModalDelete";
import SubmissoesTable from "@/components/SubmissoesTable";
import { avaliadoresEvento } from "@/app/api/client/avaliadoresEvento";
import {
  gestorAssociarAvaliadorSubmissao,
  gestorDesassociarAvaliadorSubmissao,
} from "@/app/api/client/submissao";
import calcularTempoDesdeAtribuicao from "@/lib/calcularTempoDesdeAtribuicao";
import styles from "./page.module.scss";

const Page = ({ params }) => {
  const { eventoSlug } = params;
  const [loadingAvaliadores, setLoadingAvaliadores] = useState(false);
  const [avaliadores, setAvaliadores] = useState([]);

  const [submissaoSelecionada, setSubmissaoSelecionada] = useState(null);
  const [buscaAvaliador, setBuscaAvaliador] = useState("");
  const [atribuindoAvaliadorId, setAtribuindoAvaliadorId] = useState(null);

  const [atribuicaoParaRetirar, setAtribuicaoParaRetirar] = useState(null);
  const [retirando, setRetirando] = useState(false);
  const [erroRetirar, setErroRetirar] = useState("");

  const toast = useRef(null);
  const tabelaRef = useRef(null);

  const showToast = (severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const fetchAvaliadores = async () => {
    setLoadingAvaliadores(true);
    try {
      const resposta = await avaliadoresEvento(eventoSlug);
      setAvaliadores(resposta || []);
    } catch (error) {
      console.error("Erro ao carregar avaliadores:", error);
      showToast("error", "Erro", "Falha ao carregar avaliadores.");
    } finally {
      setLoadingAvaliadores(false);
    }
  };

  useEffect(() => {
    fetchAvaliadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoSlug]);

  // Vinculações ativas (SubmissaoAvaliador ainda existente = em andamento —
  // processarAvaliacao apaga a linha ao finalizar a avaliação), agrupadas
  // por submissão. Uma submissão pode ter mais de um avaliador ao mesmo
  // tempo — quem decide quantos é o gestor, atribuindo um de cada vez.
  const avaliacoesAtuaisPorSubmissaoId = useMemo(() => {
    const mapa = new Map();
    avaliadores.forEach((avaliador) => {
      (avaliador.SubmissaoAvaliador || []).forEach((atribuicao) => {
        const lista = mapa.get(atribuicao.submissaoId) || [];
        lista.push({ ...atribuicao, avaliador });
        mapa.set(atribuicao.submissaoId, lista);
      });
    });
    return mapa;
  }, [avaliadores]);

  // Avaliadores já atribuídos à submissão selecionada, pra não oferecer o
  // mesmo avaliador duas vezes na mesma submissão.
  const avaliadorIdsJaAtribuidos = useMemo(() => {
    if (!submissaoSelecionada) return new Set();
    const atuais =
      avaliacoesAtuaisPorSubmissaoId.get(submissaoSelecionada.id) || [];
    return new Set(atuais.map((a) => a.avaliadorId));
  }, [submissaoSelecionada, avaliacoesAtuaisPorSubmissaoId]);

  // Avaliadores elegíveis para a submissão selecionada: por padrão, mesma
  // área (ou "Sem área definida"), sempre excluindo quem é participante da
  // submissão (conflito de interesse) ou já atribuído a ela. Digitando nome
  // ou CPF na busca, o admin também pode encontrar e escolher qualquer
  // outro avaliador do evento, mesmo fora da área — nesse caso ele aparece
  // com um aviso.
  const avaliadoresParaExibir = useMemo(() => {
    if (!submissaoSelecionada) return [];
    const areaSubmissao = submissaoSelecionada.Resumo?.area?.area || null;
    const cpfsParticipantes = new Set(
      (submissaoSelecionada.Resumo?.participacoes || [])
        .map((p) => p.user?.cpf)
        .filter(Boolean),
    );

    const naoParticipantes = avaliadores.filter(
      (avaliador) =>
        !cpfsParticipantes.has(avaliador.user?.cpf) &&
        !avaliadorIdsJaAtribuidos.has(avaliador.id),
    );

    const pertenceAArea = (avaliador) =>
      !areaSubmissao ||
      (avaliador.user?.userArea || []).some(
        (ua) => ua.area?.area === areaSubmissao,
      );

    const termo = buscaAvaliador.trim().toLowerCase();
    const termoCpf = buscaAvaliador.replace(/\D/g, "");

    const base = termo
      ? naoParticipantes.filter((avaliador) => {
          const nomeCorresponde = avaliador.user?.nome
            ?.toLowerCase()
            .includes(termo);
          const cpfCorresponde =
            termoCpf.length > 0 &&
            avaliador.user?.cpf?.replace(/\D/g, "").includes(termoCpf);
          return nomeCorresponde || cpfCorresponde;
        })
      : naoParticipantes.filter(pertenceAArea);

    return base.map((avaliador) => ({
      ...avaliador,
      emAndamento: (avaliador.SubmissaoAvaliador || []).length,
      avaliadas: avaliador.user?._count?.Avaliacao || 0,
      foraDaArea: !pertenceAArea(avaliador),
    }));
  }, [
    submissaoSelecionada,
    avaliadores,
    buscaAvaliador,
    avaliadorIdsJaAtribuidos,
  ]);

  const handleAbrirAtribuicao = (submissao) => {
    setSubmissaoSelecionada(submissao);
    setBuscaAvaliador("");
  };

  const handleFecharAtribuicao = () => {
    setSubmissaoSelecionada(null);
    setBuscaAvaliador("");
    setAtribuindoAvaliadorId(null);
  };

  const handleAtribuir = async (avaliador) => {
    if (!submissaoSelecionada) return;
    setAtribuindoAvaliadorId(avaliador.id);
    try {
      const resposta = await gestorAssociarAvaliadorSubmissao(
        eventoSlug,
        submissaoSelecionada.id,
        avaliador.id,
      );

      // Atualiza o estado local em vez de recarregar tudo — já temos em
      // mãos a submissão selecionada e o avaliador escolhido, só falta o
      // id/createdAt da vinculação criada. A tabela de submissões só
      // precisa saber que o status mudou (via ref), sem refetch.
      const novaAtribuicao = {
        ...resposta.submissaoAvaliador,
        submissao: submissaoSelecionada,
      };
      setAvaliadores((prev) =>
        prev.map((a) =>
          a.id === avaliador.id
            ? {
                ...a,
                SubmissaoAvaliador: [
                  ...(a.SubmissaoAvaliador || []),
                  novaAtribuicao,
                ],
              }
            : a,
        ),
      );
      tabelaRef.current?.atualizarStatusSubmissao(
        submissaoSelecionada.id,
        "EM_AVALIACAO",
      );

      showToast(
        "success",
        "Sucesso",
        `Submissão atribuída a ${avaliador.user.nome}.`,
      );
      handleFecharAtribuicao();
    } catch (error) {
      const mensagem =
        error.response?.data?.message ||
        "Erro ao atribuir avaliador à submissão.";
      showToast("error", "Erro", mensagem);
    } finally {
      setAtribuindoAvaliadorId(null);
    }
  };

  const handleConfirmarRetirar = async () => {
    if (!atribuicaoParaRetirar) return;
    setRetirando(true);
    setErroRetirar("");
    try {
      const resultado = await gestorDesassociarAvaliadorSubmissao(
        eventoSlug,
        atribuicaoParaRetirar.id,
      );

      setAvaliadores((prev) =>
        prev.map((a) =>
          a.id === atribuicaoParaRetirar.avaliadorId
            ? {
                ...a,
                SubmissaoAvaliador: (a.SubmissaoAvaliador || []).filter(
                  (sa) => sa.id !== atribuicaoParaRetirar.id,
                ),
              }
            : a,
        ),
      );
      tabelaRef.current?.atualizarStatusSubmissao(
        atribuicaoParaRetirar.submissaoId,
        resultado?.novoStatus || "AGUARDANDO_AVALIACAO",
      );

      showToast("success", "Sucesso", "Avaliador desassociado com sucesso!");
      setAtribuicaoParaRetirar(null);
    } catch (error) {
      setErroRetirar(
        error.response?.data?.message ||
          "Erro ao desassociar o avaliador da submissão.",
      );
    } finally {
      setRetirando(false);
    }
  };

  // Só estados terminais impedem uma nova atribuição — combina com a regra
  // do backend (gestorAssociarAvaliadorSubmissao).
  const STATUS_ATRIBUIVEIS = ["AGUARDANDO_AVALIACAO", "EM_AVALIACAO"];

  const avaliadoresBodyTemplate = (rowData) => {
    const atuais = avaliacoesAtuaisPorSubmissaoId.get(rowData.id) || [];
    const finalizadas = rowData.Avaliacao || [];
    const podeAtribuir = STATUS_ATRIBUIVEIS.includes(rowData.status);

    return (
      <div className={styles.celulaAvaliadores}>
        {finalizadas.map((avaliacao) => (
          <div
            key={avaliacao.id}
            className={`${styles.linhaAvaliacaoFinalizada} ${
              avaliacao.arquivada ? styles.linhaAvaliacaoFinalizadaArquivada : ""
            }`}
          >
            <p className={styles.nomeAvaliador}>{avaliacao.avaliador?.nome}</p>
            <p className={styles.infoAvaliador}>
              Nota: {avaliacao.notaTotal}
              {avaliacao.arquivada && (
                <span className={styles.badgeArquivada}>Arquivada</span>
              )}
            </p>
          </div>
        ))}
        {atuais.map((atual) => {
          const tempo = calcularTempoDesdeAtribuicao(atual.createdAt);
          return (
            <div key={atual.id} className={styles.linhaAvaliador}>
              <div>
                <p className={styles.nomeAvaliador}>
                  {atual.avaliador.user.nome}
                </p>
                <p className={styles.infoAvaliador}>
                  <RiTimeLine size={12} /> há {tempo.display}
                </p>
              </div>
              <button
                type="button"
                className={styles.btnRetirarAvaliador}
                title={`Retirar ${atual.avaliador.user.nome}`}
                onClick={() => setAtribuicaoParaRetirar(atual)}
              >
                <RiDeleteBinLine size={14} />
              </button>
            </div>
          );
        })}
        {podeAtribuir && (
          <button
            type="button"
            className={styles.btnAtribuirAvaliador}
            onClick={() => handleAbrirAtribuicao(rowData)}
          >
            <RiUserAddLine size={14} /> Atribuir avaliador
          </button>
        )}
        {atuais.length === 0 && finalizadas.length === 0 && !podeAtribuir && "—"}
      </div>
    );
  };

  // Pra ordenar "quem está esperando avaliação há mais tempo": usa o
  // createdAt mais antigo entre os vínculos ativos da submissão (se tiver
  // mais de um avaliador, conta a partir do primeiro que pegou). Quem não
  // tem nenhum vínculo ativo vai sempre pro fim da lista. Precisa virar um
  // campo real na linha (via `enriquecerLinha`) porque sortField como
  // função não ordena de forma confiável na versão do PrimeReact em uso.
  const enriquecerLinha = useCallback(
    (submissao) => {
      const atuais = avaliacoesAtuaisPorSubmissaoId.get(submissao.id) || [];
      const tempoEmAtribuicaoOrdenacao =
        atuais.length === 0
          ? Infinity
          : Math.min(...atuais.map((a) => new Date(a.createdAt).getTime()));
      return { tempoEmAtribuicaoOrdenacao };
    },
    [avaliacoesAtuaisPorSubmissaoId],
  );

  const colunasExtras = [
    <Column
      key="avaliadores"
      header="Avaliadores"
      body={avaliadoresBodyTemplate}
      sortable
      sortField="tempoEmAtribuicaoOrdenacao"
      style={{ minWidth: "220px" }}
    />,
  ];

  if (loadingAvaliadores && avaliadores.length === 0) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.navContent}>
      <Toast ref={toast} />

      <div className={styles.dashboard}>
        <SubmissoesTable
          ref={tabelaRef}
          eventoSlug={eventoSlug}
          colunasExtras={colunasExtras}
          enriquecerLinha={enriquecerLinha}
          renderCardExtra={avaliadoresBodyTemplate}
        />
      </div>

      <Dialog
        visible={!!submissaoSelecionada}
        style={{ width: "560px" }}
        header={submissaoSelecionada?.Resumo?.titulo || "Atribuir avaliador"}
        modal
        className={`p-fluid ${styles.eventoDialog}`}
        onHide={handleFecharAtribuicao}
      >
        <p className={styles.contador}>
          Área:{" "}
          {submissaoSelecionada?.Resumo?.area?.area || "Sem área definida"}
        </p>

        {(avaliacoesAtuaisPorSubmissaoId.get(submissaoSelecionada?.id) || [])
          .length > 0 && (
          <p className={styles.contador}>
            Já atribuída a:{" "}
            {(
              avaliacoesAtuaisPorSubmissaoId.get(submissaoSelecionada?.id) || []
            )
              .map((a) => a.avaliador.user.nome)
              .join(", ")}
          </p>
        )}

        <div className="mb-2">
          <InputText
            className={`${styles.eventoInput} w-100`}
            placeholder="Buscar qualquer avaliador por nome ou CPF..."
            value={buscaAvaliador}
            onChange={(e) => setBuscaAvaliador(e.target.value)}
          />
        </div>

        {avaliadoresParaExibir.length === 0 ? (
          <p>
            {buscaAvaliador.trim()
              ? "Nenhum avaliador encontrado para essa busca."
              : "Nenhum avaliador elegível encontrado para esta área."}
          </p>
        ) : (
          <ul className={styles.listaAvaliadores}>
            {avaliadoresParaExibir.map((avaliador) => (
              <li key={avaliador.id} className={styles.itemAvaliador}>
                <div>
                  <p className={styles.nomeAvaliador}>{avaliador.user.nome}</p>
                  <p className={styles.infoAvaliador}>
                    {avaliador.emAndamento} em andamento · {avaliador.avaliadas}{" "}
                    avaliadas
                  </p>
                  {avaliador.foraDaArea && (
                    <p className={styles.avisoOcupado}>
                      Fora da área desta submissão
                    </p>
                  )}
                </div>
                <Button
                  icon={RiUserAddLine}
                  className="btn-primary"
                  loading={atribuindoAvaliadorId === avaliador.id}
                  onClick={() => handleAtribuir(avaliador)}
                >
                  Selecionar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>

      <ModalDelete
        isOpen={!!atribuicaoParaRetirar}
        onClose={() => {
          setAtribuicaoParaRetirar(null);
          setErroRetirar("");
        }}
        title="Retirar avaliador da submissão"
        confirmationText="Tem certeza que deseja retirar este avaliador desta submissão? A submissão voltará para a fila de aguardando avaliação."
        errorDelete={erroRetirar}
        handleDelete={handleConfirmarRetirar}
        txtBtn={retirando ? "Retirando..." : "Retirar"}
      />
    </div>
  );
};

export default Page;
