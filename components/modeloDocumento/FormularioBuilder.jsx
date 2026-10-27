"use client";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiCloseLine,
  RiDeleteBinLine,
} from "@remixicon/react";

import styles from "./FormularioBuilder.module.scss";

// Monta o formularioPadrao de um modelo FORMULARIO, com os tipos de campo
// que a tela de assinatura sabe exibir
// (app/[tenant]/user/documentos/[documentoId]/page.jsx).
const TIPOS_CAMPO = [
  { value: "checkbox", label: "Caixa de marcar (declaração)" },
  { value: "arquivo", label: "Envio de arquivo (PDF)" },
  { value: "text", label: "Texto curto" },
  { value: "select", label: "Lista de opções" },
  { value: "group", label: "Grupo de campos" },
];

let ultimoId = 0;
const novoId = () => `campo-${++ultimoId}`;

// _id só existe no editor (chave estável do React); a API descarta.
export const comIds = (campos = []) =>
  campos.map((campo) => ({
    ...campo,
    _id: novoId(),
    ...(campo.tipo === "group" ? { campos: comIds(campo.campos) } : {}),
  }));

export const semIds = (campos = []) =>
  // eslint-disable-next-line no-unused-vars
  campos.map(({ _id, ...campo }) =>
    campo.tipo === "group" ? { ...campo, campos: semIds(campo.campos) } : campo
  );

export const campoVazio = (tipo) => {
  const base = { _id: novoId(), tipo, label: "" };
  switch (tipo) {
    case "select":
      return { ...base, obrigatorio: false, opcoes: [{ label: "Opção 1", value: "Opção 1" }] };
    case "checkbox":
      return { ...base, obrigatorio: true, value: false };
    case "arquivo":
      return { ...base, obrigatorio: true };
    case "group":
      return { ...base, campos: [campoVazio("checkbox")] };
    default:
      return { ...base, obrigatorio: false };
  }
};

const folhas = (campos) => campos.flatMap((c) => (c.tipo === "group" ? c.campos : [c]));

// Mesmas regras do formularioPadraoSchema da API
export const validarCampos = (campos) => {
  const erros = [];
  if (campos.length === 0) erros.push("Adicione pelo menos um campo.");
  const todos = [...campos, ...campos.flatMap((c) => (c.tipo === "group" ? c.campos : []))];
  if (todos.some((c) => !c.label?.trim())) erros.push("Há campo sem rótulo.");
  if (todos.some((c) => c.tipo === "group" && c.campos.length === 0))
    erros.push("Há grupo sem nenhum campo.");
  if (todos.some((c) => c.tipo === "select" && (c.opcoes.length === 0 || c.opcoes.some((o) => !o.label.trim()))))
    erros.push("Toda lista de opções precisa de opções preenchidas.");
  if (rotulosDuplicados(campos).size > 0)
    erros.push("Há campos com o mesmo rótulo: as respostas são guardadas pelo rótulo, então eles precisam ser diferentes.");
  return erros;
};

const rotulosDuplicados = (campos) => {
  const vistos = new Set();
  const duplicados = new Set();
  for (const campo of folhas(campos)) {
    const rotulo = campo.label.trim();
    if (!rotulo) continue;
    if (vistos.has(rotulo)) duplicados.add(rotulo);
    vistos.add(rotulo);
  }
  return duplicados;
};

const OpcoesSelect = ({ opcoes, onChange }) => (
  <div className={styles.opcoes}>
    <span className={styles.rotulo}>Opções</span>
    {opcoes.map((opcao, i) => (
      <div key={i} className={styles.opcao}>
        <InputText
          value={opcao.label}
          onChange={(e) =>
            onChange(
              opcoes.map((o, j) => (j === i ? { label: e.target.value, value: e.target.value } : o))
            )
          }
        />
        <Button
          icon={<RiCloseLine />}
          className="p-button-text p-button-sm p-button-danger"
          aria-label="Remover opção"
          onClick={() => onChange(opcoes.filter((_, j) => j !== i))}
          disabled={opcoes.length === 1}
        />
      </div>
    ))}
    <Button
      label="Adicionar opção"
      className="p-button-text p-button-sm"
      onClick={() => {
        const texto = `Opção ${opcoes.length + 1}`;
        onChange([...opcoes, { label: texto, value: texto }]);
      }}
    />
  </div>
);

const CampoEditor = ({ campo, onChange, onRemover, onMover, posicao, total, permitirGrupo, duplicados }) => {
  const atualizar = (dados) => onChange({ ...campo, ...dados });
  const isGrupo = campo.tipo === "group";

  const trocarTipo = (tipo) => {
    if (tipo === campo.tipo) return;
    onChange({ ...campoVazio(tipo), _id: campo._id, label: campo.label });
  };

  return (
    <div className={`${styles.campo} ${isGrupo ? styles.grupo : ""}`}>
      <div className={styles.cabecalho}>
        <Dropdown
          value={campo.tipo}
          options={permitirGrupo ? TIPOS_CAMPO : TIPOS_CAMPO.filter((t) => t.value !== "group")}
          onChange={(e) => trocarTipo(e.value)}
          className={styles.tipo}
        />
        <div className={styles.acoes}>
          <Button
            icon={<RiArrowUpLine />}
            className="p-button-text p-button-sm"
            aria-label="Mover para cima"
            onClick={() => onMover(-1)}
            disabled={posicao === 0}
          />
          <Button
            icon={<RiArrowDownLine />}
            className="p-button-text p-button-sm"
            aria-label="Mover para baixo"
            onClick={() => onMover(1)}
            disabled={posicao === total - 1}
          />
          <Button
            icon={<RiDeleteBinLine />}
            className="p-button-text p-button-sm p-button-danger"
            aria-label="Remover campo"
            onClick={onRemover}
          />
        </div>
      </div>

      <label className={styles.rotulo}>
        {isGrupo ? "Nome do grupo (uso interno, não aparece para o aluno)" : campo.tipo === "checkbox" ? "Texto da declaração" : "Rótulo"}
        <InputTextarea
          value={campo.label}
          rows={1}
          autoResize
          onChange={(e) => atualizar({ label: e.target.value })}
          className={duplicados.has(campo.label.trim()) ? "p-invalid" : ""}
        />
      </label>
      {duplicados.has(campo.label.trim()) && (
        <small className={styles.erro}>Já existe outro campo com este rótulo.</small>
      )}

      {!isGrupo && (
        <div className={styles.linha}>
          <Checkbox
            inputId={`obrigatorio-${campo._id}`}
            checked={!!campo.obrigatorio}
            onChange={(e) => atualizar({ obrigatorio: e.checked })}
          />
          <label htmlFor={`obrigatorio-${campo._id}`}>Obrigatório</label>
        </div>
      )}

      {campo.tipo === "text" && (
        <div className={styles.extras}>
          <label className={styles.rotulo}>
            Texto de exemplo (opcional)
            <InputText value={campo.placeholder ?? ""} onChange={(e) => atualizar({ placeholder: e.target.value })} />
          </label>
          <label className={styles.rotulo}>
            Explicação abaixo do campo (opcional)
            <InputText value={campo.descricao ?? ""} onChange={(e) => atualizar({ descricao: e.target.value })} />
          </label>
        </div>
      )}
      {campo.tipo === "arquivo" && (
        <label className={styles.rotulo}>
          Explicação abaixo do campo (opcional)
          <InputText value={campo.descricao ?? ""} onChange={(e) => atualizar({ descricao: e.target.value })} />
        </label>
      )}
      {campo.tipo === "checkbox" && (
        <label className={styles.rotulo}>
          Observação abaixo da caixa (opcional)
          <InputText value={campo.mensagem ?? ""} onChange={(e) => atualizar({ mensagem: e.target.value })} />
        </label>
      )}
      {campo.tipo === "select" && (
        <OpcoesSelect opcoes={campo.opcoes} onChange={(opcoes) => atualizar({ opcoes })} />
      )}

      {isGrupo && (
        <ListaCampos
          campos={campo.campos}
          onChange={(campos) => atualizar({ campos })}
          permitirGrupo={false}
          duplicados={duplicados}
          textoAdicionar="Adicionar campo ao grupo"
        />
      )}
    </div>
  );
};

const ListaCampos = ({ campos, onChange, permitirGrupo, duplicados, textoAdicionar }) => {
  const mover = (indice, direcao) => {
    const destino = indice + direcao;
    if (destino < 0 || destino >= campos.length) return;
    const nova = [...campos];
    [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
    onChange(nova);
  };

  return (
    <div className={styles.lista}>
      {campos.map((campo, i) => (
        <CampoEditor
          key={campo._id}
          campo={campo}
          posicao={i}
          total={campos.length}
          permitirGrupo={permitirGrupo}
          duplicados={duplicados}
          onChange={(atualizado) => onChange(campos.map((c, j) => (j === i ? atualizado : c)))}
          onRemover={() => onChange(campos.filter((_, j) => j !== i))}
          onMover={(direcao) => mover(i, direcao)}
        />
      ))}
      <Button
        icon={<RiAddLine />}
        label={textoAdicionar}
        className="p-button-outlined p-button-sm"
        onClick={() => onChange([...campos, campoVazio("checkbox")])}
      />
    </div>
  );
};

const FormularioBuilder = ({ campos, onChange }) => (
  <ListaCampos
    campos={campos}
    onChange={onChange}
    permitirGrupo
    duplicados={rotulosDuplicados(campos)}
    textoAdicionar="Adicionar campo"
  />
);

export default FormularioBuilder;
