"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import { Toast } from "primereact/toast";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Button as PrimeButton } from "primereact/button";
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiFileExcelLine,
  RiUserAddLine,
} from "@remixicon/react";
import Button from "@/components/Button";
import {
  consultarAvaliadoresEvento,
  editarAvaliadorEvento,
  cadastrarAvaliadorEvento,
  excluirAvaliadorEvento,
} from "@/app/api/client/avaliadoresEvento";
import { FilterMatchMode } from "primereact/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import styles from "./page.module.scss";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [avaliadores, setAvaliadores] = useState([]);
  const [tokenConvite, setTokenConvite] = useState("");
  const [eventoNome, setEventoNome] = useState("");
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [rootOptions] = useState([
    { label: "Sim", value: true },
    { label: "Não", value: false },
  ]);

  // Estados para o diálogo de edição de vinculação
  const [vinculacaoDialogVisible, setVinculacaoDialogVisible] = useState(false);
  const [avaliadorSelecionado, setAvaliadorSelecionado] = useState(null);
  const [tenantSelecionado, setTenantSelecionado] = useState(null);
  const [lotacaoSelecionada, setLotacaoSelecionada] = useState(null);
  const [opcoesTenants, setOpcoesTenants] = useState([]);
  const [opcoesLotacoes, setOpcoesLotacoes] = useState([]);
  const [salvandoVinculacao, setSalvandoVinculacao] = useState(false); // ← Novo estado
  const [isExportando, setIsExportando] = useState(false);
  const [filtroAreaIds, setFiltroAreaIds] = useState([]);
  const [filtroSubsessaoIds, setFiltroSubsessaoIds] = useState([]);

  // Estados para o diálogo de cadastro direto de avaliador
  const [cadastroDialogVisible, setCadastroDialogVisible] = useState(false);
  const [cpfCadastro, setCpfCadastro] = useState("");
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);

  // Estados para o diálogo de remoção de vínculo
  const [excluirDialogVisible, setExcluirDialogVisible] = useState(false);
  const [avaliadorParaExcluir, setAvaliadorParaExcluir] = useState(null);
  const [salvandoExclusao, setSalvandoExclusao] = useState(false);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "user.nome": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "user.email": { value: null, matchMode: FilterMatchMode.CONTAINS },
    avaliadorRoot: { value: null, matchMode: FilterMatchMode.IN },
  });

  const toast = useRef(null);
  const dataTableRef = useRef(null);

  const getVinculacao = (avaliador) => {
    if (avaliador.vinculoAtivo === false) {
      return "Vínculo removido";
    }

    if (avaliador.tenant && avaliador.tenant.sigla) {
      return avaliador.tenant.sigla;
    }

    if (avaliador.tenantLotacao && avaliador.tenantLotacao.lotacao) {
      if (
        avaliador.tenantLotacao.tenant &&
        avaliador.tenantLotacao.tenant.sigla
      ) {
        return `${avaliador.tenantLotacao.tenant.sigla} - ${avaliador.tenantLotacao.lotacao}`;
      }
      return avaliador.tenantLotacao.lotacao;
    }

    if (avaliador.externo === true) {
      return "Externo";
    }

    return "Não informado";
  };

  // Opções do filtro de Área, derivadas dos avaliadores já carregados
  // (UserArea não é escopado por evento — reflete toda área que o
  // avaliador já escolheu em qualquer evento/edital, não só este).
  const opcoesArea = useMemo(() => {
    const porId = new Map();
    avaliadores.forEach((avaliador) => {
      (avaliador.user?.userArea || []).forEach(({ areaId, area }) => {
        if (!area || porId.has(areaId)) return;
        porId.set(areaId, {
          value: areaId,
          label: `${area.area} (${area.grandeArea?.grandeArea})`,
        });
      });
    });
    return [...porId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [avaliadores]);

  // Opções do filtro de Subsessão, derivadas dos avaliadores já carregados.
  const opcoesSubsessao = useMemo(() => {
    const porId = new Map();
    avaliadores.forEach((avaliador) => {
      (avaliador.user?.ConviteAvaliadorEvento || []).forEach((convite) => {
        (convite.conviteSubsessao || []).forEach(({ subsessaoApresentacao: sub }) => {
          if (!sub || porId.has(sub.id)) return;
          porId.set(sub.id, {
            value: sub.id,
            label: `${sub.sessaoApresentacao?.titulo} — ${formatarData(
              sub.inicio,
            )} ${formatarHora(sub.inicio)}`,
          });
        });
      });
    });
    return [...porId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [avaliadores]);

  const avaliadoresFiltrados = useMemo(() => {
    return avaliadores.filter((avaliador) => {
      if (filtroAreaIds.length > 0) {
        const areasDoAvaliador = (avaliador.user?.userArea || []).map(
          (ua) => ua.areaId,
        );
        if (!filtroAreaIds.some((id) => areasDoAvaliador.includes(id))) {
          return false;
        }
      }

      if (filtroSubsessaoIds.length > 0) {
        const subsessoesDoAvaliador = (
          avaliador.user?.ConviteAvaliadorEvento || []
        ).flatMap((convite) =>
          (convite.conviteSubsessao || []).map(
            (cs) => cs.subsessaoApresentacao?.id,
          ),
        );
        if (
          !filtroSubsessaoIds.some((id) => subsessoesDoAvaliador.includes(id))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [avaliadores, filtroAreaIds, filtroSubsessaoIds]);

  const fetchData = async (eventoSlug) => {
    setLoading(true);
    try {
      const response = await consultarAvaliadoresEvento(eventoSlug);
      setAvaliadores(response.avaliadores || []);
      setTokenConvite(response.evento?.tokenConvite || "");
      setEventoNome(response.evento?.nomeEvento || "");

      // Preparar opções de tenants para o dropdown
      const tenantsFormatados =
        response.evento?.tenants?.map((t) => ({
          label: t.tenant.sigla,
          value: t.tenant.id,
          lotacoes: t.tenant.TenantLotacao || [],
        })) || [];

      // Adicionar opção "Externo"
      tenantsFormatados.push({
        label: "Externo",
        value: "externo",
        lotacoes: [],
      });

      setOpcoesTenants(tenantsFormatados);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      showToast("error", "Erro", "Falha ao carregar avaliadores");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  // Função para abrir o diálogo de edição de vinculação
  const abrirDialogVinculacao = (rowData) => {
    if (rowData.vinculoAtivo === false) return;

    setAvaliadorSelecionado(rowData);

    // Configurar estado inicial baseado na vinculação atual
    if (rowData.externo) {
      setTenantSelecionado("externo");
      setLotacaoSelecionada(null);
      setOpcoesLotacoes([]);
    } else if (rowData.tenantId) {
      setTenantSelecionado(rowData.tenantId);
      setLotacaoSelecionada(null);
      // Encontrar o tenant e suas lotações
      const tenant = opcoesTenants.find((t) => t.value === rowData.tenantId);
      setOpcoesLotacoes(tenant?.lotacoes || []);
    } else if (rowData.tenantLotacaoId) {
      // Encontrar o tenant da lotação
      const lotacaoTenant = opcoesTenants.find((t) =>
        t.lotacoes.some((l) => l.id === rowData.tenantLotacaoId)
      );
      if (lotacaoTenant) {
        setTenantSelecionado(lotacaoTenant.value);
        setLotacaoSelecionada(rowData.tenantLotacaoId);
        setOpcoesLotacoes(lotacaoTenant.lotacoes);
      }
    } else {
      setTenantSelecionado(null);
      setLotacaoSelecionada(null);
      setOpcoesLotacoes([]);
    }

    setVinculacaoDialogVisible(true);
  };

  // Função para lidar com a mudança de tenant selecionado
  const handleTenantChange = (e) => {
    const tenantId = e.value;
    setTenantSelecionado(tenantId);

    if (tenantId === "externo") {
      setLotacaoSelecionada(null);
      setOpcoesLotacoes([]);
    } else {
      setLotacaoSelecionada(null);
      const tenantSelecionado = opcoesTenants.find((t) => t.value === tenantId);
      setOpcoesLotacoes(tenantSelecionado?.lotacoes || []);
    }
  };

  // Função para salvar a vinculação
  const salvarVinculacao = async () => {
    if (!avaliadorSelecionado) return;

    setSalvandoVinculacao(true); // Iniciar loading

    try {
      let payload = {};

      if (tenantSelecionado === "externo") {
        payload = { externo: true };
      } else if (lotacaoSelecionada) {
        payload = { tenantLotacaoId: lotacaoSelecionada };
      } else if (tenantSelecionado) {
        payload = { tenantId: tenantSelecionado };
      } else {
        // Se nada foi selecionado, limpar vinculação
        payload = {
          tenantId: null,
          tenantLotacaoId: null,
          externo: false,
        };
      }

      // Atualizar estado local primeiro para feedback imediato
      setAvaliadores((prev) =>
        prev.map((avaliador) =>
          avaliador.id === avaliadorSelecionado.id
            ? { ...avaliador, ...payload }
            : avaliador
        )
      );

      const response = await editarAvaliadorEvento(
        avaliadorSelecionado.id,
        params.eventoSlug,
        payload
      );

      if (response.avaliador) {
        // Atualizar com dados do servidor
        setAvaliadores((prev) =>
          prev.map((avaliador) =>
            avaliador.id === avaliadorSelecionado.id
              ? response.avaliador
              : avaliador
          )
        );
        showToast("success", "Sucesso", "Vinculação atualizada com sucesso");
      }

      setVinculacaoDialogVisible(false);
    } catch (error) {
      console.error("Erro ao atualizar vinculação:", error);
      showToast("error", "Erro", "Falha ao atualizar vinculação");

      // Reverter mudanças em caso de erro
      setAvaliadores((prev) =>
        prev.map((avaliador) =>
          avaliador.id === avaliadorSelecionado.id
            ? avaliadorSelecionado
            : avaliador
        )
      );
    } finally {
      setSalvandoVinculacao(false); // Finalizar loading
    }
  };

  // Função para cadastrar um avaliador diretamente pelo CPF
  const cadastrarAvaliador = async () => {
    if (!cpfCadastro) return;

    setSalvandoCadastro(true);

    try {
      const response = await cadastrarAvaliadorEvento(
        params.eventoSlug,
        cpfCadastro
      );

      if (response.avaliador) {
        setAvaliadores((prev) => [response.avaliador, ...prev]);
        showToast("success", "Sucesso", "Avaliador cadastrado com sucesso");
        setCadastroDialogVisible(false);
        setCpfCadastro("");
      }
    } catch (error) {
      console.error("Erro ao cadastrar avaliador:", error);
      const mensagem =
        error?.response?.data?.message || "Falha ao cadastrar avaliador";
      showToast("error", "Erro", mensagem);
    } finally {
      setSalvandoCadastro(false);
    }
  };

  // Excluir o vínculo de um avaliador com o evento (só permitido quando ele
  // ainda não avaliou nenhuma submissão neste evento — validado também no
  // backend).
  const handleExcluirVinculo = (rowData) => {
    setAvaliadorParaExcluir(rowData);
    setExcluirDialogVisible(true);
  };

  const confirmarExclusaoVinculo = async () => {
    if (!avaliadorParaExcluir) return;

    setSalvandoExclusao(true);
    try {
      await excluirAvaliadorEvento(params.eventoSlug, avaliadorParaExcluir.id);
      setAvaliadores((prev) =>
        prev.filter((a) => a.id !== avaliadorParaExcluir.id)
      );
      showToast("success", "Sucesso", "Vínculo removido com sucesso");
      setExcluirDialogVisible(false);
    } catch (error) {
      const mensagem =
        error?.response?.data?.message || "Falha ao remover vínculo";
      showToast("error", "Erro", mensagem);
    } finally {
      setSalvandoExclusao(false);
    }
  };

  // Template para a coluna de vinculação com clique e ícone de edição
  const vinculacaoBodyTemplate = (rowData) => {
    if (rowData.vinculoAtivo === false) {
      return <span>{getVinculacao(rowData)}</span>;
    }

    return (
      <div
        className={`${styles.vinculacaoLink} cursor-pointer flex align-items-center gap-2`}
        onClick={() => abrirDialogVinculacao(rowData)}
      >
        <i className="pi pi-pencil" style={{ fontSize: "0.875rem" }}></i>
        <span>{getVinculacao(rowData)}</span>
      </div>
    );
  };

  const handleAvaliadorRootChange = async (rowData, newValue) => {
    try {
      setAvaliadores((prevAvaliadores) =>
        prevAvaliadores.map((avaliador) =>
          avaliador.id === rowData.id
            ? { ...avaliador, avaliadorRoot: newValue }
            : avaliador
        )
      );

      const payload = { avaliadorRoot: newValue };
      const response = await editarAvaliadorEvento(
        rowData.id,
        params.eventoSlug,
        payload
      );

      if (response.avaliador) {
        setAvaliadores((prevAvaliadores) =>
          prevAvaliadores.map((avaliador) =>
            avaliador.id === rowData.id
              ? {
                  ...avaliador,
                  avaliadorRoot: response.avaliador.avaliadorRoot,
                }
              : avaliador
          )
        );
      }

      showToast("success", "Sucesso", "Avaliador atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar avaliador:", error);
      setAvaliadores((prevAvaliadores) =>
        prevAvaliadores.map((avaliador) =>
          avaliador.id === rowData.id
            ? { ...avaliador, avaliadorRoot: rowData.avaliadorRoot }
            : avaliador
        )
      );
      showToast("error", "Erro", "Falha ao atualizar avaliador");
    }
  };

  const rootBodyTemplate = (rowData) => {
    if (rowData.vinculoAtivo === false) {
      return "—";
    }

    return (
      <Dropdown
        value={rowData.avaliadorRoot}
        options={rootOptions}
        onChange={(e) => handleAvaliadorRootChange(rowData, e.value)}
        placeholder="Selecionar"
        className="w-full"
        disabled={loading}
      />
    );
  };

  const rootFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value || []}
        options={rootOptions}
        onChange={(e) => options.filterApplyCallback(e.value)}
        optionLabel="label"
        placeholder="Selecione"
        className="p-column-filter"
        maxSelectedLabels={2}
        style={{ minWidth: "120px" }}
      />
    );
  };

  // Só permite excluir o vínculo de avaliadores sem nenhuma avaliação
  // registrada neste evento — evita apagar histórico de quem já avaliou.
  const acoesBodyTemplate = (rowData) => {
    if (rowData.vinculoAtivo === false || rowData.qntAvaliacoes > 0) {
      return null;
    }

    return (
      <PrimeButton
        icon="pi pi-trash"
        className="p-button-danger p-button-text p-button-sm"
        title="Remover vínculo com o evento"
        onClick={() => handleExcluirVinculo(rowData)}
      />
    );
  };

  const getConviteLink = () => {
    return `https://www.plic.app.br/evento/${params.eventoSlug}/avaliador/convite-link/${tokenConvite}`;
  };

  const copyToClipboard = () => {
    if (!tokenConvite) return;

    const link = getConviteLink();
    navigator.clipboard
      .writeText(link)
      .then(() => {
        showToast(
          "success",
          "Copiado!",
          "Link de convite copiado para a área de transferência"
        );
      })
      .catch((err) => {
        showToast("error", "Erro", "Falha ao copiar o link");
      });
  };

  useEffect(() => {
    fetchData(params.eventoSlug);
  }, [params.eventoSlug]);

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const emailBodyTemplate = (rowData) => {
    return (
      rowData.user.email ||
      (rowData.user.ConviteAvaliadorEvento.length > 0
        ? rowData.user.ConviteAvaliadorEvento[
            rowData.user.ConviteAvaliadorEvento.length - 1
          ].email
        : "N/A")
    );
  };

  const exportExcel = async () => {
    setIsExportando(true);
    try {
      const dadosParaExportar =
        dataTableRef.current?.getFilteredValue?.() ?? avaliadores;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Avaliadores");
      worksheet.columns = [
        { header: "Nome", key: "nome", width: 30 },
        { header: "CPF", key: "cpf", width: 18 },
        { header: "E-mail", key: "email", width: 30 },
        { header: "Vinculação", key: "vinculacao", width: 30 },
        { header: "Avaliador Root", key: "avaliadorRoot", width: 15 },
        { header: "Avaliações Realizadas", key: "qntAvaliacoes", width: 20 },
      ];
      dadosParaExportar.forEach((avaliador) => {
        worksheet.addRow({
          nome: avaliador.user.nome,
          cpf: avaliador.user.cpf,
          email: emailBodyTemplate(avaliador),
          vinculacao: getVinculacao(avaliador),
          avaliadorRoot: avaliador.avaliadorRoot ? "Sim" : "Não",
          qntAvaliacoes: avaliador.qntAvaliacoes ?? 0,
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Avaliadores-${params.eventoSlug}.xlsx`);
    } finally {
      setIsExportando(false);
    }
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <InputText
        className={`${styles.eventoInput} w-100`}
        value={globalFilterValue}
        onChange={onGlobalFilterChange}
        placeholder="Buscar..."
      />
      <Button
        icon={RiFileExcelLine}
        onClick={exportExcel}
        className="btn-secondary ml-2"
        disabled={isExportando}
      >
        {isExportando ? "Exportando..." : "Exportar"}
      </Button>
    </div>
  );

  // Footer do diálogo
  // Footer do diálogo com loading
  const dialogFooter = (
    <div>
      <Button
        icon={RiCloseLine}
        onClick={() => setVinculacaoDialogVisible(false)}
        className="btn-link"
        disabled={salvandoVinculacao}
      >
        Cancelar
      </Button>
      <Button
        icon={RiCheckLine}
        onClick={salvarVinculacao}
        className="btn-primary"
        disabled={salvandoVinculacao}
      >
        {salvandoVinculacao ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );

  // Footer do diálogo de cadastro de avaliador
  const cadastroDialogFooter = (
    <div className="flex justify-content-end align-items-center gap-1">
      <Button
        icon={RiCloseLine}
        onClick={() => setCadastroDialogVisible(false)}
        className={`btn-secondary ${styles.footerButton}`}
        disabled={salvandoCadastro}
      >
        Cancelar
      </Button>
      <Button
        icon={RiCheckLine}
        onClick={cadastrarAvaliador}
        className={`btn-primary ${styles.footerButton}`}
        disabled={
          salvandoCadastro || !cpfCadastro || cpfCadastro.includes("_")
        }
      >
        {salvandoCadastro ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </div>
  );

  // Footer do diálogo de remoção de vínculo
  const excluirDialogFooter = (
    <div className="flex justify-content-end align-items-center gap-1">
      <Button
        icon={RiCloseLine}
        onClick={() => setExcluirDialogVisible(false)}
        className={`btn-secondary ${styles.footerButton}`}
        disabled={salvandoExclusao}
      >
        Cancelar
      </Button>
      <Button
        icon={RiDeleteBinLine}
        onClick={confirmarExclusaoVinculo}
        className={`btn-error ${styles.footerButton}`}
        disabled={salvandoExclusao}
      >
        {salvandoExclusao ? "Removendo..." : "Sim, remover"}
      </Button>
    </div>
  );

  if (loading && avaliadores.length === 0) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.navContent}>
      <Toast ref={toast} />

      {/* Diálogo de edição de vinculação */}
      <Dialog
        visible={vinculacaoDialogVisible}
        style={{ width: "500px" }}
        header="Editar Vinculação"
        modal
        className={`p-fluid ${styles.eventoDialog}`}
        footer={dialogFooter}
        onHide={() => setVinculacaoDialogVisible(false)}
      >
        {avaliadorSelecionado && (
          <div>
            <Dropdown
              value={tenantSelecionado}
              options={opcoesTenants}
              onChange={handleTenantChange}
              optionLabel="label"
              placeholder="Selecione uma instituição"
              className="mt-2"
              filter // 🔥 habilita a busca
              filterPlaceholder="Buscar..." // placeholder no campo de busca
            />

            {tenantSelecionado &&
              tenantSelecionado !== "externo" &&
              opcoesLotacoes.length > 0 && (
                <div className="mt-3">
                  <label className={styles.eventoLabel}>
                    Selecione a lotação:
                  </label>
                  <Dropdown
                    value={lotacaoSelecionada}
                    options={opcoesLotacoes}
                    onChange={(e) => setLotacaoSelecionada(e.value)}
                    optionLabel="lotacao"
                    optionValue="id"
                    placeholder="Selecione uma lotação"
                    className="mt-2"
                    filter // 🔥 habilita a busca
                    filterPlaceholder="Buscar..." // placeholder no campo de busca
                  />
                </div>
              )}
          </div>
        )}
      </Dialog>

      {/* Diálogo de cadastro direto de avaliador */}
      <Dialog
        visible={cadastroDialogVisible}
        style={{ width: "500px" }}
        header="Cadastrar Avaliador"
        modal
        className={`p-fluid ${styles.eventoDialog}`}
        footer={cadastroDialogFooter}
        onHide={() => {
          setCadastroDialogVisible(false);
          setCpfCadastro("");
        }}
      >
        <p className={styles.dialogDescricao}>
          Informe o CPF do avaliador. Se já houver cadastro com esse CPF, a
          pessoa será apenas vinculada a este evento; caso contrário, um
          novo cadastro é criado automaticamente.
        </p>

        <label className={styles.eventoLabel}>CPF</label>
        <InputMask
          mask="999.999.999-99"
          value={cpfCadastro}
          onChange={(e) => setCpfCadastro(e.value || "")}
          placeholder="000.000.000-00"
          className={`${styles.eventoInput} mt-2`}
          autoFocus
        />
      </Dialog>

      {/* Diálogo de remoção de vínculo */}
      <Dialog
        visible={excluirDialogVisible}
        style={{ width: "500px" }}
        header="Remover avaliador"
        modal
        className={`p-fluid ${styles.eventoDialog}`}
        footer={excluirDialogFooter}
        onHide={() => setExcluirDialogVisible(false)}
      >
        {avaliadorParaExcluir && (
          <p className={styles.dialogDescricao}>
            Remover o vínculo de{" "}
            <strong>{avaliadorParaExcluir.user?.nome}</strong> com este
            evento? Essa ação não pode ser desfeita.
          </p>
        )}
      </Dialog>

      <div className={styles.dashboard}>
        <div className={styles.tituloPagina}>
          <h5>Lista de Avaliadores</h5>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h6>Convite</h6>
            <p>
              Compartilhe este link para que avaliadores se cadastrem no
              evento.
            </p>
          </div>

          <div className="flex mt-1 flex-1 align-items-center gap-1">
            <InputText
              id="conviteLink"
              aria-label="Link de convite do avaliador"
              value={tokenConvite ? getConviteLink() : "Carregando..."}
              readOnly
              className={`${styles.eventoInput} w-100`}
            />
            <Button
              icon={RiFileCopyLine}
              onClick={copyToClipboard}
              title="Copiar link"
              className="btn-secondary"
              disabled={!tokenConvite}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div
            className={`${styles.sectionHead} flex justify-content-between align-items-center`}
          >
            <div>
              <h6>Avaliadores</h6>
              <p>
                Busque, edite vínculos e exporte a lista de avaliadores do
                evento.
              </p>
            </div>
            <Button
              icon={RiUserAddLine}
              className="btn-primary"
              title="Cadastrar Avaliador"
              onClick={() => setCadastroDialogVisible(true)}
            />
          </div>

          <div className={styles.filterBar}>
            <div>
              <label className={styles.eventoLabel}>Área</label>
              <MultiSelect
                value={filtroAreaIds}
                options={opcoesArea}
                onChange={(e) => setFiltroAreaIds(e.value)}
                placeholder="Todas as áreas"
                filter
                className="w-100"
                display="chip"
              />
            </div>
            <div>
              <label className={styles.eventoLabel}>Subsessão</label>
              <MultiSelect
                value={filtroSubsessaoIds}
                options={opcoesSubsessao}
                onChange={(e) => setFiltroSubsessaoIds(e.value)}
                placeholder="Todas as subsessões"
                filter
                className="w-100"
                display="chip"
              />
            </div>
          </div>

          <p className={styles.contador}>
            {avaliadoresFiltrados.length} de {avaliadores.length}{" "}
            {avaliadores.length === 1 ? "avaliador" : "avaliadores"}
          </p>

          <DataTable
            ref={dataTableRef}
            className={styles.eventoTable}
            value={avaliadoresFiltrados}
            paginator
            filterDisplay="row"
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            loading={loading}
            filters={filters}
            globalFilterFields={["user.nome", "user.email", "avaliadorRoot"]}
            header={header}
            emptyMessage="Nenhum avaliador encontrado."
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} avaliadores"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          >
            <Column
              field="user.nome"
              header="Nome"
              sortable
              filter
              filterPlaceholder="Buscar por nome"
            />
            <Column
              field="user.email"
              header="E-mail"
              body={emailBodyTemplate}
              sortable
              filter
              filterPlaceholder="Buscar por e-mail"
            />
            <Column
              header="Vinculação"
              body={vinculacaoBodyTemplate}
              sortable
              sortField={(rowData) => getVinculacao(rowData)}
              style={{ width: "280px", maxWidth: "280px" }}
              bodyStyle={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
            <Column
              field="avaliadorRoot"
              header="Avaliador Root"
              body={rootBodyTemplate}
              sortable
              filter
              filterField="avaliadorRoot"
              showFilterMenu={false}
              filterElement={rootFilterTemplate}
            />
            <Column
              field="qntAvaliacoes"
              header="Avaliações Realizadas"
              sortable
            />
            <Column
              header="Ações"
              body={acoesBodyTemplate}
              style={{ width: "80px", textAlign: "center" }}
            />
          </DataTable>
        </section>
      </div>
    </div>
  );
};

export default Page;
