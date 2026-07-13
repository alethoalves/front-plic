"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import style from "./page.module.scss";
import { Toast } from "primereact/toast";
import { getCargos, deleteCargo } from "@/app/api/client/cargo";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Modal from "@/components/Modal";
import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import NewCargo from "@/components/Formularios/NewCargo";
import { RiDeleteBinLine, RiSettings5Line } from "@remixicon/react";
import { ProgressBar } from "primereact/progressbar";
import Header from "@/components/Header";
import { classNames } from "primereact/utils";
import {
  enviarConvitesAvaliadores,
  toggleStatusAvaliadorAno,
  getSolicitacoesLattes,
  decidirSolicitacaoLattes,
  reenviarMensagemSolicitacaoLattes,
} from "@/app/api/client/avaliador";
import { renderStatusTagWithJustificativa } from "@/lib/tagUtils";
import { Calendar } from "primereact/calendar";
import { getTenantBySlug } from "@/app/api/client/tenant";
import { Editor } from "primereact/editor";
import { InputMask } from "primereact/inputmask";
import { Tag } from "primereact/tag";
import montarMensagemConviteAvaliador from "@/lib/montarMensagemConviteAvaliador";

const SOLICITACAO_STATUS_LABELS = {
  PENDENTE: { label: "Pendente", severity: "warning" },
  APROVADO: { label: "Aprovado", severity: "success" },
  RECUSADO: { label: "Recusado", severity: "danger" },
};

const ABAS = [
  { id: "avaliadores", label: "Avaliadores" },
  { id: "lattes", label: "Solicitações Lattes" },
];

const Page = ({ params }) => {
  const [abaAtiva, setAbaAtiva] = useState("avaliadores");
  const [todasAreas, setTodasAreas] = useState([]);
  const [avaliadores, setAvaliadores] = useState([]);

  const toast = useRef(null); // Referência para o Toast

  // Função para exibir mensagens de sucesso ou erro no Toast
  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [areasFiltro, setAreasFiltro] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avaliadorToEdit, setAvaliadorToEdit] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const [verifiedRows, setVerifiedRows] = useState({});
  const [checkedRows, setCheckedRows] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [emailContent, setEmailContent] = useState("");
  const [dataInicial, setDataInicial] = useState(null); // Date | null
  const [dataFinal, setDataFinal] = useState(null); // Date | null
  const [tenant, setTenant] = useState();
  const [instituicaoNome, setInstituicaoNome] = useState("");
  const [gestorNome, setGestorNome] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoFone, setContatoFone] = useState("");
  const [nomeDestinatario, setNomeDestinatario] = useState("");
  const [loadingRows, setLoadingRows] = useState({});

  const dataTableRef = useRef(null);
  const toggleDisponivel = async (rowData, statusAtual) => {
    const linha = rowData.id;
    setLoadingRows((s) => ({ ...s, [linha]: true }));

    const novoStatus = statusAtual === "CONFIRMADO" ? "RECUSADO" : "CONFIRMADO";

    // Atualização otimista
    setAvaliadores((prev) =>
      prev.map((av) =>
        av.id === linha
          ? {
              ...av,
              user: {
                ...av.user,
                AvaliadorAno: av.user.AvaliadorAno?.map((a) =>
                  a.ano === Number(params.ano)
                    ? { ...a, status: novoStatus }
                    : a
                ),
              },
            }
          : av
      )
    );

    try {
      await toggleStatusAvaliadorAno({
        userId: rowData.user.id,
        ano: Number(params.ano),
        tenantId: tenant.id,
      });
      await atualizarAvaliadores(params.tenant, setAvaliadores, setTodasAreas);
    } catch (err) {
      showToast("error", "Erro", "Falha ao atualizar status");
    } finally {
      setLoadingRows((s) => ({ ...s, [linha]: false }));
    }
  };
  // Filtros
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "user.nome": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "user.email": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "user.celular": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    nivel: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
  });

  // Buscar avaliadores e áreas
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await atualizarAvaliadores(
          params.tenant,
          setAvaliadores,
          setTodasAreas
        );
        const tenant = await getTenantBySlug(params.tenant);

        setTenant(tenant);
        setInstituicaoNome(tenant.nome || "");
        setGestorNome(tenant.nomeGestorIc || "");
        setContatoEmail(tenant.emailTenant || "");
        setContatoFone(tenant.telefoneTenant || "");
      } catch (error) {
        console.error("Erro ao buscar avaliadores:", error);
        setError("Erro ao buscar avaliadores.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  // Regera o conteúdo sempre que as datas ou o tenant mudarem
  useEffect(() => {
    setEmailContent(
      montarMensagemConviteAvaliador(
        instituicaoNome,
        gestorNome,
        contatoEmail,
        contatoFone,
        dataInicial,
        dataFinal
      )
    );
  }, [
    instituicaoNome,
    gestorNome,
    contatoEmail,
    contatoFone,
    dataInicial,
    dataFinal,
  ]);

  // Filtrar avaliadores por áreas de atuação
  const avaliadoresFiltrados =
    areasFiltro.length > 0
      ? avaliadores.filter((avaliador) =>
          avaliador.user.userArea.some((ua) =>
            areasFiltro.includes(ua.area.area)
          )
        )
      : avaliadores;

  // Exportar para Excel
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Avaliadores");

    // Cabeçalhos
    worksheet.columns = [
      { header: "Nome", key: "nome", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Celular", key: "celular", width: 15 },
      { header: "Nível", key: "nivel", width: 20 },
      { header: "Áreas de Atuação", key: "areas", width: 50 },
    ];

    // Adicionar dados
    avaliadoresFiltrados.forEach((avaliador) => {
      worksheet.addRow({
        nome: avaliador.user.nome,
        email: avaliador.user.email,
        celular: avaliador.user.celular,
        nivel:
          avaliador.nivel === 0
            ? "Ad hoc"
            : avaliador.nivel === 1
            ? "Comitê Institucional"
            : "Comitê Externo",
        areas: avaliador.user.userArea.map((ua) => ua.area.area).join(", "),
      });
    });

    // Salvar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Avaliadores.xlsx");
  };

  // Filtro global
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Cabeçalho da tabela
  const renderHeader = () => {
    return (
      <div className="">
        <div className="m-2">
          <label htmlFor="filtroStatus" className="block ">
            <p>Busque por palavra-chave:</p>
          </label>
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Pesquisar..."
            style={{ width: "100%" }}
          />

          <label htmlFor="filtroStatus" className="block mt-2">
            <p>Filtre por área de atuação:</p>
          </label>
          <MultiSelect
            id="areasFiltro"
            value={areasFiltro}
            options={todasAreas}
            onChange={(e) => setAreasFiltro(e.value)}
            placeholder="Selecione as áreas"
            display="chip"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  };

  const paginatorRight = (
    <Button type="button" icon="pi pi-download" text onClick={exportExcel} />
  );

  const paginatorLeft = (
    <Button
      type="button"
      icon="pi pi-plus"
      text
      onClick={() => openModalAndSetData()}
    />
  );

  // Funções para manipulação de ações
  const handleCreateOrEditSuccess = async () => {
    try {
      const data = await getCargos(params.tenant, {
        cargo: "avaliador",
        ano: params.ano,
      });
      setAvaliadores(data);
    } catch (error) {
      console.error("Erro ao buscar avaliadores:", error);
    }
  };

  const handleDelete = useCallback(
    async (avaliador) => {
      const confirmed = window.confirm(
        "Tem certeza que deseja excluir este avaliador?"
      );
      if (!confirmed) return;

      setErrorDelete("");
      try {
        await deleteCargo(params.tenant, avaliador.id);
        setAvaliadores((prevAvaliadores) =>
          prevAvaliadores.filter((a) => a.id !== avaliador.id)
        );
      } catch (error) {
        setErrorDelete(
          error.response?.data?.message ?? "Erro na conexão com o servidor."
        );
      }
    },
    [params.tenant]
  );

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setAvaliadorToEdit(data);
    setVerifiedData(null);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setAvaliadorToEdit(null);
    setErrorDelete(null);
    setVerifiedData(null);
    setSelectedRows([]);
  };

  // Renderização do modal
  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className="mb-2">
        <h4>Editar Avaliador</h4>
        <p>Preencha os dados abaixo para editar o avaliador.</p>
        {!avaliadorToEdit && (
          <CPFVerificationForm
            tenantSlug={params.tenant}
            onCpfVerified={setVerifiedData}
          />
        )}
        {(verifiedData || avaliadorToEdit) && (
          <NewCargo
            tenantSlug={params.tenant}
            initialData={{ ...verifiedData, ...avaliadorToEdit }}
            onClose={closeModalAndResetData}
            onSuccess={handleCreateOrEditSuccess}
            avaliador={true}
          />
        )}
      </div>
    </Modal>
  );

  const atualizarAvaliadores = async (
    tenant,
    setAvaliadores,
    setTodasAreas
  ) => {
    try {
      const data = await getCargos(tenant, {
        cargo: "avaliador",
        ano: params.ano,
      });
      setAvaliadores(data);

      // Extrair todas as áreas únicas dos avaliadores
      const areas = [];
      data.forEach((avaliador) => {
        avaliador.user.userArea.forEach((ua) => {
          if (!areas.includes(ua.area.area)) {
            areas.push(ua.area.area);
          }
        });
      });
      setTodasAreas(areas);
    } catch (error) {
      console.error("Erro ao atualizar avaliadores:", error);
      throw error;
    }
  };

  const selectedCount = selectedRows.length;
  // modal de convite
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [loadingEnviarConvite, setLoadingEnviarConvite] = useState(false);

  const [paraField, setParaField] = useState(""); // texto do campo "Para:"
  const selecionados = selectedRows;
  const abrirModalConvite = () => {
    if (selecionados.length) {
      // pré-preenche com e-mails ou nomes; ajuste como preferir
      setParaField(selecionados.map((a) => a.user.email).join("; "));
    } else {
      setParaField("");
    }
    setInviteModalOpen(true);
  };

  // link geral de avaliador do ano (sem token pessoal — mesmo link pra todo mundo)
  const linkGeralAvaliador =
    typeof window !== "undefined"
      ? `${window.location.origin}/${params.tenant}/public/convite-avaliador/${params.ano}`
      : "";

  const copiarLinkGeral = async () => {
    try {
      await navigator.clipboard.writeText(linkGeralAvaliador);
      showToast("success", "Copiado", "Link copiado para a área de transferência.");
    } catch (err) {
      console.error(err);
      showToast("error", "Erro", "Não foi possível copiar o link.");
    }
  };

  // fila de solicitações de análise de Lattes (quem ainda não tem doutorado confirmado)
  const [solicitacoesLattes, setSolicitacoesLattes] = useState([]);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(true);
  const [decisaoResultado, setDecisaoResultado] = useState(null); // { mensagem, celular }

  const fetchSolicitacoesLattes = useCallback(async () => {
    setLoadingSolicitacoes(true);
    try {
      const resp = await getSolicitacoesLattes(params.tenant, Number(params.ano));
      setSolicitacoesLattes(resp || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Erro", "Falha ao carregar as solicitações de Lattes.");
    } finally {
      setLoadingSolicitacoes(false);
    }
  }, [params.tenant, params.ano]);

  useEffect(() => {
    fetchSolicitacoesLattes();
  }, [fetchSolicitacoesLattes]);

  const enviarDecisao = async (solicitacao, payload) => {
    try {
      const resp = await decidirSolicitacaoLattes(params.tenant, solicitacao.id, payload);
      setDecisaoResultado(resp?.mensagem ? { mensagem: resp.mensagem, celular: resp.celular } : null);
      await fetchSolicitacoesLattes();
      showToast(
        "success",
        payload.aprovado ? "Solicitação aprovada" : "Solicitação recusada",
        "Copie a mensagem pra avisar o avaliador."
      );
    } catch (err) {
      console.error(err);
      showToast("error", "Erro", err.response?.data?.message || "Falha ao decidir a solicitação");
    }
  };

  // modal "Ano de conclusão do doutorado" (aprovação)
  const [solicitacaoParaAprovar, setSolicitacaoParaAprovar] = useState(null);
  const [anoTitulacaoInput, setAnoTitulacaoInput] = useState("");

  const abrirModalAprovar = (solicitacao) => {
    setAnoTitulacaoInput("");
    setSolicitacaoParaAprovar(solicitacao);
    setSolicitacaoSelecionada(null);
  };

  const confirmarAprovacao = async () => {
    const anoTitulacao = parseInt(anoTitulacaoInput, 10);
    const anoAtual = new Date().getFullYear();
    if (!anoTitulacao || anoTitulacao < 1950 || anoTitulacao > anoAtual) {
      showToast("error", "Ano inválido", `Informe um ano entre 1950 e ${anoAtual}.`);
      return;
    }
    await enviarDecisao(solicitacaoParaAprovar, { aprovado: true, anoTitulacao });
    setSolicitacaoParaAprovar(null);
  };

  const handleRecusarSolicitacao = async (solicitacao) => {
    const jaEstavaAprovado = solicitacao.status === "APROVADO";
    const aviso = jaEstavaAprovado
      ? "Isso não remove o Cargo de avaliador já concedido — pra tirar o acesso, remova o cargo dele na aba \"Avaliadores\". Motivo da recusa (opcional):"
      : "Motivo da recusa (opcional):";
    const motivoRecusa = window.prompt(aviso) || undefined;
    await enviarDecisao(solicitacao, { aprovado: false, motivoRecusa });
    setSolicitacaoSelecionada(null);
  };

  // modal de detalhe/edição (clique na linha) — reenviar mensagem ou reabrir a decisão
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);

  const handleReenviarMensagem = async (solicitacao) => {
    try {
      const resp = await reenviarMensagemSolicitacaoLattes(params.tenant, solicitacao.id);
      setDecisaoResultado(resp?.mensagem ? { mensagem: resp.mensagem, celular: resp.celular } : null);
      setSolicitacaoSelecionada(null);
    } catch (err) {
      console.error(err);
      showToast("error", "Erro", err.response?.data?.message || "Falha ao gerar a mensagem.");
    }
  };

  return (
    <>
      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
        <h4>Enviar convite</h4>
        <p>Informe os destinatários e personalize a mensagem.</p>

        {/* --- dados de cabeçalho ----- */}
        <div className="mt-1  ">
          <div className="mt-1">
            <label className=" mt-2 mb-1">Para:</label>
            <InputText
              style={{ width: "100%" }}
              value={paraField}
              disabled={selecionados.length > 0}
              onChange={(e) => setParaField(e.target.value)}
            />
          </div>

          <div className="mt-1">
            <label className="">Instituição:</label>
            <InputText
              style={{ width: "100%" }}
              value={instituicaoNome}
              onChange={(e) => setInstituicaoNome(e.target.value)}
            />
          </div>
          <div className="mt-1">
            <label className="">Nome do gestor IC:</label>
            <InputText
              style={{ width: "100%" }}
              value={gestorNome}
              onChange={(e) => setGestorNome(e.target.value)}
            />
          </div>
          <div className="mt-1">
            <label className="">E-mail de suporte:</label>
            <InputText
              keyfilter="email"
              style={{ width: "100%" }}
              value={contatoEmail}
              onChange={(e) => setContatoEmail(e.target.value)}
            />
          </div>
          <div className="mt-1">
            <label className="">Telefone de suporte:</label>
            <InputMask
              mask="(99) 99999-9999"
              placeholder="(61) 91234-5678"
              style={{ width: "100%" }}
              value={contatoFone}
              onChange={(e) => setContatoFone(e.value)}
            />
          </div>
          <div className="flex gap-1 mt-1 mb-1">
            <div className="">
              <label className="">Data inicial:</label>
              <Calendar
                value={dataInicial}
                onChange={(e) => setDataInicial(e.value)}
                showIcon
                dateFormat="dd/mm/yy"
                style={{ width: "100%" }}
              />
            </div>
            <div className="">
              <label className="">Data final:</label>
              <Calendar
                value={dataFinal}
                onChange={(e) => setDataFinal(e.value)}
                showIcon
                dateFormat="dd/mm/yy"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* --- campo CONTEÚDO ----- */}
        <label className="">Conteúdo do e-mail:</label>
        <Editor
          style={{ height: 240 }}
          value={emailContent}
          onTextChange={(e) => setEmailContent(e.htmlValue)}
        />

        {/* --- botões ----- */}
        <div className="flex justify-content-end mt-4">
          <Button
            label={loadingEnviarConvite ? "Enviado..." : "Enviar"}
            icon="pi pi-check"
            onClick={async () => {
              /* ───── validações rápidas ───── */
              if (!emailContent.trim()) {
                showToast(
                  "warn",
                  "Mensagem vazia",
                  "Digite o conteúdo do e-mail."
                );
                return;
              }

              // Validação de campos obrigatórios
              if (!instituicaoNome.trim()) {
                showToast(
                  "warn",
                  "Instituição vazia",
                  "Informe o nome da instituição."
                );
                return;
              }

              if (!gestorNome.trim()) {
                showToast("warn", "Gestor vazio", "Informe o nome do gestor.");
                return;
              }

              if (!contatoEmail.trim()) {
                showToast(
                  "warn",
                  "E-mail vazio",
                  "Informe o e-mail de contato."
                );
                return;
              }

              if (!contatoFone.trim()) {
                showToast(
                  "warn",
                  "Telefone vazio",
                  "Informe o telefone de contato."
                );
                return;
              }

              if (!dataInicial || !dataFinal) {
                showToast("warn", "Datas faltando", "Informe as duas datas.");
                return;
              }

              if (dataInicial > dataFinal) {
                showToast(
                  "error",
                  "Datas inconsistentes",
                  "A data inicial deve ser anterior à final."
                );
                return;
              }

              /* ───── validação do campo PARA quando não há linhas selecionadas ───── */
              if (!selecionados.length && !paraField.trim()) {
                showToast(
                  "error",
                  "Destinatários faltando",
                  "Informe os destinatários ou selecione avaliadores na tabela."
                );
                return;
              }

              if (!selecionados.length && paraField.trim()) {
                const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const emailsDigitados = paraField
                  .split(";")
                  .map((e) => e.trim())
                  .filter(Boolean);
                const algumInvalido = emailsDigitados.some(
                  (em) => !reEmail.test(em)
                );
                if (emailsDigitados.length === 0 || algumInvalido) {
                  showToast(
                    "error",
                    "Formato inválido",
                    "Separe os e-mails com ponto-e-vírgula (;) e use endereços válidos."
                  );
                  return;
                }
              }

              try {
                setLoadingEnviarConvite(true);
                const payload = {
                  ano: Number(params.ano),
                  emails: selecionados.length
                    ? selectedRows.map((row) => ({ cargoId: row.id })) // internos
                    : paraField
                        .split(";")
                        .map((e) => e.trim())
                        .filter(Boolean), // externos
                  mensagem: emailContent,
                  dataInicial: dataInicial.toISOString(),
                  dataFinal: dataFinal.toISOString(),
                };

                const resp = await enviarConvitesAvaliadores(
                  params.tenant,
                  payload
                );
                await atualizarAvaliadores(
                  params.tenant,
                  setAvaliadores,
                  setTodasAreas
                );
                showToast("success", "Convites enviados", resp.message);
              } catch (err) {
                console.error(err);
                showToast(
                  "error",
                  "Erro",
                  err.response?.data?.message || "Falha no envio"
                );
              }
              setLoadingEnviarConvite(false);
              /* limpa & fecha */
              setInviteModalOpen(false);
              setEmailContent("");
              setDataInicial(null);
              setDataFinal(null);
            }}
          />
        </div>
      </Modal>
      <Modal isOpen={!!decisaoResultado} onClose={() => setDecisaoResultado(null)}>
        <h4>Mensagem pronta pra enviar</h4>
        <p>Copie e envie pro avaliador, ou abra direto no WhatsApp dele.</p>
        <div className="mt-2 mb-2" style={{ whiteSpace: "pre-wrap" }}>
          {decisaoResultado?.mensagem}
        </div>
        <div className="flex justify-content-end gap-1">
          <Button
            label="Copiar mensagem"
            icon="pi pi-copy"
            className="p-button-secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(decisaoResultado?.mensagem || "");
                showToast("success", "Copiado", "Mensagem copiada para a área de transferência.");
              } catch (err) {
                console.error(err);
                showToast("error", "Erro", "Não foi possível copiar a mensagem.");
              }
            }}
          />
          {decisaoResultado?.celular ? (
            <a
              href={`https://wa.me/55${decisaoResultado.celular.replace(/\D/g, "")}?text=${encodeURIComponent(
                decisaoResultado.mensagem || ""
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button label="Abrir no WhatsApp" icon="pi pi-whatsapp" />
            </a>
          ) : (
            <span className="text-sm text-color-secondary">
              Avaliador sem celular cadastrado.
            </span>
          )}
        </div>
      </Modal>
      <Modal isOpen={!!solicitacaoParaAprovar} onClose={() => setSolicitacaoParaAprovar(null)}>
        <h4>Aprovar avaliador</h4>
        <p>
          Informe o ano de conclusão do doutorado de{" "}
          {solicitacaoParaAprovar?.user?.nome}.
        </p>
        <div className="mt-2">
          <label className="mb-1">Ano de conclusão do doutorado:</label>
          <InputText
            style={{ width: "100%" }}
            keyfilter="int"
            maxLength={4}
            value={anoTitulacaoInput}
            onChange={(e) => setAnoTitulacaoInput(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex justify-content-end mt-2">
          <Button label="Confirmar aprovação" icon="pi pi-check" onClick={confirmarAprovacao} />
        </div>
      </Modal>
      <Modal isOpen={!!solicitacaoSelecionada} onClose={() => setSolicitacaoSelecionada(null)}>
        <h4>{solicitacaoSelecionada?.user?.nome}</h4>
        <p>CPF: {solicitacaoSelecionada?.user?.cpf}</p>
        <p>E-mail: {solicitacaoSelecionada?.user?.email}</p>
        <p>
          <a href={solicitacaoSelecionada?.linkLattes} target="_blank" rel="noreferrer">
            Abrir Currículo Lattes
          </a>
        </p>
        <p className="mt-1">
          Status:{" "}
          {solicitacaoSelecionada &&
            (() => {
              const info = SOLICITACAO_STATUS_LABELS[solicitacaoSelecionada.status] ?? {
                label: solicitacaoSelecionada.status,
                severity: "info",
              };
              return <Tag value={info.label} severity={info.severity} />;
            })()}
        </p>
        {solicitacaoSelecionada?.motivoRecusa && (
          <p className="mt-1">Motivo da recusa: {solicitacaoSelecionada.motivoRecusa}</p>
        )}

        <div className="flex-space gap-1 mt-3">
          {solicitacaoSelecionada?.status === "PENDENTE" && (
            <>
              <Button
                label="Aprovar"
                icon="pi pi-check"
                className="p-button-success"
                onClick={() => abrirModalAprovar(solicitacaoSelecionada)}
              />
              <Button
                label="Recusar"
                icon="pi pi-times"
                className="p-button-danger"
                onClick={() => handleRecusarSolicitacao(solicitacaoSelecionada)}
              />
            </>
          )}
          {solicitacaoSelecionada?.status === "APROVADO" && (
            <>
              <Button
                label="Reverter aprovação (engano)"
                icon="pi pi-undo"
                className="p-button-danger"
                onClick={() => handleRecusarSolicitacao(solicitacaoSelecionada)}
              />
              <Button
                label="Reenviar mensagem"
                icon="pi pi-send"
                className="p-button-secondary"
                onClick={() => handleReenviarMensagem(solicitacaoSelecionada)}
              />
            </>
          )}
          {solicitacaoSelecionada?.status === "RECUSADO" && (
            <>
              <Button
                label="Aprovar mesmo assim"
                icon="pi pi-check"
                className="p-button-success"
                onClick={() => abrirModalAprovar(solicitacaoSelecionada)}
              />
              <Button
                label="Reenviar mensagem"
                icon="pi pi-send"
                className="p-button-secondary"
                onClick={() => handleReenviarMensagem(solicitacaoSelecionada)}
              />
            </>
          )}
        </div>
        {solicitacaoSelecionada?.status === "APROVADO" && (
          <p className="mt-2 text-sm text-color-secondary">
            Reverter aqui só corrige o registro da solicitação — pra tirar o
            acesso de fato, remova o cargo dele na aba &quot;Avaliadores&quot;.
          </p>
        )}
      </Modal>
      {renderModalContent()}
      <Toast ref={toast} /> {/* Componente Toast */}
      <main>
        <Card className="mb-4 p-2">
          <div className={style.configuracoes}>
            <div className={style.icon}>
              <RiSettings5Line />
            </div>
            <ul>
              <li
                className={style.enviar}
                style={{ cursor: "not-allowed" }}
                title="Envio de e-mail pelo sistema está indisponível no momento."
              >
                <Button icon="pi pi-send" disabled>
                  <p>
                    Enviar{" "}
                    {selectedCount > 0 && (
                      <span className={style.badge}>{selectedCount}</span>
                    )}{" "}
                    convite{selectedCount > 1 && "s"}
                  </p>
                </Button>
              </li>
            </ul>
          </div>
          <div className="mt-2">
            <label className="mb-1">Link de convite do avaliador ({params.ano}):</label>
            <div className="flex-space gap-1">
              <InputText style={{ width: "100%" }} value={linkGeralAvaliador} readOnly />
              <Button icon="pi pi-copy" label="Copiar" onClick={copiarLinkGeral} />
            </div>
            <p className="mt-1 text-sm text-color-secondary">
              Mesmo link pra todo mundo — envie por e-mail ou compartilhe em grupos
              de WhatsApp. Quem já tem doutorado confirmado vira avaliador na hora;
              quem não tem cai na fila de "Solicitações Lattes" abaixo.
            </p>
          </div>
        </Card>

        <div className={style.abas}>
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              className={`${style.aba} ${abaAtiva === aba.id ? style.abaAtiva : ""}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {abaAtiva === "avaliadores" && (
        <Card className="custom-card">
          {loading ? (
            <div className="pr-2 pl-2 pb-2 pt-2">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            </div>
          ) : (
            <>
              <h5 className="pt-2 pl-2 pr-2">Avaliadores</h5>
              <DataTable
                ref={dataTableRef}
                value={avaliadoresFiltrados}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50]}
                scrollable
                dataKey="id"
                header={renderHeader()}
                filters={filters}
                filterDisplay="menu"
                globalFilterFields={[
                  "user.nome",
                  "user.email",
                  "user.celular",
                  "nivel",
                ]}
                emptyMessage="Nenhum avaliador encontrado."
                onRowClick={(e) => {
                  setSelectedRows([]);
                  openModalAndSetData(e.data);
                }}
                rowClassName="clickable-row" // Adiciona cursor pointer e hover effect
                paginatorRight={paginatorRight}
                paginatorLeft={paginatorLeft}
                selection={selectedRows}
                onSelectionChange={(e) => setSelectedRows(e.value)}
              >
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3rem" }}
                  frozen
                />
                <Column
                  header="Nome"
                  body={(rowData) => (
                    <div>
                      <h6 className="m-0">{rowData.user.nome}</h6>
                      <p className="m-0 text-sm text-color-secondary">
                        {rowData.user.email}
                      </p>
                      <p className="m-0 mt-1 text-sm text-color-secondary">
                        {rowData.user.celular}
                      </p>
                    </div>
                  )}
                  sortable
                  sortField="user.nome"
                  filter
                  filterField="user.nome"
                  filterPlaceholder="Filtrar por nome"
                />

                <Column
                  header="Nível"
                  body={(rowData) =>
                    rowData.nivel === 0
                      ? "Ad hoc"
                      : rowData.nivel === 1
                      ? "Comitê Institucional"
                      : "Comitê Externo"
                  }
                  sortable
                  filter
                  filterPlaceholder="Filtrar por nível"
                />
                <Column
                  header="Status do Convite"
                  body={(rowData) =>
                    renderStatusTagWithJustificativa(
                      rowData.user.avaliadorAnoStatus
                    )
                  }
                  style={{ textAlign: "center" }}
                  sortable
                  filter
                  //filterPlaceholder="Filtrar por nível"
                />
                <Column
                  header="Disponível pra avaliar"
                  body={(rowData) => {
                    const avaliadorAno = rowData.user.AvaliadorAno;

                    const statusAtual = avaliadorAno[0]?.status ?? "PENDENTE";
                    const isLoading = loadingRows[rowData.id];

                    return (
                      <div
                        className="flex justify-content-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDisponivel(rowData, statusAtual);
                        }}
                      >
                        {isLoading ? (
                          <i
                            className="pi pi-spinner pi-spin"
                            style={{ fontSize: "1.25rem" }}
                          />
                        ) : (
                          <i
                            className={classNames("pi", {
                              "pi-check text-green-500":
                                statusAtual === "CONFIRMADO",
                              "pi-hourglass text-yellow-500":
                                statusAtual === "PENDENTE",
                              "pi-thumbs-down text-red-400":
                                statusAtual === "RECUSADO",
                            })}
                            style={{ fontSize: "1.25rem" }}
                          />
                        )}
                      </div>
                    );
                  }}
                  style={{ width: "100px", textAlign: "center" }}
                />
                <Column
                  body={(rowData) => (
                    <div
                      className="flex align-items-center justify-content-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rowData);
                      }}
                    >
                      <i
                        className={classNames("pi", "pi-trash", "text-red-400")}
                        style={{ fontSize: "1.25rem" }}
                      />
                    </div>
                  )}
                />
              </DataTable>
            </>
          )}
        </Card>
        )}

        {abaAtiva === "lattes" && (
          <Card className="custom-card">
            {loadingSolicitacoes ? (
              <div className="pr-2 pl-2 pb-2 pt-2">
                <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
              </div>
            ) : (
              <>
                <h5 className="pt-2 pl-2 pr-2">Solicitações de análise de Lattes</h5>
                <p className="pl-2 pr-2 text-sm text-color-secondary">
                  Clique numa linha pra ver detalhes, reenviar a mensagem ou
                  corrigir uma decisão.
                </p>
                <DataTable
                  value={solicitacoesLattes}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  scrollable
                  dataKey="id"
                  emptyMessage="Nenhuma solicitação ainda."
                  onRowClick={(e) => setSolicitacaoSelecionada(e.data)}
                  rowClassName="clickable-row"
                >
                  <Column field="user.nome" header="Nome" sortable />
                  <Column field="user.cpf" header="CPF" />
                  <Column field="user.email" header="E-mail" />
                  <Column
                    header="Lattes"
                    body={(row) => (
                      <a
                        href={row.linkLattes}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Abrir Lattes
                      </a>
                    )}
                  />
                  <Column
                    header="Status"
                    field="status"
                    sortable
                    body={(row) => {
                      const info = SOLICITACAO_STATUS_LABELS[row.status] ?? { label: row.status, severity: "info" };
                      return <Tag value={info.label} severity={info.severity} />;
                    }}
                  />
                  <Column
                    header="Ações"
                    body={(row) =>
                      row.status === "PENDENTE" ? (
                        <div className="flex-space gap-1">
                          <Button
                            icon="pi pi-check"
                            className="p-button-success p-button-sm"
                            label="Aprovar"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalAprovar(row);
                            }}
                          />
                          <Button
                            icon="pi pi-times"
                            className="p-button-danger p-button-sm"
                            label="Recusar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecusarSolicitacao(row);
                            }}
                          />
                        </div>
                      ) : (
                        "—"
                      )
                    }
                  />
                </DataTable>
              </>
            )}
          </Card>
        )}
      </main>
    </>
  );
};

export default Page;
