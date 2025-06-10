/*
  Componente: NotificarAvaliador.jsx
  Tabela de avaliadores com projetos pendentes
*/
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import Header from "@/components/Header";
import {
  enviarNotificacaoAvaliador,
  getAvaliadoresComProjetosPendentes,
} from "@/app/api/client/avaliador";
import styles from "./NotificarAvaliador.module.scss";
import { Skeleton } from "primereact/skeleton";

export default function NotificarAvaliador({ params }) {
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [avaliadores, setAvaliadores] = useState([]);
  const [error, setError] = useState(null);
  const [selectedAvaliadores, setSelectedAvaliadores] = useState([]);
  const [globalFilter, setGlobalFilter] = useState(null);
  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [dataFinalizacao, setDataFinalizacao] = useState(null);
  const [isTodayOrAfter, setIsTodayOrAfter] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAvaliadoresComProjetosPendentes(
        params.tenant,
        params.ano
      );
      setAvaliadores(response.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar dados.");
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.ano]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Verifica se a data selecionada é hoje ou no futuro
    if (dataFinalizacao) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(dataFinalizacao);
      selectedDate.setHours(0, 0, 0, 0);
      setIsTodayOrAfter(selectedDate >= today);
    } else {
      setIsTodayOrAfter(false);
    }
  }, [dataFinalizacao]);

  const handleEnviarNotificacao = async () => {
    if (selectedAvaliadores.length === 0 || !dataFinalizacao) return;

    setLoadingEnvio(true);

    try {
      const payload = {
        tenantId: Number(params.tenant),
        lista: selectedAvaliadores.map((a) => ({
          nome: a.nome,
          email: a.email,
        })),
        data: dataFinalizacao.toISOString().split("T")[0], // Formato YYYY-MM-DD
      };

      const response = await enviarNotificacaoAvaliador(params.tenant, payload);

      toast.current?.show({
        severity: "success",
        summary: "Notificações enviadas",
        detail: `${response.resultado.length} notificações foram enviadas com sucesso.`,
        life: 5000,
      });

      setSelectedAvaliadores([]);
      setDataFinalizacao(null);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro ao enviar",
        detail: err.response?.data?.message || "Erro ao enviar notificações",
        life: 6000,
      });
    } finally {
      setLoadingEnvio(false);
    }
  };

  const header = (
    <div className="flex flex-wrap justify-content-between align-items-center gap-2">
      <span className="p-input-icon-left mb-2">
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Pesquisar..."
        />
      </span>
      {selectedAvaliadores.length > 0 && (
        <div className="flex align-items-center gap-1">
          <Calendar
            value={dataFinalizacao}
            onChange={(e) => setDataFinalizacao(e.value)}
            dateFormat="dd/mm/yy"
            placeholder="Data final"
            showIcon
            className={!isTodayOrAfter && dataFinalizacao ? "p-invalid" : ""}
            minDate={new Date()}
          />
          <Button
            label="Enviar notificação"
            icon="pi pi-send"
            className="p-button-sm p-button-success"
            onClick={handleEnviarNotificacao}
            loading={loadingEnvio}
            disabled={loadingEnvio || !dataFinalizacao || !isTodayOrAfter}
            tooltip={
              !isTodayOrAfter && dataFinalizacao
                ? "A data deve ser hoje ou no futuro"
                : undefined
            }
            tooltipOptions={{ position: "top" }}
          />
        </div>
      )}
    </div>
  );

  const nomeEmailBodyTemplate = (rowData) => {
    return (
      <div className="flex flex-column">
        <span className="font-bold">{rowData.nome}</span>
        <span className="text-sm text-color-secondary">{rowData.email}</span>
      </div>
    );
  };

  const pendenciasBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.totalPendentes}
        severity={rowData.totalPendentes > 0 ? "danger" : "success"}
        rounded
      />
    );
  };

  const selectionBodyTemplate = (rowData) => {
    return (
      <Checkbox
        checked={selectedAvaliadores.some((item) => item.id === rowData.id)}
        onChange={(e) => {
          let _selectedAvaliadores = [...selectedAvaliadores];

          if (e.checked) {
            _selectedAvaliadores.push(rowData);
          } else {
            _selectedAvaliadores = _selectedAvaliadores.filter(
              (item) => item.id !== rowData.id
            );
          }

          setSelectedAvaliadores(_selectedAvaliadores);
        }}
      />
    );
  };

  return (
    <>
      <Toast ref={toast} />
      <Header
        subtitulo="Notificar Avaliadores"
        descricao="Notifique avaliadores que estejam com projetos atribuídos e ainda não avaliados."
        className="mb-3"
      />

      <div className={styles.content}>
        {loading ? (
          <div className="card">
            <DataTable value={Array(5)}>
              <Column field="nome" header="Nome" body={<Skeleton />} />
              <Column field="email" header="Email" body={<Skeleton />} />
              <Column
                field="pendencias"
                header="Pendências"
                body={<Skeleton />}
              />
            </DataTable>
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="card">
            <DataTable
              value={avaliadores}
              selection={selectedAvaliadores}
              onSelectionChange={(e) => setSelectedAvaliadores(e.value)}
              dataKey="id"
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} avaliadores"
              globalFilter={globalFilter}
              header={header}
              emptyMessage="Nenhum avaliador encontrado"
            >
              <Column
                selectionMode="multiple"
                headerStyle={{ width: "3rem" }}
                body={selectionBodyTemplate}
              />
              <Column
                field="nome"
                header="Avaliador"
                body={nomeEmailBodyTemplate}
                sortable
                filter
                filterPlaceholder="Pesquisar por nome"
              />
              <Column
                field="totalPendentes"
                header="Pendências"
                body={pendenciasBodyTemplate}
                sortable
                align="center"
              />
            </DataTable>
          </div>
        )}
      </div>
    </>
  );
}
