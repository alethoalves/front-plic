"use client";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";

import {
  getModeloDocumento,
  atualizarModeloDocumento,
  criarModeloDocumento,
} from "@/app/api/client/documentos";

import TermoEditorVisual from "./TermoEditorVisual";
import FormularioBuilder, { comIds, semIds, validarCampos, campoVazio } from "./FormularioBuilder";
import { TERMO_ESQUELETO } from "./termoEsqueleto";
import {
  ACOES_APOS_ASSINATURAS,
  STATUS_REGISTRO,
  TIPOS_DOCUMENTO,
  VARIAVEIS_PARTICIPACAO,
  VARIAVEIS_PROJETO,
} from "./constantes";

import styles from "./ModeloDocumentoDialog.module.scss";

const ACAO_JUSTIFICATIVA = "JUSTIFICAR_AUSENCIA_SUBMISSAO";

const REGRAS_BOOLEANAS = [
  { chave: "exigirAssinaturaOrientador", label: "O orientador também assina" },
  { chave: "exigirAutenticacao", label: "O gestor valida o documento depois das assinaturas" },
  { chave: "exigirDadosBancarios", label: "O aluno informa os dados bancários ao assinar" },
  {
    chave: "tornarVinculoPendenteAoCriarDoc",
    label: "Ao gerar o documento, deixar o vínculo de bolsa do aluno pendente",
  },
];
const CHAVES_REGRAS = [...REGRAS_BOOLEANAS.map((r) => r.chave), "acaoAposAssinaturas"];

const NOVOS_TIPOS = [
  {
    tipo: "TERMO",
    titulo: "Termo",
    descricao: "Um texto para o aluno (e o orientador) ler e assinar. Ex.: termo de compromisso.",
  },
  {
    tipo: "FORMULARIO",
    titulo: "Formulário",
    descricao: "Campos para o aluno preencher: declarações, envio de PDF etc. Ex.: recibo mensal, termo de aceite.",
  },
];

const ABAS_TERMO = [
  { id: "visual", label: "Editor visual" },
  { id: "html", label: "HTML" },
];

const regrasPadrao = (tipo) => ({
  exigirAssinaturaOrientador: tipo === "TERMO",
  exigirAutenticacao: false,
  exigirDadosBancarios: false,
  tornarVinculoPendenteAoCriarDoc: false,
  acaoAposAssinaturas: tipo === "TERMO" ? "ATIVAR_PARTICIPACAO" : "ATIVAR_VINCULO_BOLSA",
});

const formDoModelo = (modelo) => ({
  tipoDocumento: modelo.tipoDocumento,
  titulo: modelo.titulo ?? "",
  descricao: modelo.descricao ?? "",
  linkDocModelo: modelo.linkDocModelo ?? "",
  textoPadrao: modelo.textoPadrao ?? "",
  campos: comIds(Array.isArray(modelo.formularioPadrao) ? modelo.formularioPadrao : []),
  regras: Object.fromEntries(CHAVES_REGRAS.map((chave) => [chave, modelo[chave]])),
});

const formNovo = (tipo) => ({
  tipoDocumento: tipo,
  titulo: "",
  descricao: "",
  linkDocModelo: "",
  textoPadrao: tipo === "TERMO" ? TERMO_ESQUELETO : "",
  campos: tipo === "FORMULARIO" ? [campoVazio("arquivo")] : [],
  regras: regrasPadrao(tipo),
});

const destacarVariaveis = (html) =>
  html.replace(
    /\[[^\]]+\]/g,
    // dentro do iframe não há SCSS: hex de $warning-light
    (match) => `<mark style="background:#ffd76b;padding:0 2px;border-radius:3px">${match}</mark>`
  );

const CampoSomenteLeitura = ({ campo }) => (
  <li>
    <span className={styles.campoLabel}>{campo.label || "(sem rótulo)"}</span>{" "}
    <span className={styles.meta}>
      {campo.tipo}
      {campo.obrigatorio ? " · obrigatório" : ""}
    </span>
    {Array.isArray(campo.campos) && campo.campos.length > 0 && (
      <ul>
        {campo.campos.map((sub, i) => (
          <CampoSomenteLeitura key={i} campo={sub} />
        ))}
      </ul>
    )}
  </li>
);

const ModeloDocumentoDialog = ({ tenant, modeloId, onClose, onSalvo, toast }) => {
  const isNovo = modeloId === "novo";
  const textareaRef = useRef(null);
  const [modelo, setModelo] = useState(null);
  const [form, setForm] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [abaTermo, setAbaTermo] = useState("visual");
  // remonta o editor visual com o texto atual ao voltar da aba HTML
  const [versaoEditor, setVersaoEditor] = useState(0);

  useEffect(() => {
    setAbaTermo("visual");
    setModelo(null);
    setForm(null);
    if (!modeloId || modeloId === "novo") return;

    const carregar = async () => {
      setCarregando(true);
      try {
        const dados = await getModeloDocumento(tenant, modeloId);
        setModelo(dados);
        setForm(formDoModelo(dados));
      } catch {
        toast.current?.show({ severity: "error", summary: "Erro", detail: "Falha ao carregar o modelo." });
        onClose();
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [tenant, modeloId, onClose, toast]);

  const tipo = form?.tipoDocumento;
  const isTermo = tipo === "TERMO";
  const isFormulario = tipo === "FORMULARIO";
  const variaveis = modelo?.docInscricaoProjeto ? VARIAVEIS_PROJETO : VARIAVEIS_PARTICIPACAO;
  const podeEditarEstrutura =
    isNovo || (!!modelo && modelo.totalRegistros === 0 && modelo.acaoAposAssinaturas !== ACAO_JUSTIFICATIVA);
  // Ao trocar/fechar o modelo, o form antigo ainda existe até o efeito
  // acima limpar: só renderiza o conteúdo quando form e modelo batem.
  const pronto = !!form && (isNovo || !!modelo);

  const atualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const atualizarRegra = (chave, valor) =>
    setForm((f) => ({ ...f, regras: { ...f.regras, [chave]: valor } }));

  // ─── O que mudou em relação ao salvo ──────────────────────────────────────
  const mudancas = useMemo(() => {
    if (!form || isNovo || !modelo) return null;
    const camposSalvos = JSON.stringify(modelo.formularioPadrao ?? []);
    return {
      titulo: form.titulo !== (modelo.titulo ?? ""),
      descricao: form.descricao !== (modelo.descricao ?? ""),
      linkDocModelo: form.linkDocModelo !== (modelo.linkDocModelo ?? ""),
      textoPadrao: isTermo && form.textoPadrao !== (modelo.textoPadrao ?? ""),
      formularioPadrao: isFormulario && JSON.stringify(semIds(form.campos)) !== camposSalvos,
      regras: CHAVES_REGRAS.filter((chave) => form.regras[chave] !== modelo[chave]),
    };
  }, [form, modelo, isNovo, isTermo, isFormulario]);

  const alterado = isNovo
    ? !!form
    : !!mudancas &&
      (mudancas.titulo ||
        mudancas.descricao ||
        mudancas.linkDocModelo ||
        mudancas.textoPadrao ||
        mudancas.formularioPadrao ||
        mudancas.regras.length > 0);

  // ─── Validação ────────────────────────────────────────────────────────────
  // Trechos entre colchetes que a API não reconhece (inclusive dentro de
  // <style>) — viram "[DADO NÃO ENCONTRADO]" para quem assina.
  const colchetesDesconhecidos = useMemo(() => {
    if (!isTermo || !form?.textoPadrao) return [];
    const conhecidas = new Set(variaveis.map((v) => `[${v.nome}]`));
    const encontrados = form.textoPadrao.match(/\[[^\]]+\]/g) || [];
    return [...new Set(encontrados.filter((t) => !conhecidas.has(t)))];
  }, [isTermo, form?.textoPadrao, variaveis]);

  const erros = useMemo(() => {
    if (!form) return [];
    const lista = [];
    if (!form.titulo.trim()) lista.push("Dê um título ao modelo.");
    if (isTermo && !form.textoPadrao.trim()) lista.push("O texto do termo não pode ficar vazio.");
    if (isFormulario && podeEditarEstrutura) lista.push(...validarCampos(form.campos));
    return lista;
  }, [form, isTermo, isFormulario, podeEditarEstrutura]);

  // ─── Ações ────────────────────────────────────────────────────────────────
  const fechar = () => {
    if (alterado && !window.confirm("Descartar as alterações não salvas?")) return;
    onClose();
  };

  const trocarAbaTermo = (aba) => {
    if (aba === "visual" && abaTermo !== "visual") setVersaoEditor((v) => v + 1);
    setAbaTermo(aba);
  };

  const inserirVariavelNoHtml = (nome) => {
    const el = textareaRef.current;
    const texto = form.textoPadrao;
    const variavel = `[${nome}]`;
    const inicio = el?.selectionStart ?? texto.length;
    const fim = el?.selectionEnd ?? texto.length;
    atualizar("textoPadrao", texto.slice(0, inicio) + variavel + texto.slice(fim));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = inicio + variavel.length;
    });
  };

  const montarPayload = () => {
    const base = {
      titulo: form.titulo,
      descricao: form.descricao,
      linkDocModelo: form.linkDocModelo,
    };
    if (isNovo) {
      return {
        ...base,
        ...form.regras,
        tipoDocumento: tipo,
        ...(isTermo ? { textoPadrao: form.textoPadrao } : { formularioPadrao: semIds(form.campos) }),
      };
    }
    // na edição, campos e regras só vão se mudaram (a API recusa mudança de
    // estrutura em modelo que já gerou documentos)
    return {
      ...base,
      ...(mudancas.textoPadrao ? { textoPadrao: form.textoPadrao } : {}),
      ...(mudancas.formularioPadrao ? { formularioPadrao: semIds(form.campos) } : {}),
      ...Object.fromEntries(mudancas.regras.map((chave) => [chave, form.regras[chave]])),
    };
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      if (isNovo) {
        await criarModeloDocumento(tenant, montarPayload());
      } else {
        await atualizarModeloDocumento(tenant, modelo.id, montarPayload());
      }
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: isNovo
          ? "Modelo criado. Ele já aparece nas telas de gerar documentos e de cotas."
          : "Modelo atualizado.",
      });
      onSalvo?.();
      onClose();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: err.response?.data?.message ?? "Falha ao salvar o modelo.",
        life: 8000,
      });
    } finally {
      setSalvando(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const statusRegistros = Object.entries(modelo?.registrosPorStatus || {});

  const avisoImpacto =
    !isNovo && mudancas?.textoPadrao
      ? modelo.registrosSemTextoGravado > 0
        ? `${modelo.registrosSemTextoGravado} documento(s) ainda sem assinatura passarão a exibir o novo texto. Os já assinados não mudam.`
        : "Nenhum documento existente será afetado: os já assinados guardam o texto que foi assinado."
      : "";

  const rodape = pronto && (
    <div className={styles.rodape}>
      <div className={styles.mensagensRodape}>
        {erros.length > 0 && alterado ? (
          <span className={styles.erro}>{erros[0]}</span>
        ) : (
          <span className={styles.aviso}>{avisoImpacto}</span>
        )}
      </div>
      <div>
        <Button label="Cancelar" className="p-button-text" onClick={fechar} />
        <Button
          label={salvando ? "Salvando..." : isNovo ? "Criar modelo" : "Salvar"}
          className="p-button-success"
          onClick={salvar}
          disabled={!alterado || salvando || erros.length > 0}
        />
      </div>
    </div>
  );

  const titulo = isNovo
    ? form
      ? `Novo modelo: ${TIPOS_DOCUMENTO[tipo]}`
      : "Novo modelo de documento"
    : modelo?.titulo ?? "Carregando...";

  const renderEscolhaTipo = () => (
    <div className={styles.escolhaTipo}>
      <p>Que tipo de documento você quer criar?</p>
      <div className={styles.opcoesTipo}>
        {NOVOS_TIPOS.map((opcao) => (
          <button
            key={opcao.tipo}
            type="button"
            className={styles.opcaoTipo}
            onClick={() => setForm(formNovo(opcao.tipo))}
          >
            <strong>{opcao.titulo}</strong>
            <span>{opcao.descricao}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderRegras = () => (
    <details className={styles.regras} open={isNovo}>
      <summary>Regras do fluxo</summary>
      {!podeEditarEstrutura && (
        <p className={styles.meta}>
          {modelo?.acaoAposAssinaturas === ACAO_JUSTIFICATIVA
            ? "As regras deste modelo são definidas pelo sistema."
            : `Este modelo já gerou ${modelo?.totalRegistros} documento(s), então campos e regras ficam travados. Para mudar, crie uma nova versão.`}
        </p>
      )}
      <div className={styles.listaRegras}>
        {REGRAS_BOOLEANAS.map((regra) => (
          <div key={regra.chave} className={styles.linha}>
            <Checkbox
              inputId={`regra-${regra.chave}`}
              checked={!!form.regras[regra.chave]}
              onChange={(e) => atualizarRegra(regra.chave, e.checked)}
              disabled={!podeEditarEstrutura}
            />
            <label htmlFor={`regra-${regra.chave}`}>{regra.label}</label>
          </div>
        ))}
        <label className={styles.label}>
          Quando o documento for aceito
          {form.regras.acaoAposAssinaturas === ACAO_JUSTIFICATIVA ? (
            <span className={styles.meta}>{ACOES_APOS_ASSINATURAS[ACAO_JUSTIFICATIVA]}</span>
          ) : (
            <Dropdown
              value={form.regras.acaoAposAssinaturas}
              options={["ATIVAR_PARTICIPACAO", "ATIVAR_VINCULO_BOLSA"].map((acao) => ({
                label: ACOES_APOS_ASSINATURAS[acao],
                value: acao,
              }))}
              onChange={(e) => atualizarRegra("acaoAposAssinaturas", e.value)}
              disabled={!podeEditarEstrutura}
              className={styles.dropdownAcao}
            />
          )}
        </label>
      </div>
    </details>
  );

  const renderTermo = () => (
    <div className={styles.secao}>
      <div className={styles.abas}>
        {ABAS_TERMO.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={`${styles.aba} ${abaTermo === aba.id ? styles.abaAtiva : ""}`}
            onClick={() => trocarAbaTermo(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {colchetesDesconhecidos.length > 0 && (
        <div className={styles.alerta}>
          Estes trechos entre colchetes não são campos dinâmicos e vão aparecer como
          &quot;[DADO NÃO ENCONTRADO]&quot; para quem assina:{" "}
          <strong>{colchetesDesconhecidos.join(", ")}</strong>
        </div>
      )}

      {abaTermo === "visual" && (
        <TermoEditorVisual
          key={`${modeloId}-${versaoEditor}`}
          html={form.textoPadrao}
          variaveis={variaveis}
          onChange={(html) => atualizar("textoPadrao", html)}
        />
      )}

      {abaTermo === "html" && (
        <>
          <div className={styles.variaveis}>
            <span className={styles.meta}>Inserir campo:</span>
            {variaveis.map((v) => (
              <Button
                key={v.nome}
                label={`[${v.nome}]`}
                className="p-button-outlined p-button-sm"
                tooltip={v.descricao}
                tooltipOptions={{ position: "top" }}
                onClick={() => inserirVariavelNoHtml(v.nome)}
              />
            ))}
          </div>
          <div className={styles.editorHtml}>
            <div className={styles.painel}>
              <span className={styles.label}>Código HTML</span>
              <textarea
                ref={textareaRef}
                className={styles.codigo}
                value={form.textoPadrao}
                spellCheck={false}
                onChange={(e) => atualizar("textoPadrao", e.target.value)}
              />
            </div>
            <div className={styles.painel}>
              <span className={styles.label}>Pré-visualização</span>
              <iframe
                title="Pré-visualização do termo"
                className={styles.preview}
                sandbox=""
                srcDoc={destacarVariaveis(form.textoPadrao)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderFormulario = () => (
    <div className={styles.secao}>
      <span className={styles.label}>Campos do formulário</span>
      {podeEditarEstrutura ? (
        <>
          <p className={styles.meta}>
            As respostas são guardadas pelo rótulo de cada campo, então os rótulos precisam ser diferentes.
          </p>
          <FormularioBuilder campos={form.campos} onChange={(campos) => atualizar("campos", campos)} />
        </>
      ) : (
        <>
          <ul className={styles.camposLeitura}>
            {(modelo.formularioPadrao || []).map((campo, i) => (
              <CampoSomenteLeitura key={i} campo={campo} />
            ))}
          </ul>
          <p className={styles.meta}>
            Os campos não podem ser alterados porque as respostas já enviadas dependem deles. Para
            mudar, crie uma nova versão.
          </p>
        </>
      )}
    </div>
  );

  return (
    <Dialog
      visible={!!modeloId}
      onHide={fechar}
      header={titulo}
      footer={rodape}
      style={{ width: isTermo ? "95vw" : "860px", maxWidth: "95vw" }}
      maximizable={isTermo}
      draggable={false}
    >
      {isNovo && !form ? (
        renderEscolhaTipo()
      ) : carregando || !pronto ? (
        <p>Carregando...</p>
      ) : (
        <div className={styles.conteudo}>
          {modelo && (
            <div className={styles.tags}>
              <Tag value={TIPOS_DOCUMENTO[modelo.tipoDocumento] ?? modelo.tipoDocumento} />
              {modelo.arquivado && <Tag severity="warning" value="Arquivado" />}
              {statusRegistros.length === 0 ? (
                <span className={styles.meta}>Nenhum documento gerado ainda</span>
              ) : (
                statusRegistros.map(([status, total]) => (
                  <span key={status} className={styles.meta}>
                    {STATUS_REGISTRO[status] ?? status}: <strong>{total}</strong>
                  </span>
                ))
              )}
            </div>
          )}

          {modelo?.usos?.length > 0 && (
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
              <InputText value={form.titulo} onChange={(e) => atualizar("titulo", e.target.value)} />
            </label>
            <label className={styles.label}>
              Link do modelo (opcional)
              <InputText
                value={form.linkDocModelo}
                placeholder="https://..."
                onChange={(e) => atualizar("linkDocModelo", e.target.value)}
              />
            </label>
          </div>
          <label className={styles.label}>
            Descrição
            <InputTextarea
              value={form.descricao}
              rows={2}
              autoResize
              onChange={(e) => atualizar("descricao", e.target.value)}
            />
          </label>

          {(isTermo || isFormulario) && renderRegras()}
          {isTermo && renderTermo()}
          {isFormulario && renderFormulario()}

          {tipo === "DECLARACAO" && !form.textoPadrao && (
            <p className={styles.meta}>
              O texto desta declaração é montado pelo sistema no momento em que ela é criada.
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default ModeloDocumentoDialog;
