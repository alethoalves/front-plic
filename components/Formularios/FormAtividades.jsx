"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
import formStyles from "@/components/Formularios/Form.module.scss";
import styles from "./FormAtividades.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import {
  RiCalendarEventLine,
  RiCalendarLine,
  RiTimeLine,
  RiMapPinLine,
  RiAddCircleLine,
  RiSettings4Line,
  RiSave2Line,
  RiPencilLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCloseLine,
} from "@remixicon/react";
import {
  criarAtividade,
  atualizarAtividade,
  excluirAtividade,
} from "@/app/api/client/atividadesEvento";

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

// Mesma convenção de FormSessoes.jsx: o back-end guarda inicio/fim/
// dataFinalInscricao como ISO "Z" cujos dígitos já são a hora de Brasília
// (sem conversão de fuso), mas o Calendar do PrimeReact só lê/escreve por
// getters LOCAIS do Date. Esse par de funções faz a ponte, sem deixar o
// offset real do fuso do navegador entrar na conta.
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

const TIPOS_PARTICIPANTE = [
  { label: "Autoridade", value: "AUTORIDADE" },
  { label: "Mediador(a)", value: "MEDIADOR" },
  { label: "Palestrante", value: "PALESTRANTE" },
];

const tipoParticipanteLabel = (tipo) =>
  TIPOS_PARTICIPANTE.find((t) => t.value === tipo)?.label ?? tipo;

const PARTICIPANTE_VAZIO = { nome: "", descricao: "", tipo: "PALESTRANTE" };

// Form de criar/editar atividade, aberto dentro de um Modal — mesmo papel
// que SubsessaoForm cumpre em FormSessoes.jsx (item sem sub-conteúdo próprio,
// então o Modal não recebe `edit`/`itemName`; o título vem do próprio form).
const AtividadeForm = ({ eventoSlug, atividade, onClose, onSuccess }) => {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const { control, handleSubmit } = useForm({
    defaultValues: {
      titulo: atividade?.titulo ?? "",
      subtitulo: atividade?.subtitulo ?? "",
      local: atividade?.local ?? "",
      descricao: atividade?.descricao ?? "",
      inicio: atividade ? deIsoBrasilia(atividade.inicio) : null,
      fim: atividade ? deIsoBrasilia(atividade.fim) : null,
      temInscricaoPropria: atividade?.dataFinalInscricao ? "true" : "false",
      dataFinalInscricao: atividade?.dataFinalInscricao
        ? deIsoBrasilia(atividade.dataFinalInscricao)
        : null,
    },
  });

  const temInscricaoPropria = useWatch({
    control,
    name: "temInscricaoPropria",
  });

  // Participantes (autoridade/mediador/palestrante) vivem só em estado local
  // e vão no mesmo payload da atividade ao salvar — igual à convenção de
  // areaIds em FormSessoes.jsx (o backend substitui a lista inteira a cada
  // update), já que não têm identidade/edição própria fora deste form.
  const [participantes, setParticipantes] = useState(
    (atividade?.participantes || []).map((p) => ({
      nome: p.nome,
      descricao: p.descricao || "",
      tipo: p.tipo,
    })),
  );
  const [novoParticipante, setNovoParticipante] = useState(PARTICIPANTE_VAZIO);
  const [erroParticipante, setErroParticipante] = useState("");
  const [editandoParticipanteIndex, setEditandoParticipanteIndex] =
    useState(null);
  const [editParticipanteFields, setEditParticipanteFields] =
    useState(PARTICIPANTE_VAZIO);
  const [erroEdicaoParticipante, setErroEdicaoParticipante] = useState("");

  const handleAddParticipante = () => {
    const nome = novoParticipante.nome.trim();
    if (!nome) {
      setErroParticipante("Informe o nome do participante.");
      return;
    }
    setParticipantes((prev) => [
      ...prev,
      {
        nome,
        descricao: novoParticipante.descricao.trim(),
        tipo: novoParticipante.tipo,
      },
    ]);
    setNovoParticipante(PARTICIPANTE_VAZIO);
    setErroParticipante("");
  };

  const handleRemoveParticipante = (index) => {
    setParticipantes((prev) => prev.filter((_, i) => i !== index));
    if (editandoParticipanteIndex === index) setEditandoParticipanteIndex(null);
  };

  const handleStartEditParticipante = (index) => {
    setEditandoParticipanteIndex(index);
    setEditParticipanteFields(participantes[index]);
    setErroEdicaoParticipante("");
  };

  const handleCancelEditParticipante = () => {
    setEditandoParticipanteIndex(null);
    setErroEdicaoParticipante("");
  };

  const handleSaveEditParticipante = () => {
    const nome = editParticipanteFields.nome.trim();
    if (!nome) {
      setErroEdicaoParticipante("Informe o nome do participante.");
      return;
    }
    setParticipantes((prev) =>
      prev.map((p, i) =>
        i === editandoParticipanteIndex
          ? {
              nome,
              descricao: editParticipanteFields.descricao.trim(),
              tipo: editParticipanteFields.tipo,
            }
          : p,
      ),
    );
    setEditandoParticipanteIndex(null);
    setErroEdicaoParticipante("");
  };

  const onSalvar = async (data) => {
    if (!data.inicio || !data.fim) {
      setErro("Informe início e fim da atividade.");
      return;
    }
    if (temInscricaoPropria === "true" && !data.dataFinalInscricao) {
      setErro(
        "Informe a data final de inscrição, ou desmarque a opção acima.",
      );
      return;
    }
    setSalvando(true);
    setErro("");
    const payload = {
      titulo: data.titulo,
      subtitulo: data.subtitulo?.trim() || undefined,
      local: data.local,
      descricao: data.descricao?.trim() || undefined,
      inicio: paraIsoBrasilia(data.inicio),
      fim: paraIsoBrasilia(data.fim),
      dataFinalInscricao:
        temInscricaoPropria === "true"
          ? paraIsoBrasilia(data.dataFinalInscricao)
          : null,
      participantes: participantes.map(({ nome, descricao, tipo }) => ({
        nome,
        descricao: descricao || undefined,
        tipo,
      })),
    };
    try {
      const resposta = atividade
        ? await atualizarAtividade(eventoSlug, atividade.id, payload)
        : await criarAtividade(eventoSlug, payload);
      onSuccess(resposta.atividade);
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
        {atividade ? "Editar atividade" : "Nova atividade"}
      </h4>
      <div className={formStyles.input}>
        <Input
          control={control}
          name="titulo"
          label="Título"
          inputType="text"
          disabled={salvando}
        />
      </div>
      <div className={`${formStyles.input} mt-2`}>
        <Input
          control={control}
          name="subtitulo"
          label="Subtítulo (opcional)"
          inputType="text"
          disabled={salvando}
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
      <div className={`${formStyles.input} mt-2`}>
        <Textarea
          control={control}
          name="descricao"
          label="Descrição (opcional)"
          maxLength={500}
          disabled={salvando}
        />
      </div>
      <div className={`${formStyles.input} mt-2`}>
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
      <div className={`${formStyles.checkboxGrid} mt-2`}>
        <Input
          control={control}
          name="temInscricaoPropria"
          label="Esta atividade tem inscrição própria"
          inputType="checkbox"
          disabled={salvando}
        />
      </div>
      {temInscricaoPropria === "true" && (
        <div className={`${formStyles.input} mt-2`}>
          <div className="mb-1">
            <p>Data final de inscrição</p>
          </div>
          <Controller
            control={control}
            name="dataFinalInscricao"
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                placeholder="Prazo final de inscrição"
                disabled={salvando}
                style={{ width: "100%" }}
              />
            )}
          />
        </div>
      )}
      <div className="mt-2">
        <div className="mb-1">
          <p>Participantes (opcional)</p>
        </div>

        {participantes.length > 0 && (
          <div className={formStyles.lista}>
            {participantes.map((participante, index) => {
              if (editandoParticipanteIndex === index) {
                return (
                  <div
                    key={`edit-${index}`}
                    className={formStyles.listaItem}
                  >
                    <div className={formStyles.listaItemEditForm}>
                      <input
                        className={formStyles.editInput}
                        value={editParticipanteFields.nome}
                        onChange={(e) =>
                          setEditParticipanteFields((prev) => ({
                            ...prev,
                            nome: e.target.value,
                          }))
                        }
                        placeholder="Nome"
                        disabled={salvando}
                      />
                      <input
                        className={formStyles.editInput}
                        value={editParticipanteFields.descricao}
                        onChange={(e) =>
                          setEditParticipanteFields((prev) => ({
                            ...prev,
                            descricao: e.target.value,
                          }))
                        }
                        placeholder="Breve descrição (opcional)"
                        disabled={salvando}
                      />
                      <select
                        className={formStyles.editInput}
                        value={editParticipanteFields.tipo}
                        onChange={(e) =>
                          setEditParticipanteFields((prev) => ({
                            ...prev,
                            tipo: e.target.value,
                          }))
                        }
                        disabled={salvando}
                      >
                        {TIPOS_PARTICIPANTE.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      {erroEdicaoParticipante && (
                        <p className={formStyles.editError}>
                          {erroEdicaoParticipante}
                        </p>
                      )}
                      <div className={formStyles.editActions}>
                        <button
                          type="button"
                          className={formStyles.editSave}
                          onClick={handleSaveEditParticipante}
                          disabled={salvando}
                        >
                          <RiCheckLine size={14} /> Salvar
                        </button>
                        <button
                          type="button"
                          className={formStyles.editCancel}
                          onClick={handleCancelEditParticipante}
                          disabled={salvando}
                        >
                          <RiCloseLine size={14} /> Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={formStyles.listaItem}>
                  <div className={formStyles.listaItemContent}>
                    <p className={formStyles.itemName}>
                      {participante.nome}
                    </p>
                    <p className={formStyles.itemDates}>
                      {tipoParticipanteLabel(participante.tipo)}
                      {participante.descricao && ` — ${participante.descricao}`}
                    </p>
                  </div>
                  <div className={formStyles.listaItemActions}>
                    <div
                      className={`${formStyles.actionIcon} ${formStyles.actionIconEdit}`}
                      onClick={() => handleStartEditParticipante(index)}
                      title="Editar"
                    >
                      <RiPencilLine />
                    </div>
                    <div
                      className={`${formStyles.actionIcon} ${formStyles.actionIconDelete}`}
                      onClick={() => handleRemoveParticipante(index)}
                      title="Excluir"
                    >
                      <RiDeleteBinLine />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={`${formStyles.listaItemEditForm} mt-1`}>
          <input
            className={formStyles.editInput}
            value={novoParticipante.nome}
            onChange={(e) =>
              setNovoParticipante((prev) => ({ ...prev, nome: e.target.value }))
            }
            placeholder="Nome"
            disabled={salvando}
          />
          <input
            className={formStyles.editInput}
            value={novoParticipante.descricao}
            onChange={(e) =>
              setNovoParticipante((prev) => ({
                ...prev,
                descricao: e.target.value,
              }))
            }
            placeholder="Breve descrição (opcional)"
            disabled={salvando}
          />
          <select
            className={formStyles.editInput}
            value={novoParticipante.tipo}
            onChange={(e) =>
              setNovoParticipante((prev) => ({ ...prev, tipo: e.target.value }))
            }
            disabled={salvando}
          >
            {TIPOS_PARTICIPANTE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {erroParticipante && (
            <p className={formStyles.editError}>{erroParticipante}</p>
          )}
          <Button
            icon={RiAddCircleLine}
            className="btn-secondary"
            type="button"
            onClick={handleAddParticipante}
            disabled={salvando}
          >
            Adicionar participante
          </Button>
        </div>
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

// CRUD de atividades genéricas da programação (palestras, workshops,
// credenciamento, intervalos etc.), embutido na aba "Atividades" de
// admin/configuracoes. Lista plana + Modal (sem abas por item, ao
// contrário de "Sessões") porque atividades não têm sub-conteúdo — mesmo
// subpadrão que SubsessaoForm usa dentro de FormSessoes.jsx.
const FormAtividades = ({ eventoSlug, initialAtividades }) => {
  const [atividades, setAtividades] = useState(initialAtividades || []);
  const [formModal, setFormModal] = useState(null); // { atividade? } | null
  const [excluindoAtividade, setExcluindoAtividade] = useState(null);
  const [erroExclusao, setErroExclusao] = useState("");
  const [excluindoLoading, setExcluindoLoading] = useState(false);

  const menuRef = useRef(null);
  const [menuAlvo, setMenuAlvo] = useState(null);
  const itensMenu = [
    {
      label: "Editar atividade",
      icon: "pi pi-pencil",
      command: () => setFormModal({ atividade: menuAlvo }),
    },
    {
      label: "Excluir atividade",
      icon: "pi pi-trash",
      command: () => {
        setErroExclusao("");
        setExcluindoAtividade(menuAlvo);
      },
    },
  ];

  useEffect(() => {
    setAtividades(initialAtividades || []);
  }, [initialAtividades]);

  const handleExcluir = async () => {
    setErroExclusao("");
    setExcluindoLoading(true);
    try {
      await excluirAtividade(eventoSlug, excluindoAtividade.id);
      setAtividades((prev) =>
        prev.filter((a) => a.id !== excluindoAtividade.id),
      );
      setExcluindoAtividade(null);
    } catch (error) {
      setErroExclusao(
        error.response?.data?.message ?? "Erro na conexão com o servidor.",
      );
    } finally {
      setExcluindoLoading(false);
    }
  };

  const atividadesOrdenadas = [...atividades].sort(
    (a, b) => new Date(a.inicio) - new Date(b.inicio),
  );

  return (
    <div className={formStyles.secao}>
      <div className={formStyles.secaoHead}>
        <div className={formStyles.secaoIcon}>
          <RiCalendarEventLine />
        </div>
        <div>
          <h6>Atividades da programação</h6>
          <p>
            Palestras, workshops, credenciamento, intervalos e outras
            atividades exibidas na programação pública, além das sessões de
            apresentação.
          </p>
        </div>
      </div>
      <div className={formStyles.secaoContent}>
        <div className={styles.atividades}>
          {atividadesOrdenadas.map((atividade) => (
            <div key={atividade.id} className={styles.atividade}>
              <div className={styles.atividadeInfo}>
                <div className={styles.description}>
                  <div className={styles.icon}>
                    <RiCalendarLine />
                  </div>
                  <div className={styles.infoBoxDescription}>
                    <p>Dia</p>
                    <h6>{formatarData(atividade.inicio)}</h6>
                  </div>
                </div>
                <div className={styles.description}>
                  <div className={styles.icon}>
                    <RiTimeLine />
                  </div>
                  <div className={styles.infoBoxDescription}>
                    <p>Horário</p>
                    <h6>
                      de {formatarHora(atividade.inicio)} às{" "}
                      {formatarHora(atividade.fim)}
                    </h6>
                  </div>
                </div>
                <div className={styles.description}>
                  <div className={styles.icon}>
                    <RiMapPinLine />
                  </div>
                  <div className={styles.infoBoxDescription}>
                    <p>Local</p>
                    <h6>{atividade.local}</h6>
                  </div>
                </div>
                <div className={styles.description}>
                  <div className={styles.infoBoxDescription}>
                    <p>Título</p>
                    <h6>
                      {atividade.titulo}
                      {atividade.subtitulo ? ` — ${atividade.subtitulo}` : ""}
                    </h6>
                  </div>
                </div>
                {atividade.participantes?.length > 0 && (
                  <div className={styles.description}>
                    <div className={styles.infoBoxDescription}>
                      <p>Participantes</p>
                      <h6>{atividade.participantes.length}</h6>
                    </div>
                  </div>
                )}
              </div>
              <div
                className={`${styles.menuTrigger} ${styles.atividadeActions}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuAlvo(atividade);
                  menuRef.current.toggle(e);
                }}
                title="Ações da atividade"
              >
                <RiSettings4Line />
              </div>
            </div>
          ))}
          {atividadesOrdenadas.length === 0 && (
            <p className={formStyles.dica}>
              Nenhuma atividade cadastrada ainda.
            </p>
          )}
        </div>
        <Button
          icon={RiAddCircleLine}
          className="btn-secondary mt-2"
          type="button"
          onClick={() => setFormModal({})}
        >
          Adicionar atividade
        </Button>
      </div>

      <Menu
        model={itensMenu}
        popup
        ref={menuRef}
        className={styles.menuAcoes}
      />

      <Modal isOpen={!!formModal} onClose={() => setFormModal(null)}>
        {formModal && (
          <AtividadeForm
            key={formModal.atividade?.id ?? "nova"}
            eventoSlug={eventoSlug}
            atividade={formModal.atividade}
            onClose={() => setFormModal(null)}
            onSuccess={(dados) =>
              setAtividades((prev) => {
                const existe = prev.some((a) => a.id === dados.id);
                return existe
                  ? prev.map((a) => (a.id === dados.id ? dados : a))
                  : [...prev, dados];
              })
            }
          />
        )}
      </Modal>

      <ModalDelete
        isOpen={!!excluindoAtividade}
        onClose={() => setExcluindoAtividade(null)}
        title="Excluir atividade"
        confirmationText={`Tem certeza que deseja excluir a atividade "${excluindoAtividade?.titulo ?? ""}"?`}
        errorDelete={erroExclusao}
        handleDelete={handleExcluir}
        txtBtn={excluindoLoading ? "Excluindo..." : "Excluir"}
      />
    </div>
  );
};

export default FormAtividades;
