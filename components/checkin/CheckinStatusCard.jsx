"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  RiCheckboxCircleLine,
  RiMapPinLine,
  RiCalendarEventLine,
  RiTimerLine,
  RiPresentationLine,
  RiLockLine,
  RiHourglassLine,
  RiSearchEyeLine,
  RiDownloadLine,
  RiLoginCircleLine,
  RiArrowRightCircleLine,
  RiExternalLinkLine,
} from "@remixicon/react";
import { getStatusCheckin, iniciarCheckinOutraSubmissao } from "@/app/api/client/checkin";
import { generateAndDownloadCertificatePDF } from "@/app/api/client/certificado";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import Button from "@/components/Button";
import styles from "./checkin.module.scss";
import cardStyles from "./CheckinStatusCard.module.scss";

const STATUS_LABEL = {
  AGUARDANDO_AVALIACAO: "Aguardando avaliação",
  EM_AVALIACAO: "Em avaliação",
  AVALIADA: "Avaliação concluída",
};

// Mesma linguagem de cor por status já usada no admin (STATUS_CLASSE em
// admin/sessoes/[idSubsessao]/page.jsx): amarelo = aguardando, verde = concluído.
const STATUS_PILL_CLASSE = {
  AGUARDANDO_AVALIACAO: "pillAguardando",
  EM_AVALIACAO: "pillEmAvaliacao",
  AVALIADA: "pillAvaliada",
};

const STATUS_ICON = {
  AGUARDANDO_AVALIACAO: RiHourglassLine,
  EM_AVALIACAO: RiSearchEyeLine,
  AVALIADA: RiCheckboxCircleLine,
};

// Cada tipo de certificado além do de participação só aparece se a
// submissão de fato se qualificar pra ele (flags gravadas pelo gestor no
// fluxo de avaliação/premiação).
const TIPOS_CERTIFICADO = [
  { tipo: "EXPOSITOR", label: "Certificado de participação", elegivel: () => true },
  { tipo: "PREMIADO", label: "Certificado de premiação", elegivel: (r) => r.premio },
  { tipo: "INDICADO", label: "Certificado de indicação ao prêmio", elegivel: (r) => r.indicacaoPremio },
  { tipo: "MENCAO", label: "Certificado de menção honrosa", elegivel: (r) => r.mencaoHonrosa },
];

const formatarListaAvaliadores = (nomes) => {
  if (!nomes || nomes.length === 0) return "a um avaliador";
  if (nomes.length === 1) return `ao(à) avaliador(a) ${nomes[0]}`;
  return `aos(às) avaliadores(as) ${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
};

const POLL_INTERVAL_MS = 30000;

const formatarDuracao = (segundos) => {
  const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
  const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(segundos % 60)).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// Tela final do wizard de check-in e conteúdo da página de acompanhamento
// (checkin/status/[checkinToken]) — mesmo componente nos dois lugares.
const CheckinStatusCard = ({ eventoSlug, checkinToken, resultadoInicial }) => {
  const router = useRouter();
  const params = useParams();
  const [resultado, setResultado] = useState(resultadoInicial ?? null);
  const [erro, setErro] = useState("");
  const [duracaoSegundos, setDuracaoSegundos] = useState(0);
  const [baixando, setBaixando] = useState({});
  const [erroCertificado, setErroCertificado] = useState({});
  const [iniciandoOutra, setIniciandoOutra] = useState({});
  const [erroOutra, setErroOutra] = useState({});
  const pollRef = useRef(null);

  const buscarStatus = async () => {
    try {
      const resposta = await getStatusCheckin(eventoSlug, checkinToken);
      setResultado(resposta.resultado);
    } catch (error) {
      setErro(
        error.response?.data?.message ?? "Link de acompanhamento inválido.",
      );
    }
  };

  const handleBaixarCertificado = async (tipo) => {
    setBaixando((prev) => ({ ...prev, [tipo]: true }));
    setErroCertificado((prev) => ({ ...prev, [tipo]: "" }));
    try {
      await generateAndDownloadCertificatePDF(resultado.eventoId, tipo, resultado.submissaoId);
    } catch (error) {
      setErroCertificado((prev) => ({
        ...prev,
        [tipo]: error.message ?? "Erro ao gerar o certificado. Tente novamente.",
      }));
    } finally {
      setBaixando((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  // Identifica o aluno pelo checkinToken da submissão atual (já concluída),
  // sem precisar escanear o QR Code/redigitar o CPF de novo — o wizard de
  // check-in pula direto pra etapa de localização com esse token.
  const handleIniciarOutraSubmissao = async (submissaoIdDestino) => {
    setIniciandoOutra((prev) => ({ ...prev, [submissaoIdDestino]: true }));
    setErroOutra((prev) => ({ ...prev, [submissaoIdDestino]: "" }));
    try {
      const resposta = await iniciarCheckinOutraSubmissao(eventoSlug, {
        checkinToken: resultado.checkinToken,
        submissaoId: submissaoIdDestino,
      });
      sessionStorage.setItem(
        `checkin:continuar:${eventoSlug}`,
        JSON.stringify({ token: resposta.token, submissaoId: resposta.submissaoId }),
      );
      router.push(`/evento/${params.eventoSlug}/edicao/${eventoSlug}/checkin`);
    } catch (error) {
      setErroOutra((prev) => ({
        ...prev,
        [submissaoIdDestino]: error.response?.data?.message ?? "Erro ao iniciar o check-in.",
      }));
      setIniciandoOutra((prev) => ({ ...prev, [submissaoIdDestino]: false }));
    }
  };

  useEffect(() => {
    if (!resultadoInicial) buscarStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!resultado || resultado.status === "AVALIADA") return;

    pollRef.current = setInterval(buscarStatus, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado?.status]);

  useEffect(() => {
    if (!resultado?.checkinAt || resultado.status === "AVALIADA") return;

    const atualizar = () =>
      setDuracaoSegundos(
        Math.max(
          0,
          Math.floor((Date.now() - new Date(resultado.checkinAt)) / 1000),
        ),
      );
    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    return () => clearInterval(intervalo);
  }, [resultado?.checkinAt, resultado?.status]);

  if (erro) {
    return (
      <div className={`${styles.card} text-center`}>
        <div className={styles.iconeCentral}>
          <RiSearchEyeLine />
        </div>
        <h1 className="h-editorial-sm mb-2">Link inválido</h1>
        <p className="mb-3">{erro}</p>
        <Button
          icon={RiArrowRightCircleLine}
          className="btn-primary w-100"
          linkTo={`/evento/${params.eventoSlug}/edicao/${eventoSlug}/checkin`}
        >
          Ir para o check-in
        </Button>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className={styles.card}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={cardStyles.header}>
        <div className={cardStyles.iconeSucesso}>
          <RiCheckboxCircleLine />
        </div>
        <h1 className="h-editorial-sm">Check-in confirmado!</h1>
      </div>

      {resultado.titulo && (
        <div className={cardStyles.trabalhoCard}>
          <RiPresentationLine />
          <div>
            <span className={cardStyles.trabalhoLabel}>Título do trabalho</span>
            <p className={cardStyles.trabalhoTitulo}>{resultado.titulo}</p>
          </div>
        </div>
      )}

      {resultado.square && (
        <div className={cardStyles.posterDestaque}>
          <span className={cardStyles.posterLabel}>Seu pôster</span>
          <span className={cardStyles.posterNumero}>
            nº {resultado.square.numero}
          </span>
          {resultado.subsessao?.local && (
            <span className={cardStyles.posterLocal}>
              <RiMapPinLine /> {resultado.subsessao.local}
            </span>
          )}
        </div>
      )}

      <div className={cardStyles.statusDestaque}>
        <span
          className={`${cardStyles.pill} ${cardStyles.pillGrande} ${cardStyles[STATUS_PILL_CLASSE[resultado.status]] ?? ""}`}
        >
          {(() => {
            const IconeStatus = STATUS_ICON[resultado.status];
            return IconeStatus ? <IconeStatus /> : null;
          })()}
          {STATUS_LABEL[resultado.status] ?? resultado.status}
        </span>

        {resultado.status === "AGUARDANDO_AVALIACAO" && (
          <p className={cardStyles.statusExplicacao}>
            Quando sua ficha de avaliação for atribuída a algum avaliador, o
            status mudará para &quot;Em avaliação&quot;. Por enquanto, aguarde
            no seu pôster e apresente seu trabalho ao público.
          </p>
        )}

        {resultado.status === "EM_AVALIACAO" && (
          <p className={cardStyles.statusExplicacao}>
            Sua ficha de avaliação foi atribuída {formatarListaAvaliadores(resultado.avaliadores)}.
            Aguarde em seu pôster a chegada do avaliador(a). Após a
            avaliação, seu certificado ficará disponível{" "}
            {resultado.certificadoUrl ? (
              <a href={resultado.certificadoUrl} target="_blank" rel="noopener noreferrer">
                neste link
              </a>
            ) : (
              "na área de certificados do evento"
            )}
            .
          </p>
        )}

        {resultado.status === "AVALIADA" && (
          <>
            <p className={cardStyles.statusExplicacao}>
              Sua avaliação foi concluída. Seu(s) certificado(s) já
              pode(m) ser baixado(s) direto por aqui.
            </p>
            <div className={cardStyles.certificadosBotoes}>
              {TIPOS_CERTIFICADO.filter((item) => item.elegivel(resultado)).map((item) => (
                <div key={item.tipo}>
                  <Button
                    icon={RiDownloadLine}
                    className="btn-primary w-100"
                    onClick={() => handleBaixarCertificado(item.tipo)}
                    loading={baixando[item.tipo]}
                  >
                    {item.label}
                  </Button>
                  {erroCertificado[item.tipo] && (
                    <p className={styles.erro}>{erroCertificado[item.tipo]}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={cardStyles.linhas}>
        {resultado.subsessao?.inicio && (
          <div className={cardStyles.linha}>
            <RiCalendarEventLine />
            <span>
              {formatarData(resultado.subsessao.inicio)} às{" "}
              {formatarHora(resultado.subsessao.inicio)}
            </span>
          </div>
        )}

        {resultado.status !== "AVALIADA" && (
          <div className={cardStyles.linha}>
            <RiTimerLine />
            <span>{formatarDuracao(duracaoSegundos)} desde o check-in</span>
          </div>
        )}
      </div>

      {resultado.outrasSubmissoes?.length > 0 && (
        <div className={cardStyles.outrasSubmissoes}>
          <p className={cardStyles.outrasSubmissoesTitulo}>
            Suas outras submissões neste evento
          </p>
          {resultado.outrasSubmissoes.map((outra) => {
            const podeIniciar = outra.elegivel && resultado.status === "AVALIADA";
            // Já passou pelo próprio check-in (em andamento ou já avaliada)
            // — tem link de acompanhamento próprio, não é "bloqueada".
            const temAcompanhamento = !podeIniciar && Boolean(outra.checkinToken);
            const destacar = podeIniciar || temAcompanhamento;

            const conteudo = (
              <>
                {podeIniciar && <RiLoginCircleLine />}
                {temAcompanhamento && <RiExternalLinkLine />}
                {!destacar && <RiLockLine />}
                <div>
                  <p className={cardStyles.outraSubmissaoTitulo}>{outra.titulo}</p>
                  {podeIniciar && (
                    <>
                      <Button
                        icon={RiArrowRightCircleLine}
                        className="btn-primary mt-1"
                        onClick={() => handleIniciarOutraSubmissao(outra.submissaoId)}
                        loading={iniciandoOutra[outra.submissaoId]}
                      >
                        Fazer check-in agora
                      </Button>
                      {erroOutra[outra.submissaoId] && (
                        <p className={styles.erro}>{erroOutra[outra.submissaoId]}</p>
                      )}
                    </>
                  )}
                  {temAcompanhamento && (
                    <p className={cardStyles.outraSubmissaoAviso}>Toque para ver o acompanhamento</p>
                  )}
                  {!destacar && (
                    <p className={cardStyles.outraSubmissaoAviso}>
                      Aguardando a avaliação do trabalho acima para liberar o check-in desta submissão.
                    </p>
                  )}
                </div>
              </>
            );

            const className = `${cardStyles.outraSubmissao} ${destacar ? cardStyles.outraSubmissaoAtiva : ""}`;

            return temAcompanhamento ? (
              <Link
                key={outra.submissaoId}
                href={`/evento/${params.eventoSlug}/edicao/${eventoSlug}/checkin/status/${outra.checkinToken}`}
                className={`${className} ${cardStyles.outraSubmissaoClicavel}`}
              >
                {conteudo}
              </Link>
            ) : (
              <div key={outra.submissaoId} className={className}>
                {conteudo}
              </div>
            );
          })}
        </div>
      )}

      <p className={cardStyles.dica}>
        Guarde esta página nos favoritos para acompanhar o status da sua
        avaliação a qualquer momento.
      </p>
    </div>
  );
};

export default CheckinStatusCard;
