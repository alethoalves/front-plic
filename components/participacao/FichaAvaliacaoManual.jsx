"use client";
import { useState, useMemo } from "react";
import styles from "./FichaAvaliacaoManual.module.scss";
import { Button } from "primereact/button";
import { Card } from "primereact/card";

// Extrai todos os itens folha (com notaPorItem) do schema, junto com seu caminho
// de índices. Retorna um array de { path: "0.1.2", item }.
function extrairFolhas(grupos, prefixo = "") {
  const folhas = [];
  grupos?.forEach((grupo, i) => {
    const caminho = prefixo ? `${prefixo}.${i}` : String(i);
    if (grupo.notaPorItem !== undefined) {
      folhas.push({ path: caminho, item: grupo });
    } else if (grupo.grupos?.length > 0) {
      folhas.push(...extrairFolhas(grupo.grupos, caminho));
    }
  });
  return folhas;
}

// Navega pelo objeto usando o caminho "0.1.2" → obj.grupos[0].grupos[1].grupos[2]
function navegarPorCaminho(obj, caminho) {
  const partes = caminho.split(".");
  let atual = obj;
  for (const parte of partes) {
    if (!atual?.grupos) return null;
    atual = atual.grupos[parseInt(parte)];
  }
  return atual;
}

// Reconstrói uma cópia do schema com respostaCampos = Array(qty).fill([]) em cada folha
function reconstruirFicha(schema, quantidades) {
  const ficha = JSON.parse(JSON.stringify(schema));

  const preencherFolhas = (grupos, prefixo = "") => {
    grupos?.forEach((grupo, i) => {
      const caminho = prefixo ? `${prefixo}.${i}` : String(i);
      if (grupo.notaPorItem !== undefined) {
        const qty = quantidades[caminho] ?? 0;
        grupo.respostaCampos = Array(qty).fill([]);
      } else if (grupo.grupos?.length > 0) {
        preencherFolhas(grupo.grupos, caminho);
      }
    });
  };

  preencherFolhas(ficha.grupos);
  return ficha;
}

// Calcula a nota de um grupo a partir das quantidades (sem modificar o schema)
function calcularNota(grupo, quantidades, prefixo = "") {
  if (grupo.notaPorItem !== undefined) {
    const qty = quantidades[prefixo] ?? 0;
    return Math.min(qty * grupo.notaPorItem, grupo.notaMax ?? Infinity);
  }
  if (grupo.grupos?.length > 0) {
    let total = 0;
    grupo.grupos.forEach((sub, i) => {
      const caminho = prefixo ? `${prefixo}.${i}` : String(i);
      total += calcularNota(sub, quantidades, caminho);
    });
    return Math.min(total, grupo.notaMax ?? total);
  }
  return 0;
}

function calcularNotaRaiz(schema, quantidades) {
  if (!schema?.grupos) return 0;
  let total = 0;
  schema.grupos.forEach((grupo, i) => {
    total += calcularNota(grupo, quantidades, String(i));
  });
  return Math.min(total, schema.notaMax ?? total);
}

// ─── GrupoManual ─────────────────────────────────────────────────────────────
// Renderiza recursivamente um grupo. Folhas mostram input; nós mostram soma.
const GrupoManual = ({ grupo, caminho, quantidades, onChange, nivel = 0 }) => {
  const [expanded, setExpanded] = useState(nivel < 2);
  const notaAtual = calcularNota(grupo, quantidades, caminho);
  const isLeaf = grupo.notaPorItem !== undefined;
  const hasChildren = !isLeaf && grupo.grupos?.length > 0;

  const nivelClass = nivel === 0 ? styles.nivel0 : nivel === 1 ? styles.nivel1 : styles.nivel2;

  return (
    <div className={`${styles.grupo} ${nivelClass}`}>
      <div
        className={`${styles.grupoHeader} ${hasChildren ? styles.clicavel : ""}`}
        onClick={() => hasChildren && setExpanded((v) => !v)}
      >
        <div className={styles.grupoHeaderEsquerda}>
          {hasChildren && (
            <i className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"} ${styles.expandIcon}`} />
          )}
          <span className={styles.grupoLabel}>{grupo.label}</span>
        </div>

        <div className={styles.grupoHeaderDireita}>
          {isLeaf ? (
            <div className={styles.inputWrapper} onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                min={0}
                value={quantidades[caminho] ?? 0}
                onChange={(e) => onChange(caminho, Math.max(0, parseInt(e.target.value) || 0))}
                className={styles.qtyInput}
              />
              <span className={styles.qtyLabel}>
                × {grupo.notaPorItem} pts = <strong>{notaAtual}</strong>/{grupo.notaMax}
              </span>
            </div>
          ) : (
            <span className={styles.notaResumo}>
              <strong>{notaAtual}</strong>/{grupo.notaMax} pts
            </span>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className={styles.subgrupos}>
          {grupo.grupos.map((sub, i) => {
            const subCaminho = `${caminho}.${i}`;
            return (
              <GrupoManual
                key={subCaminho}
                grupo={sub}
                caminho={subCaminho}
                quantidades={quantidades}
                onChange={onChange}
                nivel={nivel + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── FichaAvaliacaoManual ─────────────────────────────────────────────────────
const FichaAvaliacaoManual = ({
  schema,          // perfil do schemaFichaAvaliacaoParticipacao (já filtrado por tipoParticipacao)
  fichaAtual,      // participacao.fichaAvaliacao existente (pré-preenche HIBRIDA)
  onSave,          // (fichaAvaliacao) => void
  onBack,          // () => void
  loading = false,
}) => {
  // Inicializa quantidades a partir da fichaAtual (HIBRIDA) ou zero (MANUAL)
  const initialQuantidades = useMemo(() => {
    const folhas = extrairFolhas(schema?.grupos);
    const mapa = {};
    folhas.forEach(({ path }) => {
      const itemAtual = fichaAtual ? navegarPorCaminho(fichaAtual, path) : null;
      mapa[path] = itemAtual?.respostaCampos?.length ?? 0;
    });
    return mapa;
  }, [schema, fichaAtual]);

  const [quantidades, setQuantidades] = useState(initialQuantidades);
  const [confirmado, setConfirmado] = useState(false);

  const handleChange = (caminho, valor) => {
    setQuantidades((prev) => ({ ...prev, [caminho]: valor }));
    setConfirmado(false);
  };

  const handleSalvar = () => {
    const ficha = reconstruirFicha(schema, quantidades);
    onSave(ficha);
  };

  const notaTotal = calcularNotaRaiz(schema, quantidades);

  if (!schema) return null;

  return (
    <Card className={styles.fichaCard}>
      <div className={styles.fichaHeader}>
        <div className={styles.fichaTitulo}>
          <h4>{schema.label || "Ficha de Avaliação"}</h4>
          <p className={styles.fichaSubtitulo}>
            Informe a quantidade de itens de cada categoria. A nota é calculada automaticamente.
          </p>
        </div>
        <div className={styles.notaTotal}>
          <span className={styles.notaTotalLabel}>Nota Total</span>
          <span className={styles.notaTotalValor}>
            {notaTotal}
            <span className={styles.notaTotalMax}>/{schema.notaMax ?? 0}</span>
          </span>
        </div>
      </div>

      <div className={styles.grupos}>
        {schema.grupos?.map((grupo, i) => (
          <GrupoManual
            key={i}
            grupo={grupo}
            caminho={String(i)}
            quantidades={quantidades}
            onChange={handleChange}
            nivel={0}
          />
        ))}
      </div>

      <label className={styles.confirmacao}>
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
        />
        <span>
          Confirmo que as informações inseridas acima estão de acordo com o
          Currículo Lattes do aluno.
        </span>
      </label>

      <div className={styles.acoes}>
        {onBack && (
          <Button
            label="Voltar"
            icon="pi pi-arrow-left"
            className="p-button-text p-button-plain"
            onClick={onBack}
            disabled={loading}
          />
        )}
        <Button
          label={loading ? "Salvando..." : "Salvar Ficha"}
          icon={loading ? "pi pi-spin pi-spinner" : "pi pi-save"}
          className="btn-primary"
          onClick={handleSalvar}
          disabled={loading || !confirmado}
        />
      </div>
    </Card>
  );
};

export default FichaAvaliacaoManual;
