"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campoSchema } from "@/lib/zodSchemas/campoSchema";
import styles from "@/components/Formularios/Form.module.scss";
import selectStyles from "@/components/Select.module.scss";
import { Dropdown } from "primereact/dropdown";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiSave2Line,
  RiText,
  RiFileTextLine,
  RiHashtag,
  RiCalendarLine,
  RiListCheck,
  RiCheckboxMultipleLine,
  RiCheckboxLine,
  RiAttachment2,
  RiToggleLine,
  RiLinkM,
  RiFlowChart,
  RiArrowDownSLine,
  RiEditBoxLine,
} from "@remixicon/react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { createCampo, updateCampo, createRegra, deleteRegra } from "@/app/api/client/campo";

const TIPOS = [
  { value: "text",        label: "Texto curto",        icon: RiText },
  { value: "textLong",    label: "Texto longo",         icon: RiFileTextLine },
  { value: "blockNote",   label: "Texto rico",          icon: RiEditBoxLine },
  { value: "number",      label: "Número",              icon: RiHashtag },
  { value: "date",        label: "Data",                icon: RiCalendarLine },
  { value: "select",      label: "Seleção única",       icon: RiListCheck },
  { value: "multiselect", label: "Múltipla escolha",    icon: RiCheckboxMultipleLine },
  { value: "checkbox",    label: "Caixas de seleção",   icon: RiCheckboxLine },
  { value: "arquivo",     label: "Arquivo",             icon: RiAttachment2 },
  { value: "flag",        label: "Sim / Não",           icon: RiToggleLine },
  { value: "link",        label: "Link",                icon: RiLinkM },
];

const TIPO_FILE_OPTIONS = [
  { label: "Selecione um tipo", value: "" },
  { label: "PDF",    value: "pdf" },
  { label: "XML",    value: "xml" },
  { label: "Vídeo", value: "video" },
  { label: "Imagem", value: "imagem" },
];

// Campos disponíveis do UserTenant para vínculo
const USER_TENANT_FIELDS = [
  { value: "",               label: "Sem vínculo",                   modelRef: null },
  { value: "matricula",      label: "Matrícula (aluno)",             modelRef: null },
  { value: "cursoId",        label: "Curso (aluno)",                 modelRef: { modelName: "tenantCurso",        campoRetorno: "curso"         } },
  { value: "campusId",       label: "Campus (aluno)",                modelRef: { modelName: "tenantCampus",       campoRetorno: "campus"        } },
  { value: "formaIngressoId",label: "Forma de ingresso (aluno)",     modelRef: { modelName: "tenantFormaIngresso",campoRetorno: "formaIngresso" } },
  { value: "turno",          label: "Turno (aluno)",                 modelRef: null },
  { value: "semestre",       label: "Semestre (aluno)",              modelRef: null },
  { value: "rendimentoAcademico", label: "Rendimento acadêmico/IRA (aluno)", modelRef: null },
  { value: "lotacaoId",      label: "Lotação (orientador)",          modelRef: { modelName: "tenantLotacao",      campoRetorno: "lotacao"       } },
  { value: "cargoId",        label: "Cargo (orientador)",            modelRef: { modelName: "tenantCargo",        campoRetorno: "cargo"         } },
  { value: "banco",          label: "Banco",                         modelRef: null },
  { value: "agencia",        label: "Agência",                       modelRef: null },
  { value: "conta",          label: "Conta bancária",                modelRef: null },
];

const CONDICAO_OPTIONS = [
  { label: "for igual a",              value: "IGUAL" },
  { label: "incluir pelo menos um de", value: "INCLUI" },
  { label: "incluir todos os valores", value: "TODOS" },
];

const ACAO_OPTIONS = [
  { label: "Mostrar",      value: "MOSTRAR" },
  { label: "Ocultar",     value: "OCULTAR" },
  { label: "Habilitar",   value: "HABILITAR" },
  { label: "Desabilitar", value: "DESABILITAR" },
];

const FormCampo = ({ tenantSlug, formularioId, initialData, campos = [], onClose, onSuccess }) => {
  const [activeTab, setActiveTab]       = useState("config");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [savedCampoId, setSavedCampoId] = useState(initialData?.id ?? null);

  // Opções do campo (select/multiselect)
  const [options, setOptions]       = useState([]);
  const [newOption, setNewOption]   = useState("");

  // Regras
  const [regras, setRegras]             = useState(initialData?.regras ?? []);
  const [loadingRegra, setLoadingRegra] = useState(false);
  const [regraError, setRegraError]     = useState("");
  const [novaRegra, setNovaRegra]       = useState({
    condicao: "IGUAL",
    valores: [],
    acao: "MOSTRAR",
    camposAlvo: [],
  });

  const { control, handleSubmit, setValue, reset, watch } = useForm({
    resolver: zodResolver(campoSchema),
    defaultValues: {
      label:           "",
      descricao:       "",
      tipo:            "",
      maxChar:         "200",
      obrigatorio:     "true",
      ocultarDoAvaliador: "false",
      ordem:           "1",
      tipoFile:        "",
      userTenantField: "",
    },
  });

  const tipoValue            = watch("tipo");
  const userTenantFieldValue = watch("userTenantField");
  const hasOpcoes            = ["select", "multiselect", "checkbox"].includes(tipoValue);

  // Configuração do campo UserTenant selecionado
  const utFieldConfig = USER_TENANT_FIELDS.find((f) => f.value === userTenantFieldValue);
  const isUtFkField   = !!utFieldConfig?.modelRef;

  useEffect(() => {
    if (initialData) {
      setValue("label",           initialData.label);
      setValue("descricao",       initialData.descricao ?? "");
      setValue("tipo",            initialData.tipo ?? "");
      setValue("tipoFile",        initialData.tipoFile ?? "");
      setValue("maxChar",         initialData.maxChar?.toString() ?? "200");
      setValue("obrigatorio",     initialData.obrigatorio ? "true" : "false");
      setValue("ocultarDoAvaliador", initialData.ocultarDoAvaliador ? "true" : "false");
      setValue("ordem",           initialData.ordem?.toString() ?? "1");
      setValue("userTenantField", initialData.userTenantField ?? "");
      setOptions(initialData.opcoes?.map((o) => o.label) ?? []);
      setRegras(initialData.regras ?? []);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  // Quando um campo FK do UserTenant é selecionado, força o tipo para "select"
  useEffect(() => {
    if (isUtFkField) {
      setValue("tipo", "select");
    }
  }, [userTenantFieldValue, isUtFkField, setValue]);

  // ─── Config ──────────────────────────────────────────────────────────────

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      // Resolve modelRef a partir do campo UserTenant selecionado
      const utConfig  = USER_TENANT_FIELDS.find((f) => f.value === data.userTenantField);
      const modelRef  = utConfig?.modelRef ?? null;

      const finalData = {
        ...data,
        opcoes:          isUtFkField ? [] : (hasOpcoes ? options : []),
        modelRef,
        userTenantField: data.userTenantField || null,
      };

      let campo;
      if (initialData) {
        campo = await updateCampo(tenantSlug, formularioId, initialData.id, finalData);
      } else {
        campo = await createCampo(tenantSlug, formularioId, finalData);
      }
      const id = campo?.id ?? initialData?.id;
      setSavedCampoId(id);
      onSuccess();
      if (!initialData) {
        setActiveTab("regras");
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message ?? "Erro na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
      setNewOption("");
    }
  };

  const handleOptionKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddOption(); }
  };

  // ─── Regras ──────────────────────────────────────────────────────────────

  const camposAlvo = campos.filter((c) => c.id !== (initialData?.id ?? savedCampoId));

  const handleAddRegra = async () => {
    if (!novaRegra.valores.length || !novaRegra.camposAlvo.length) {
      setRegraError("Selecione ao menos um valor e um campo alvo.");
      return;
    }
    setRegraError("");
    setLoadingRegra(true);
    try {
      const campoId = initialData?.id ?? savedCampoId;
      const regra = await createRegra(tenantSlug, formularioId, campoId, novaRegra);
      setRegras((prev) => [...prev, regra]);
      setNovaRegra({ condicao: "IGUAL", valores: [], acao: "MOSTRAR", camposAlvo: [] });
    } catch (err) {
      setRegraError(err.response?.data?.message ?? "Erro ao adicionar regra.");
    } finally {
      setLoadingRegra(false);
    }
  };

  const handleDeleteRegra = async (regraId) => {
    setLoadingRegra(true);
    try {
      const campoId = initialData?.id ?? savedCampoId;
      await deleteRegra(tenantSlug, formularioId, campoId, regraId);
      setRegras((prev) => prev.filter((r) => r.id !== regraId));
    } catch (err) {
      setRegraError(err.response?.data?.message ?? "Erro ao remover regra.");
    } finally {
      setLoadingRegra(false);
    }
  };

  const toggleValor = (v) => {
    setNovaRegra((prev) => ({
      ...prev,
      valores: prev.valores.includes(v)
        ? prev.valores.filter((x) => x !== v)
        : [...prev.valores, v],
    }));
  };

  const toggleAlvo = (id) => {
    setNovaRegra((prev) => ({
      ...prev,
      camposAlvo: prev.camposAlvo.includes(id)
        ? prev.camposAlvo.filter((x) => x !== id)
        : [...prev.camposAlvo, id],
    }));
  };

  const regraLabel = (r) => {
    const condicaoLabel = CONDICAO_OPTIONS.find((c) => c.value === r.condicao)?.label ?? r.condicao;
    const valores = Array.isArray(r.valores) ? r.valores.join(", ") : r.valores;
    const acaoLabel = ACAO_OPTIONS.find((a) => a.value === r.acao)?.label ?? r.acao;
    const alvosLabel = Array.isArray(r.camposAlvo)
      ? r.camposAlvo.map((id) => campos.find((c) => c.id === id)?.label ?? `#${id}`).join(", ")
      : r.camposAlvo;
    return `Se ${condicaoLabel} "${valores}" → ${acaoLabel}: ${alvosLabel}`;
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const canShowRegras = savedCampoId !== null;

  return (
    <div>
      {/* Tabs */}
      <div className={styles.menu}>
        <div
          className={`${styles.itemMenu} ${activeTab === "config" ? styles.itemMenuSelected : ""}`}
          onClick={() => setActiveTab("config")}
        >
          <p className="p5">Configuração</p>
        </div>
        <div
          className={`${styles.itemMenu} ${activeTab === "regras" ? styles.itemMenuSelected : ""} ${!canShowRegras ? styles.itemMenuDisabled : ""}`}
          onClick={() => canShowRegras && setActiveTab("regras")}
          title={!canShowRegras ? "Salve o campo primeiro para adicionar regras" : undefined}
        >
          <p className="p5">Regras {regras.length > 0 && `(${regras.length})`}</p>
        </div>
      </div>

      {/* ── Tab: Configuração ── */}
      {activeTab === "config" && (
        <form className={styles.formulario} onSubmit={handleSubmit(handleFormSubmit)}>
          <div className={styles.input}>

            {/* Tipo — grid de cards */}
            <div style={{ marginBottom: "1rem" }}>
              <p className="p5" style={{ marginBottom: "0.5rem", fontWeight: 500 }}>Tipo de campo *</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                {TIPOS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => !isUtFkField && setValue("tipo", value)}
                    disabled={isUtFkField}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.6rem 0.4rem",
                      border: tipoValue === value ? "2px solid var(--primary-dark, #2563eb)" : "1px solid #e2e8f0",
                      borderRadius: "8px",
                      background: tipoValue === value ? "var(--primary-lightest, #eff6ff)" : "#fff",
                      cursor: isUtFkField ? "not-allowed" : "pointer",
                      opacity: isUtFkField && tipoValue !== value ? 0.4 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={18} color={tipoValue === value ? "var(--primary-dark, #2563eb)" : "#64748b"} />
                    <span style={{ fontSize: "0.7rem", color: tipoValue === value ? "var(--primary-dark, #2563eb)" : "#64748b", textAlign: "center", lineHeight: 1.2 }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              className="mb-2"
              control={control}
              name="label"
              label="Título da pergunta *"
              inputType="text"
              placeholder="Ex: Qual é o título do seu projeto?"
              disabled={loading}
            />
            <Input
              className="mb-2"
              control={control}
              name="descricao"
              label="Descrição (instrução adicional)"
              inputType="text"
              placeholder="Orientação para o respondente"
              disabled={loading}
            />
            <Input
              control={control}
              name="obrigatorio"
              label="Campo obrigatório"
              inputType="checkbox"
              disabled={loading}
            />
            <Input
              control={control}
              name="ocultarDoAvaliador"
              label="Ocultar essa resposta da tela do avaliador"
              inputType="checkbox"
              disabled={loading}
            />

            {/* Vínculo com campo do UserTenant */}
            <div style={{ marginBottom: "1rem", marginTop: "0.5rem" }}>
              <p className="p5" style={{ marginBottom: "0.5rem", fontWeight: 500 }}>
                Vincular ao cadastro do usuário
              </p>
              <Controller
                name="userTenantField"
                control={control}
                render={({ field }) => (
                  <label className={`${selectStyles.select} select`}>
                    <div className={selectStyles.selectContainer}>
                      <Dropdown
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.value ?? "")}
                        options={USER_TENANT_FIELDS}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Sem vínculo"
                        disabled={loading}
                        className="w-full"
                        showClear={!!field.value}
                        onClear={() => field.onChange("")}
                        panelClassName="w-full"
                      />
                    </div>
                  </label>
                )}
              />
              {isUtFkField && (
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.35rem" }}>
                  Campo FK: o tipo será fixado como "Seleção única" e as opções carregadas automaticamente da base do tenant.
                </p>
              )}
              {userTenantFieldValue === "turno" && (
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.35rem" }}>
                  Para Turno, use o tipo "Seleção única" e adicione as opções: DIURNO, MATUTINO, VESPERTINO, NOTURNO, VIRTUAL.
                </p>
              )}
            </div>

            {/* Condicional: Arquivo */}
            {tipoValue === "arquivo" && (
              <Select
                className="mb-2"
                control={control}
                name="tipoFile"
                label="Tipo de arquivo aceito *"
                options={TIPO_FILE_OPTIONS}
                disabled={loading}
              />
            )}

            {/* Condicional: Texto curto / longo / rico */}
            {(tipoValue === "text" || tipoValue === "textLong" || tipoValue === "blockNote") && (
              <Input
                className="mb-2"
                control={control}
                name="maxChar"
                label="Limite de caracteres"
                inputType="number"
                placeholder="Ex: 500"
                disabled={loading}
              />
            )}

            {/* Condicional: Seleção / Múltipla escolha — oculta quando FK (opções automáticas) */}
            {hasOpcoes && !isUtFkField && (
              <div className={styles.options} style={{ marginBottom: "1rem" }}>
                <p className="p5" style={{ marginBottom: "0.5rem", fontWeight: 500 }}>Opções de resposta</p>
                <div className={styles.optionInput}>
                  <input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={handleOptionKeyDown}
                    type="text"
                    placeholder="Digite uma opção e pressione Enter"
                    disabled={loading}
                  />
                  <div className={styles.btn}>
                    <Button className="btn-secondary" type="button" onClick={handleAddOption} disabled={loading} icon={RiAddLine} />
                  </div>
                </div>
                {options.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                    Nenhuma opção adicionada ainda.
                  </p>
                )}
                <ul className={styles.optionList} style={{ marginTop: "0.5rem" }}>
                  {options.map((option, index) => (
                    <li key={index} className={styles.optionItem}>
                      <div className={styles.label}><p>{option}</p></div>
                      <div className={styles.btn}>
                        <Button type="button" className="btn-error" onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))} disabled={loading} icon={RiDeleteBinLine} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="notification notification-error" style={{ marginBottom: "0.75rem" }}>
              <p className="p5">{error}</p>
            </div>
          )}

          <div className={styles.btnSubmit}>
            <Button icon={RiSave2Line} className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Salvando..." : initialData ? "Atualizar campo" : "Salvar campo"}
            </Button>
          </div>
        </form>
      )}

      {/* ── Tab: Regras ── */}
      {activeTab === "regras" && (
        <div style={{ marginTop: "1rem" }}>
          {!canShowRegras ? (
            <div className="notification notification-warning">
              <p className="p5">Salve o campo primeiro para poder adicionar regras.</p>
            </div>
          ) : (
            <>
              {/* Regras existentes */}
              {regras.length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <p className="p5" style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Regras ativas</p>
                  {regras.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        marginBottom: "0.5rem",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <RiFlowChart size={16} color="#64748b" />
                        <span style={{ fontSize: "0.8rem", color: "#334155" }}>{regraLabel(r)}</span>
                      </div>
                      <Button
                        type="button"
                        className="btn-error"
                        onClick={() => handleDeleteRegra(r.id)}
                        disabled={loadingRegra}
                        icon={RiDeleteBinLine}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário nova regra */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "1rem",
                }}
              >
                <p className="p5" style={{ fontWeight: 500, marginBottom: "0.75rem" }}>
                  <RiAddLine size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                  Nova regra
                </p>

                {/* Condição */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>Condição</p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {CONDICAO_OPTIONS.filter((c) =>
                      tipoValue === "multiselect" ? true : c.value === "IGUAL"
                    ).map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNovaRegra((prev) => ({ ...prev, condicao: c.value }))}
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "20px",
                          border: novaRegra.condicao === c.value ? "2px solid var(--primary-dark, #2563eb)" : "1px solid #e2e8f0",
                          background: novaRegra.condicao === c.value ? "var(--primary-lightest, #eff6ff)" : "#fff",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          color: novaRegra.condicao === c.value ? "var(--primary-dark, #2563eb)" : "#64748b",
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Valores */}
                {hasOpcoes && options.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>
                      Quando o valor {novaRegra.condicao === "IGUAL" ? "for" : "incluir"}:
                    </p>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleValor(opt)}
                          style={{
                            padding: "0.25rem 0.65rem",
                            borderRadius: "20px",
                            border: novaRegra.valores.includes(opt) ? "2px solid #16a34a" : "1px solid #e2e8f0",
                            background: novaRegra.valores.includes(opt) ? "#f0fdf4" : "#fff",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            color: novaRegra.valores.includes(opt) ? "#16a34a" : "#64748b",
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ação */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>Ação</p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {ACAO_OPTIONS.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => setNovaRegra((prev) => ({ ...prev, acao: a.value }))}
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "20px",
                          border: novaRegra.acao === a.value ? "2px solid #d97706" : "1px solid #e2e8f0",
                          background: novaRegra.acao === a.value ? "#fffbeb" : "#fff",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          color: novaRegra.acao === a.value ? "#d97706" : "#64748b",
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campos alvo */}
                {camposAlvo.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>Os seguintes campos:</p>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {camposAlvo.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleAlvo(c.id)}
                          style={{
                            padding: "0.25rem 0.65rem",
                            borderRadius: "20px",
                            border: novaRegra.camposAlvo.includes(c.id) ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                            background: novaRegra.camposAlvo.includes(c.id) ? "#f5f3ff" : "#fff",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            color: novaRegra.camposAlvo.includes(c.id) ? "#7c3aed" : "#64748b",
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {camposAlvo.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
                    Não há outros campos no formulário para usar como alvo.
                  </p>
                )}

                {regraError && (
                  <div className="notification notification-error" style={{ marginBottom: "0.5rem" }}>
                    <p className="p5">{regraError}</p>
                  </div>
                )}

                <Button
                  icon={RiAddLine}
                  className="btn-primary"
                  type="button"
                  disabled={loadingRegra || camposAlvo.length === 0}
                  onClick={handleAddRegra}
                >
                  {loadingRegra ? "Salvando..." : "Adicionar regra"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FormCampo;
