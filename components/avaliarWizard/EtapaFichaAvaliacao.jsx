"use client";

import { useState } from "react";
import Button from "@/components/Button";
import NoData from "@/components/NoData";
import ProgressoEtapas from "./ProgressoEtapas";
import {
  RiQuillPenLine,
  RiMedalLine,
  RiStarLine,
  RiErrorWarningLine,
} from "@remixicon/react";
import styles from "./wizard.module.scss";
import { calcularNotaTotalPonderada, opcoesInput } from "@/lib/criterioAvaliacaoScoring";

// Passo 4 (último do ciclo): formulário único redesenhado pra mobile — mesma
// lógica de critérios/notas/premiação da tela antiga
// (avaliacoes/avaliacao/.../page.jsx), só com pills e espaçamento maiores.
// Mantém o mesmíssimo contrato de `body` pra processarAvaliacao.
const EtapaFichaAvaliacao = ({
  submissaoDetalhada,
  numeroPoster,
  onFinalizar,
  onDevolver,
  loadingFinalizar,
  loadingDevolver,
  erro,
}) => {
  const [selectedNotas, setSelectedNotas] = useState({});
  const [mencaoHonrosaSelecionada, setMencaoHonrosaSelecionada] =
    useState(false);
  const [premioSelecionado, setPremioSelecionado] = useState(false);
  const [comentarioFeedback, setComentarioFeedback] = useState("");
  const [erroValidacao, setErroValidacao] = useState("");

  const feedbackObrigatorio = mencaoHonrosaSelecionada || premioSelecionado;

  const criterios = submissaoDetalhada?.evento?.CriterioAvaliacao || [];
  const notaMinimaMencaoHonrosa =
    submissaoDetalhada?.evento?.notaMinimaMencaoHonrosa || 0;
  const notaMinimaPremio = submissaoDetalhada?.evento?.notaMinimaPremio || 0;
  const notaTotal = calcularNotaTotalPonderada(criterios, selectedNotas);
  const respondidos = criterios.filter(
    (criterio) => selectedNotas[criterio.id] !== undefined,
  ).length;

  if (!submissaoDetalhada) {
    return (
      <div className={styles.card}>
        <ProgressoEtapas atual={4} total={4} />
        <p className="text-center">Carregando ficha de avaliação...</p>
      </div>
    );
  }

  if (criterios.length === 0) {
    return (
      <div className={styles.card}>
        <ProgressoEtapas atual={4} total={4} />
        <NoData description="Critérios de avaliação não foram definidos." />
      </div>
    );
  }

  const handleNota = (criterioId, valor) => {
    setSelectedNotas((prev) => ({ ...prev, [criterioId]: valor }));
  };

  const handleMencaoHonrosa = () => {
    if (notaTotal >= notaMinimaMencaoHonrosa) {
      setMencaoHonrosaSelecionada((prev) => !prev);
      setPremioSelecionado(false);
    }
  };

  const handlePremio = () => {
    if (notaTotal >= notaMinimaPremio) {
      setPremioSelecionado((prev) => !prev);
      setMencaoHonrosaSelecionada(false);
    }
  };

  const handleFinalizar = () => {
    const criteriosSemNota = criterios.filter(
      (criterio) => selectedNotas[criterio.id] === undefined,
    );
    if (criteriosSemNota.length > 0) {
      setErroValidacao(
        "Atribua uma nota a todos os critérios antes de finalizar.",
      );
      return;
    }
    if (feedbackObrigatorio && !comentarioFeedback.trim()) {
      setErroValidacao(
        "O feedback ao aluno é obrigatório quando o trabalho é indicado a prêmio ou menção honrosa.",
      );
      return;
    }
    setErroValidacao("");

    const criteriosAtualizados = criterios.map((criterio) => ({
      ...criterio,
      notaAtribuida: selectedNotas[criterio.id],
    }));

    onFinalizar({
      ...submissaoDetalhada.evento,
      CriterioAvaliacao: criteriosAtualizados,
      notaTotal,
      mencaoHonrosaSelecionada,
      premioSelecionado,
      comentarioFeedback,
      submissaoId: submissaoDetalhada.id,
    });
  };

  return (
    <div className={styles.card}>
      <ProgressoEtapas atual={4} total={4} />
      <h1 className="h-editorial-sm mb-1">Ficha de avaliação</h1>
      <p className="mb-3">Pôster nº {numeroPoster}</p>

      <div className={styles.listaCriterios}>
        <div className={styles.notaFlutuante}>
          <span>Nota parcial</span>
          <strong>
            {notaTotal.toFixed(1)}
            <small>/10</small>
          </strong>
          <span className={styles.notaFlutuanteProgresso}>
            {respondidos}/{criterios.length} respondidos
          </span>
        </div>

        {criterios
          .slice()
          .sort((a, b) => a.id - b.id)
          .map((criterio, index) => {
            const opcoes = opcoesInput(criterio);
            const qualitativo = criterio.tipoEntrada === "QUALITATIVA";
            const classeSeveridade = {
              error: styles.valorError,
              warning: styles.valorWarning,
              success: styles.valorSuccess,
            };
            return (
              <div className={styles.quesito} key={criterio.id}>
                <h6 className={styles.quesitoTitulo}>
                  <span>{index + 1}. </span>
                  {criterio.titulo}
                </h6>
                {criterio.descricao && (
                  <p className={styles.quesitoDescricao}>{criterio.descricao}</p>
                )}
                <div
                  className={`${styles.valores} ${
                    qualitativo ? styles.valoresQualitativas : ""
                  }`}
                >
                  {opcoes.map((opcao) => (
                    <div
                      key={opcao.valor}
                      className={`${styles.valor} ${
                        qualitativo ? styles.valorQualitativo : ""
                      } ${qualitativo ? classeSeveridade[opcao.severidade] : ""} ${
                        selectedNotas[criterio.id] === opcao.valor
                          ? styles.valorSelecionado
                          : ""
                      }`}
                      onClick={() => handleNota(criterio.id, opcao.valor)}
                    >
                      {qualitativo ? (
                        <>
                          <p className={styles.valorLabel}>{opcao.label}</p>
                          {opcao.descricao && (
                            <p className={styles.valorDescricao}>{opcao.descricao}</p>
                          )}
                        </>
                      ) : (
                        opcao.label
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      <div className={styles.notaTotalCard}>
        <div className={styles.notaHeader}>
          <h6>Nota final</h6>
          <div>
            <span>{notaTotal.toFixed(1)}</span>
            <small>/10</small>
          </div>
        </div>
        <div className={styles.notaProgress}>
          <div
            className={styles.notaProgressBar}
            style={{ width: `${notaTotal * 10}%` }}
          />
        </div>
        <div className={styles.notaMinimas}>
          <p>Mínimo para menção honrosa: {notaMinimaMencaoHonrosa}</p>
          <p>Mínimo para prêmio: {notaMinimaPremio}</p>
        </div>
      </div>

      <div className={styles.premiacao}>
        <div
          className={`${styles.premioOpcao} ${
            mencaoHonrosaSelecionada
              ? styles.premioSelecionado
              : notaTotal >= notaMinimaMencaoHonrosa
                ? styles.premioDisponivel
                : styles.premioIndisponivel
          }`}
          onClick={handleMencaoHonrosa}
        >
          <RiStarLine />
          <p>
            {mencaoHonrosaSelecionada
              ? "Menção honrosa selecionada"
              : "Indicar à menção honrosa"}
          </p>
          {notaTotal < notaMinimaMencaoHonrosa && <RiErrorWarningLine />}
        </div>
        <div
          className={`${styles.premioOpcao} ${
            premioSelecionado
              ? styles.premioSelecionado
              : notaTotal >= notaMinimaPremio
                ? styles.premioDisponivel
                : styles.premioIndisponivel
          }`}
          onClick={handlePremio}
        >
          <RiMedalLine />
          <p>
            {premioSelecionado
              ? "Prêmio selecionado"
              : "Indicar ao prêmio destaque"}
          </p>
          {notaTotal < notaMinimaPremio && <RiErrorWarningLine />}
        </div>
      </div>

      <h6 className="mb-1">
        Feedback ao(à) aluno(a){" "}
        {feedbackObrigatorio ? "(obrigatório)" : "(opcional)"}
      </h6>
      <textarea
        className={styles.feedbackTextarea}
        placeholder="Escreva aqui seu feedback para o autor..."
        value={comentarioFeedback}
        onChange={(e) => setComentarioFeedback(e.target.value)}
      />

      {(erroValidacao || erro) && (
        <p className={styles.erro}>{erroValidacao || erro}</p>
      )}

      <Button
        className="btn-primary w-100 mt-2"
        onClick={handleFinalizar}
        icon={RiQuillPenLine}
        loading={loadingFinalizar}
      >
        Finalizar avaliação
      </Button>
      <Button
        className="btn-link w-100 mt-1"
        onClick={onDevolver}
        loading={loadingDevolver}
      >
        Não quero/posso avaliar este trabalho
      </Button>
    </div>
  );
};

export default EtapaFichaAvaliacao;
