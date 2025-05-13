"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./ModalStyleInscricao.module.scss";
import {
  RiUserAddLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCloseLine,
} from "@remixicon/react";

import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";

import {
  getCpfAutorizados,
  createCpfAutorizado,
  deleteCpfAutorizado,
} from "@/app/api/client/tenant"; // ajuste o caminho
import cpfValidator from "@/lib/cpfValidator";
// Botão do PrimeReact (apelidado para evitar conflito de nome)
import { Button as PButton } from "primereact/button";

// Seu botão personalizado (importação default)
import Button from "./Button";

const PermissoesInscricao = ({ params }) => {
  /* ───────── estados principais ───────── */
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);

  /* busca e filtros */
  const [globalFilter, setGlobalFilter] = useState("");
  const [cadastradoFilter, setCadastradoFilter] = useState(null);

  /* diálogo de criação */
  const [showDialog, setShowDialog] = useState(false);
  const [novoCpf, setNovoCpf] = useState("");
  const [novoNome, setNovoNome] = useState("");

  const toast = useRef(null);

  /* ───────── carregar lista ───────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { registros } = await getCpfAutorizados(params.tenant);
      setRegistros(registros);
    } catch (e) {
      console.error(e);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível carregar registros",
      });
    } finally {
      setLoading(false);
    }
  }, [params.tenant]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ───────── criação ───────── */
  const handleCreate = async () => {
    // remove pontos ou hífens digitados pelo usuário
    const cpfLimpo = novoCpf.replace(/\D/g, "");

    /* ───── validações básicas ───── */
    if (!cpfLimpo || !novoNome.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Campos obrigatórios",
        detail: "Preencha CPF e nome",
      });
      return;
    }

    if (!cpfValidator(cpfLimpo)) {
      toast.current.show({
        severity: "error",
        summary: "CPF inválido",
        detail: "Digite um CPF válido",
      });
      return;
    }

    /* ───── chamada à API ───── */
    try {
      await createCpfAutorizado(params.tenant, {
        cpf: cpfLimpo,
        nome: novoNome.trim(),
      });

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Registro criado",
      });

      setShowDialog(false);
      setNovoCpf("");
      setNovoNome("");
      fetchData(); // recarrega lista
    } catch (e) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: e?.response?.data?.error || "Falha ao criar registro",
      });
    }
  };

  /* ───────── exclusão ───────── */
  const confirmDelete = (row) => {
    confirmDialog({
      message: `Excluir CPF ${row.cpf}?`,
      header: "Confirmação",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      accept: async () => {
        try {
          await deleteCpfAutorizado(params.tenant, row.id);
          toast.current.show({
            severity: "success",
            summary: "Excluído",
            detail: "Registro removido",
          });
          fetchData();
        } catch (e) {
          toast.current.show({
            severity: "error",
            summary: "Erro",
            detail: e?.response?.data?.error || "Falha ao excluir registro",
          });
        }
      },
    });
  };

  const deleteBody = (row) => (
    <PButton
      icon={<RiDeleteBinLine />}
      className="p-button-text p-button-danger"
      onClick={() => confirmDelete(row)}
      tooltip="Excluir"
    />
  );

  /* ───────── templates DataTable ───────── */
  const statusBody = (row) =>
    row.userCadastrado ? (
      <RiCheckLine className="text-green-500" />
    ) : (
      <RiCloseLine className="text-red-400" />
    );

  /* ───────── filtros DataTable ───────── */
  const filters = {
    global: { value: globalFilter, matchMode: FilterMatchMode.CONTAINS },
    userCadastrado: {
      value: cadastradoFilter,
      matchMode: FilterMatchMode.EQUALS,
    },
  };

  const cadastradoFilterElement = (
    <Dropdown
      value={cadastradoFilter}
      options={[
        { label: "Todos", value: null },
        { label: "Sim", value: true },
        { label: "Não", value: false },
      ]}
      onChange={(e) => setCadastradoFilter(e.value)}
      placeholder="Todos"
      showClear
      className="p-column-filter"
    />
  );

  /* ───────── header DataTable ───────── */
  const tableHeader = (
    <div className="flex justify-content-between align-items-center gap-1">
      <span className="p-input-icon-left w-12rem">
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar nome ou CPF"
        />
      </span>

      {/* botão customizado */}
      <div style={{ width: "150px" }}>
        <Button
          className="btn-primary w-50" // use suas classes utilitárias
          icon={RiUserAddLine}
          onClick={() => setShowDialog(true)}
        >
          Novo
        </Button>
      </div>
    </div>
  );

  return (
    <div className={styles.content}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <h5 className="mb-3">Usuários autorizados</h5>
      <p>
        Os usuários abaixo poderão se inscrever nos editais da sua instituição
      </p>
      <DataTable
        value={registros}
        loading={loading}
        paginator
        rows={10}
        filters={filters}
        globalFilterFields={["nome", "cpf"]}
        header={tableHeader}
        emptyMessage="Nenhum registro encontrado"
      >
        <Column
          field="nome"
          style={{ maxWidth: "120px" }}
          header="Nome"
          sortable
        />
        <Column field="cpf" header="CPF" sortable />
        <Column
          field="userCadastrado"
          header="Cadastrado?"
          body={statusBody}
          dataType="boolean"
          filter
          filterElement={cadastradoFilterElement}
          showFilterMenu={false}
        />
        <Column body={deleteBody} style={{ width: "4rem" }} />
      </DataTable>

      {/* diálogo para novo registro */}
      <Dialog
        header={<h6>Novo CPF autorizado</h6>}
        visible={showDialog}
        style={{ width: "26rem" }}
        onHide={() => setShowDialog(false)}
        modal
      >
        <div className="p-fluid ">
          <div className="field">
            <label htmlFor="cpf">CPF</label>
            <InputText
              id="cpf"
              value={novoCpf}
              onChange={(e) => setNovoCpf(e.target.value)}
              keyfilter="pint"
              maxLength={11}
            />
          </div>
          <div className="field mt-2">
            <label htmlFor="nome">Nome</label>
            <InputText
              id="nome"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-content-end mt-3 mb-2">
          <PButton
            label="Cancelar"
            className="p-button-text mr-2"
            onClick={() => setShowDialog(false)}
          />
          <PButton label="Salvar" icon="pi pi-check" onClick={handleCreate} />
        </div>
      </Dialog>
    </div>
  );
};

export default PermissoesInscricao;
