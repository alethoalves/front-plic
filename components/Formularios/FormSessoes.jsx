"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { TreeSelect } from "primereact/treeselect";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
import Link from "next/link";
import formStyles from "@/components/Formularios/Form.module.scss";
import styles from "./FormSessoes.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import {
  RiCalendarEventLine,
  RiCalendarLine,
  RiTimeLine,
  RiGroupLine,
  RiSurveyLine,
  RiAddCircleLine,
  RiSettings4Line,
  RiSave2Line,
} from "@remixicon/react";
import { getAreas } from "@/app/api/client/area";
import {
  criarSessao,
  atualizarSessao,
  excluirSessao,
  criarSubsessao,
  atualizarSubsessao,
  excluirSubsessao,
} from "@/app/api/client/sessoes";

const TIPOS_SESSAO = [
  { label: "Apresentação Oral", value: "APRESENTACAO_ORAL" },
  { label: "Apresentação de Pôsteres", value: "APRESENTACAO_POSTER" },
];

const tipoLabel = (tipo) =>
  TIPOS_SESSAO.find((t) => t.value === tipo)?.label ?? tipo;

const formatarData = (dataIso) => {
  const data = new Date(dataIso);
  const dia = data.getUTCDate().toString().padStart(2, "0");
  const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
  const ano = data.getUTCFullYear().toString();
  return `${dia}/${mes}/${ano}`;
};

const formatarHora = (dataIso) => {
  const data = new Date(dataIso);
  const horas = data.getUTCHours().toString().padStart(2, "0");
  const minutos = data.getUTCMinutes().toString().padStart(2, "0");
  return `${horas}h${minutos}`;
};

// O back-end guarda inicio/fim de subsessão como ISO "Z", mas os dígitos
// são a hora de Brasília em si (sem conversão de fuso — mesma convenção de
// formatarData/formatarHora acima e de formatarDataComoString/parseDate em
// api-plic/src/services/utils.js). O Calendar do PrimeReact, porém, só lê e
// escreve por getters LOCAIS do Date (getHours/getDate...). Esse par de
// funções faz a ponte: lê os dígitos UTC do ISO pra um Date cujos getters
// locais batem com eles, e vice-versa, sem nunca deixar o offset real do
// fuso do navegador entrar na conta.
const deIsoBrasilia = (dataIso) => {
  const data = new Date(dataIso);
  return new Date(
    data.getUTCFullYear(),
    data.getUTCMonth(),
    data.getUTCDate(),
    data.getUTCHours(),
    data.getUTCMinutes(),
  );
};

const paraIsoBrasilia = (data) => {
  const pad = (n) => n.toString().padStart(2, "0");
  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());
  const horas = pad(data.getHours());
  const minutos = pad(data.getMinutes());
  return `${ano}-${mes}-${dia}T${horas}:${minutos}:00.000Z`;
};

// Referência estável — evita recriar `[]` a cada render e disparar
// resets indesejados no TreeSelect (mesmo cuidado de AreaSelector.jsx).
const AREA_IDS_VAZIO = [];

// Agrupa as áreas (flat, com `area.grandeArea` embutido pelo backend) em
// nós de árvore por Grande Área, para o TreeSelect de "Áreas": marcar a
// Grande Área seleciona todas as áreas dela de uma vez, no mesmo dropdown.
const construirArvoreAreas = (areas) => {
  const porGrandeArea = new Map();
  (areas || []).forEach((area) => {
    const grandeArea = area.grandeArea;
    if (!grandeArea) return;
    if (!porGrandeArea.has(grandeArea.id)) {
      porGrandeArea.set(grandeArea.id, {
        key: `ga-${grandeArea.id}`,
        label: grandeArea.grandeArea,
        children: [],
      });
    }
    porGrandeArea.get(grandeArea.id).children.push({
      key: String(area.id),
      label: area.area,
    });
  });

  return Array.from(porGrandeArea.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((grupo) => ({
      ...grupo,
      children: grupo.children.sort((a, b) => a.label.localeCompare(b.label)),
    }));
};

// Converte a lista de areaIds selecionados (o que vai pro backend) no
// formato de `value` do TreeSelect com selectionMode="checkbox", incluindo
// o estado (checked/parcial) dos nós de Grande Área.
const areaIdsParaTreeValue = (areaTree, areaIds) => {
  const selecionadas = new Set((areaIds || []).map(String));
  const value = {};
  areaTree.forEach((grupo) => {
    let marcadas = 0;
    grupo.children.forEach((area) => {
      const checked = selecionadas.has(area.key);
      if (checked) marcadas += 1;
      value[area.key] = { checked, partialChecked: false };
    });
    const total = grupo.children.length;
    value[grupo.key] = {
      checked: total > 0 && marcadas === total,
      partialChecked: marcadas > 0 && marcadas < total,
    };
  });
  return value;
};

// Converte o `value` retornado pelo TreeSelect de volta pra lista de
// areaIds (ignora as chaves de Grande Área, só as folhas interessam).
const treeValueParaAreaIds = (value) =>
  Object.entries(value || {})
    .filter(([key, estado]) => estado.checked && !key.startsWith("ga-"))
    .map(([key]) => Number(key));

// Resumo em texto do que está selecionado, usado como valueTemplate do
// TreeSelect — display="chip" nativo mostraria um chip pra Grande Área E um
// pra cada área-filha marcada (redundante). Aqui cada grupo totalmente
// marcado vira só o nome da Grande Área; grupos parciais listam as áreas
// escolhidas. O comprimento é limitado aqui mesmo, em JS — depender de
// CSS (overflow/ellipsis) pra cortar um texto arbitrariamente longo dentro
// do markup interno do PrimeReact se mostrou frágil, então a garantia de
// que o texto cabe numa linha vem do próprio conteúdo, não do CSS.
const LIMITE_CARACTERES_RESUMO_AREAS = 55;

const resumoAreasSelecionadas = (areaTree, areaIds, placeholder) => {
  const selecionadas = new Set((areaIds || []).map(String));
  if (selecionadas.size === 0) return placeholder;

  const partes = [];
  let totalAreas = 0;
  areaTree.forEach((grupo) => {
    const marcadas = grupo.children.filter((area) => selecionadas.has(area.key));
    if (marcadas.length === 0) return;
    totalAreas += marcadas.length;
    partes.push(
      marcadas.length === grupo.children.length
        ? grupo.label
        : marcadas.map((area) => area.label).join(", ")
    );
  });

  const textoCompleto = partes.join(", ");
  if (textoCompleto.length <= LIMITE_CARACTERES_RESUMO_AREAS) {
    return textoCompleto || placeholder;
  }

  const grupos = partes.length;
  return `${totalAreas} área${totalAreas === 1 ? "" : "s"} selecionada${totalAreas === 1 ? "" : "s"} em ${grupos} grande${grupos === 1 ? "" : "s"} área${grupos === 1 ? "" : "s"}`;
};

// Form pequeno usado dentro do modal de criar/editar subsessão — key no
// componente pai garante remontagem com os defaultValues certos.
const SubsessaoForm = ({
  eventoSlug,
  sessaoId,
  subsessao,
  onClose,
  onSuccess,
}) => {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const { control, handleSubmit } = useForm({
    defaultValues: {
      inicio: subsessao ? deIsoBrasilia(subsessao.inicio) : null,
      fim: subsessao ? deIsoBrasilia(subsessao.fim) : null,
      local: subsessao?.local ?? "",
    },
  });

  const onSalvar = async (data) => {
    if (!data.inicio || !data.fim) {
      setErro("Informe início e fim da subsessão.");
      return;
    }
    setSalvando(true);
    setErro("");
    const payload = {
      inicio: paraIsoBrasilia(data.inicio),
      fim: paraIsoBrasilia(data.fim),
      local: data.local,
    };
    try {
      const resposta = subsessao
        ? await atualizarSubsessao(eventoSlug, subsessao.id, payload)
        : await criarSubsessao(eventoSlug, sessaoId, payload);
      onSuccess(resposta.subsessao);
      onClose();
    } catch (error) {
      setErro(
        error.response?.data?.message ?? "Erro na conexão com o servidor.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className={formStyles.formulario} onSubmit={handleSubmit(onSalvar)}>
      <h4 className="mb-2">
        {subsessao ? "Editar subsessão" : "Nova subsessão"}
      </h4>
      <div className={formStyles.input}>
        <div className="mb-1">
          <p>Início</p>
        </div>
        <Controller
          control={control}
          name="inicio"
          render={({ field }) => (
            <Calendar
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              showTime
              hourFormat="24"
              dateFormat="dd/mm/yy"
              placeholder="Data e hora de início"
              disabled={salvando}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>
      <div className={`${formStyles.input} mt-2`}>
        <div className="mb-1">
          <p>Fim</p>
        </div>
        <Controller
          control={control}
          name="fim"
          render={({ field }) => (
            <Calendar
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              showTime
              hourFormat="24"
              dateFormat="dd/mm/yy"
              placeholder="Data e hora de fim"
              disabled={salvando}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>
      <div className={`${formStyles.input} mt-2`}>
        <Input
          control={control}
          name="local"
          label="Local"
          inputType="text"
          disabled={salvando}
        />
      </div>
      <div className={formStyles.btnSubmit}>
        <Button
          icon={RiSave2Line}
          className="btn-primary mt-2"
          type="submit"
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {erro && (
        <div className="notification notification-error">
          <p className="p5">{erro}</p>
        </div>
      )}
    </form>
  );
};

// Form de criar/editar sessão — inclui o vínculo com Áreas, usado pela
// alocação automática de submissões (getEventoBySlugForInscricao e afins).
const SessaoForm = ({ eventoSlug, sessao, areaTree, onClose, onSuccess }) => {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      titulo: sessao?.titulo ?? "",
      tipo: sessao?.tipo ?? "APRESENTACAO_ORAL",
      capacidade: sessao?.capacidade ? String(sessao.capacidade) : "",
      areaIds: sessao?.sessaoArea?.map((sa) => sa.areaId) ?? AREA_IDS_VAZIO,
    },
  });

  const onSalvar = async (data) => {
    if (!data.areaIds?.length) {
      setErro("Selecione ao menos uma área.");
      return;
    }
    setSalvando(true);
    setErro("");
    const payload = {
      titulo: data.titulo,
      tipo: data.tipo,
      capacidade: Number(data.capacidade),
      areaIds: data.areaIds,
    };
    try {
      const resposta = sessao
        ? await atualizarSessao(eventoSlug, sessao.id, payload)
        : await criarSessao(eventoSlug, payload);
      onSuccess(resposta.sessao);
      if (!sessao) reset();
      onClose?.();
    } catch (error) {
      setErro(
        error.response?.data?.message ?? "Erro na conexão com o servidor.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className={formStyles.formulario} onSubmit={handleSubmit(onSalvar)}>
      <div className={formStyles.secaoGrid}>
        <Input
          control={control}
          name="titulo"
          label="Título da sessão"
          inputType="text"
          disabled={salvando}
        />
        <Select
          control={control}
          name="tipo"
          label="Tipo"
          options={TIPOS_SESSAO}
          disabled={salvando}
        />
        <Input
          control={control}
          name="capacidade"
          label="Capacidade de cada subsessão"
          inputType="number"
          disabled={salvando}
        />
        <div className={styles.areasField}>
          <div className="mb-1">
            <p>Áreas</p>
          </div>
          <Controller
            control={control}
            name="areaIds"
            render={({ field }) => (
              <TreeSelect
                value={areaIdsParaTreeValue(areaTree, field.value)}
                options={areaTree}
                onChange={(e) => field.onChange(treeValueParaAreaIds(e.value))}
                selectionMode="checkbox"
                placeholder="Selecione as áreas"
                valueTemplate={() =>
                  resumoAreasSelecionadas(areaTree, field.value, "Selecione as áreas")
                }
                filter
                disabled={salvando}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
        <Button
          icon={sessao ? RiSave2Line : RiAddCircleLine}
          className="btn-secondary"
          type="submit"
          disabled={salvando}
        >
          {salvando ? "Salvando..." : sessao ? "Salvar" : "Adicionar"}
        </Button>
      </div>
      {erro && <p className={`${formStyles.statusErro} mt-1`}>{erro}</p>}
    </form>
  );
};

// CRUD de sessões e subsessões, embutido em admin/apresentacao e
// admin/submissao (que hoje só listam sessões em modo leitura). O vínculo
// de área é obrigatório na criação: sem ele, a sessão nova não recebe
// submissões automaticamente (ver getEventoBySlugForInscricao no backend).
const FormSessoes = ({ eventoSlug, initialSessoes, basePath }) => {
  const [sessoes, setSessoes] = useState(initialSessoes || []);
  const [areaTree, setAreaTree] = useState([]);

  // Uma aba por sessão + a aba fixa "nova" — evita empilhar todas as
  // sessões sempre abertas na tela (só o conteúdo da aba ativa renderiza).
  const [abaAtiva, setAbaAtiva] = useState(
    (initialSessoes || [])[0]?.id ?? "nova",
  );

  const [editandoSessao, setEditandoSessao] = useState(null);
  const [excluindoSessao, setExcluindoSessao] = useState(null);
  const [erroExclusaoSessao, setErroExclusaoSessao] = useState("");
  const [excluindoSessaoLoading, setExcluindoSessaoLoading] = useState(false);

  const [subsessaoModal, setSubsessaoModal] = useState(null); // { sessaoId, subsessao? }
  const [excluindoSubsessao, setExcluindoSubsessao] = useState(null); // { sessaoId, subsessao }
  const [erroExclusaoSubsessao, setErroExclusaoSubsessao] = useState("");
  const [excluindoSubsessaoLoading, setExcluindoSubsessaoLoading] =
    useState(false);

  // Menu de ações (engrenagem) — uma instância de <Menu> por nível
  // (sessão/subsessão), reaproveitada pra qualquer linha: guarda "qual
  // item" foi clicado, monta o `model` a partir dele.
  const menuSessaoRef = useRef(null);
  const [sessaoMenuAlvo, setSessaoMenuAlvo] = useState(null);
  const itensMenuSessao = [
    {
      label: "Editar sessão",
      icon: "pi pi-pencil",
      command: () => setEditandoSessao(sessaoMenuAlvo),
    },
    {
      label: "Excluir sessão",
      icon: "pi pi-trash",
      command: () => {
        setErroExclusaoSessao("");
        setExcluindoSessao(sessaoMenuAlvo);
      },
    },
  ];

  const menuSubsessaoRef = useRef(null);
  const [subsessaoMenuAlvo, setSubsessaoMenuAlvo] = useState(null);
  const itensMenuSubsessao = [
    {
      label: "Editar subsessão",
      icon: "pi pi-pencil",
      command: () =>
        setSubsessaoModal({
          sessaoId: subsessaoMenuAlvo?.sessaoId,
          subsessao: subsessaoMenuAlvo?.subsessao,
        }),
    },
    {
      label: "Excluir subsessão",
      icon: "pi pi-trash",
      command: () => {
        setErroExclusaoSubsessao("");
        setExcluindoSubsessao(subsessaoMenuAlvo);
      },
    },
  ];

  useEffect(() => {
    setSessoes(initialSessoes || []);
  }, [initialSessoes]);

  useEffect(() => {
    let ativo = true;
    getAreas()
      .then((areas) => {
        if (!ativo) return;
        setAreaTree(construirArvoreAreas(areas));
      })
      .catch(() => {
        // Falha silenciosa — só impede a criação/edição de sessão até recarregar
      });
    return () => {
      ativo = false;
    };
  }, []);

  const handleExcluirSessao = async () => {
    setErroExclusaoSessao("");
    setExcluindoSessaoLoading(true);
    try {
      await excluirSessao(eventoSlug, excluindoSessao.id);
      const restantes = sessoes.filter((s) => s.id !== excluindoSessao.id);
      setSessoes(restantes);
      if (abaAtiva === excluindoSessao.id) {
        setAbaAtiva(restantes[0]?.id ?? "nova");
      }
      setExcluindoSessao(null);
    } catch (error) {
      setErroExclusaoSessao(
        error.response?.data?.message ?? "Erro na conexão com o servidor.",
      );
    } finally {
      setExcluindoSessaoLoading(false);
    }
  };

  const handleExcluirSubsessao = async () => {
    const { sessaoId, subsessao } = excluindoSubsessao;
    setErroExclusaoSubsessao("");
    setExcluindoSubsessaoLoading(true);
    try {
      await excluirSubsessao(eventoSlug, subsessao.id);
      setSessoes((prev) =>
        prev.map((s) =>
          s.id === sessaoId
            ? {
                ...s,
                subsessaoApresentacao: s.subsessaoApresentacao.filter(
                  (sub) => sub.id !== subsessao.id,
                ),
              }
            : s,
        ),
      );
      setExcluindoSubsessao(null);
    } catch (error) {
      setErroExclusaoSubsessao(
        error.response?.data?.message ?? "Erro na conexão com o servidor.",
      );
    } finally {
      setExcluindoSubsessaoLoading(false);
    }
  };

  const sessaoAtiva = sessoes.find((s) => s.id === abaAtiva);

  return (
    <>
      <div className={styles.abas}>
        {sessoes.map((sessao) => (
          <button
            key={sessao.id}
            type="button"
            className={`${styles.aba} ${
              abaAtiva === sessao.id ? styles.abaAtiva : ""
            }`}
            onClick={() => setAbaAtiva(sessao.id)}
          >
            {sessao.titulo}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.aba} ${
            abaAtiva === "nova" ? styles.abaAtiva : ""
          }`}
          onClick={() => setAbaAtiva("nova")}
        >
          + Nova sessão
        </button>
      </div>

      {abaAtiva === "nova" && (
        <div className={formStyles.secao}>
          <div className={formStyles.secaoHead}>
            <div className={formStyles.secaoIcon}>
              <RiCalendarEventLine />
            </div>
            <h6>Nova sessão</h6>
          </div>
          <div className={formStyles.secaoContent}>
            <SessaoForm
              eventoSlug={eventoSlug}
              areaTree={areaTree}
              onSuccess={(nova) => {
                setSessoes((prev) => [...prev, nova]);
                setAbaAtiva(nova.id);
              }}
            />
          </div>
        </div>
      )}

      {sessaoAtiva && (
        <div className={formStyles.secao}>
          <div className={`${formStyles.secaoHead} ${styles.sessaoHeadRow}`}>
            <div className="flex align-items-center gap-1">
              <div className={formStyles.secaoIcon}>
                <RiCalendarEventLine />
              </div>
              <h6>Sessão {sessaoAtiva.titulo}</h6>
            </div>
            <div
              className={styles.menuTrigger}
              onClick={(e) => {
                setSessaoMenuAlvo(sessaoAtiva);
                menuSessaoRef.current.toggle(e);
              }}
              title="Ações da sessão"
            >
              <RiSettings4Line />
            </div>
          </div>
          <div
            className={`${formStyles.secaoContent} ${styles.sessaoContentBody}`}
          >
            <p>
              <strong>Tipo de sessão: </strong>
              {tipoLabel(sessaoAtiva.tipo)}
            </p>
            <p>
              <strong>Capacidade de cada subsessão: </strong>
              {sessaoAtiva.capacidade}
            </p>
            {sessaoAtiva.sessaoArea?.length > 0 && (
              <p>
                <strong>Áreas: </strong>
                {sessaoAtiva.sessaoArea.map((sa) => sa.area.area).join(", ")}
              </p>
            )}
            <p className="mt-2">
              <strong>Subsessões: </strong>
            </p>
            <div className={styles.subsessoes}>
              {[...(sessaoAtiva.subsessaoApresentacao || [])]
                .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
                .map((subs) => (
                <div key={subs.id} className={styles.subsessao}>
                  <Link
                    href={`${basePath}/${subs.id}`}
                    className={styles.subsessaoLink}
                  >
                    <div className={styles.description}>
                      <div className={styles.icon}>
                        <RiCalendarLine />
                      </div>
                      <div className={styles.infoBoxDescription}>
                        <p>Dia</p>
                        <h6>{formatarData(subs.inicio)}</h6>
                      </div>
                    </div>
                    <div className={styles.description}>
                      <div className={styles.icon}>
                        <RiTimeLine />
                      </div>
                      <div className={styles.infoBoxDescription}>
                        <p>Horário</p>
                        <h6>
                          de {formatarHora(subs.inicio)} às{" "}
                          {formatarHora(subs.fim)}
                        </h6>
                      </div>
                    </div>
                    <div className={styles.description}>
                      <div className={styles.icon}>
                        <RiGroupLine />
                      </div>
                      <div className={styles.infoBoxDescription}>
                        <p>Inscritos</p>
                        <h6>{subs.submissaoCount}</h6>
                      </div>
                    </div>
                    <div className={styles.description}>
                      <div className={styles.icon}>
                        <RiSurveyLine />
                      </div>
                      <div className={styles.infoBoxDescription}>
                        <p>Avaliadores</p>
                        <h6>{subs.conviteSubsessaoCount}</h6>
                      </div>
                    </div>
                  </Link>
                  <div
                    className={`${styles.menuTrigger} ${styles.subsessaoActions}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSubsessaoMenuAlvo({
                        sessaoId: sessaoAtiva.id,
                        subsessao: subs,
                      });
                      menuSubsessaoRef.current.toggle(e);
                    }}
                    title="Ações da subsessão"
                  >
                    <RiSettings4Line />
                  </div>
                </div>
              ))}
            </div>
            <Button
              icon={RiAddCircleLine}
              className="btn-secondary mt-2"
              type="button"
              onClick={() => setSubsessaoModal({ sessaoId: sessaoAtiva.id })}
            >
              Adicionar subsessão
            </Button>
          </div>
        </div>
      )}

      <Menu
        model={itensMenuSessao}
        popup
        ref={menuSessaoRef}
        className={styles.menuAcoes}
      />
      <Menu
        model={itensMenuSubsessao}
        popup
        ref={menuSubsessaoRef}
        className={styles.menuAcoes}
      />

      <Modal
        isOpen={!!editandoSessao}
        onClose={() => setEditandoSessao(null)}
        edit
        itemName="sessão"
      >
        {editandoSessao && (
          <SessaoForm
            key={editandoSessao.id}
            eventoSlug={eventoSlug}
            sessao={editandoSessao}
            areaTree={areaTree}
            onClose={() => setEditandoSessao(null)}
            onSuccess={(atualizada) =>
              setSessoes((prev) =>
                prev.map((s) =>
                  s.id === atualizada.id ? { ...s, ...atualizada } : s,
                ),
              )
            }
          />
        )}
      </Modal>

      <ModalDelete
        isOpen={!!excluindoSessao}
        onClose={() => setExcluindoSessao(null)}
        title="Excluir sessão"
        confirmationText={`Tem certeza que deseja excluir a sessão "${excluindoSessao?.titulo ?? ""}"? Se houver subsessões vinculadas, a exclusão será bloqueada — exclua-as primeiro.`}
        errorDelete={erroExclusaoSessao}
        handleDelete={handleExcluirSessao}
        txtBtn={excluindoSessaoLoading ? "Excluindo..." : "Excluir"}
      />

      <Modal isOpen={!!subsessaoModal} onClose={() => setSubsessaoModal(null)}>
        {subsessaoModal && (
          <SubsessaoForm
            key={subsessaoModal.subsessao?.id ?? "nova"}
            eventoSlug={eventoSlug}
            sessaoId={subsessaoModal.sessaoId}
            subsessao={subsessaoModal.subsessao}
            onClose={() => setSubsessaoModal(null)}
            onSuccess={(dados) =>
              setSessoes((prev) =>
                prev.map((s) => {
                  if (s.id !== subsessaoModal.sessaoId) return s;
                  const existe = s.subsessaoApresentacao?.some(
                    (sub) => sub.id === dados.id,
                  );
                  return {
                    ...s,
                    subsessaoApresentacao: existe
                      ? s.subsessaoApresentacao.map((sub) =>
                          sub.id === dados.id ? { ...sub, ...dados } : sub,
                        )
                      : [
                          ...(s.subsessaoApresentacao || []),
                          {
                            ...dados,
                            submissaoCount: 0,
                            conviteSubsessaoCount: 0,
                          },
                        ],
                  };
                }),
              )
            }
          />
        )}
      </Modal>

      <ModalDelete
        isOpen={!!excluindoSubsessao}
        onClose={() => setExcluindoSubsessao(null)}
        title="Excluir subsessão"
        confirmationText="Tem certeza que deseja excluir esta subsessão? Se houver submissões, squares ou convites de avaliador vinculados, a exclusão será bloqueada."
        errorDelete={erroExclusaoSubsessao}
        handleDelete={handleExcluirSubsessao}
        txtBtn={excluindoSubsessaoLoading ? "Excluindo..." : "Excluir"}
      />
    </>
  );
};

export default FormSessoes;
