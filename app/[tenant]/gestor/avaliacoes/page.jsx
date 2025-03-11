"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { MultiSelect } from "primereact/multiselect";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Tooltip } from "primereact/tooltip";
import { getInscricaoProjetoByTenant } from "@/app/api/client/projeto";
import Modal from "@/components/Modal"; // Importe o componente Modal personalizado
import ModalInscricao from "@/components/ModalInscricao"; // Importe o componente ModalInscricao
import FormGestorProjetoCreateOrEdit from "@/components/Formularios/FormGestorProjetoCreateOrEdit";
import style from "./page.module.scss"; // Importe o componente Modal personalizado
import AvaliacoesProjetos from "@/components/avaliacoes/avaliacoesProjetos";
import AvaliadoresProjetos from "@/components/avaliacoes/AvaliadoresProjetos";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inscricoesProjetos, setInscricoesProjetos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a abertura do modal
  const [selectedInscricao, setSelectedInscricao] = useState(null); // Estado para armazenar a inscrição selecionada
  const [selectedInscricoes, setSelectedInscricoes] = useState([]);

  const processarInscricoes = async (tenant, setInscricoesProjetos) => {
    // Buscar os dados da API
    const inscricoesProjetos = await getInscricaoProjetoByTenant(
      tenant,
      "enviada"
    );

    // Processar os dados
    const inscricoesComColunasVirtuais = inscricoesProjetos.map((inscricao) => {
      const quantidadeFichas = inscricao.FichaAvaliacao?.length || 0;
      const notaMedia =
        quantidadeFichas > 0
          ? (
              inscricao.FichaAvaliacao.reduce(
                (sum, ficha) => sum + (ficha.notaTotal || 0),
                0
              ) / quantidadeFichas
            ).toFixed(2)
          : "N/A";

      const avaliadores = inscricao.InscricaoProjetoAvaliador.map(
        (avaliador) => avaliador.avaliador.nome
      ).join(", ");

      // Quantidade de avaliadores
      const quantidadeAvaliadores =
        inscricao.InscricaoProjetoAvaliador?.length || 0;

      // Diferença entre a maior e a menor nota
      const notas = inscricao.FichaAvaliacao.map(
        (ficha) => ficha.notaTotal || 0
      );
      const diferencaNotas =
        notas.length > 0 ? Math.max(...notas) - Math.min(...notas) : "N/A";

      return {
        ...inscricao,
        quantidadeFichas,
        notaMedia,
        avaliadores,
        quantidadeAvaliadores, // Nova coluna virtual
        diferencaNotas, // Nova coluna virtual
      };
    });

    // Atualizar o estado com os dados processados
    setInscricoesProjetos(inscricoesComColunasVirtuais || []);
  };

  return (
    <>
      <main>
        <div className={style.content}>
          <AvaliacoesProjetos params={params} />
          <AvaliadoresProjetos params={params} />
        </div>
      </main>
    </>
  );
};

export default Page;
