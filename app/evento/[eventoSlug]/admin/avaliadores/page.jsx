"use client";

import { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import {
  consultarAvaliadoresEvento,
  editarAvaliadorEvento,
} from "@/app/api/client/avaliadoresEvento";
import { FilterMatchMode } from "primereact/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
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

  // Template para a coluna de vinculação com clique e ícone de edição
  const vinculacaoBodyTemplate = (rowData) => {
    if (rowData.vinculoAtivo === false) {
      return <span>{getVinculacao(rowData)}</span>;
    }

    return (
      <div
        className="cursor-pointer text-primary hover:underline flex align-items-center gap-2"
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
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <InputText
        className="w-100"
        value={globalFilterValue}
        onChange={onGlobalFilterChange}
        placeholder="Buscar..."
      />
      <Button
        icon="pi pi-file-excel"
        label="Exportar"
        onClick={exportExcel}
        className="ml-2"
      />
    </div>
  );

  // Footer do diálogo
  // Footer do diálogo com loading
  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={() => setVinculacaoDialogVisible(false)}
        className="p-button-text"
        disabled={salvandoVinculacao}
      />
      <Button
        label={salvandoVinculacao ? "Salvando..." : "Salvar"}
        icon={salvandoVinculacao ? "pi pi-spinner pi-spin" : "pi pi-check"}
        onClick={salvarVinculacao}
        autoFocus
        disabled={salvandoVinculacao}
      />
    </div>
  );

  return (
    <div className={styles.navContent}>
      <Toast ref={toast} />

      {/* Diálogo de edição de vinculação */}
      <Dialog
        visible={vinculacaoDialogVisible}
        style={{ width: "500px" }}
        header="Editar Vinculação"
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={() => setVinculacaoDialogVisible(false)}
      >
        {avaliadorSelecionado && (
          <div className="field">
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
                <div className="field mt-3">
                  <label>Selecione a lotação:</label>
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

      <div className="card mb-4">
        <div>
          <label htmlFor="conviteLink" className="mb-1">
            Convite Avaliador:
          </label>

          <div className="flex mt-1 flex-1 align-items-center gap-1">
            <InputText
              id="conviteLink"
              value={tokenConvite ? getConviteLink() : "Carregando..."}
              readOnly
              className="w-100"
            />
            <Button
              icon="pi pi-copy"
              onClick={copyToClipboard}
              tooltip="Copiar link"
              tooltipOptions={{ position: "top" }}
              severity="secondary"
              className="p-button-outlined"
              disabled={!tokenConvite}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <DataTable
          ref={dataTableRef}
          value={avaliadores}
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
        </DataTable>
      </div>
    </div>
  );
};

export default Page;
