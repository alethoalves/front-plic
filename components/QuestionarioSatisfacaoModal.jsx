"use client";
import { useState } from "react";
import styles from "./QuestionarioSatisfacaoModal.module.scss";
import Button from "@/components/Button";
import { RiCloseLargeLine, RiSendPlaneLine } from "@remixicon/react";
import { responderQuestionario } from "@/app/api/client/questionarioSatisfacao";

// ─── Renderizadores de tipos de questão ──────────────────────────────────────

function QuestaoMultiplaEscolha({ questao, valor, onChange }) {
  return (
    <div className={styles.opcoes}>
      {questao.opcoes.map((opcao) => (
        <label key={opcao} className={styles.opcaoLabel}>
          <input
            type="radio"
            name={questao.id}
            value={opcao}
            checked={valor === opcao}
            onChange={() => onChange(questao.id, opcao)}
          />
          <span>{opcao}</span>
        </label>
      ))}
    </div>
  );
}

function QuestaoLikert({ questao, valor, onChange }) {
  const { escala } = questao;
  const valores = Array.from({ length: escala.max - escala.min + 1 }, (_, i) =>
    String(escala.min + i),
  );
  return (
    <div className={styles.likertWrap}>
      <div className={styles.likertLabelsExtremos}>
        <span>{escala.rotulos[String(escala.min)]}</span>
        <span>{escala.rotulos[String(escala.max)]}</span>
      </div>
      <div className={styles.likertOpcoes}>
        {valores.map((v) => (
          <label key={v} className={styles.likertItem}>
            <input
              type="radio"
              name={questao.id}
              value={v}
              checked={valor === v}
              onChange={() => onChange(questao.id, v)}
            />
            <span className={styles.likertNumero}>{v}</span>
            <span className={styles.likertRotulo}>
              {escala.rotulos[v] || ""}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function QuestaoLikertComNaoSeAplica({ questao, valor, onChange }) {
  const { escala } = questao;
  const valores = Array.from({ length: escala.max - escala.min + 1 }, (_, i) =>
    String(escala.min + i),
  );
  return (
    <div className={styles.likertWrap}>
      <div className={styles.likertLabelsExtremos}>
        <span>{escala.rotulos[String(escala.min)]}</span>
        <span>{escala.rotulos[String(escala.max)]}</span>
      </div>
      <div className={styles.likertOpcoes}>
        {valores.map((v) => (
          <label key={v} className={styles.likertItem}>
            <input
              type="radio"
              name={questao.id}
              value={v}
              checked={valor === v}
              onChange={() => onChange(questao.id, v)}
            />
            <span className={styles.likertNumero}>{v}</span>
            <span className={styles.likertRotulo}>
              {escala.rotulos[v] || ""}
            </span>
          </label>
        ))}
      </div>
      {escala.opcaoExtra && (
        <label className={styles.opcaoLabel} style={{ marginTop: "0.5rem" }}>
          <input
            type="radio"
            name={questao.id}
            value="nao_se_aplica"
            checked={valor === "nao_se_aplica"}
            onChange={() => onChange(questao.id, "nao_se_aplica")}
          />
          <span>{escala.opcaoExtra}</span>
        </label>
      )}
    </div>
  );
}

function QuestaoMatrizLikert({ questao, valor = {}, onChange }) {
  const { escala, afirmacoes } = questao;
  const colunas = Array.from({ length: escala.max - escala.min + 1 }, (_, i) =>
    String(escala.min + i),
  );

  const handleChange = (afirmacaoId, v) => {
    onChange(questao.id, { ...valor, [afirmacaoId]: v });
  };

  return (
    <div className={styles.matrizWrap}>
      <table className={styles.matrizTabela}>
        <thead>
          <tr>
            <th></th>
            {colunas.map((c) => (
              <th key={c}>
                <div className={styles.matrizCabecalho}>
                  <span>{c}</span>
                  {escala.rotulos[c] && (
                    <span className={styles.matrizRotulo}>
                      {escala.rotulos[c]}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {afirmacoes.map((af) => (
            <tr key={af.id}>
              <td className={styles.matrizAfirmacao}>{af.texto}</td>
              {colunas.map((c) => (
                <td key={c} className={styles.matrizCelula}>
                  <input
                    type="radio"
                    name={`${questao.id}_${af.id}`}
                    value={c}
                    checked={(valor[af.id] || "") === c}
                    onChange={() => handleChange(af.id, c)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestaoNPS({ questao, valor, onChange }) {
  const valores = Array.from(
    { length: questao.max - questao.min + 1 },
    (_, i) => questao.min + i,
  );
  return (
    <div className={styles.npsWrap}>
      <div className={styles.npsOpcoes}>
        {valores.map((v) => (
          <label key={v} className={styles.npsItem}>
            <input
              type="radio"
              name={questao.id}
              value={String(v)}
              checked={valor === String(v)}
              onChange={() => onChange(questao.id, String(v))}
            />
            <span
              className={`${styles.npsNumero} ${
                valor === String(v) ? styles.npsAtivo : ""
              }`}
            >
              {v}
            </span>
          </label>
        ))}
      </div>
      <div className={styles.npsLabels}>
        <span>{questao.rotuloMin}</span>
        <span>{questao.rotuloMax}</span>
      </div>
    </div>
  );
}

function QuestaoRespostaAberta({ questao, valor, onChange }) {
  return (
    <textarea
      className={styles.textarea}
      rows={4}
      placeholder="Escreva sua resposta aqui..."
      value={valor || ""}
      onChange={(e) => onChange(questao.id, e.target.value)}
    />
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

function renderQuestao(questao, respostas, onChange) {
  const valor = respostas[questao.id];
  const props = { questao, valor, onChange };

  switch (questao.tipo) {
    case "multipla_escolha":
      return <QuestaoMultiplaEscolha {...props} />;
    case "likert":
    case "escala_facilidade":
      return <QuestaoLikert {...props} />;
    case "likert_com_nao_se_aplica":
      return <QuestaoLikertComNaoSeAplica {...props} />;
    case "matriz_likert":
      return <QuestaoMatrizLikert {...props} />;
    case "nps":
      return <QuestaoNPS {...props} />;
    case "resposta_aberta":
      return <QuestaoRespostaAberta {...props} />;
    default:
      return null;
  }
}

function questaoVisivel(questao, respostas) {
  if (!questao.condicional) return true;
  const { questaoId, valores } = questao.condicional;
  const respostaPai = respostas[questaoId];
  if (respostaPai === undefined || respostaPai === null || respostaPai === "")
    return false;
  return valores.includes(String(respostaPai));
}

function validarRespostas(schema, respostas) {
  const erros = [];
  for (const bloco of schema.blocos) {
    for (const questao of bloco.questoes) {
      if (!questaoVisivel(questao, respostas)) continue;
      if (!questao.obrigatorio) continue;

      const valor = respostas[questao.id];
      if (questao.tipo === "matriz_likert") {
        const faltando = questao.afirmacoes.some(
          (af) => !valor || !valor[af.id],
        );
        if (faltando)
          erros.push(
            `Questão ${questao.numero} requer resposta para todas as afirmações.`,
          );
      } else if (!valor && valor !== 0) {
        erros.push(`Questão ${questao.numero} é obrigatória.`);
      }
    }
  }
  return erros;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

// O componente recebe o questionário já resolvido pelo pai — só renderiza e envia
export default function QuestionarioSatisfacaoModal({
  tenant,
  questionario,
  inscricaoId,
  onConcluir,
  onCancelar,
  modoPreview = false,
}) {
  const [respostas, setRespostas] = useState({});
  const [erros, setErros] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const handleChange = (questaoId, valor) => {
    setRespostas((prev) => ({ ...prev, [questaoId]: valor }));
  };

  const handleEnviar = async () => {
    if (modoPreview) {
      onConcluir();
      return;
    }
    const errosValidacao = validarRespostas(questionario.schema, respostas);
    if (errosValidacao.length > 0) {
      setErros(errosValidacao);
      return;
    }
    setErros([]);
    setEnviando(true);
    try {
      await responderQuestionario(
        tenant,
        questionario.id,
        respostas,
        inscricaoId,
      );
      onConcluir();
    } catch {
      setErros(["Erro ao enviar respostas. Tente novamente."]);
    } finally {
      setEnviando(false);
    }
  };

  const schema = questionario.schema;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3>{questionario.titulo}</h3>
            {questionario.descricao && (
              <p className={styles.subtitulo}>{questionario.descricao}</p>
            )}
          </div>
          <button className={styles.fechar} onClick={onCancelar} title="Fechar">
            <RiCloseLargeLine size={20} />
          </button>
        </div>

        <div className={styles.corpo}>
          {schema.apresentacao && (
            <div className={styles.apresentacao}>
              {schema.apresentacao.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {schema.blocos.map((bloco) => (
            <div key={bloco.id} className={styles.bloco}>
              <h4 className={styles.tituloBloco}>{bloco.titulo}</h4>
              {bloco.descricao && (
                <p className={styles.descricaoBloco}>{bloco.descricao}</p>
              )}
              {bloco.questoes.map((questao) => {
                if (!questaoVisivel(questao, respostas)) return null;
                return (
                  <div key={questao.id} className={styles.questao}>
                    <p className={styles.textoQuestao}>
                      <strong>{questao.numero}</strong> {questao.texto}
                      {questao.obrigatorio && (
                        <span className={styles.obrigatorio}> *</span>
                      )}
                    </p>
                    {renderQuestao(questao, respostas, handleChange)}
                  </div>
                );
              })}
            </div>
          ))}

          {erros.length > 0 && (
            <div className={styles.erros}>
              {erros.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}
        </div>

        <div className={styles.rodape}>
          <Button
            type="button"
            className={styles.submitButton}
            onClick={handleEnviar}
            disabled={enviando}
            icon={RiSendPlaneLine}
          >
            {modoPreview
              ? "Fechar visualização"
              : enviando
                ? "Enviando..."
                : "Enviar e finalizar inscrição"}
          </Button>
          <button
            type="button"
            className={styles.cancelarLink}
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
