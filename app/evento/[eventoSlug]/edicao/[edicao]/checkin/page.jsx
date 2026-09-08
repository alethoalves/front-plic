"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiSearchEyeLine, RiArrowLeftCircleLine } from "@remixicon/react";
import { getEventoBySlug, getEventoRootBySlug } from "@/app/api/client/eventos";
import { consultarCheckin, finalizarCheckin } from "@/app/api/client/checkin";
import { EventoBanner } from "@/components/evento/EventoBanner";
import Button from "@/components/Button";
import EtapaCpf from "@/components/checkin/EtapaCpf";
import EtapaSelecaoSubmissao from "@/components/checkin/EtapaSelecaoSubmissao";
import EtapaLocalizacao from "@/components/checkin/EtapaLocalizacao";
import EtapaInstrucao from "@/components/checkin/EtapaInstrucao";
import CheckinStatusCard from "@/components/checkin/CheckinStatusCard";
import checkinStyles from "@/components/checkin/checkin.module.scss";
import styles from "./page.module.scss";

const PASSOS_INSTRUCAO = [
  {
    titulo: "Atenção!",
    corpo:
      "Leia atentamente as próximas instruções para finalizar seu check-in.",
  },
  {
    titulo: "Passo 2",
    corpo:
      "Após seu check-in ser realizado você deverá ir imediatamente ao seu pôster e aguardar o avaliador.",
  },
  {
    titulo: "Passo 3",
    corpo: "Apresente seu trabalho ao avaliador.",
  },
  {
    titulo: "Passo 4",
    corpo:
      "Você poderá ser avaliado(a) por mais de um avaliador e poderá apresentar sua pesquisa para o público em geral.",
  },
  {
    titulo: "Passo 5",
    corpo:
      "Você poderá acompanhar o status da sua avaliação por este link assim que o check-in for concluído.",
  },
  {
    titulo: "Está tudo certo até aqui?",
    corpo: "Ao confirmar, seu check-in será finalizado imediatamente.",
    confirmacao: true,
  },
];

const Page = ({ params }) => {
  const router = useRouter();
  const [evento, setEvento] = useState(null);

  const [etapa, setEtapa] = useState("cpf");
  const [erroCpf, setErroCpf] = useState("");
  const [erroFinal, setErroFinal] = useState("");
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [loadingFinalizar, setLoadingFinalizar] = useState(false);

  const [token, setToken] = useState("");
  const [elegiveis, setElegiveis] = useState([]);
  const [submissaoId, setSubmissaoId] = useState(null);
  const [coords, setCoords] = useState(null);
  const [indiceInstrucao, setIndiceInstrucao] = useState(0);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    getEventoBySlug(params.edicao)
      .then(setEvento)
      .catch(() => setEvento(null));
  }, [params.edicao]);

  // Retomada vinda da tela de status (botão "fazer check-in agora" de outra
  // submissão) — já chega com token pronto, pula CPF e seleção direto pra
  // localização.
  useEffect(() => {
    const chave = `checkin:continuar:${params.edicao}`;
    const bruto = sessionStorage.getItem(chave);
    if (!bruto) return;

    sessionStorage.removeItem(chave);
    try {
      const { token: tokenRetomado, submissaoId: submissaoIdRetomado } =
        JSON.parse(bruto);
      setToken(tokenRetomado);
      setSubmissaoId(submissaoIdRetomado);
      setEtapa("localizacao");
    } catch (error) {
      console.error("Erro ao retomar check-in:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.edicao]);

  // Volta a tela de check-in pro início — usado no botão da tela de erro,
  // já que antes não havia como tentar de novo sem recarregar a página.
  const reiniciar = () => {
    setErroCpf("");
    setErroFinal("");
    setToken("");
    setElegiveis([]);
    setSubmissaoId(null);
    setCoords(null);
    setIndiceInstrucao(0);
    setResultado(null);
    setEtapa("cpf");
  };

  const handleConsultar = async (cpf) => {
    setLoadingConsulta(true);
    setErroCpf("");
    try {
      const resposta = await consultarCheckin(params.edicao, cpf);

      if (resposta.statusToken) {
        router.replace(
          `/evento/${params.eventoSlug}/edicao/${params.edicao}/checkin/status/${resposta.statusToken.checkinToken}`,
        );
        return;
      }

      if (!resposta.elegiveis || resposta.elegiveis.length === 0) {
        setErroFinal(
          resposta.message ?? "Nenhuma submissão liberada para check-in.",
        );
        setEtapa("erro");
        return;
      }

      setToken(resposta.token);
      setElegiveis(resposta.elegiveis);

      if (resposta.elegiveis.length === 1) {
        setSubmissaoId(resposta.elegiveis[0].submissaoId);
        setEtapa("localizacao");
      } else {
        setEtapa("selecao");
      }
    } catch (error) {
      setErroCpf(error.response?.data?.message ?? "Erro ao consultar CPF.");
    } finally {
      setLoadingConsulta(false);
    }
  };

  const handleSelecionarSubmissao = (id) => {
    setSubmissaoId(id);
    setEtapa("localizacao");
  };

  const handleLocalizacaoOk = (coordenadas) => {
    setCoords(coordenadas);
    setIndiceInstrucao(0);
    setEtapa("instrucao");
  };

  const handleProximaInstrucao = async () => {
    const passoAtual = PASSOS_INSTRUCAO[indiceInstrucao];

    if (!passoAtual.confirmacao) {
      setIndiceInstrucao((i) => i + 1);
      return;
    }

    setLoadingFinalizar(true);
    setErroFinal("");
    try {
      const resposta = await finalizarCheckin(params.edicao, token, {
        submissaoId,
        ...coords,
      });
      setResultado(resposta.resultado);
      setEtapa("resultado");
    } catch (error) {
      setErroFinal(
        error.response?.data?.message ?? "Erro ao finalizar check-in.",
      );
      setEtapa("erro");
    } finally {
      setLoadingFinalizar(false);
    }
  };

  return (
    <div className={styles.mainDiv}>
      <EventoBanner evento={evento} />

      {etapa === "cpf" && (
        <EtapaCpf
          onConsultar={handleConsultar}
          loading={loadingConsulta}
          erro={erroCpf}
        />
      )}

      {etapa === "selecao" && (
        <EtapaSelecaoSubmissao
          elegiveis={elegiveis}
          onSelecionar={handleSelecionarSubmissao}
        />
      )}

      {etapa === "localizacao" && (
        <EtapaLocalizacao
          eventoSlug={params.edicao}
          token={token}
          submissaoId={submissaoId}
          onSucesso={handleLocalizacaoOk}
        />
      )}

      {etapa === "instrucao" && (
        <EtapaInstrucao
          passo={PASSOS_INSTRUCAO[indiceInstrucao]}
          atual={indiceInstrucao + 1}
          total={PASSOS_INSTRUCAO.length}
          onProximo={handleProximaInstrucao}
          onNao={reiniciar}
          loading={loadingFinalizar}
        />
      )}

      {etapa === "resultado" && resultado && (
        <CheckinStatusCard
          eventoSlug={params.edicao}
          checkinToken={resultado.checkinToken}
          resultadoInicial={resultado}
        />
      )}

      {etapa === "erro" && (
        <div className={`${checkinStyles.card} text-center`}>
          <div className={checkinStyles.iconeCentral}>
            <RiSearchEyeLine />
          </div>
          <h1 className="h-editorial-sm mb-2">Nada por aqui ainda</h1>
          <p className="mb-3">{erroFinal}</p>
          <Button
            icon={RiArrowLeftCircleLine}
            className="btn-secondary w-100"
            onClick={reiniciar}
          >
            Tentar com outro CPF
          </Button>
        </div>
      )}
    </div>
  );
};

export default Page;
