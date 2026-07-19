"use client";
import { useState } from "react";

const resolverCampo = (obj, field) => field.split(".").reduce((acc, key) => acc?.[key], obj);

// Renderiza um campo do modal de detalhes (label + valor) a partir de um
// elemento <Column> já definido pra tabela (reaproveita `body`/`editor` dele
// direto de `column.props`, sem duplicar a definição de cada campo). Estado
// de edição é 100% nosso (useState), sem depender do motor de edição de
// célula do PrimeReact — fonte da maior parte dos bugs de edição inline.
const CampoModalEditavel = ({ coluna, linha, onSalvar, styles }) => {
  const { field, header, editorTipo } = coluna.props;
  const editavel = Boolean(coluna.props.editor);
  const valorExibido = coluna.props.body ? coluna.props.body(linha) : resolverCampo(linha, field) ?? "—";
  const [emEdicao, setEmEdicao] = useState(false);
  const [rascunho, setRascunho] = useState(null);

  if (!editavel) {
    return (
      <div className={styles.field}>
        <p className={styles.fieldLabel}>{header}</p>
        <p className={styles.fieldValue}>{valorExibido}</p>
      </div>
    );
  }

  // select/multiselect: uma escolha já é a ação completa, salva na hora.
  // text: digita livre, só salva ao sair do campo (blur) ou Enter — usar
  // blur genérico pra tudo quebraria o Dropdown/MultiSelect, que abre o
  // painel de opções num portal (o foco "sai" do wrapper assim que abre).
  // `number` (InputNumber) também entra no grupo "imediato": diferente do
  // InputText, ele só chama `onValueChange` num Enter/Tab/blur/colar —
  // nunca a cada tecla digitada — e
  // já tem seu próprio handler de blur interno que dispara `onValueChange`
  // com o valor final. Se a gente também tentasse confirmar no blur do
  // wrapper, ele rodaria com o `rascunho` de ANTES desse callback (state
  // ainda não tinha sido atualizado nesse mesmo evento) e nunca salvaria.
  const commitImediato = ["select", "multiselect", "number"].includes(editorTipo);

  const confirmar = async (valor) => {
    setEmEdicao(false);
    const valorAntigo = resolverCampo(linha, field);
    if (valor === valorAntigo) return;
    await onSalvar({ field, newValue: valor, value: valorAntigo });
  };

  if (!emEdicao) {
    return (
      <div className={styles.field}>
        <p className={styles.fieldLabel}>{header}</p>
        <p
          className={`${styles.fieldValue} ${styles.fieldValueEditavel}`}
          onClick={() => {
            setRascunho(resolverCampo(linha, field));
            setEmEdicao(true);
          }}
        >
          {valorExibido}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <p className={styles.fieldLabel}>{header}</p>
      <div
        onBlur={commitImediato ? undefined : () => confirmar(rascunho)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !commitImediato) confirmar(rascunho);
          if (e.key === "Escape") setEmEdicao(false);
        }}
      >
        {coluna.props.editor({
          value: rascunho,
          editorCallback: (valor) => {
            setRascunho(valor);
            if (commitImediato) confirmar(valor);
          },
        })}
      </div>
    </div>
  );
};

export default CampoModalEditavel;
