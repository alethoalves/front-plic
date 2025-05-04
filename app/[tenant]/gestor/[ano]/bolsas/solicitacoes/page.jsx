"use client";
import React, { useEffect, useRef, useState } from "react";

import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import styles from "./page.module.scss";
import SolicitacoesBolsa from "@/components/SolicitacoesBolsa";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
      } catch (err) {
        console.error("Erro:", err);
        setError("Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.tenant, params.ano]);

  return (
    <main>
      <Toast ref={toast} />
      {loading ? (
        <div className="p-2">
          <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
        </div>
      ) : error ? (
        <Message severity="error" text={error} />
      ) : (
        <>
          {false && (
            <Card className="p-2">
              <p className="mb-1">
                1º negar as solicitações de bolsas para quem nao alcaçar a nota
                mínima de 60 pontos
              </p>
              <p className="mb-1">
                2º negar as solicitações de bolsas para quem não tem IRA maior
                ou igual a 3 nos editais PIBIC e PIBITI
              </p>
              <p>3º negar solicitações de bolsas para a mesma pessoa</p>
              <p>
                3º negar as solicitações de bolsas se: + de 2 solicitacoes de
                bolsa por edital
              </p>
            </Card>
          )}
          <SolicitacoesBolsa />
        </>
      )}
    </main>
  );
};

export default Page;
