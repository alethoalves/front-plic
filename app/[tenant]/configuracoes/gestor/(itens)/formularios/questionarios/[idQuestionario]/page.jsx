"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiArrowLeftLine,
  RiSaveLine,
  RiToggleLine,
  RiToggleFill,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiEyeLine,
} from "@remixicon/react";

import styles from "./page.module.scss";
import Header from "@/components/Header";
import Button from "@/components/Button";
import QuestionarioSatisfacaoModal from "@/components/QuestionarioSatisfacaoModal";
import { getQuestionario, updateQuestionario } from "@/app/api/client/questionarioSatisfacao";

// ─── Utilitários ──────────────────────────────────────────────────────────────

const uid = () => `_${Math.random().toString(36).slice(2, 9)}`;

const TIPOS = [
  { value: "multipla_escolha",       label: "Múltipla escolha (uma resposta)" },
  { value: "likert",                 label: "Escala de satisfação (Likert 1-5)" },
  { value: "escala_facilidade",      label: "Escala de facilidade (1-5)" },
  { value: "likert_com_nao_se_aplica", label: "Escala Likert com opção 'Não se aplica'" },
  { value: "matriz_likert",          label: "Matriz de afirmações (Likert)" },
  { value: "nps",                    label: "NPS — Escala 0 a 10" },
  { value: "resposta_aberta",        label: "Resposta aberta (texto livre)" },
];

const escalaVazia = () => ({
  min: 1, max: 5,
  rotulos: { "1": "", "2": "", "3": "Neutro", "4": "", "5": "" },
});

const novaQuestao = (tipo = "multipla_escolha") => {
  const base = { id: uid(), numero: "", texto: "", tipo, obrigatorio: true };
  switch (tipo) {
    case "multipla_escolha":
      return { ...base, opcoes: ["Opção 1", "Opção 2"] };
    case "likert":
    case "escala_facilidade":
      return { ...base, escala: escalaVazia() };
    case "likert_com_nao_se_aplica":
      return { ...base, escala: { ...escalaVazia(), opcaoExtra: "Não se aplica" } };
    case "matriz_likert":
      return { ...base, afirmacoes: [{ id: uid(), texto: "" }], escala: escalaVazia() };
    case "nps":
      return { ...base, min: 0, max: 10, rotuloMin: "Definitivamente não recomendaria", rotuloMax: "Recomendaria com certeza" };
    default:
      return base;
  }
};

const novoBloco = () => ({ id: uid(), titulo: "", descricao: "", questoes: [novaQuestao()] });

// ─── Editores de campos específicos por tipo ──────────────────────────────────

function EditorMultiplaEscolha({ questao, onChange }) {
  const opcoes = questao.opcoes ?? [];
  const update = (i, val) => {
    const next = [...opcoes]; next[i] = val;
    onChange({ opcoes: next });
  };
  const add = () => onChange({ opcoes: [...opcoes, ""] });
  const remove = (i) => onChange({ opcoes: opcoes.filter((_, idx) => idx !== i) });
  return (
    <div className={styles.opcoesList}>
      {opcoes.map((op, i) => (
        <div key={i} className={styles.opcaoRow}>
          <input className={styles.inputSm} value={op} onChange={e => update(i, e.target.value)} placeholder={`Opção ${i + 1}`} />
          <button type="button" className={styles.btnIconSmDanger} onClick={() => remove(i)} title="Remover opção"><RiDeleteBinLine size={16} /></button>
        </div>
      ))}
      <button type="button" className={styles.btnAddSmall} onClick={add}><RiAddCircleLine size={14} /> Adicionar opção</button>
    </div>
  );
}

function EditorEscala({ escala, onChange, showOpcaoExtra }) {
  const rot = escala?.rotulos ?? {};
  const updateRotulo = (k, v) => onChange({ escala: { ...escala, rotulos: { ...rot, [k]: v } } });
  return (
    <div className={styles.escalaWrap}>
      <p className={styles.escalaHint}>Rótulos da escala (1 = menor, 5 = maior)</p>
      <div className={styles.escalaGrid}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className={styles.escalaItem}>
            <span className={styles.escalaNum}>{n}</span>
            <input className={styles.inputSm} value={rot[String(n)] ?? ""} onChange={e => updateRotulo(String(n), e.target.value)} placeholder={`Rótulo ${n}`} />
          </div>
        ))}
      </div>
      {showOpcaoExtra && (
        <div className={styles.fieldGroup} style={{ marginTop: "0.5rem" }}>
          <label className={styles.label}>Texto da opção extra ("Não se aplica")</label>
          <input className={styles.input} value={escala?.opcaoExtra ?? ""} onChange={e => onChange({ escala: { ...escala, opcaoExtra: e.target.value } })} />
        </div>
      )}
    </div>
  );
}

function EditorMatrizLikert({ questao, onChange }) {
  const afs = questao.afirmacoes ?? [];
  const updateAf = (i, val) => {
    const next = afs.map((a, idx) => idx === i ? { ...a, texto: val } : a);
    onChange({ afirmacoes: next });
  };
  const addAf = () => onChange({ afirmacoes: [...afs, { id: uid(), texto: "" }] });
  const removeAf = (i) => onChange({ afirmacoes: afs.filter((_, idx) => idx !== i) });
  return (
    <div>
      <p className={styles.escalaHint}>Afirmações da matriz</p>
      {afs.map((af, i) => (
        <div key={af.id} className={styles.opcaoRow}>
          <input className={styles.inputSm} value={af.texto} onChange={e => updateAf(i, e.target.value)} placeholder={`Afirmação ${i + 1}`} />
          <button type="button" className={styles.btnIconSmDanger} onClick={() => removeAf(i)}><RiDeleteBinLine size={16} /></button>
        </div>
      ))}
      <button type="button" className={styles.btnAddSmall} onClick={addAf}><RiAddCircleLine size={14} /> Adicionar afirmação</button>
      <EditorEscala escala={questao.escala} onChange={onChange} />
    </div>
  );
}

function EditorNPS({ questao, onChange }) {
  return (
    <div className={styles.fieldGroup}>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Rótulo mínimo (0)</label>
          <input className={styles.input} value={questao.rotuloMin ?? ""} onChange={e => onChange({ rotuloMin: e.target.value })} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Rótulo máximo (10)</label>
          <input className={styles.input} value={questao.rotuloMax ?? ""} onChange={e => onChange({ rotuloMax: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function EditorCondicional({ questao, onChange, questoesAnteriores }) {
  const cond = questao.condicional;
  const ativa = !!cond;
  const toggle = () => onChange({ condicional: ativa ? undefined : { questaoId: "", valores: [] } });
  const updateId = (v) => onChange({ condicional: { ...cond, questaoId: v } });
  const updateValores = (v) => {
    const arr = v.split(",").map(s => s.trim()).filter(Boolean);
    onChange({ condicional: { ...cond, valores: arr } });
  };
  return (
    <div className={styles.condicionalWrap}>
      <label className={styles.checkLabel}>
        <input type="checkbox" checked={ativa} onChange={toggle} />
        <span>Exibir condicionalmente (mostrar apenas se outra questão tiver determinada resposta)</span>
      </label>
      {ativa && (
        <div className={styles.condicionalFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Depende da questão</label>
            <select className={styles.select} value={cond.questaoId} onChange={e => updateId(e.target.value)}>
              <option value="">Selecione...</option>
              {questoesAnteriores.map(q => (
                <option key={q.id} value={q.id}>{q.numero ? `${q.numero} — ` : ""}{q.texto?.slice(0, 60) || q.id}</option>
              ))}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Valores que ativam esta questão <span className={styles.hint}>(separados por vírgula — ex: 1, 2 ou "Sim, utilizei")</span></label>
            <input className={styles.input} value={(cond.valores ?? []).join(", ")} onChange={e => updateValores(e.target.value)} placeholder='Ex: 1, 2  ou  "Sim, utilizei e fui atendido(a)"' />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Editor de uma questão ────────────────────────────────────────────────────

function QuestaoEditor({ questao, onUpdate, onRemove, onMoveUp, onMoveDown, questoesAnteriores }) {
  const set = (patch) => onUpdate({ ...questao, ...patch });

  const handleTipoChange = (tipo) => {
    const novo = novaQuestao(tipo);
    onUpdate({ ...novo, id: questao.id, numero: questao.numero, texto: questao.texto, obrigatorio: questao.obrigatorio });
  };

  return (
    <div className={styles.questaoCard}>
      <div className={styles.questaoHeader}>
        <div className={styles.questaoMeta}>
          <input className={`${styles.inputSm} ${styles.inputNumero}`} value={questao.numero} onChange={e => set({ numero: e.target.value })} placeholder="Nº" title="Número da questão (ex: 1.1)" />
          <select className={styles.selectSm} value={questao.tipo} onChange={e => handleTipoChange(e.target.value)}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={questao.obrigatorio} onChange={e => set({ obrigatorio: e.target.checked })} />
            <span>Obrigatória</span>
          </label>
        </div>
        <div className={styles.questaoAcoes}>
          <button type="button" className={styles.btnIconSm} onClick={onMoveUp} title="Mover acima"><RiArrowUpLine size={14} /></button>
          <button type="button" className={styles.btnIconSm} onClick={onMoveDown} title="Mover abaixo"><RiArrowDownLine size={14} /></button>
          <button type="button" className={styles.btnIconSmDanger} onClick={onRemove} title="Excluir questão"><RiDeleteBinLine size={14} /></button>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Texto da questão</label>
        <textarea className={styles.textareaSm} rows={3} value={questao.texto} onChange={e => set({ texto: e.target.value })} placeholder="Digite o enunciado da questão..." />
      </div>

      {/* Campos específicos por tipo */}
      {questao.tipo === "multipla_escolha" && (
        <EditorMultiplaEscolha questao={questao} onChange={set} />
      )}
      {(questao.tipo === "likert" || questao.tipo === "escala_facilidade") && (
        <EditorEscala escala={questao.escala} onChange={set} />
      )}
      {questao.tipo === "likert_com_nao_se_aplica" && (
        <EditorEscala escala={questao.escala} onChange={set} showOpcaoExtra />
      )}
      {questao.tipo === "matriz_likert" && (
        <EditorMatrizLikert questao={questao} onChange={set} />
      )}
      {questao.tipo === "nps" && (
        <EditorNPS questao={questao} onChange={set} />
      )}

      {/* Lógica condicional */}
      <EditorCondicional questao={questao} onChange={set} questoesAnteriores={questoesAnteriores} />
    </div>
  );
}

// ─── Editor de um bloco ───────────────────────────────────────────────────────

function BlocoEditor({ bloco, onUpdate, onRemove, onMoveUp, onMoveDown, questoesAnterioresDoBloco }) {
  const setBloco = (patch) => onUpdate({ ...bloco, ...patch });

  const updateQuestao = (id, q) =>
    setBloco({ questoes: bloco.questoes.map(x => x.id === id ? q : x) });
  const removeQuestao = (id) =>
    setBloco({ questoes: bloco.questoes.filter(x => x.id !== id) });
  const addQuestao = () =>
    setBloco({ questoes: [...bloco.questoes, novaQuestao()] });
  const moveQuestao = (idx, dir) => {
    const qs = [...bloco.questoes];
    const target = idx + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[idx], qs[target]] = [qs[target], qs[idx]];
    setBloco({ questoes: qs });
  };

  // Questões anteriores acessíveis para condicional = questões de blocos anteriores + questões anteriores dentro deste bloco
  const getQuestoesAnteriores = (qIdx) => [
    ...questoesAnterioresDoBloco,
    ...bloco.questoes.slice(0, qIdx),
  ];

  return (
    <div className={styles.blocoCard}>
      <div className={styles.blocoHeader}>
        <div className={styles.blocoTitulo}>
          <span className={styles.blocoLabel}>Bloco</span>
          <input className={styles.input} value={bloco.titulo} onChange={e => setBloco({ titulo: e.target.value })} placeholder="Título do bloco (ex: BLOCO 1 — PERFIL DO RESPONDENTE)" />
        </div>
        <div className={styles.blocoAcoes}>
          <button type="button" className={styles.btnIconSm} onClick={onMoveUp} title="Mover bloco acima"><RiArrowUpLine size={14} /></button>
          <button type="button" className={styles.btnIconSm} onClick={onMoveDown} title="Mover bloco abaixo"><RiArrowDownLine size={14} /></button>
          <button type="button" className={styles.btnIconSmDanger} onClick={onRemove} title="Excluir bloco"><RiDeleteBinLine size={14} /></button>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Descrição / contexto do bloco <span className={styles.hint}>(opcional)</span></label>
        <input className={styles.input} value={bloco.descricao ?? ""} onChange={e => setBloco({ descricao: e.target.value })} placeholder="Ex: (Passos 1, 2 e 3)" />
      </div>

      <div className={styles.questoesList}>
        {bloco.questoes.map((q, idx) => (
          <QuestaoEditor
            key={q.id}
            questao={q}
            onUpdate={(updated) => updateQuestao(q.id, updated)}
            onRemove={() => removeQuestao(q.id)}
            onMoveUp={() => moveQuestao(idx, -1)}
            onMoveDown={() => moveQuestao(idx, 1)}
            questoesAnteriores={getQuestoesAnteriores(idx)}
          />
        ))}
      </div>

      <button type="button" className={styles.btnAddQuestao} onClick={addQuestao}>
        <RiAddCircleLine size={16} /> Adicionar questão
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const Page = ({ params }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contexto, setContexto] = useState("inscricao");
  const [ativo, setAtivo] = useState(false);
  const [apresentacao, setApresentacao] = useState("");
  const [blocos, setBlocos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = await getQuestionario(params.tenant, params.idQuestionario);
        setTitulo(q.titulo);
        setDescricao(q.descricao ?? "");
        setContexto(q.contexto);
        setAtivo(q.ativo);
        setApresentacao(q.schema?.apresentacao ?? "");
        setBlocos(q.schema?.blocos ?? []);
      } catch {
        setError("Erro ao carregar questionário.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idQuestionario]);

  const updateBloco = (id, b) => setBlocos(prev => prev.map(x => x.id === id ? b : x));
  const removeBloco = (id) => setBlocos(prev => prev.filter(x => x.id !== id));
  const addBloco = () => setBlocos(prev => [...prev, novoBloco()]);
  const moveBloco = (idx, dir) => {
    const next = [...blocos];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setBlocos(next);
  };

  // Questões de todos os blocos anteriores (para condicional)
  const questoesAnterioresDoBloco = (blocoIdx) =>
    blocos.slice(0, blocoIdx).flatMap(b => b.questoes);

  const buildSchema = () => ({ apresentacao, blocos });

  const handleSalvar = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateQuestionario(params.tenant, params.idQuestionario, {
        titulo, descricao, contexto, ativo, schema: buildSchema(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [params.tenant, params.idQuestionario, titulo, descricao, contexto, ativo, apresentacao, blocos]);

  const previewQuestionario = { id: parseInt(params.idQuestionario), titulo, descricao, schema: buildSchema() };

  if (loading) return <main><p className="mt-2">Carregando...</p></main>;
  if (error) return <main><p className="mt-2">{error}</p></main>;

  return (
    <>
      {showPreview && (
        <QuestionarioSatisfacaoModal
          tenant={params.tenant}
          questionario={previewQuestionario}
          inscricaoId={null}
          modoPreview
          onConcluir={() => setShowPreview(false)}
          onCancelar={() => setShowPreview(false)}
        />
      )}

      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.voltar} onClick={() => router.push(`/${params.tenant}/configuracoes/gestor/formularios`)} type="button">
            <RiArrowLeftLine size={18} /> Formulários
          </button>
        </div>

        <Header
          className="mb-3"
          titulo="Questionário de satisfação"
          subtitulo={titulo}
          descricao="Edite as perguntas e configurações do questionário."
        />

        <div className={styles.content}>

          {/* ── Informações gerais ── */}
          <section className={styles.section}>
            <h5 className={styles.sectionTitle}>Informações gerais</h5>
            <div className={styles.fieldsRow}>
              <div className={styles.fieldGroup} style={{ flex: 2 }}>
                <label className={styles.label}>Título</label>
                <input className={styles.input} value={titulo} onChange={e => setTitulo(e.target.value)} />
              </div>
              <div className={styles.fieldGroup} style={{ flex: 3 }}>
                <label className={styles.label}>Descrição</label>
                <input className={styles.input} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Fluxo de Inscrição | PIBIC 2026/2027" />
              </div>
            </div>
            <div className={styles.fieldsRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Contexto</label>
                <select className={styles.select} value={contexto} onChange={e => setContexto(e.target.value)}>
                  <option value="inscricao">Inscrição</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Status</label>
                <button type="button" className={`${styles.toggleBtn} ${ativo ? styles.toggleAtivo : ""}`} onClick={() => setAtivo(v => !v)}>
                  {ativo ? <RiToggleFill size={28} /> : <RiToggleLine size={28} />}
                  <span>{ativo ? "Ativo" : "Inativo"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── Apresentação ── */}
          <section className={styles.section}>
            <h5 className={styles.sectionTitle}>Texto de apresentação</h5>
            <p className={styles.sectionHint}>Texto exibido ao respondente antes das perguntas. Use linhas em branco para separar parágrafos.</p>
            <textarea className={styles.textareaApresentacao} rows={6} value={apresentacao} onChange={e => setApresentacao(e.target.value)} placeholder="Ex: Prezado(a) orientador(a), este questionário tem como objetivo..." />
          </section>

          {/* ── Blocos e questões ── */}
          <section className={styles.section}>
            <h5 className={styles.sectionTitle}>Blocos e questões</h5>
            {blocos.length === 0 && <p className={styles.sectionHint}>Nenhum bloco adicionado. Clique em "Adicionar bloco" para começar.</p>}
            {blocos.map((bloco, idx) => (
              <BlocoEditor
                key={bloco.id}
                bloco={bloco}
                onUpdate={(b) => updateBloco(bloco.id, b)}
                onRemove={() => removeBloco(bloco.id)}
                onMoveUp={() => moveBloco(idx, -1)}
                onMoveDown={() => moveBloco(idx, 1)}
                questoesAnterioresDoBloco={questoesAnterioresDoBloco(idx)}
              />
            ))}
            <button type="button" className={styles.btnAddBloco} onClick={addBloco}>
              <RiAddCircleLine size={18} /> Adicionar bloco
            </button>
          </section>

          {/* ── Ações ── */}
          <div className={styles.actions}>
            {saveError && <p className={styles.saveError}>{saveError}</p>}
            {saveSuccess && <p className={styles.saveSuccess}>Salvo com sucesso!</p>}
            <Button type="button" hierarchy="secondary" icon={RiEyeLine} onClick={() => setShowPreview(true)}>
              Visualizar questionário
            </Button>
            <Button type="button" hierarchy="primary" icon={RiSaveLine} onClick={handleSalvar} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
