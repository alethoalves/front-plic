"use client";
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { RiStarFill, RiStarLine } from "@remixicon/react";
import Button from "@/components/Button";
import {
  excluirFeedbackCompartilhamento,
  getNomeAcessante,
  salvarFeedbackCompartilhamento,
  setNomeAcessante,
} from "@/app/api/client/compartilhamentoResumos";
import styles from "./RelatorioResumosAvaliacoes.module.scss";

// Estrelas + comentário de quem acessa um link compartilhado, por trabalho.
// Todos com o link veem os feedbacks; cada acessante edita só o próprio.

const Estrelas = ({ valor, onChange, tamanho = 18 }) => (
  <span className={styles.estrelas}>
    {[1, 2, 3, 4, 5].map((n) => {
      const Icone = n <= valor ? RiStarFill : RiStarLine;
      return onChange ? (
        <button
          key={n}
          type="button"
          className={styles.estrelaBotao}
          onClick={() => onChange(n)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Icone size={tamanho} />
        </button>
      ) : (
        <Icone key={n} size={tamanho} />
      );
    })}
  </span>
);

const formatarData = (d) => new Date(d).toLocaleDateString("pt-BR");

// Controlado pelo relatório (feedbacks + onChange), que usa as estrelas no filtro
const FeedbackTrabalho = ({ token, submissaoId, feedbacks = [], onChange }) => {
  const setFeedbacks = (lista) => onChange?.(submissaoId, lista);
  const proprio = feedbacks.find((f) => f.proprio);
  const outros = feedbacks.filter((f) => !f.proprio);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState("");
  const [estrelas, setEstrelas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const media = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.estrelas, 0) / feedbacks.length).toFixed(1)
    : null;

  const abrirFormulario = () => {
    setNome(proprio?.nome || getNomeAcessante());
    setEstrelas(proprio?.estrelas || 0);
    setComentario(proprio?.comentario || "");
    setErro(null);
    setEditando(true);
  };

  const handleSalvar = async () => {
    if (nome.trim().length < 2) return setErro("Informe seu nome.");
    if (!estrelas) return setErro("Escolha de 1 a 5 estrelas.");
    setSalvando(true);
    setErro(null);
    try {
      setFeedbacks(await salvarFeedbackCompartilhamento(token, { submissaoId, nome, estrelas, comentario }));
      setNomeAcessante(nome.trim());
      setEditando(false);
    } catch (error) {
      setErro(error?.response?.data?.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    setSalvando(true);
    try {
      setFeedbacks(await excluirFeedbackCompartilhamento(token, submissaoId));
    } catch (error) {
      setErro(error?.response?.data?.message || "Erro ao excluir. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className={styles.secao}>
      <h3 className={styles.secaoTitulo}>
        Avaliações de quem acessou o link
        {media && (
          <span className={styles.mediaFeedback}>
            <RiStarFill size={14} /> {media} ({feedbacks.length})
          </span>
        )}
      </h3>

      {editando ? (
        <div className={`${styles.feedbackForm} mb-2`}>
          <InputText
            className={styles.feedbackInput}
            value={nome}
            maxLength={80}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
          />
          <Estrelas valor={estrelas} onChange={setEstrelas} tamanho={24} />
          <InputTextarea
            className={styles.feedbackInput}
            value={comentario}
            maxLength={2000}
            rows={3}
            autoResize
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentário (opcional)"
          />
          {erro && <p className={styles.feedbackErro}>{erro}</p>}
          <div className={styles.feedbackAcoes}>
            <Button onClick={handleSalvar} className="btn-primary" type="button" loading={salvando}>
              Salvar avaliação
            </Button>
            <Button onClick={() => setEditando(false)} className="btn-secondary" type="button" disabled={salvando}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : proprio ? (
        <div className={`${styles.feedback} ${styles.feedbackProprio} mb-2`}>
          <div className={styles.feedbackCabecalho}>
            <strong>{proprio.nome} (você)</strong>
            <Estrelas valor={proprio.estrelas} />
          </div>
          {proprio.comentario && <p>{proprio.comentario}</p>}
          {erro && <p className={styles.feedbackErro}>{erro}</p>}
          <div className={`${styles.feedbackAcoes} ${styles.naoImprimir}`}>
            <Button onClick={abrirFormulario} className="btn-secondary" type="button" disabled={salvando}>
              Editar
            </Button>
            <Button onClick={handleExcluir} className="btn-error-outline" type="button" loading={salvando}>
              Excluir
            </Button>
          </div>
        </div>
      ) : (
        <div className={`${styles.naoImprimir} mb-2`}>
          <Button onClick={abrirFormulario} icon={RiStarLine} className="btn-secondary" type="button">
            Avaliar este trabalho
          </Button>
        </div>
      )}

      {outros.map((f) => (
        <div key={f.id} className={`${styles.feedback} mb-1`}>
          <div className={styles.feedbackCabecalho}>
            <strong>{f.nome}</strong>
            <Estrelas valor={f.estrelas} />
            <span className={styles.feedbackData}>{formatarData(f.updatedAt)}</span>
          </div>
          {f.comentario && <p>{f.comentario}</p>}
        </div>
      ))}

      {!feedbacks.length && !editando && (
        <p className={styles.feedbackVazio}>Ninguém avaliou este trabalho ainda.</p>
      )}
    </section>
  );
};

export default FeedbackTrabalho;
