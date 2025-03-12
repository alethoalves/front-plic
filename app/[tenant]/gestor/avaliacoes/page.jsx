"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
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
import AvaliacoesProjetos from "@/components/avaliacoes/AvaliacoesProjetos";
import AvaliadoresProjetos from "@/components/avaliacoes/AvaliadoresProjetos";
import Button from "@/components/Button";
import { Toast } from "primereact/toast"; // Importe o Toast do PrimeReact
import { atribuicaoDeProjetosPeloGestor } from "@/app/api/client/avaliador"; // Importe a função de atribuição
import { getCargos } from "@/app/api/client/cargo";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avaliadoresList, setAvaliadoresList] = useState([]); // Estado para armazenar os avaliadores selecionados
  const [projetos, setProjetos] = useState([]); // Estado para armazenar os projetos selecionados
  const [isProcessing, setIsProcessing] = useState(false); // Estado para controlar o carregamento do botão
  const toast = useRef(null); // Referência para o Toast
  const [inscricoesProjetos, setInscricoesProjetos] = useState([]);
  const [todasAreas, setTodasAreas] = useState([]);
  const [avaliadores, setAvaliadores] = useState([]);
  // Função para exibir mensagens de sucesso ou erro no Toast
  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  // Função para lidar com a atribuição de projetos
  const handleAtribuicao = async () => {
    //console.log(projetos);
    //console.log(avaliadoresList);
    //return;
    setIsProcessing(true); // Ativa o estado de carregamento

    try {
      // Monta o corpo da requisição
      const body = {
        inscricaoProjetos: projetos,
        avaliadores: avaliadoresList,
      };

      // Chama a função de atribuição
      const response = await atribuicaoDeProjetosPeloGestor(
        params.tenant,
        body
      );

      // Verifica se a resposta e response.data existem
      if (response && response.data) {
        // Verifica se há associações bem-sucedidas
        if (response.data.associacoesBemSucedidas?.length > 0) {
          response.data.associacoesBemSucedidas.forEach((associacao) => {
            showToast("success", "Sucesso", associacao.message);
          });
        }

        // Verifica se há associações com falha
        if (response.data.associacoesFalhas?.length > 0) {
          response.data.associacoesFalhas.forEach((falha) => {
            showToast("error", "Erro", falha.message);
          });
        }

        // Caso não haja associações bem-sucedidas nem falhas, exibe uma mensagem genérica
        if (
          !response.data.associacoesBemSucedidas?.length &&
          !response.data.associacoesFalhas?.length
        ) {
          showToast("success", "Sucesso", "Atribuição realizada com sucesso!");
        }
      } else {
        showToast("success", "Sucesso", "Atribuição realizada com sucesso!");
      }

      // Atualiza as inscrições e avaliadores
      const atualizacaoProjeto = await processarInscricoes(
        params.tenant,
        setInscricoesProjetos
      );
      await atualizarAvaliadores(params.tenant, setAvaliadores, setTodasAreas);
    } catch (error) {
      // Captura a mensagem de erro da API ou usa uma mensagem padrão
      const errorData = error.response?.data;

      // Verifica se o erro contém uma lista de falhas
      if (errorData?.associacoesFalhas?.length > 0) {
        // Exibe um toast para cada falha
        errorData.associacoesFalhas.forEach((falha) => {
          showToast("error", "Erro", falha.message);
        });
      } else {
        // Caso não haja lista de falhas, exibe uma mensagem de erro genérica
        const errorMessage =
          errorData?.message ||
          error.message ||
          "Erro ao realizar a atribuição.";
        showToast("error", "Erro", errorMessage);
      }
    } finally {
      setIsProcessing(false); // Desativa o estado de carregamento
    }
  };
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

  const calcularProjetosAvaliados = (avaliador) => {
    return avaliador.user.InscricaoProjetoAvaliador.reduce(
      (total, inscricao) => {
        return total + (inscricao.inscricaoProjeto.FichaAvaliacao?.length || 0);
      },
      0
    );
  };
  const atualizarAvaliadores = async (
    tenant,
    setAvaliadores,
    setTodasAreas
  ) => {
    const avaliadores = await getCargos(tenant, {
      cargo: "avaliador",
    });

    // Adicionar colunas virtuais
    const avaliadoresComColunasVirtuais = avaliadores.map((avaliador) => ({
      ...avaliador,
      projetosAvaliados: calcularProjetosAvaliados(avaliador), // Coluna virtual
      projetosAtribuidos: avaliador.user.InscricaoProjetoAvaliador.length, // Coluna virtual
    }));

    setAvaliadores(avaliadoresComColunasVirtuais || []);

    // Extrair todas as áreas de atuação únicas
    const areasUnicas = [
      ...new Set(
        avaliadores.flatMap((avaliador) =>
          avaliador.user.userArea.map((ua) => ua.area.area)
        )
      ),
    ];
    setTodasAreas(areasUnicas.map((area) => ({ label: area, value: area })));
  };
  return (
    <>
      <main>
        <div className={style.content}>
          <AvaliacoesProjetos
            params={params}
            setProjetosSelecionados={setProjetos}
            processarInscricoes={processarInscricoes}
            inscricoesProjetos={inscricoesProjetos}
            setInscricoesProjetos={setInscricoesProjetos}
          />
          {avaliadoresList?.length > 0 && projetos?.length > 0 && (
            <button
              className="button btn-primary"
              onClick={handleAtribuicao}
              disabled={isProcessing} // Desabilita o botão durante o processamento
            >
              {isProcessing ? (
                <p>Carregando...</p>
              ) : (
                <p>
                  {projetos.length === 1 && avaliadoresList.length === 1
                    ? `Atribuir 1 projeto para ${avaliadoresList[0].user.nome}`
                    : projetos.length === 1 && avaliadoresList.length > 1
                    ? `Atribuir 1 projeto para vários avaliadores`
                    : projetos.length > 1 && avaliadoresList.length === 1
                    ? `Atribuir ${projetos.length} projetos para ${avaliadoresList[0].user.nome}`
                    : "Distribuição automática"}
                </p>
              )}
            </button>
          )}
          <AvaliadoresProjetos
            params={params}
            setAvaliadoresSelecionados={setAvaliadoresList}
            calcularProjetosAvaliados={calcularProjetosAvaliados}
            atualizarAvaliadores={atualizarAvaliadores}
            setAvaliadores={setAvaliadores}
            avaliadores={avaliadores}
            setTodasAreas={setTodasAreas}
            todasAreas={todasAreas}
            processarInscricoes={processarInscricoes}
            setInscricoesProjetos={setInscricoesProjetos}
            inscricoesProjetos={inscricoesProjetos}
          />
        </div>
      </main>
      {/* Componente Toast para exibir mensagens */}
      <Toast ref={toast} />
    </>
  );
};

export default Page;
