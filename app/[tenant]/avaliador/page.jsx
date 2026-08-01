"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import {
  RiAwardFill,
  RiQuillPenLine,
  RiArrowRightLine,
  RiFolderChartLine,
  RiScales3Line,
} from "@remixicon/react";
import { listarFamiliasRecursoAvaliador } from "@/app/api/client/avaliador";

const Page = ({ params }) => {
  const [recursoEmAndamento, setRecursoEmAndamento] = useState(null);

  useEffect(() => {
    let ativo = true;
    listarFamiliasRecursoAvaliador(params.tenant, new Date().getFullYear())
      .then((data) => {
        if (ativo) setRecursoEmAndamento(data?.emAndamento || null);
      })
      .catch(() => {
        // Falha silenciosa — é só um indicador informativo na Home.
      });
    return () => {
      ativo = false;
    };
  }, [params.tenant]);

  return (
    <main className={styles.main}>
      <div className={styles.ambientes}>
        <Link
          href={`/${params.tenant}/avaliador/avaliacoes/projetos`}
          className={styles.ambienteCard}
        >
          <div className={`${styles.ambienteIcone} ${styles.ambienteIconeProjetos}`}>
            <RiFolderChartLine size={26} />
          </div>
          <div className={styles.ambienteConteudo}>
            <h5>Avaliação de Projetos e Planos</h5>
            <p>
              Selecione projetos aguardando avaliação e preencha a ficha de
              projeto e dos respectivos planos de trabalho.
            </p>
          </div>
          <RiArrowRightLine className={styles.ambienteSeta} />
        </Link>

        <Link
          href={`/${params.tenant}/avaliador/avaliacoes/recursos`}
          className={styles.ambienteCard}
        >
          <div className={`${styles.ambienteIcone} ${styles.ambienteIconeRecursos}`}>
            <RiScales3Line size={26} />
          </div>
          <div className={styles.ambienteConteudo}>
            <h5>
              Avaliação de Recursos
              {recursoEmAndamento && (
                <span className={styles.ambienteBadge}>1 em andamento</span>
              )}
            </h5>
            <p>
              Analise recursos enviados por orientadores contra notas de
              projetos e planos de trabalho já avaliados.
            </p>
          </div>
          <RiArrowRightLine className={styles.ambienteSeta} />
        </Link>
      </div>

      <div className={styles.instituicoes}>
        {/** LINK PARA AVALIAÇÃO APENAS DE PLANOS DE TRABALHO **/}
        {/** quando o edital prevê apenas formulário de avaliação do plano **/}
        {false && (
          <Link href={`/avaliador/avaliacoes/planos`}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiQuillPenLine />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliar Planos de Trabalho</h6>
              </div>
            </div>
          </Link>
        )}
        {/** LINK PARA AVALIAÇÃO DE ATIVIDADES **/}
        {false && (
          <Link href={`${params.tenant}/avaliador/avaliacoes/atividades`}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiQuillPenLine />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliar atividades</h6>
              </div>
            </div>
          </Link>
        )}
        {false && (
          <Link href={"/avaliador/home/certificados"}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiAwardFill />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliações concluídas</h6>
              </div>
            </div>
          </Link>
        )}
        {false && (
          <Link href={"/avaliador/home/certificados"}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiAwardFill />
              </div>
              <div className={styles.descricao}>
                <h6>Declarações e Certificados</h6>
              </div>
            </div>
          </Link>
        )}
      </div>
    </main>
  );
};

export default Page;
