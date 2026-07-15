"use client";
// HOOKS
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
// COMPONENTES
import Header from "@/components/Header";
// PRIMEREACT
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { MultiSelect } from "primereact/multiselect";
import { Tag } from "primereact/tag";

// FUNÇÕES
import {
  aplicarNotaCorte,
  getAllPlanoDeTrabalhosByTenant,
} from "@/app/api/client/planoDeTrabalho";
import calcularMedia from "@/lib/calcularMedia";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { FilterService } from "primereact/api";
import { Dialog } from "primereact/dialog";
import TabelaPlanoDeTrabalho from "@/components/tabelas/TabelaPlanoDeTrabalho";
// Registra filtro personalizado para intervalo de notas
FilterService.register("nota_intervalo", (value, filters) => {
  const [min, max] = filters || [null, null];

  if (min === null && max === null) return true; // Sem filtro
  if (min !== null && value < min) return false; // Valor abaixo do mínimo
  if (max !== null && value > max) return false; // Valor acima do máximo
  return true; // Passou no filtro
});
const Page = ({ params }) => {
  // ESTADOS

  return (
    <>
      <main className={styles.main}>
        <Header className="mb-3" titulo="Aplicar nota de corte" />
        <TabelaPlanoDeTrabalho params={params} />
      </main>
    </>
  );
};

export default Page;
