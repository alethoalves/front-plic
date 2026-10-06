"use client";
import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import {
  RiArrowLeftRightLine,
  RiHandCoinLine,
  RiInformationLine,
  RiLinksLine,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import PreviaAlteracao from "@/components/alteracoesParticipacao/PreviaAlteracao";
import {
  criarSolicitacaoAlteracao,
  previaSolicitacaoAlteracao,
} from "@/app/api/client/alteracaoParticipacao";
import {
  ICONE_TIPO,
  ROTULO_TIPO,
  hojeISO,
  mensagemErro,
  motivoNaoRecebeDe,
  origemEhVagaFila,
  podeReceberDe,
} from "@/lib/alteracaoParticipacao";
import styles from "./orientandos.module.scss";

const DESCRICAO_TIPO = {
  TRANSFERENCIA_BOLSA:
    "A bolsa (com a mesma fonte pagadora) passa para outro aluno desta inscrição. Quem recebe precisará assinar os documentos exigidos pela cota.",
  DEVOLUCAO_BOLSA:
    "A bolsa volta para a gestão, que a redistribui pela lista de espera geral. O aluno continua no projeto como voluntário. Para dar a bolsa a outro aluno seu, use \"Transferir bolsa\".",
  CANCELAMENTO:
    "A participação do aluno é encerrada. Documentos ainda não assinados que ativariam a participação ou a bolsa serão cancelados.",
  SUBSTITUICAO:
    "O aluno atual é substituído por outro no mesmo plano de trabalho. Se houver bolsa ou lista de espera, o novo aluno herda essa posição.",
};

const DESCRICAO_VAGA_FILA =
  "A vaga na lista de espera (solicitação de bolsa ainda sem cota) passa para um voluntário desta inscrição, e o aluno atual fica como voluntário. Quem recebe não pode ter nenhuma outra solicitação de bolsa, com ou sem cota, neste ano.";

const DESCRICAO_DESISTENCIA_FILA =
  "O aluno abre mão da vaga na lista de espera (solicitação de bolsa ainda sem cota) e continua no projeto como voluntário. Para passar a vaga a outro aluno seu, use \"Transferir vaga na fila\".";

const ROTULO_DATA = {
  TRANSFERENCIA_BOLSA: "Data da transferência",
  DEVOLUCAO_BOLSA: "Data da devolução",
  CANCELAMENTO: "Data de encerramento",
  SUBSTITUICAO: "Data de início do novo aluno",
};

// Opções de destino da bolsa: alunos da mesma inscrição; os que não podem
// receber aparecem desabilitados com o motivo. O 1º da lista de espera é o
// sugerido.
const montarDestinos = (aluno, alunosInscricao) => {
  const candidatos = alunosInscricao.filter(
    (a) => a.participacaoId !== aluno.participacaoId && a.classe !== "ENCERRADO"
  );
  const ordenados = [...candidatos].sort((a, b) => {
    const peso = (x) => (podeReceberDe(x, aluno) ? 0 : 1) * 10 + (x.classe === "LISTA_ESPERA" ? 0 : 1);
    if (peso(a) !== peso(b)) return peso(a) - peso(b);
    if (a.classe === "LISTA_ESPERA" && b.classe === "LISTA_ESPERA") {
      return (a.vinculo?.ordemRecebimentoBolsa ?? Infinity) - (b.vinculo?.ordemRecebimentoBolsa ?? Infinity);
    }
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
  // Bolsa: sugere o 1º da lista de espera. Vaga na fila: não há sugestão.
  const sugerido = origemEhVagaFila(aluno)
    ? null
    : ordenados.find((a) => podeReceberDe(a, aluno) && a.classe === "LISTA_ESPERA");
  return {
    opcoes: ordenados.map((a) => ({
      value: a.participacaoId,
      label: a.nome,
      aluno: a,
      motivo: motivoNaoRecebeDe(a, aluno),
      disabled: !podeReceberDe(a, aluno),
      sugerido: sugerido?.participacaoId === a.participacaoId,
    })),
    sugeridoId: sugerido?.participacaoId ?? null,
  };
};

const templateDestino = (opcao) => {
  if (!opcao) return <span>Selecione o aluno</span>;
  const a = opcao.aluno;
  const detalhe = opcao.disabled
    ? opcao.motivo
    : a.classe === "LISTA_ESPERA"
    ? `Lista de espera${a.vinculo?.ordemRecebimentoBolsa ? ` · ordem ${a.vinculo.ordemRecebimentoBolsa}` : ""}`
    : "Voluntário";
  return (
    <div className={styles.opcaoDestino}>
      <span className={styles.opcaoDestinoNome}>
        {a.nome}
        {opcao.sugerido && <span className={styles.sugerido}>Sugerido</span>}
      </span>
      <small>
        {detalhe}
        {a.plano?.titulo ? ` · ${a.plano.titulo}` : ""}
      </small>
    </div>
  );
};

const ModalSolicitacao = ({
  isOpen,
  onClose,
  tenant,
  tipo,
  aluno,
  alunosInscricao = [],
  destinoInicialId = null,
  onEnviada,
  toast,
}) => {
  const [etapa, setEtapa] = useState("dados");
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(hojeISO());
  const [destinoId, setDestinoId] = useState(null);
  const [acaoBolsa, setAcaoBolsa] = useState(null);
  const [novoAluno, setNovoAluno] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  // Pedido que só é possível junto com outro pedido pendente (bloco)
  const [sugestaoBloco, setSugestaoBloco] = useState(null); // { agruparCom, mensagem }
  const [agruparCom, setAgruparCom] = useState(null);

  const { opcoes: opcoesDestino, sugeridoId } = useMemo(
    () => (aluno ? montarDestinos(aluno, alunosInscricao) : { opcoes: [], sugeridoId: null }),
    [aluno, alunosInscricao]
  );

  const ehBolsista = aluno?.classe === "BOLSISTA";
  const ehVagaFila = tipo === "TRANSFERENCIA_BOLSA" && origemEhVagaFila(aluno);
  const ehDesistenciaFila = tipo === "DEVOLUCAO_BOLSA" && origemEhVagaFila(aluno);
  const bolsaTransferivel = Boolean(aluno?.acoes?.transferirBolsa);
  const precisaDestino =
    tipo === "TRANSFERENCIA_BOLSA" || (tipo === "CANCELAMENTO" && ehBolsista && acaoBolsa === "TRANSFERIR");

  useEffect(() => {
    if (!isOpen) return;
    setEtapa("dados");
    setMotivo("");
    setData(hojeISO());
    setDestinoId(destinoInicialId ?? (tipo === "TRANSFERENCIA_BOLSA" ? sugeridoId : null));
    setAcaoBolsa(null);
    setNovoAluno(null);
    setPrevia(null);
    setErro("");
    setSugestaoBloco(null);
    setAgruparCom(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tipo, aluno?.participacaoId, destinoInicialId]);

  useEffect(() => {
    if (tipo === "CANCELAMENTO" && acaoBolsa === "TRANSFERIR" && !destinoId) setDestinoId(sugeridoId);
  }, [acaoBolsa, tipo, destinoId, sugeridoId]);

  if (!aluno || !tipo) return null;

  const Icone = ICONE_TIPO[tipo];

  const montarDados = () => {
    const dados = { tipo, participacaoId: aluno.participacaoId, motivo, data };
    if (agruparCom) dados.agruparCom = agruparCom;
    if (tipo === "TRANSFERENCIA_BOLSA") dados.participacaoDestinoId = destinoId;
    if (tipo === "SUBSTITUICAO") dados.novoUserId = novoAluno?.userId;
    if (tipo === "CANCELAMENTO" && ehBolsista) {
      dados.destinoBolsa =
        acaoBolsa === "TRANSFERIR"
          ? { acao: "TRANSFERIR", participacaoDestinoId: destinoId }
          : { acao: acaoBolsa };
    }
    return dados;
  };

  const validarDados = () => {
    if (tipo === "SUBSTITUICAO" && !novoAluno) return "Verifique o CPF do novo aluno.";
    if (tipo === "CANCELAMENTO" && ehBolsista && !acaoBolsa) return "Escolha o que fazer com a bolsa.";
    if (precisaDestino && !destinoId) return "Escolha o aluno que vai receber a bolsa.";
    if (!motivo.trim()) return "Informe o motivo.";
    if (!data) return "Informe a data.";
    return "";
  };

  const revisar = async (agrupar = agruparCom) => {
    const problema = validarDados();
    if (problema) {
      setErro(problema);
      return;
    }
    setErro("");
    setSugestaoBloco(null);
    setCarregando(true);
    try {
      const dados = { ...montarDados(), ...(agrupar ? { agruparCom: agrupar } : {}) };
      const resultado = await previaSolicitacaoAlteracao(tenant, dados);
      setAgruparCom(resultado?.bloco ? agrupar : null);
      setPrevia(resultado);
      setEtapa("revisao");
    } catch (error) {
      const resposta = error?.response?.data;
      if (resposta?.codigo === "PODE_AGRUPAR") {
        setSugestaoBloco({ agruparCom: resposta.agruparCom, mensagem: resposta.message });
      } else {
        setErro(mensagemErro(error, "Não foi possível gerar a prévia."));
      }
    } finally {
      setCarregando(false);
    }
  };

  const enviar = async () => {
    setCarregando(true);
    try {
      const resposta = await criarSolicitacaoAlteracao(tenant, montarDados());
      toast?.current?.show({
        severity: "success",
        summary: "Solicitação enviada",
        detail: resposta.message,
        life: 4000,
      });
      onEnviada?.();
      onClose();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível enviar a solicitação."));
      setEtapa("dados");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className={styles.modalSolicitacao}>
        <div className={styles.modalCabecalho}>
          <div className={styles.modalIcone}>
            <Icone size={22} />
          </div>
          <div>
            <h5>
              {ehVagaFila
                ? "Transferência de vaga na lista de espera"
                : ehDesistenciaFila
                ? "Desistência da lista de espera"
                : ROTULO_TIPO[tipo]}
            </h5>
            <p>
              {aluno.nome}
              {aluno.plano?.titulo ? ` · ${aluno.plano.titulo}` : ""}
            </p>
          </div>
        </div>

        <div className={styles.passos}>
          <span className={etapa === "dados" ? styles.passoAtivo : ""}>1. Dados</span>
          <span className={etapa === "revisao" ? styles.passoAtivo : ""}>2. Revisão</span>
        </div>

        {etapa === "dados" && (
          <div className={styles.formulario}>
            <p className={styles.descricao}>
              <RiInformationLine size={16} />
              <span>
                {ehVagaFila ? DESCRICAO_VAGA_FILA : ehDesistenciaFila ? DESCRICAO_DESISTENCIA_FILA : DESCRICAO_TIPO[tipo]}{" "}
                Nada muda até a gestão aprovar.
              </span>
            </p>

            {tipo === "SUBSTITUICAO" && (
              <div className={styles.campo}>
                <label>Novo aluno</label>
                {novoAluno ? (
                  <div className={styles.novoAluno}>
                    <strong>{novoAluno.nome}</strong>
                    <small>{novoAluno.email}</small>
                    <Button
                      label="Trocar"
                      className="p-button-text p-button-sm"
                      onClick={() => setNovoAluno(null)}
                    />
                  </div>
                ) : (
                  <CPFVerificationForm tenantSlug={tenant} onCpfVerified={setNovoAluno} />
                )}
              </div>
            )}

            {tipo === "CANCELAMENTO" && ehBolsista && (
              <div className={styles.campo}>
                <label>O que fazer com a bolsa de {aluno.nome.split(" ")[0]}?</label>
                <div className={styles.escolhas}>
                  <button
                    type="button"
                    className={`${styles.escolha} ${acaoBolsa === "TRANSFERIR" ? styles.escolhaAtiva : ""}`}
                    onClick={() => setAcaoBolsa("TRANSFERIR")}
                    disabled={!bolsaTransferivel}
                    title={bolsaTransferivel ? "" : "A bolsa está num status que não permite transferência"}
                  >
                    <RiArrowLeftRightLine size={18} />
                    <span>
                      <strong>Transferir para outro aluno</strong>
                      <small>Um voluntário ativo desta inscrição recebe a bolsa.</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.escolha} ${acaoBolsa === "DEVOLVER" ? styles.escolhaAtiva : ""}`}
                    onClick={() => setAcaoBolsa("DEVOLVER")}
                  >
                    <RiHandCoinLine size={18} />
                    <span>
                      <strong>Devolver à gestão</strong>
                      <small>A bolsa volta para a lista de espera geral.</small>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {precisaDestino && (
              <div className={styles.campo}>
                <label>{ehVagaFila ? "Quem vai receber a vaga na lista de espera" : "Quem vai receber a bolsa"}</label>
                <Dropdown
                  className="w-full"
                  value={destinoId}
                  options={opcoesDestino}
                  optionDisabled="disabled"
                  onChange={(e) => setDestinoId(e.value)}
                  itemTemplate={templateDestino}
                  valueTemplate={(opcao) => templateDestino(opcao)}
                  placeholder="Selecione o aluno"
                  emptyMessage="Nenhum outro aluno nesta inscrição"
                />
                {opcoesDestino.every((o) => o.disabled) && (
                  <small className={styles.ajuda}>
                    {ehVagaFila
                      ? "Nenhum aluno desta inscrição pode receber a vaga agora. Só voluntários com participação ativa e sem nenhuma solicitação de bolsa (com ou sem cota) neste ano podem recebê-la."
                      : "Nenhum aluno desta inscrição pode receber a bolsa agora. Só voluntários com participação ativa e sem bolsa em outra participação podem recebê-la."}
                  </small>
                )}
              </div>
            )}

            <div className={styles.campo}>
              <label htmlFor="motivoSolicitacao">Motivo</label>
              <InputTextarea
                id="motivoSolicitacao"
                rows={3}
                className="w-full"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explique para a gestão o motivo da alteração"
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="dataSolicitacao">{ROTULO_DATA[tipo]}</label>
              <input
                id="dataSolicitacao"
                type="date"
                className="p-inputtext p-component w-full"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>
        )}

        {etapa === "revisao" && (
          <div className={styles.formulario}>
            <p className={styles.descricao}>
              <RiInformationLine size={16} />
              <span>
                Confira o efeito previsto. A solicitação fica pendente até a gestão aprovar; a gestão pode ajustar a
                data.
              </span>
            </p>
            {previa?.bloco && (
              <div className={styles.avisoBloco}>
                <RiLinksLine size={18} />
                <span>
                  <strong>Enviado em bloco</strong> com{" "}
                  {previa.bloco.solicitacoes.map((s) => `#${s.id} (${s.rotulo})`).join(", ")}. A gestão aprova ou
                  recusa tudo junto, executando na ordem; cancelar qualquer etapa cancela o bloco.
                </span>
              </div>
            )}
            <PreviaAlteracao previa={previa} />
          </div>
        )}

        {sugestaoBloco && (
          <div className={styles.avisoBloco}>
            <RiLinksLine size={18} />
            <span>{sugestaoBloco.mensagem}</span>
            <Button
              label="Enviar em bloco"
              icon="pi pi-link"
              className="p-button-sm"
              onClick={() => revisar(sugestaoBloco.agruparCom)}
              loading={carregando}
            />
          </div>
        )}

        {erro && <p className={styles.erroFormulario}>{erro}</p>}

        <div className={styles.modalAcoes}>
          {etapa === "dados" ? (
            <>
              <Button label="Cancelar" className="p-button-secondary p-button-outlined" onClick={onClose} disabled={carregando} />
              <Button label="Revisar" icon="pi pi-arrow-right" iconPos="right" onClick={() => revisar()} loading={carregando} />
            </>
          ) : (
            <>
              <Button
                label="Voltar"
                className="p-button-secondary p-button-outlined"
                onClick={() => setEtapa("dados")}
                disabled={carregando}
              />
              <Button
                label="Enviar solicitação"
                icon="pi pi-send"
                onClick={enviar}
                loading={carregando}
                disabled={previa?.valida === false}
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ModalSolicitacao;
