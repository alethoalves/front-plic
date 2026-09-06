"use client";
import {
  RiAddCircleLine,
  RiAlarmLine,
  RiAlertLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiMapPinLine,
  RiMedalLine,
  RiPercentLine,
  RiPresentationLine,
  RiQuillPenLine,
  RiRobot2Line,
  RiStarLine,
  RiThumbDownLine,
  RiSearchLine,
  RiHourglassLine,
  RiSearchEyeLine,
  RiCheckboxCircleLine,
  RiLoginCircleLine,
  RiUserUnfollowLine,
  RiLinkUnlinkM,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { getSubsessaoById } from "@/app/api/client/subsessoes";
import { getSessoesBySlug } from "@/app/api/client/sessoes";
import { updateSubmissaoStatus } from "@/app/api/client/submissao";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import ModalSubmissaoAdmin from "@/components/ModalSubmissaoAdmin";

import {
  vincularSubmissao,
  desvincularSubmissao,
  vincularAutomaticamenteSubmissao,
  gerarSquareParaSubsessao,
} from "@/app/api/client/square";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
import { formatarData, formatarHora } from "@/lib/formatarDatas";

const STATUS_LABEL = {
  DISTRIBUIDA: "checkin pendente",
  SELECIONADA: "checkin pendente",
  AGUARDANDO_AVALIACAO: "aguardando avaliação",
  AVALIADA: "avaliação concluída",
  EM_AVALIACAO: "em avaliação",
  AUSENTE: "ausente",
};
const statusLabel = (status) => STATUS_LABEL[status] ?? status;

const STATUS_CLASSE = {
  DISTRIBUIDA: "error",
  SELECIONADA: "error",
  AGUARDANDO_AVALIACAO: "warning",
  AVALIADA: "success",
  EM_AVALIACAO: "emAvaliacao",
  AUSENTE: "inativada",
};
const statusClasse = (status) => styles[STATUS_CLASSE[status]] || "";

// Opções de troca rápida de status no card do pôster — mesmas 5 do ícone
// de status em components/SubmissoesTable.jsx (SELECIONADA fica de fora, é
// resultado do fluxo de premiação, não faz sentido como troca manual).
const STATUS_ALTERAVEIS = [
  { value: "AUSENTE", label: "Ausente" },
  { value: "DISTRIBUIDA", label: "Checkin pendente" },
  { value: "AGUARDANDO_AVALIACAO", label: "Aguardando avaliação" },
  { value: "EM_AVALIACAO", label: "Em avaliação" },
  { value: "AVALIADA", label: "Avaliada" },
];

const STATUS_ICON = {
  AUSENTE: RiUserUnfollowLine,
  DISTRIBUIDA: RiLoginCircleLine,
  AGUARDANDO_AVALIACAO: RiHourglassLine,
  EM_AVALIACAO: RiSearchEyeLine,
  AVALIADA: RiCheckboxCircleLine,
};

// Sufixo usado pra montar as classes do quadrado de ícone (ex.:
// "statusIconBtnAusenteAtivo" no page.module.scss) — mesmo nome de classe
// de components/SubmissoesTable.module.scss pra reaproveitar as mesmas cores.
const STATUS_COR_ICONE = {
  AUSENTE: "Ausente",
  DISTRIBUIDA: "CheckinPendente",
  AGUARDANDO_AVALIACAO: "AguardandoAvaliacao",
  EM_AVALIACAO: "EmAvaliacao",
  AVALIADA: "Avaliada",
};

const CARGOS_ORIENTADORES = ["ORIENTADOR", "COORIENTADOR"];
const CARGOS_ALUNOS = ["AUTOR", "COAUTOR"];

// Critérios clicáveis dos cards do .statsGrid — cada um filtra o grid de
// pôsteres pra mostrar só os squares cuja submissão bate com o critério.
const FILTRO_STAT_LABEL = {
  AVALIADA: "Avaliados",
  CHECKIN_PENDENTE: "Aguardando Checkin",
  AGUARDANDO_AVALIACAO: "Aguardando Avaliação",
  EM_AVALIACAO: "em Avaliação",
  INDICADO_PREMIO: "Indicados ao Prêmio",
  MENCAO_HONROSA: "Menção Honrosa",
  NOTA_BAIXA: "Notas baixas",
};

const squareBateComFiltroStat = (square, filtroStat) => {
  if (!filtroStat) return true;
  const submissao = square.submissao;
  if (!submissao) return false;

  switch (filtroStat) {
    case "AVALIADA":
      return submissao.status === "AVALIADA";
    case "CHECKIN_PENDENTE":
      return (
        submissao.status === "DISTRIBUIDA" ||
        submissao.status === "SELECIONADA"
      );
    case "AGUARDANDO_AVALIACAO":
      return submissao.status === "AGUARDANDO_AVALIACAO";
    case "EM_AVALIACAO":
      return submissao.status === "EM_AVALIACAO";
    case "INDICADO_PREMIO":
      return !!submissao.indicacaoPremio;
    case "MENCAO_HONROSA":
      return !!submissao.mencaoHonrosa;
    case "NOTA_BAIXA":
      return submissao.notaFinal != null && submissao.notaFinal < 4;
    default:
      return true;
  }
};

const participantesLabel = (participacoes, cargos, { comCpf = false } = {}) =>
  (participacoes || [])
    .filter((p) => cargos.includes(p.cargo))
    .map(
      (p, i) => `${i > 0 ? ", " : ""}${p.user.nome} ${comCpf ? `(${p.user.cpf}) ` : ""}`
    );

function SubmissaoResumoContent({
  submissao,
  comCpf = false,
  tituloPrefixo = "",
  permitirAlterarStatus = false,
  statusAtualizandoId = null,
  onStatusChange,
}) {
  const resumo = submissao?.Resumo;
  return (
    <>
      <div className={styles.info}>
        <p className={`${styles.status} ${statusClasse(submissao?.status)}`}>
          {statusLabel(submissao?.status)}
        </p>
        <p className={styles.area}>
          {[
            resumo?.area?.area || "sem área",
            getInstituicaoSigla(submissao),
            submissao?.categoria?.toUpperCase(),
          ]
            .filter(Boolean)
            .join(" - ")}
        </p>
      </div>
      {permitirAlterarStatus && (
        <div className={styles.statusIcones}>
          {STATUS_ALTERAVEIS.map(({ value, label }) => {
            const Icon = STATUS_ICON[value];
            const ativo = submissao?.status === value;
            const corSufixo = STATUS_COR_ICONE[value];
            return (
              <button
                key={value}
                type="button"
                title={label}
                disabled={statusAtualizandoId === submissao?.id}
                className={`${styles.statusIconBtn} ${
                  ativo ? styles[`statusIconBtn${corSufixo}Ativo`] : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(submissao, value);
                }}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      )}
      <div className={styles.submissaoData}>
        <h6>
          {tituloPrefixo}
          {resumo?.titulo}
        </h6>
        <p className={styles.participacoes}>
          <strong>Orientadores: </strong>
          {participantesLabel(resumo?.participacoes, CARGOS_ORIENTADORES, {
            comCpf,
          })}
        </p>
        <p className={styles.participacoes}>
          <strong>Alunos: </strong>
          {participantesLabel(resumo?.participacoes, CARGOS_ALUNOS, {
            comCpf,
          })}
        </p>
      </div>
    </>
  );
}

function PremiosBadges({ submissao, notaFinalComPrefixo = false }) {
  if (
    !(
      submissao?.premio ||
      submissao?.indicacaoPremio ||
      submissao?.notaFinal
    )
  ) {
    return null;
  }
  return (
    <div className={styles.premios}>
      {submissao?.premio && <Tag severity="warning" value="Premiado" />}
      {submissao?.indicacaoPremio && (
        <Tag severity="info" value="Indicado ao Prêmio" />
      )}
      {submissao?.mencaoHonrosa && (
        <Tag severity="success" value="Menção Honrosa" />
      )}
      {submissao?.notaFinal && (
        <Tag
          value={
            notaFinalComPrefixo
              ? `Nota: ${submissao.notaFinal}`
              : `${submissao.notaFinal}`
          }
        />
      )}
    </div>
  );
}

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const [subsessao, setSubsessao] = useState(null);
  const [subsessaoFiltered, setSubsessaoFiltered] = useState(null);
  const [squareSelected, setSquareSelected] = useState(null);
  const [submissaoSelected, setSubmissaoSelected] = useState(null);

  // Navegação entre subsessões (setas ← →) sem precisar do menu lateral —
  // mesma ordenação usada lá (por sessão, depois por horário dentro dela).
  const [subsessoesOrdenadas, setSubsessoesOrdenadas] = useState([]);

  useEffect(() => {
    let ativo = true;
    getSessoesBySlug(params.eventoSlug)
      .then((sessoes) => {
        if (!ativo) return;
        const ordenadas = (sessoes || []).flatMap((sessao) =>
          [...(sessao.subsessaoApresentacao || [])].sort(
            (a, b) => new Date(a.inicio) - new Date(b.inicio)
          )
        );
        setSubsessoesOrdenadas(ordenadas);
      })
      .catch((error) =>
        console.error("Erro ao buscar sessões para navegação:", error)
      );
    return () => {
      ativo = false;
    };
  }, [params.eventoSlug]);

  const indiceAtual = subsessoesOrdenadas.findIndex(
    (s) => s.id === Number(params.idSubsessao)
  );
  const subsessaoAnterior =
    indiceAtual > 0 ? subsessoesOrdenadas[indiceAtual - 1] : null;
  const proximaSubsessao =
    indiceAtual >= 0 && indiceAtual < subsessoesOrdenadas.length - 1
      ? subsessoesOrdenadas[indiceAtual + 1]
      : null;

  // Estatísticas do .statsGrid recalculadas a partir do estado local (em
  // vez do subsessao.info vindo só do fetch inicial) — sem isso, trocar
  // status/desvincular/alocar só refletia aqui depois de recarregar a
  // página, já que essas ações atualizam Square/subsessaoFiltered em
  // memória, não o objeto `info` (que é só um snapshot do momento do fetch).
  const todasSubmissoes = useMemo(() => {
    const alocadas = (subsessao?.Square || [])
      .filter((square) => square.submissao)
      .map((square) => square.submissao);
    return [...alocadas, ...(subsessaoFiltered || [])];
  }, [subsessao, subsessaoFiltered]);

  const info = useMemo(
    () => ({
      total: todasSubmissoes.length,
      avaliadas: todasSubmissoes.filter((s) => s.status === "AVALIADA")
        .length,
      distribuidas: todasSubmissoes.filter(
        (s) => s.status === "DISTRIBUIDA" || s.status === "SELECIONADA"
      ).length,
      aguardando: todasSubmissoes.filter(
        (s) => s.status === "AGUARDANDO_AVALIACAO"
      ).length,
      emAvaliacao: todasSubmissoes.filter((s) => s.status === "EM_AVALIACAO")
        .length,
      indicadosPremio: todasSubmissoes.filter((s) => s.indicacaoPremio)
        .length,
      mencaoHonrosa: todasSubmissoes.filter((s) => s.mencaoHonrosa).length,
      notasMenores4: todasSubmissoes.filter(
        (s) => s.notaFinal != null && s.notaFinal < 4
      ).length,
      submissoesNaoAlocadas: todasSubmissoes.filter(
        (s) => !s.square || s.square.length < 1
      ).length,
    }),
    [todasSubmissoes]
  );

  // Filtro dos squares (pôsteres) por nome, CPF, título ou área
  const [squareFilter, setSquareFilter] = useState("");
  const [filteredSquares, setFilteredSquares] = useState([]);

  // Card do .statsGrid clicado (toggle, só um ativo por vez) — filtra o
  // grid de pôsteres por status/prêmio/nota, combinado com squareFilter.
  const [filtroStat, setFiltroStat] = useState(null);
  const alternarFiltroStat = (valor) =>
    setFiltroStat((atual) => (atual === valor ? null : valor));

  // Filtro (client-side) dos candidatos no modal "Inserir Trabalho" — a
  // lista inteira já vem carregada em subsessaoFiltered, não precisa de
  // outra ida ao backend só pra filtrar o que já está em memória.
  const [candidatoFilter, setCandidatoFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(null);
  const [isModalOpenSubmissao, setIsModalOpenSubmissao] = useState(null);
  const [isUpdated, setIsUpdated] = useState(false);

  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingAlocacao, setLoadingAlocacao] = useState(false);
  const [loadingGerarPoster, setLoadingGerarPoster] = useState(false);
  const [statusAtualizandoId, setStatusAtualizandoId] = useState(null);

  // Confirmação de desvincular submissão de um pôster
  const [squareParaDesvincular, setSquareParaDesvincular] = useState(null);
  const [desvinculando, setDesvinculando] = useState(false);
  const [erroDesvincular, setErroDesvincular] = useState("");

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

  // Filtra os squares (pôsteres) por nome, CPF, título ou área da submissão vinculada
  const filterSquares = (filterValue, squares) => {
    if (!filterValue.trim()) {
      return squares || [];
    }

    const lowerCaseFilter = filterValue.toLowerCase();

    return squares.filter((square) => {
      if (!square.submissaoId || !square.submissao) {
        return false; // Ignora squares sem submissão
      }

      const { submissao } = square;
      const { Resumo } = submissao;

      const hasNameMatch = Resumo?.participacoes?.some((participacao) =>
        participacao.user.nome.toLowerCase().includes(lowerCaseFilter)
      );

      const hasCpfMatch = Resumo?.participacoes?.some((participacao) =>
        participacao.user.cpf.toLowerCase().includes(lowerCaseFilter)
      );

      const hasTitleMatch = Resumo?.titulo
        ?.toLowerCase()
        .includes(lowerCaseFilter);

      const hasAreaMatch = Resumo?.area?.area
        ?.toLowerCase()
        .includes(lowerCaseFilter);

      return hasNameMatch || hasCpfMatch || hasTitleMatch || hasAreaMatch;
    });
  };

  // Filtra os candidatos do modal "Inserir Trabalho" por nome, CPF ou título
  const filterCandidatos = (filterValue, submissoes) => {
    if (!filterValue.trim()) {
      return submissoes || [];
    }

    const lowerCaseFilter = filterValue.toLowerCase();

    return (submissoes || []).filter((submissao) => {
      const { Resumo } = submissao;

      const hasNameMatch = Resumo?.participacoes?.some((participacao) =>
        participacao.user.nome.toLowerCase().includes(lowerCaseFilter)
      );

      const hasCpfMatch = Resumo?.participacoes?.some((participacao) =>
        participacao.user.cpf.toLowerCase().includes(lowerCaseFilter)
      );

      const hasTitleMatch = Resumo?.titulo
        ?.toLowerCase()
        .includes(lowerCaseFilter);

      return hasNameMatch || hasCpfMatch || hasTitleMatch;
    });
  };

  // Atualiza os squares filtrados quando o filtro ou a subsessão mudam
  useEffect(() => {
    if (subsessao?.Square) {
      const filtered = filterSquares(squareFilter, subsessao.Square);
      setFilteredSquares(filtered);
    }
  }, [squareFilter, subsessao]);

  // Função de busca dos dados ao renderizar o componente
  const fetchData = async (eventoSlug, idSubsessao) => {
    setLoading(true); // Define o estado de carregamento como verdadeiro
    try {
      const subsessao = await getSubsessaoById(eventoSlug, idSubsessao);
      // Ordena os items dentro de subsessao.Square pelo campo "numero" de forma crescente
      subsessao.Square.sort((a, b) => a.numero - b.numero);
      setSubsessao(subsessao);

      const filtered = filterSquares(squareFilter, subsessao.Square);
      setFilteredSquares(filtered);

      // Só submissões sem pôster ainda são candidatas a preencher um square vazio
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

  const closeModalAndResetData = async () => {
    if (isUpdated) {
      await fetchData(params.eventoSlug, params.idSubsessao); // Só faz fetch se houver atualização
      setIsUpdated(false); // Reseta o estado após atualizar os dados
    }
    setIsModalOpen(false);
    setIsModalOpenSubmissao(false);
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

  // Aloca automaticamente todas as submissões ainda sem pôster, uma a uma
  // (sequencial pra cada chamada já enxergar o square vazio que a anterior ocupou)
  const handleAlocarAutomaticamente = async () => {
    if (!subsessaoFiltered || subsessaoFiltered.length === 0) return;
    setLoadingAlocacao(true);
    setTotal(subsessaoFiltered.length);
    setProgress(0);
    try {
      for (let i = 0; i < subsessaoFiltered.length; i++) {
        try {
          await vincularAutomaticamenteSubmissao(
            params.eventoSlug,
            subsessaoFiltered[i].id
          );
        } catch (error) {
          console.error("Erro ao alocar submissão automaticamente:", error);
        }
        setProgress(i + 1);
      }
      showSuccess("Submissões alocadas automaticamente com sucesso!");
      await fetchData(params.eventoSlug, params.idSubsessao);
    } finally {
      setLoadingAlocacao(false);
    }
  };

  // Troca rápida de status direto no card do pôster, sem abrir o modal de
  // detalhes — atualiza só a submissão afetada em memória (Square e
  // subsessaoFiltered), sem recarregar a subsessão inteira.
  const handleStatusChange = async (submissaoAlvo, novoStatus) => {
    if (!submissaoAlvo || submissaoAlvo.status === novoStatus) return;
    setStatusAtualizandoId(submissaoAlvo.id);
    try {
      await updateSubmissaoStatus(
        params.eventoSlug,
        submissaoAlvo.id,
        novoStatus
      );
      setSubsessao((prev) => ({
        ...prev,
        Square: prev.Square.map((square) =>
          square.submissaoId === submissaoAlvo.id
            ? { ...square, submissao: { ...square.submissao, status: novoStatus } }
            : square
        ),
      }));
      setSubsessaoFiltered((prev) =>
        (prev || []).map((s) =>
          s.id === submissaoAlvo.id ? { ...s, status: novoStatus } : s
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar status da submissão:", error);
      showError("Erro ao atualizar o status da submissão.");
    } finally {
      setStatusAtualizandoId(null);
    }
  };

  // Desvincula a submissão de um pôster já ocupado — a submissão volta a
  // aparecer como candidata sem pôster, sem precisar recarregar a subsessão.
  const confirmarDesvincular = async () => {
    if (!squareParaDesvincular) return;
    setDesvinculando(true);
    setErroDesvincular("");
    try {
      await desvincularSubmissao(
        params.eventoSlug,
        squareParaDesvincular.submissaoId,
        squareParaDesvincular.id
      );
      const submissaoLiberada = squareParaDesvincular.submissao;
      setSubsessao((prev) => ({
        ...prev,
        Square: prev.Square.map((square) =>
          square.id === squareParaDesvincular.id
            ? { ...square, submissaoId: null, submissao: null }
            : square
        ),
      }));
      if (submissaoLiberada) {
        setSubsessaoFiltered((prev) => [
          ...(prev || []),
          { ...submissaoLiberada, square: [] },
        ]);
      }
      setSquareParaDesvincular(null);
    } catch (error) {
      console.error("Erro ao desvincular submissão do pôster:", error);
      setErroDesvincular("Erro ao desvincular a submissão. Tente novamente.");
    } finally {
      setDesvinculando(false);
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
      showError(
        error.response?.data?.message || "Erro ao alocar submissão ao pôster."
      );
    } finally {
      setLoading(false); // Para o estado de carregamento
    }
  };
  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiAddCircleLine />
      </div>
      <h4>{squareSelected ? "Inserir Trabalho" : "Trabalhos sem Pôster"}</h4>
      <div className="p-inputgroup mb-2">
        <span className="p-inputgroup-addon">
          <RiSearchLine />
        </span>
        <InputText
          value={candidatoFilter}
          onChange={(e) => setCandidatoFilter(e.target.value)}
          placeholder="Filtrar por nome, CPF ou título..."
        />
      </div>
      {loading && <p className={styles.loadingInline}>Carregando...</p>}
      {!loading && (
        <div className={styles.squares}>
          {filterCandidatos(candidatoFilter, subsessaoFiltered).map((item) => (
            <div
              key={item.id}
              className={styles.square}
              onClick={() => {
                if (squareSelected) {
                  alocarSubmissao(item);
                } else {
                  setSubmissaoSelected(item);
                  setIsModalOpenSubmissao(true);
                }
              }}
            >
              <div className={`${styles.squareContent} m-0`}>
                <SubmissaoResumoContent submissao={item} />
              </div>
              <PremiosBadges submissao={item} />
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

  const squaresPorTexto = squareFilter
    ? filteredSquares
    : subsessao?.Square || [];
  const squaresExibidos = squaresPorTexto.filter((square) =>
    squareBateComFiltroStat(square, filtroStat)
  );

  return (
    <div className={styles.navContent}>
      <Toast ref={toast} position="top-right" />
      {renderModalContent()}
      {renderModalSubmissao()}
      <ModalDelete
        isOpen={!!squareParaDesvincular}
        onClose={() => {
          setSquareParaDesvincular(null);
          setErroDesvincular("");
        }}
        icon={RiLinkUnlinkM}
        title="Desvincular pôster?"
        confirmationText={`Isso vai remover "${
          squareParaDesvincular?.submissao?.Resumo?.titulo || "esta submissão"
        }" do pôster nº ${
          squareParaDesvincular?.numero
        }. Ela volta a ficar sem pôster atribuído.`}
        errorDelete={erroDesvincular}
        handleDelete={confirmarDesvincular}
        txtBtn={desvinculando ? "Desvinculando..." : "Desvincular"}
      />

      <div className={styles.pageCard}>
        <div className={styles.tituloPagina}>
          {subsessaoAnterior ? (
            <Link
              href={`/evento/${params.eventoSlug}/admin/sessoes/${subsessaoAnterior.id}`}
              className={styles.navSeta}
              title="Subsessão anterior"
            >
              <RiArrowLeftLine size={18} />
            </Link>
          ) : (
            <span className={`${styles.navSeta} ${styles.navSetaDesabilitada}`}>
              <RiArrowLeftLine size={18} />
            </span>
          )}

          <div className={styles.tituloPaginaTexto}>
            <h5>{subsessao?.sessaoApresentacao?.titulo}</h5>
            {subsessao && (
              <p>
                {formatarData(subsessao?.inicio)} - de{" "}
                {formatarHora(subsessao?.inicio)} às{" "}
                {formatarHora(subsessao?.fim)}
              </p>
            )}
          </div>

          {proximaSubsessao ? (
            <Link
              href={`/evento/${params.eventoSlug}/admin/sessoes/${proximaSubsessao.id}`}
              className={styles.navSeta}
              title="Próxima subsessão"
            >
              <RiArrowRightLine size={18} />
            </Link>
          ) : (
            <span className={`${styles.navSeta} ${styles.navSetaDesabilitada}`}>
              <RiArrowRightLine size={18} />
            </span>
          )}
        </div>

        <section className={styles.pageSection}>
          <div className={styles.sectionHead}>
            <h6>Dashboard</h6>
            <p>Métricas de avaliação, prêmio e alocação desta subsessão.</p>
          </div>

          {subsessao && (
            <div className={styles.statsGrid}>
              <div
                className={`${styles.statTile} ${
                  filtroStat === "AVALIADA" ? styles.statTileAtivo : ""
                }`}
                onClick={() => alternarFiltroStat("AVALIADA")}
              >
                <div className={styles.icon}>
                  <RiPercentLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>
                    {(info.avaliadas / info.total).toFixed(
                      2
                    )}
                    % (faltam {info.total - info.avaliadas})
                  </h6>
                  <p>Avaliados</p>
                </div>
              </div>
              <div
                className={`${styles.statTile} ${
                  filtroStat === "CHECKIN_PENDENTE" ? styles.statTileAtivo : ""
                }`}
                onClick={() => alternarFiltroStat("CHECKIN_PENDENTE")}
              >
                <div className={styles.icon}>
                  <RiAlarmLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{info.distribuidas}</h6>
                  <p>Aguardando Checkin</p>
                </div>
              </div>
              <div
                className={`${styles.statTile} ${
                  filtroStat === "AGUARDANDO_AVALIACAO"
                    ? styles.statTileAtivo
                    : ""
                }`}
                onClick={() => alternarFiltroStat("AGUARDANDO_AVALIACAO")}
              >
                <div className={styles.icon}>
                  <RiPresentationLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{info.aguardando}</h6>
                  <p>Aguardando Avaliação</p>
                </div>
              </div>
              <div
                className={`${styles.statTile} ${
                  filtroStat === "EM_AVALIACAO" ? styles.statTileAtivo : ""
                }`}
                onClick={() => alternarFiltroStat("EM_AVALIACAO")}
              >
                <div className={styles.icon}>
                  <RiQuillPenLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{info.emAvaliacao}</h6>
                  <p>em Avaliação</p>
                </div>
              </div>
              <div
                className={`${styles.statTile} ${
                  filtroStat === "INDICADO_PREMIO" ? styles.statTileAtivo : ""
                }`}
                onClick={() => alternarFiltroStat("INDICADO_PREMIO")}
              >
                <div className={styles.icon}>
                  <RiMedalLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{info.indicadosPremio}</h6>
                  <p>Indicados ao Prêmio</p>
                </div>
              </div>
              <div
                className={`${styles.statTile} ${
                  filtroStat === "MENCAO_HONROSA" ? styles.statTileAtivo : ""
                }`}
                onClick={() => alternarFiltroStat("MENCAO_HONROSA")}
              >
                <div className={styles.icon}>
                  <RiStarLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{info.mencaoHonrosa}</h6>
                  <p>Menção Honrosa</p>
                </div>
              </div>
              <div
                className={`${styles.statTile} ${
                  filtroStat === "NOTA_BAIXA" ? styles.statTileAtivo : ""
                }`}
                onClick={() => alternarFiltroStat("NOTA_BAIXA")}
              >
                <div className={styles.icon}>
                  <RiThumbDownLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{info.notasMenores4}</h6>
                  <p>Notas baixas</p>
                </div>
              </div>
              <div
                className={styles.statTile}
                onClick={() => {
                  setSquareSelected(null);
                  setCandidatoFilter("");
                  setIsModalOpen(true);
                }}
              >
                <div className={styles.icon}>
                  <RiAlertLine />
                </div>
                <div className={styles.infoBoxDescription}>
                  <h6>{info.submissoesNaoAlocadas}</h6>
                  <p>Trabalhos sem Pôster</p>
                </div>
              </div>
            </div>
          )}

        </section>

        <section className={styles.pageSection}>
          <div className={styles.sectionHead}>
            <h6>Lista de Pôsteres</h6>
            <p>Busque, filtre e gerencie os pôsteres desta subsessão.</p>
          </div>

          <div className={styles.toolbar}>
            <div className={`p-inputgroup ${styles.searchInput}`}>
              <span className="p-inputgroup-addon">
                <RiSearchLine />
              </span>
              <InputText
                value={squareFilter}
                onChange={(e) => setSquareFilter(e.target.value)}
                placeholder="Filtrar por nome, CPF, título ou área..."
              />
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
              {subsessao?.Square.length > 0 &&
                subsessaoFiltered?.length > 0 && (
                  <Button
                    onClick={handleAlocarAutomaticamente}
                    icon={RiRobot2Line}
                    className="btn-secondary"
                    type="button"
                    disabled={loadingAlocacao}
                  >
                    {loadingAlocacao
                      ? `Alocando: ${progress} de ${total}`
                      : `Alocar automaticamente (${subsessaoFiltered.length})`}
                  </Button>
                )}
            </div>
          </div>
          {(squareFilter || filtroStat) && (
            <small className={styles.contador}>
              Mostrando {squaresExibidos.length} de{" "}
              {subsessao?.Square.length} pôsteres
              {filtroStat && ` — filtro: ${FILTRO_STAT_LABEL[filtroStat]}`}
            </small>
          )}
          {loading && <p className={styles.loadingInline}>Carregando...</p>}
          <div className={styles.squares}>
            {squaresExibidos.map(
              (item) => (
                <div key={item.id} className={styles.square}>
                  <div className={styles.squareHeader}>
                    <p>Pôster nº</p>
                    <h6>{item.numero}</h6>
                    {item.submissaoId && (
                      <button
                        type="button"
                        className={styles.desvincularBtn}
                        title="Desvincular submissão deste pôster"
                        onClick={() => setSquareParaDesvincular(item)}
                      >
                        <RiLinkUnlinkM size={14} />
                      </button>
                    )}
                  </div>

                  {!item.submissaoId ? (
                    <div
                      onClick={async () => {
                        setCandidatoFilter("");
                        setIsModalOpen(true);
                        setSquareSelected(item);
                        await fetchData(params.eventoSlug, params.idSubsessao);
                      }}
                      className={styles.squareContentEmpty}
                    >
                      <RiAddCircleLine />
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
                        <SubmissaoResumoContent
                          submissao={item.submissao}
                          comCpf
                          tituloPrefixo={`ID ${item.submissaoId}: `}
                          permitirAlterarStatus
                          statusAtualizandoId={statusAtualizandoId}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                      <PremiosBadges
                        submissao={item.submissao}
                        notaFinalComPrefixo
                      />
                    </>
                  )}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Page;
