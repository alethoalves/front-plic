"use client";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";

import {
  getModeloDocumento,
  atualizarModeloDocumento,
} from "@/app/api/client/documentos";

import styles from "./ModeloDocumentoDialog.module.scss";

export const TIPOS_DOCUMENTO = {
  TERMO: "Termo",
  FORMULARIO: "Formulário",
  DECLARACAO: "Declaração",
  EXTERNO: "Arquivo externo",
};

const ACOES_APOS_ASSINATURAS = {
  ATIVAR_PARTICIPACAO: "Ativa a participação do aluno",
  ATIVAR_VINCULO_BOLSA: "Ativa o vínculo de bolsa",
  JUSTIFICAR_AUSENCIA_SUBMISSAO: "Registra a justificativa de ausência",
};

const STATUS_REGISTRO = {
  PENDENTE: "Pendentes",
  ENVIADO: "Enviados",
  AGUARDANDO_VALIDACAO: "Aguardando validação",
  ACEITO: "Aceitos",
  RECUSADO: "Recusados",
  CANCELADO: "Cancelados",
};

// Variáveis substituídas pela API ao exibir o termo (documentosController,
// substituirVariaveis). Qualquer outro texto entre colchetes vira
// "[DADO NÃO ENCONTRADO]" para quem assina.
const VARIAVEIS_PARTICIPACAO = [
  { nome: "[NOME_ALUNO]", descricao: "Nome do aluno" },
  { nome: "[NOME_PLANO]", descricao: "Título do plano de trabalho" },
  { nome: "[INICIO_VIGENCIA_EDITAL]", descricao: "Início da vigência do edital" },
  { nome: "[FIM_VIGENCIA_EDITAL]", descricao: "Fim da vigência do edital" },
];
const VARIAVEIS_PROJETO = [
  { nome: "[NOME_PROJETO]", descricao: "Título do projeto" },
  { nome: "[INICIO_VIGENCIA_EDITAL]", descricao: "Início da vigência do edital" },
  { nome: "[FIM_VIGENCIA_EDITAL]", descricao: "Fim da vigência do edital" },
];

const destacarVariaveis = (html) =>
  html.replace(
    /\[[^\]]+\]/g,
    (match) =>
      // dentro do iframe não há SCSS: hex de $warning-light
      `<mark style="background:#ffd76b;padding:0 2px;border-radius:3px">${match}</mark>`
  );

const CampoFormulario = ({ campo }) => (
  <li>
    <span className={styles.campoLabel}>{campo.label || "(sem rótulo)"}</span>{" "}
    <span className={styles.campoMeta}>
      {campo.tipo}
      {campo.obrigatorio ? " · obrigatório" : ""}
    </span>
    {Array.isArray(campo.campos) && campo.campos.length > 0 && (
      <ul>
        {campo.campos.map((sub, i) => (
          <CampoFormulario key={i} campo={sub} />
        ))}
      </ul>
    )}
  </li>
);

const ModeloDocumentoDialog = ({ tenant, modeloId, onClose, onSalvo, toast }) => {
  const textareaRef = useRef(null);
  const [modelo, setModelo] = useState(null);
  const [form, setForm] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!modeloId) {
      setModelo(null);
      setForm(null);
      return;
    }
    const carregar = async () => {
      setCarregando(true);
      try {
        const dados = await getModeloDocumento(tenant, modeloId);
        setModelo(dados);
        setForm({
          titulo: dados.titulo ?? "",
          descricao: dados.descricao ?? "",
          linkDocModelo: dados.linkDocModelo ?? "",
          textoPadrao: dados.textoPadrao ?? "",
        });
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao carregar o modelo.",
        });
        onClose();
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [tenant, modeloId, onClose, toast]);

  const isTermo = modelo?.tipoDocumento === "TERMO";
  const variaveis = modelo?.docInscricaoProjeto ? VARIAVEIS_PROJETO : VARIAVEIS_PARTICIPACAO;

  const alterado = useMemo(() => {
    if (!modelo || !form) return false;
    return (
      form.titulo !== (modelo.titulo ?? "") ||
      form.descricao !== (modelo.descricao ?? "") ||
      form.linkDocModelo !== (modelo.linkDocModelo ?? "") ||
      (isTermo && form.textoPadrao !== (modelo.textoPadrao ?? ""))
    );
  }, [modelo, form, isTermo]);

  // Trechos entre colchetes que a API não reconhece (inclusive dentro de
  // <style>, ex.: seletores de atributo) — viram "[DADO NÃO ENCONTRADO]".
  const colchetesDesconhecidos = useMemo(() => {
    if (!isTermo || !form?.textoPadrao) return [];
    const conhecidas = new Set(variaveis.map((v) => v.nome));
    const encontrados = form.textoPadrao.match(/\[[^\]]+\]/g) || [];
    return [...new Set(encontrados.filter((t) => !conhecidas.has(t)))];
  }, [isTermo, form?.textoPadrao, variaveis]);

  const preview = useMemo(
    () => (isTermo && form ? destacarVariaveis(form.textoPadrao) : ""),
    [isTermo, form]
  );

  const atualizarCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const inserirVariavel = (variavel) => {
    const el = textareaRef.current;
    const texto = form.textoPadrao;
    const inicio = el?.selectionStart ?? texto.length;
    const fim = el?.selectionEnd ?? texto.length;
    atualizarCampo("textoPadrao", texto.slice(0, inicio) + variavel + texto.slice(fim));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = inicio + variavel.length;
    });
  };

  const fechar = () => {
    if (alterado && !window.confirm("Descartar as alterações não salvas?")) return;
    onClose();
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const dados = {
        titulo: form.titulo,
        descricao: form.descricao,
        linkDocModelo: form.linkDocModelo,
      };
      if (isTermo) dados.textoPadrao = form.textoPadrao;
      await atualizarModeloDocumento(tenant, modelo.id, dados);
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Modelo atualizado.",
      });
      onSalvo?.();
      onClose();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: err.response?.data?.message ?? "Falha ao salvar o modelo.",
      });
    } finally {
      setSalvando(false);
    }
  };

  const statusRegistros = Object.entries(modelo?.registrosPorStatus || {});

  const rodape = modelo && (
    <div className={styles.rodape}>
      <span className={styles.aviso}>
        {isTermo && form?.textoPadrao !== (modelo.textoPadrao ?? "")
          ? modelo.registrosSemTextoGravado > 0
            ? `${modelo.registrosSemTextoGravado} documento(s) ainda sem assinatura passarão a exibir o novo texto. Os já assinados não mudam.`
            : "Nenhum documento existente será afetado: os já assinados guardam o texto que foi assinado."
          : ""}
      </span>
      <div>
        <Button label="Cancelar" className="p-button-text" onClick={fechar} />
        <Button
          label={salvando ? "Salvando..." : "Salvar"}
          className="p-button-success"
          onClick={salvar}
          disabled={!alterado || salvando || !form?.titulo.trim()}
        />
      </div>
    </div>
  );

  return (
    <Dialog
      visible={!!modeloId}
      onHide={fechar}
      header={modelo ? modelo.titulo : "Carregando..."}
      footer={rodape}
      style={{ width: isTermo ? "95vw" : "720px", maxWidth: "95vw" }}
      maximizable={isTermo}
      draggable={false}
    >
      {carregando || !modelo || !form ? (
        <p>Carregando...</p>
      ) : (
        <div className={styles.conteudo}>
          <div className={styles.tags}>
            <Tag value={TIPOS_DOCUMENTO[modelo.tipoDocumento] ?? modelo.tipoDocumento} />
            {modelo.arquivado && <Tag severity="warning" value="Arquivado" />}
            {statusRegistros.length === 0 ? (
              <span className={styles.campoMeta}>Nenhum documento gerado ainda</span>
            ) : (
              statusRegistros.map(([status, total]) => (
                <span key={status} className={styles.campoMeta}>
                  {STATUS_REGISTRO[status] ?? status}: <strong>{total}</strong>
                </span>
              ))
            )}
          </div>

          {modelo.usos.length > 0 && (
            <div className={styles.usos}>
              <strong>Gera documentos automaticamente:</strong>
              <ul>
                {modelo.usos.map((uso, i) => (
                  <li key={i}>{uso.descricao}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.grade}>
            <label className={styles.label}>
              Título
              <InputText
                value={form.titulo}
                onChange={(e) => atualizarCampo("titulo", e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Link do modelo (opcional)
              <InputText
                value={form.linkDocModelo}
                placeholder="https://..."
                onChange={(e) => atualizarCampo("linkDocModelo", e.target.value)}
              />
            </label>
          </div>
          <label className={styles.label}>
            Descrição
            <InputTextarea
              value={form.descricao}
              rows={2}
              autoResize
              onChange={(e) => atualizarCampo("descricao", e.target.value)}
            />
          </label>

          <details className={styles.regras}>
            <summary>Regras do fluxo (não editáveis)</summary>
            <ul>
              <li>
                Documento de{" "}
                {modelo.docInscricaoProjeto ? "inscrição de projeto" : "participação (aluno)"}
              </li>
              <li>Assinatura do orientador: {modelo.exigirAssinaturaOrientador ? "sim" : "não"}</li>
              <li>Validação do gestor: {modelo.exigirAutenticacao ? "sim" : "não"}</li>
              <li>Exige dados bancários: {modelo.exigirDadosBancarios ? "sim" : "não"}</li>
              <li>
                Após as assinaturas:{" "}
                {ACOES_APOS_ASSINATURAS[modelo.acaoAposAssinaturas] ?? modelo.acaoAposAssinaturas}
              </li>
            </ul>
          </details>

          {isTermo && (
            <>
              <div className={styles.variaveis}>
                <span className={styles.campoMeta}>Inserir variável:</span>
                {variaveis.map((v) => (
                  <Button
                    key={v.nome}
                    label={v.nome}
                    className="p-button-outlined p-button-sm"
                    tooltip={v.descricao}
                    tooltipOptions={{ position: "top" }}
                    onClick={() => inserirVariavel(v.nome)}
                  />
                ))}
              </div>
              {colchetesDesconhecidos.length > 0 && (
                <div className={styles.alerta}>
                  Estes trechos entre colchetes não são variáveis e vão aparecer como
                  &quot;[DADO NÃO ENCONTRADO]&quot; para quem assina:{" "}
                  <strong>{colchetesDesconhecidos.join(", ")}</strong>
                </div>
              )}
              <div className={styles.editorTermo}>
                <div className={styles.painel}>
                  <span className={styles.label}>Texto do termo (HTML)</span>
                  <textarea
                    ref={textareaRef}
                    className={styles.codigo}
                    value={form.textoPadrao}
                    spellCheck={false}
                    onChange={(e) => atualizarCampo("textoPadrao", e.target.value)}
                  />
                </div>
                <div className={styles.painel}>
                  <span className={styles.label}>Pré-visualização</span>
                  <iframe
                    title="Pré-visualização do termo"
                    className={styles.preview}
                    sandbox=""
                    srcDoc={preview}
                  />
                </div>
              </div>
            </>
          )}

          {modelo.tipoDocumento === "FORMULARIO" && (
            <div>
              <span className={styles.label}>Campos do formulário</span>
              {Array.isArray(modelo.formularioPadrao) && modelo.formularioPadrao.length > 0 ? (
                <ul className={styles.campos}>
                  {modelo.formularioPadrao.map((campo, i) => (
                    <CampoFormulario key={i} campo={campo} />
                  ))}
                </ul>
              ) : (
                <p className={styles.campoMeta}>Sem campos.</p>
              )}
              <p className={styles.campoMeta}>
                Os campos não podem ser alterados porque as respostas já enviadas dependem deles.
              </p>
            </div>
          )}

          {modelo.tipoDocumento === "DECLARACAO" && !modelo.textoPadrao && (
            <p className={styles.campoMeta}>
              O texto desta declaração é montado pelo sistema no momento em que ela é criada.
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default ModeloDocumentoDialog;
