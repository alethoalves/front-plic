"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiSearchEyeLine,
  RiErrorWarningLine,
  RiCheckLine,
} from "@remixicon/react";
import { Toast } from "primereact/toast";

import { getEventoBySlug } from "@/app/api/client/eventos";
import {
  getSubmissoesEmAvaliacao,
  getResumo,
  desvincularAvaliadorSubmissao,
  processarAvaliacao,
  getAreasPendentesWizard,
  atribuirTrabalhoWizard,
} from "@/app/api/client/submissaoAvaliador";

import Button from "@/components/Button";
import CabecalhoWizard from "@/components/avaliarWizard/CabecalhoWizard";
import SessaoBadge from "@/components/avaliarWizard/SessaoBadge";
import ModalResumo from "@/components/avaliarWizard/ModalResumo";
import ModalConfirmacao from "@/components/avaliarWizard/ModalConfirmacao";
import EtapaEscolhaAreas from "@/components/avaliarWizard/EtapaEscolhaAreas";
import EtapaTrabalhoAtribuido from "@/components/avaliarWizard/EtapaTrabalhoAtribuido";
import EtapaInstrucaoPoster from "@/components/avaliarWizard/EtapaInstrucaoPoster";
import EtapaFichaAvaliacao from "@/components/avaliarWizard/EtapaFichaAvaliacao";
import {
  getUltimasAreas,
  salvarUltimasAreas,
  getContadorSessao,
  incrementarContadorSessao,
} from "@/components/avaliarWizard/sessaoAvaliador";

import wizardStyles from "@/components/avaliarWizard/wizard.module.scss";
import styles from "./page.module.scss";

const MENSAGEM_PERMISSAO_NEGADA =
  "Permissão negada. Usuário não é um avaliador vinculado a este evento.";

const tenantIdDaSubmissao = (submissao) =>
  submissao?.tenant?.id ?? submissao?.instituicaoParceira?.id;

// O admin pode atribuir manualmente várias submissões ao mesmo avaliador
// (sem a trava de "uma por vez" que existe na auto-atribuição), então elas
// ficam "EM_AVALIACAO" e somem do pool que `atribuirTrabalhoWizard` enxerga
// (que só olha AGUARDANDO_AVALIACAO). Sem checar isso antes, "Avaliar outro
// trabalho" pulava direto pra sortear um novo em vez de mostrar o que já
// estava atribuído — só reaparecia recarregando a página do zero.
const buscarProximoAtribuidoPeloAdmin = async (eventoId) => {
  const emAndamento = await getSubmissoesEmAvaliacao(eventoId);
  return emAndamento && emAndamento.length > 0 ? emAndamento[0] : null;
};

const Page = ({ params }) => {
  const router = useRouter();
  const toast = useRef(null);

  const [etapa, setEtapa] = useState("carregando");
  const [evento, setEvento] = useState(null);
  const [contador, setContador] = useState(0);

  const [areasDisponiveis, setAreasDisponiveis] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);

  const [submissaoAtual, setSubmissaoAtual] = useState(null);
  const [submissaoDetalhada, setSubmissaoDetalhada] = useState(null);
  const [jaEstavaEmAndamento, setJaEstavaEmAndamento] = useState(false);

  const [modalResumoAberto, setModalResumoAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);

  const [motivoProximoPasso, setMotivoProximoPasso] = useState("avaliado");
  const [haTrabalhosRestantes, setHaTrabalhosRestantes] = useState(false);

  const [erro, setErro] = useState("");
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingAtribuir, setLoadingAtribuir] = useState(false);
  const [loadingAtribuirOutro, setLoadingAtribuirOutro] = useState(false);
  const [loadingFinalizar, setLoadingFinalizar] = useState(false);
  const [loadingDevolver, setLoadingDevolver] = useState(false);
  const [loadingDevolverTrabalho, setLoadingDevolverTrabalho] = useState(false);
  const [loadingContinuar, setLoadingContinuar] = useState(false);

  const mostrarToast = (severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 4000 });
  };

  const ehErroPermissaoNegada = (error) =>
    error?.response?.data?.message === MENSAGEM_PERMISSAO_NEGADA;

  const carregarDetalhes = async (eventoId, submissao) => {
    setSubmissaoDetalhada(null);
    try {
      const detalhada = await getResumo(
        eventoId,
        submissao.id,
        tenantIdDaSubmissao(submissao),
      );
      setSubmissaoDetalhada(detalhada);
    } catch (error) {
      console.error("Erro ao carregar detalhes da submissão:", error);
    }
  };

  // Usado na tela "concluído" (pós-ficha ou pós-devolução) pra decidir se
  // mostra "Continuar avaliação" — olha o evento inteiro, não só as áreas
  // que o avaliador tinha escolhido, porque o ponto é saber se ainda existe
  // ALGUM trabalho esperando, mesmo fora do filtro atual dele.
  const verificarTrabalhosRestantes = async (eventoId) => {
    try {
      const areas = await getAreasPendentesWizard(eventoId);
      setHaTrabalhosRestantes((areas || []).length > 0);
    } catch (error) {
      setHaTrabalhosRestantes(false);
    }
  };

  const carregarAreas = async (eventoId) => {
    setLoadingAreas(true);
    setErro("");
    try {
      const areas = await getAreasPendentesWizard(eventoId);
      setAreasDisponiveis(areas || []);
      const salvas = getUltimasAreas(eventoId).filter((areaId) =>
        (areas || []).some((area) => area.id === areaId),
      );
      setAreasSelecionadas(salvas);
    } catch (error) {
      setErro("Não foi possível carregar as áreas disponíveis agora.");
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      setEtapa("carregando");
      try {
        const eventoData = await getEventoBySlug(params.edicao);
        setEvento(eventoData);
        setContador(getContadorSessao(eventoData.id));

        const emAndamento = await getSubmissoesEmAvaliacao(eventoData.id);
        if (emAndamento && emAndamento.length > 0) {
          setSubmissaoAtual(emAndamento[0]);
          setJaEstavaEmAndamento(true);
          setEtapa("trabalhoAtribuido");
          carregarDetalhes(eventoData.id, emAndamento[0]);
        } else {
          setEtapa("escolhaAreas");
          carregarAreas(eventoData.id);
        }
      } catch (error) {
        if (ehErroPermissaoNegada(error)) {
          router.push(
            `/evento/${params.eventoSlug}/edicao/${params.edicao}/login-avaliador`,
          );
          return;
        }
        setErro("Não foi possível carregar seus dados agora.");
        setEtapa("erro");
      }
    };
    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAlternarArea = (areaId) => {
    setAreasSelecionadas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId],
    );
  };

  const handleContinuarAreas = async () => {
    setLoadingAtribuir(true);
    setErro("");
    salvarUltimasAreas(evento.id, areasSelecionadas);
    try {
      const submissao = await atribuirTrabalhoWizard(
        evento.id,
        areasSelecionadas,
      );
      if (!submissao) {
        setEtapa("semTrabalhos");
        return;
      }
      setSubmissaoAtual(submissao);
      setJaEstavaEmAndamento(false);
      setEtapa("trabalhoAtribuido");
      carregarDetalhes(evento.id, submissao);
    } catch (error) {
      setErro("Não foi possível atribuir um trabalho agora. Tente novamente.");
    } finally {
      setLoadingAtribuir(false);
    }
  };

  const handleLerResumo = () => {
    setModalResumoAberto(true);
  };

  const handleAtribuirOutro = async () => {
    setLoadingAtribuirOutro(true);
    setErro("");
    try {
      const idAnterior = submissaoAtual.id;
      await desvincularAvaliadorSubmissao(evento.id, idAnterior);

      const jaAtribuidoPeloAdmin = await buscarProximoAtribuidoPeloAdmin(evento.id);
      if (jaAtribuidoPeloAdmin) {
        setSubmissaoAtual(jaAtribuidoPeloAdmin);
        setJaEstavaEmAndamento(true);
        carregarDetalhes(evento.id, jaAtribuidoPeloAdmin);
        return;
      }

      const proxima = await atribuirTrabalhoWizard(
        evento.id,
        areasSelecionadas,
        idAnterior,
      );
      if (!proxima) {
        setSubmissaoAtual(null);
        setSubmissaoDetalhada(null);
        setEtapa("semTrabalhos");
        return;
      }
      setSubmissaoAtual(proxima);
      setJaEstavaEmAndamento(false);
      carregarDetalhes(evento.id, proxima);
    } catch (error) {
      setErro("Não foi possível trocar de trabalho agora. Tente novamente.");
    } finally {
      setLoadingAtribuirOutro(false);
    }
  };

  // Não devolve o trabalho atual aqui — só ao navegar pra cá. Se o avaliador
  // entrar na lista manual, não escolher nada e voltar, o trabalho que ele já
  // tinha continua com ele (o boot da tela detecta e cai direto na etapa 2).
  // A devolução só acontece se/quando ele efetivamente escolher outro na
  // tela de auto-alocação (que troca pelo id passado em `substituir`).
  const handleVerEspecificos = () => {
    setErro("");
    router.push(
      `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliar/auto-alocacao?areas=${areasSelecionadas.join(",")}&substituir=${submissaoAtual.id}`,
    );
  };

  const handleIrParaPoster = () => setEtapa("instrucaoPoster");
  const handleVoltarParaTrabalho = () => setEtapa("trabalhoAtribuido");
  const handleChegarNoPoster = () => setEtapa("ficha");

  const handleFinalizarFicha = async (body) => {
    setLoadingFinalizar(true);
    setErro("");
    try {
      const resposta = await processarAvaliacao(evento.id, body);
      if (resposta.status === "success") {
        const novoContador = incrementarContadorSessao(evento.id);
        setContador(novoContador);
        setSubmissaoAtual(null);
        setSubmissaoDetalhada(null);
        setMotivoProximoPasso("avaliado");
        await verificarTrabalhosRestantes(evento.id);
        setEtapa("concluido");
      } else {
        setErro(resposta.message || "Não foi possível processar a avaliação.");
      }
    } catch (error) {
      setErro(
        error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação.",
      );
    } finally {
      setLoadingFinalizar(false);
    }
  };

  const handleDevolverFicha = () => {
    setErro("");
    setConfirmacao({
      mensagem: "Tem certeza que deseja devolver esta avaliação?",
      executar: async () => {
        setLoadingDevolver(true);
        setErro("");
        try {
          await desvincularAvaliadorSubmissao(evento.id, submissaoAtual.id);
          mostrarToast(
            "success",
            "Sucesso",
            "Avaliação devolvida com sucesso.",
          );
          setSubmissaoAtual(null);
          setSubmissaoDetalhada(null);
          setConfirmacao(null);
          setEtapa("escolhaAreas");
          carregarAreas(evento.id);
        } catch (error) {
          setErro("Não foi possível devolver a avaliação agora.");
        } finally {
          setLoadingDevolver(false);
        }
      },
    });
  };

  // Devolver o trabalho direto da etapa "trabalho atribuído", sem trocar por
  // outro nem ir pro fluxo manual — a pessoa só quer parar por agora. Some
  // com a submissão atual e leva pra tela de "próximo passo" (concluído).
  const handleDevolverTrabalho = () => {
    setErro("");
    setConfirmacao({
      mensagem: "Tem certeza que deseja devolver este trabalho sem avaliar?",
      executar: async () => {
        setLoadingDevolverTrabalho(true);
        setErro("");
        try {
          await desvincularAvaliadorSubmissao(evento.id, submissaoAtual.id);
          setSubmissaoAtual(null);
          setSubmissaoDetalhada(null);
          setMotivoProximoPasso("devolvido");
          await verificarTrabalhosRestantes(evento.id);
          setConfirmacao(null);
          setEtapa("concluido");
        } catch (error) {
          setErro("Não foi possível devolver o trabalho agora.");
        } finally {
          setLoadingDevolverTrabalho(false);
        }
      },
    });
  };

  // Botão "Continuar avaliação" da tela de próximo passo: primeiro checa se
  // sobrou algum trabalho atribuído manualmente pelo admin (não aparece no
  // pool de auto-atribuição), depois tenta um novo dentro das áreas já
  // escolhidas (friction-free); só manda pra tela de escolha de área se não
  // houver nada em nenhum dos dois.
  const handleContinuarAvaliacao = async () => {
    setLoadingContinuar(true);
    setErro("");
    try {
      const jaAtribuidoPeloAdmin = await buscarProximoAtribuidoPeloAdmin(evento.id);
      if (jaAtribuidoPeloAdmin) {
        setSubmissaoAtual(jaAtribuidoPeloAdmin);
        setJaEstavaEmAndamento(true);
        setEtapa("trabalhoAtribuido");
        carregarDetalhes(evento.id, jaAtribuidoPeloAdmin);
        return;
      }

      const proxima = await atribuirTrabalhoWizard(
        evento.id,
        areasSelecionadas,
      );
      if (proxima) {
        setSubmissaoAtual(proxima);
        setJaEstavaEmAndamento(false);
        setEtapa("trabalhoAtribuido");
        carregarDetalhes(evento.id, proxima);
      } else {
        setEtapa("escolhaAreas");
        carregarAreas(evento.id);
      }
    } catch (error) {
      setErro("Não foi possível continuar agora. Tente novamente.");
    } finally {
      setLoadingContinuar(false);
    }
  };

  const handleEscolherOutrasAreas = () => {
    setEtapa("escolhaAreas");
    carregarAreas(evento.id);
  };

  const handleTentarNovamente = () => {
    window.location.reload();
  };

  return (
    <div className={styles.mainDiv}>
      <Toast ref={toast} />
      <ModalConfirmacao
        isOpen={!!confirmacao}
        onClose={() => setConfirmacao(null)}
        titulo="Confirmação de devolução"
        mensagem={confirmacao?.mensagem}
        textoConfirmar="Sim, devolver"
        onConfirmar={() => confirmacao?.executar()}
        loading={loadingDevolver || loadingDevolverTrabalho}
        erro={erro}
      />

      {params.eventoSlug && params.edicao && (
        <CabecalhoWizard
          eventoSlug={params.eventoSlug}
          edicao={params.edicao}
        />
      )}

      {contador > 0 && etapa !== "carregando" && (
        <div className={styles.badgeWrapper}>
          <SessaoBadge quantidade={contador} />
        </div>
      )}

      {etapa === "carregando" && (
        <div className={wizardStyles.card}>
          <p className="text-center">Carregando...</p>
        </div>
      )}

      {etapa === "escolhaAreas" && (
        <EtapaEscolhaAreas
          areas={areasDisponiveis}
          selecionadas={areasSelecionadas}
          onAlternarArea={handleAlternarArea}
          onContinuar={handleContinuarAreas}
          onVerificarNovamente={() => carregarAreas(evento.id)}
          carregandoAreas={loadingAreas}
          enviando={loadingAtribuir}
          erro={erro}
        />
      )}

      {etapa === "trabalhoAtribuido" && (
        <>
          <EtapaTrabalhoAtribuido
            submissao={submissaoAtual}
            jaEstavaEmAndamento={jaEstavaEmAndamento}
            onLerResumo={handleLerResumo}
            onAtribuirOutro={handleAtribuirOutro}
            onVerEspecificos={handleVerEspecificos}
            onIrParaPoster={handleIrParaPoster}
            onDevolver={handleDevolverTrabalho}
            loadingAtribuirOutro={loadingAtribuirOutro}
            loadingDevolver={loadingDevolverTrabalho}
            erro={erro}
          />
          <ModalResumo
            isOpen={modalResumoAberto}
            onClose={() => setModalResumoAberto(false)}
            resumo={submissaoDetalhada}
            carregando={!submissaoDetalhada}
          />
        </>
      )}

      {etapa === "instrucaoPoster" && (
        <EtapaInstrucaoPoster
          submissao={submissaoAtual}
          onChegar={handleChegarNoPoster}
          onVoltar={handleVoltarParaTrabalho}
        />
      )}

      {etapa === "ficha" && (
        <EtapaFichaAvaliacao
          submissaoDetalhada={submissaoDetalhada}
          numeroPoster={
            submissaoAtual?.square?.length > 0
              ? submissaoAtual.square[0].numero
              : "-"
          }
          onFinalizar={handleFinalizarFicha}
          onDevolver={handleDevolverFicha}
          loadingFinalizar={loadingFinalizar}
          loadingDevolver={loadingDevolver}
          erro={erro}
        />
      )}

      {etapa === "concluido" && (
        <div className={`${wizardStyles.card} text-center`}>
          <div className={wizardStyles.iconeCentral}>
            <RiCheckLine />
          </div>
          <h1 className="h-editorial-sm mb-2">
            {motivoProximoPasso === "devolvido"
              ? "Trabalho devolvido"
              : "Avaliação enviada!"}
          </h1>
          <p className="mb-3">
            {motivoProximoPasso === "devolvido"
              ? "O trabalho voltou para a fila de avaliação de outros avaliadores."
              : "Obrigado por avaliar este trabalho."}
          </p>

          {erro && <p className={`${wizardStyles.erro} mb-2`}>{erro}</p>}

          {haTrabalhosRestantes ? (
            <Button
              className="btn-primary w-100"
              onClick={handleContinuarAvaliacao}
              loading={loadingContinuar}
            >
              Avaliar outro trabalho
            </Button>
          ) : (
            <p className="mb-1">
              Não há mais trabalhos aguardando avaliação no momento.
            </p>
          )}

          <Button
            className="btn-secondary w-100 mt-1"
            onClick={handleEscolherOutrasAreas}
          >
            Incluir mais áreas
          </Button>
        </div>
      )}

      {etapa === "semTrabalhos" && (
        <div className={`${wizardStyles.card} text-center`}>
          <div className={wizardStyles.iconeCentral}>
            <RiSearchEyeLine />
          </div>
          <h1 className="h-editorial-sm mb-2">Nada por aqui ainda</h1>
          <p className="mb-3">
            Não há mais trabalhos disponíveis nas áreas escolhidas no momento.
          </p>
          <Button
            className="btn-secondary w-100"
            onClick={handleEscolherOutrasAreas}
          >
            Escolher outras áreas
          </Button>
        </div>
      )}

      {etapa === "erro" && (
        <div className={`${wizardStyles.card} text-center`}>
          <div className={wizardStyles.iconeCentral}>
            <RiErrorWarningLine />
          </div>
          <h1 className="h-editorial-sm mb-2">Algo não saiu como esperado</h1>
          <p className="mb-3">{erro}</p>
          <Button
            className="btn-secondary w-100"
            onClick={handleTentarNovamente}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
};

export default Page;
