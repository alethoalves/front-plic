"use client";
import Button from "@/components/Button";

import {
  RiAddLine,
  RiArrowRightSLine,
  RiFileExcelLine,
} from "@remixicon/react";
import styles from "./ListaProjetos.module.scss";
import NoData from "../NoData";

const ListaProjetos = ({
  projetos,
  title,
  setSelectedProjeto,
  setModalView,
}) => {
  return (
    <>
      <h6>{title}</h6>
      <div className={styles.projetos}>
        {projetos.length > 0 ? (
          projetos.map((projeto) => (
            <div
              key={projeto.id}
              onClick={() => {
                setSelectedProjeto(projeto);
                setModalView("view");
              }}
              className={styles.projeto}
            >
              <h6>{projeto.titulo}</h6>
              <div className={styles.actions}>
                <div className={styles.action}>
                  <RiArrowRightSLine />
                </div>
              </div>
            </div>
          ))
        ) : (
          <NoData description="Não encontramos nenhum projeto. Crie um novo!" />
        )}
      </div>
    </>
  );
};

export default ListaProjetos;
