"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import styles from "./QuestionarioResultados.module.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// ─── Agregação ────────────────────────────────────────────────────────────────

function aggMultipla(questao, respostas) {
  const counts = Object.fromEntries(questao.opcoes.map(o => [o, 0]));
  for (const r of respostas) {
    const v = r.respostas[questao.id];
    if (v != null && counts[v] !== undefined) counts[v]++;
  }
  return { labels: questao.opcoes, data: questao.opcoes.map(l => counts[l]) };
}

function aggEscala(questao, respostas, extraKey = null) {
  const { min, max, rotulos } = questao.escala;
  const keys = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  if (extraKey) keys.push("nao_se_aplica");
  const counts = Object.fromEntries(keys.map(k => [k, 0]));
  for (const r of respostas) {
    const v = r.respostas[questao.id];
    if (v != null && counts[v] !== undefined) counts[v]++;
  }
  const labels = keys.map(k =>
    k === "nao_se_aplica" ? (extraKey || "Não se aplica") : (rotulos?.[k] ? `${k} — ${rotulos[k]}` : k)
  );
  const numericKeys = keys.filter(k => k !== "nao_se_aplica");
  const numericTotal = numericKeys.reduce((s, k) => s + counts[k], 0);
  const mean = numericTotal > 0
    ? (numericKeys.reduce((s, k) => s + parseInt(k) * counts[k], 0) / numericTotal).toFixed(2)
    : null;
  return { labels, data: keys.map(k => counts[k]), mean };
}

function aggNPS(questao, respostas) {
  const { min, max } = questao;
  const keys = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  const counts = Object.fromEntries(keys.map(k => [k, 0]));
  for (const r of respostas) {
    const v = r.respostas[questao.id];
    if (v != null && counts[v] !== undefined) counts[v]++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const promoters = (counts["9"] || 0) + (counts["10"] || 0);
  const detractors = ["0","1","2","3","4","5","6"].reduce((s, k) => s + (counts[k] || 0), 0);
  const passives = (counts["7"] || 0) + (counts["8"] || 0);
  const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;
  return { labels: keys, data: keys.map(k => counts[k]), nps, total, promoters, passives, detractors };
}

function aggMatriz(questao, respostas) {
  const { min, max, rotulos } = questao.escala;
  const cols = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  const afirmacoes = questao.afirmacoes.map(af => ({
    id: af.id,
    texto: af.texto,
    counts: Object.fromEntries(cols.map(c => [c, 0])),
  }));
  for (const r of respostas) {
    const v = r.respostas[questao.id];
    if (v && typeof v === "object") {
      for (const af of afirmacoes) {
        const val = v[af.id];
        if (val && af.counts[val] !== undefined) af.counts[val]++;
      }
    }
  }
  return { cols, rotulos, afirmacoes };
}

function aggAberta(questao, respostas) {
  return respostas
    .filter(r => r.respostas[questao.id])
    .map((r, i) => ({ idx: i + 1, texto: r.respostas[questao.id] }));
}

// ─── Gráfico de barras ────────────────────────────────────────────────────────

function GraficoBarras({ labels, data, colors, horizontal = false }) {
  const bg = colors || data.map(() => "rgba(99,102,241,0.7)");
  const chartData = {
    labels,
    datasets: [{ data, backgroundColor: bg, borderRadius: 4, borderWidth: 0 }],
  };
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed[horizontal ? "x" : "y"]} resposta(s)` } },
    },
    scales: {
      [horizontal ? "x" : "y"]: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };
  return (
    <div style={{ height: horizontal ? Math.max(160, labels.length * 38) : 200 }}>
      <Bar data={chartData} options={opts} />
    </div>
  );
}

// ─── Tabela de contagens ──────────────────────────────────────────────────────

function TabelaContagens({ labels, data }) {
  const total = data.reduce((a, b) => a + b, 0);
  return (
    <table className={styles.tabela}>
      <thead>
        <tr><th>Opção</th><th>Respostas</th><th>%</th></tr>
      </thead>
      <tbody>
        {labels.map((l, i) => (
          <tr key={l}>
            <td>{l}</td>
            <td>{data[i]}</td>
            <td>{total > 0 ? `${Math.round((data[i] / total) * 100)}%` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Visualizações por tipo ───────────────────────────────────────────────────

function VisMultipla({ questao, respostas }) {
  const { labels, data } = aggMultipla(questao, respostas);
  return (
    <div className={styles.visWrap}>
      <GraficoBarras labels={labels} data={data} horizontal={labels.length > 4} />
      <TabelaContagens labels={labels} data={data} />
    </div>
  );
}

function VisEscala({ questao, respostas, showExtra }) {
  const extraLabel = showExtra ? (questao.escala.opcaoExtra || "Não se aplica") : null;
  const { labels, data, mean } = aggEscala(questao, respostas, extraLabel);
  return (
    <div className={styles.visWrap}>
      {mean && <p className={styles.stat}>Média: <strong>{mean}</strong></p>}
      <GraficoBarras labels={labels} data={data} />
      <TabelaContagens labels={labels} data={data} />
    </div>
  );
}

function VisNPS({ questao, respostas }) {
  const { labels, data, nps, total, promoters, passives, detractors } = aggNPS(questao, respostas);
  const npsColor = nps >= 50 ? "#22c55e" : nps >= 0 ? "#eab308" : "#ef4444";
  const npsBarColors = labels.map(l => {
    const n = parseInt(l);
    if (n >= 9) return "rgba(34,197,94,0.75)";
    if (n <= 6) return "rgba(239,68,68,0.75)";
    return "rgba(234,179,8,0.75)";
  });
  return (
    <div className={styles.visWrap}>
      {nps !== null && (
        <div className={styles.npsWrap}>
          <div className={styles.npsScore} style={{ color: npsColor }}>
            {nps > 0 ? "+" : ""}{nps}
            <span className={styles.npsLabel}>NPS</span>
          </div>
          <div className={styles.npsBreakdown}>
            <span className={styles.promoter}>Promotores (9-10): {promoters} ({total ? Math.round(promoters/total*100) : 0}%)</span>
            <span className={styles.passive}>Neutros (7-8): {passives} ({total ? Math.round(passives/total*100) : 0}%)</span>
            <span className={styles.detractor}>Detratores (0-6): {detractors} ({total ? Math.round(detractors/total*100) : 0}%)</span>
          </div>
        </div>
      )}
      <GraficoBarras labels={labels} data={data} colors={npsBarColors} />
    </div>
  );
}

function VisMatriz({ questao, respostas }) {
  const { cols, rotulos, afirmacoes } = aggMatriz(questao, respostas);
  return (
    <div className={styles.matrizWrap}>
      <table className={styles.matrizTabela}>
        <thead>
          <tr>
            <th>Afirmação</th>
            {cols.map(c => (
              <th key={c}>
                {c}{rotulos?.[c] ? <><br /><small>{rotulos[c]}</small></> : ""}
              </th>
            ))}
            <th>Média</th>
          </tr>
        </thead>
        <tbody>
          {afirmacoes.map(af => {
            const total = Object.values(af.counts).reduce((a, b) => a + b, 0);
            const mean = total > 0
              ? (cols.reduce((s, c) => s + parseInt(c) * af.counts[c], 0) / total).toFixed(1)
              : "—";
            return (
              <tr key={af.id}>
                <td>{af.texto}</td>
                {cols.map(c => (
                  <td key={c}>
                    {af.counts[c]}
                    {total > 0 && <span className={styles.pct}> ({Math.round(af.counts[c]/total*100)}%)</span>}
                  </td>
                ))}
                <td><strong>{mean}</strong></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VisAberta({ questao, respostas }) {
  const textos = aggAberta(questao, respostas);
  if (textos.length === 0) return <p className={styles.semResposta}>Nenhuma resposta de texto registrada.</p>;
  return (
    <div className={styles.abertaList}>
      {textos.map(t => (
        <div key={t.idx} className={styles.abertaItem}>
          <span className={styles.abertaIdx}>{t.idx}</span>
          <p>{t.texto}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Card de questão ──────────────────────────────────────────────────────────

const TIPO_LABEL = {
  multipla_escolha: "Múltipla escolha",
  likert: "Escala Likert",
  escala_facilidade: "Escala de facilidade",
  likert_com_nao_se_aplica: "Likert + Não se aplica",
  matriz_likert: "Matriz Likert",
  nps: "NPS",
  resposta_aberta: "Resposta aberta",
};

function QuestaoCard({ questao, respostas }) {
  const responderam = respostas.filter(r => r.respostas[questao.id] != null).length;
  return (
    <div className={styles.questaoCard}>
      <div className={styles.questaoCardHeader}>
        <div className={styles.questaoInfo}>
          <span className={styles.questaoTipo}>{TIPO_LABEL[questao.tipo] || questao.tipo}</span>
          <p className={styles.questaoTexto}>
            {questao.numero && <strong>{questao.numero}. </strong>}
            {questao.texto}
          </p>
        </div>
        <span className={styles.questaoCount}>{responderam} / {respostas.length}</span>
      </div>
      <div className={styles.questaoCardBody}>
        {questao.tipo === "multipla_escolha" && <VisMultipla questao={questao} respostas={respostas} />}
        {(questao.tipo === "likert" || questao.tipo === "escala_facilidade") && <VisEscala questao={questao} respostas={respostas} />}
        {questao.tipo === "likert_com_nao_se_aplica" && <VisEscala questao={questao} respostas={respostas} showExtra />}
        {questao.tipo === "nps" && <VisNPS questao={questao} respostas={respostas} />}
        {questao.tipo === "matriz_likert" && <VisMatriz questao={questao} respostas={respostas} />}
        {questao.tipo === "resposta_aberta" && <VisAberta questao={questao} respostas={respostas} />}
      </div>
    </div>
  );
}

// ─── Componente principal (display-only) ─────────────────────────────────────

export default function QuestionarioResultados({ titulo, descricao, schema, respostas }) {
  const blocos = schema?.blocos ?? [];

  return (
    <div className={styles.wrap}>
      <div className={styles.summaryCard}>
        <span className={styles.summaryNum}>{respostas.length}</span>
        <span className={styles.summaryLabel}>
          {respostas.length === 1 ? "resposta recebida" : "respostas recebidas"}
        </span>
      </div>

      {respostas.length === 0 ? (
        <p className={styles.semResposta}>Nenhuma resposta recebida ainda.</p>
      ) : (
        blocos.map(bloco => (
          <div key={bloco.id} className={styles.blocoWrap}>
            {bloco.titulo && <h5 className={styles.blocoTitulo}>{bloco.titulo}</h5>}
            {bloco.questoes.map(q => (
              <QuestaoCard key={q.id} questao={q} respostas={respostas} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
