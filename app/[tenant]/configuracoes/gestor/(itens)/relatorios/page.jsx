"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { getCookie } from "cookies-next";
import { relatorioEmailsUsuarios, relatorioInscricoesExcel, relatorioProjetosExcel } from "@/app/api/client/relatorios";

const Page = ({ params }) => {
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [errorEmails, setErrorEmails] = useState(null);
  const [loadingInscricoes, setLoadingInscricoes] = useState(false);
  const [errorInscricoes, setErrorInscricoes] = useState(null);
  const [loadingProjetos, setLoadingProjetos] = useState(false);
  const [errorProjetos, setErrorProjetos] = useState(null);

  const handleDownloadEmails = async () => {
    setLoadingEmails(true);
    setErrorEmails(null);
    try {
      await relatorioEmailsUsuarios(params.tenant);
    } catch (err) {
      setErrorEmails("Erro ao gerar o relatório. Tente novamente.");
      console.error(err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleDownloadInscricoes = async () => {
    setLoadingInscricoes(true);
    setErrorInscricoes(null);
    try {
      const ano = getCookie("anoSelected");
      await relatorioInscricoesExcel(params.tenant, ano);
    } catch (err) {
      setErrorInscricoes("Erro ao gerar o relatório. Tente novamente.");
      console.error(err);
    } finally {
      setLoadingInscricoes(false);
    }
  };

  const handleDownloadProjetos = async () => {
    setLoadingProjetos(true);
    setErrorProjetos(null);
    try {
      const ano = getCookie("anoSelected");
      await relatorioProjetosExcel(params.tenant, ano);
    } catch (err) {
      setErrorProjetos("Erro ao gerar o relatório. Tente novamente.");
      console.error(err);
    } finally {
      setLoadingProjetos(false);
    }
  };

  return (
    <main>
      <Header
        className="mb-3"
        titulo="Relatórios"
        descricao="Gere relatórios do Programa de Iniciação Científica"
      />
      <div className="flex flex-column gap-3">
        <Card pt={{ content: { style: { padding: "1.5rem" } } }}>
          <h5 className="mt-0 mb-1">Projetos</h5>
          <p className="mt-0 mb-3" style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Gera uma planilha com título do projeto, edital, ano, proponente, lotação do proponente, área, grande área, status da inscrição, quantidade de planos de trabalho, alunos e solicitações de bolsa.
          </p>
          {errorProjetos && (
            <p className="mb-2" style={{ color: "#dc2626", fontSize: "0.875rem" }}>
              {errorProjetos}
            </p>
          )}
          <Button
            label="Baixar Excel"
            icon={loadingProjetos ? "pi pi-spin pi-spinner" : "pi pi-file-excel"}
            className="p-button-success"
            onClick={handleDownloadProjetos}
            disabled={loadingProjetos}
          />
        </Card>
        <Card pt={{ content: { style: { padding: "1.5rem" } } }}>
          <h5 className="mt-0 mb-1">Inscrições</h5>
          <p className="mt-0 mb-3" style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Gera uma planilha com ID, edital, status, proponente (nome e email), orientadores e alunos de todas as inscrições.
          </p>
          {errorInscricoes && (
            <p className="mb-2" style={{ color: "#dc2626", fontSize: "0.875rem" }}>
              {errorInscricoes}
            </p>
          )}
          <Button
            label="Baixar Excel"
            icon={loadingInscricoes ? "pi pi-spin pi-spinner" : "pi pi-file-excel"}
            className="p-button-success"
            onClick={handleDownloadInscricoes}
            disabled={loadingInscricoes}
          />
        </Card>
        <Card pt={{ content: { style: { padding: "1.5rem" } } }}>
          <h5 className="mt-0 mb-1">Emails de Usuários</h5>
          <p className="mt-0 mb-3" style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Gera uma planilha com o nome, email e tipo (Aluno ou Orientador) de todos os usuários
            participantes. Cada combinação única de usuário e tipo é listada uma vez.
          </p>
          {errorEmails && (
            <p className="mb-2" style={{ color: "#dc2626", fontSize: "0.875rem" }}>
              {errorEmails}
            </p>
          )}
          <Button
            label="Baixar Excel"
            icon={loadingEmails ? "pi pi-spin pi-spinner" : "pi pi-file-excel"}
            className="p-button-success"
            onClick={handleDownloadEmails}
            disabled={loadingEmails}
          />
        </Card>
      </div>
    </main>
  );
};

export default Page;
