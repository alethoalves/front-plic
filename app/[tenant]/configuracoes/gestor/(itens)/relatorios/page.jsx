"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { relatorioEmailsUsuarios } from "@/app/api/client/relatorios";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownloadEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      await relatorioEmailsUsuarios(params.tenant);
    } catch (err) {
      setError("Erro ao gerar o relatório. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
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
          <h5 className="mt-0 mb-1">Emails de Usuários</h5>
          <p className="mt-0 mb-3" style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Gera uma planilha com o nome, email e tipo (Aluno ou Orientador) de todos os usuários
            participantes. Cada combinação única de usuário e tipo é listada uma vez.
          </p>
          {error && (
            <p className="mb-2" style={{ color: "#dc2626", fontSize: "0.875rem" }}>
              {error}
            </p>
          )}
          <Button
            label="Baixar Excel"
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-file-excel"}
            className="p-button-success"
            onClick={handleDownloadEmails}
            disabled={loading}
          />
        </Card>
      </div>
    </main>
  );
};

export default Page;
