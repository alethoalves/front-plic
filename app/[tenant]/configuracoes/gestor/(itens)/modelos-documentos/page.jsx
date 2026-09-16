"use client";
import { useEffect, useRef, useState } from "react";

import Header from "@/components/Header";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { getDocumentoTemplates } from "@/app/api/client/documentos";
import {
  getConfiguracaoTabela,
  upsertConfiguracaoTabela,
} from "@/app/api/client/configuracaoTabela";

import styles from "./page.module.scss";

const CHAVE_DOCUMENTO_OBRIGATORIO_SUBSTITUICAO_ALUNO =
  "documentoTemplateObrigatorioSubstituicaoAluno";

const Page = ({ params }) => {
  const { tenant } = params;
  const toast = useRef(null);

  const [documentoTemplates, setDocumentoTemplates] = useState([]);
  const [documentoTemplateId, setDocumentoTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const templates = await getDocumentoTemplates(tenant);
        setDocumentoTemplates(templates || []);

        const valor = await getConfiguracaoTabela(
          tenant,
          CHAVE_DOCUMENTO_OBRIGATORIO_SUBSTITUICAO_ALUNO
        );
        setDocumentoTemplateId(valor?.documentoTemplateId ?? null);
      } catch (err) {
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao carregar os modelos de documento.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant]);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await upsertConfiguracaoTabela(
        tenant,
        CHAVE_DOCUMENTO_OBRIGATORIO_SUBSTITUICAO_ALUNO,
        { documentoTemplateId }
      );
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Configuração salva com sucesso!",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao salvar a configuração.",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main>
      <Toast ref={toast} />
      <Header
        className="mb-3"
        titulo="Modelos de Documentos"
        subtitulo="Documento obrigatório em substituições de aluno"
        descricao="Escolha qual modelo de documento deve se tornar obrigatório automaticamente para toda nova participação do tipo aluno criada por substituição."
      />

      <div className={styles.content}>
        <label className={styles.label}>Modelo de documento obrigatório</label>
        <Dropdown
          value={documentoTemplateId}
          options={documentoTemplates.map((dt) => ({
            label: dt.titulo,
            value: dt.id,
          }))}
          onChange={(e) => setDocumentoTemplateId(e.value)}
          placeholder="Nenhum (não exigir documento)"
          showClear
          disabled={loading}
          className={styles.dropdown}
        />

        <Button
          label={salvando ? "Salvando..." : "Salvar"}
          className="p-button-success mt-3"
          onClick={handleSalvar}
          disabled={loading || salvando}
        />
      </div>
    </main>
  );
};

export default Page;
