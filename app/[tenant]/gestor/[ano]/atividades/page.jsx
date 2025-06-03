"use client";
// HOOKS
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiSettings5Line } from "@remixicon/react";
// COMPONENTES
import Modal from "@/components/Modal";
// PRIMEREACT

import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";

// FUNÇÕES
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";
import TabelaPlanoDeTrabalho from "@/components/tabelas/TabelaPlanoDeTrabalho";
import Formularios from "@/components/Formularios";
import EditalAtividades from "@/components/EditalAtividades";
import TabelaRegistroAtividade from "@/components/tabelas/TabelaRegistroAtividade";

const Page = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  // ROTEAMENTO
  const router = useRouter();

  // BUSCA DE DADOS INICIAIS
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const itens = await getAllPlanoDeTrabalhosByTenant(
        params.tenant,
        params.ano || null
      );
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [params.tenant]);

  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, fetchInitialData]);

  return (
    <>
      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        size="medium"
      >
        {(() => {
          switch (activeModal) {
            case "formularios":
              return <Formularios params={params} atividades={true} />;
            case "atividades":
              return <EditalAtividades params={params} />;
            default:
              return null;
          }
        })()}
      </Modal>
      <main className={styles.main}>
        <Card className="mb-4 p-2">
          <div className={styles.configuracoes}>
            <div className={styles.icon}>
              <RiSettings5Line />
            </div>
            <ul>
              <li onClick={() => setActiveModal("atividades")}>
                <p>Atividades</p>
              </li>
              <li onClick={() => setActiveModal("formularios")}>
                <p>Formulários</p>
              </li>
            </ul>
          </div>
        </Card>

        <Card className="custom-card mb-2">
          {loading ? (
            <div className="pr-2 pl-2 pb-2 pt-2">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            </div>
          ) : (
            <>
              <TabelaRegistroAtividade params={params} />
            </>
          )}
        </Card>
      </main>
    </>
  );
};

export default Page;
