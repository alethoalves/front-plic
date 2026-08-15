"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";

// PRIMEREACT
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";

// COMPONENTES
import NoData from "@/components/NoData";
import TabelaRespostasAtividade from "@/components/tabelas/TabelaRespostasAtividade";

// FUNÇÕES
import { getRespostasAtividadeByFormulario } from "@/app/api/client/atividade";

// ESTILO
import styles from "./page.module.scss";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [formulario, setFormulario] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [erro, setErro] = useState(null);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await getRespostasAtividadeByFormulario(
        params.tenant,
        params.ano,
        params.formularioId
      );
      setFormulario(data.formulario);
      setPlanos(data.planos || []);
    } catch (error) {
      console.error("Erro ao buscar respostas da atividade:", error);
      setErro(
        error.response?.data?.message ||
          "Falha ao carregar as respostas desta atividade."
      );
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.ano, params.formularioId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  return (
    <main className={styles.main}>
      <Link
        href={`/${params.tenant}/gestor/${params.ano}/atividades`}
        className={styles.voltar}
      >
        <RiArrowLeftLine />
        Voltar para Atividades
      </Link>

      <Card className="custom-card mb-2 mt-2">
        <h5 className="pl-2 pr-2 pt-2">
          {formulario?.titulo || "Respostas da Atividade"}
        </h5>

        {loading ? (
          <div className="pr-2 pl-2 pb-2 pt-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : erro ? (
          <NoData description={erro} />
        ) : (
          <TabelaRespostasAtividade formulario={formulario} planos={planos} />
        )}
      </Card>
    </main>
  );
};

export default Page;
