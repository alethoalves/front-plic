"use client";
// HOOKS
import { useState } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiSettings5Line } from "@remixicon/react";
// COMPONENTES
import Modal from "@/components/Modal";
// PRIMEREACT

import { Card } from "primereact/card";

// FUNÇÕES
import Formularios from "@/components/Formularios";
import EditalAtividades from "@/components/EditalAtividades";
import TabelaRegistroAtividade from "@/components/tabelas/TabelaRegistroAtividade";

const Page = ({ params }) => {
  // ESTADOS
  const [activeModal, setActiveModal] = useState(null);

  // ROTEAMENTO
  const router = useRouter();

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
          <TabelaRegistroAtividade params={params} />
        </Card>
      </main>
    </>
  );
};

export default Page;
