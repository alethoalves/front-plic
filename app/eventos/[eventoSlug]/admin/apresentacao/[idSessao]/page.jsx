"use client";
import {
  RiCheckDoubleLine,
  RiExternalLinkLine,
  RiInformationLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getInscricao } from "@/app/api/client/inscricao";
import Table from "@/components/Table";
import { useRouter } from "next/navigation";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState(null);
  // ROTEAMENTO
  const router = useRouter();
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <RiInformationLine />
          </div>
          <h5>Dados gerais</h5>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.edital}>
            <p>
              <strong>Edital: </strong>
              XXXX
            </p>
            <p>
              <strong>Ano do edital: </strong>
              YYYY
            </p>
          </div>
          {itens?.orientadores[0] && (
            <div className={styles.orientadores}>
              {itens.orientadores
                .filter((item) => item.status === "ativo")
                .map((orientador) => (
                  <p key={orientador.id}>
                    <strong>
                      {orientador.tipo.charAt(0).toUpperCase() +
                        orientador.tipo.slice(1)}
                      :{" "}
                    </strong>
                    <br></br>
                    {orientador.nome_orientador?.toUpperCase() ||
                      orientador.nome_coorientador?.toUpperCase()}
                  </p>
                ))}
            </div>
          )}
          {itens?.edital?.atividades[0] && itens?.planosDeTrabalho[0] && (
            <div className={styles.atividades}>
              <div className={styles.label}>
                <p>Atividades</p>
              </div>
              {itens?.edital?.atividades.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(
                      `/${params.tenant}/gestor/inscricoes/${itens.id}/atividades`
                    );
                  }}
                  className={styles.atividade}
                >
                  <div className={styles.titulo}>
                    <h6>{item.titulo}</h6>
                    <RiExternalLinkLine />
                  </div>
                  <div className={styles.submissao}>
                    <p>{`Período de submissão: ${new Date(
                      item.dataInicio
                    ).toLocaleDateString("pt-BR")} a ${new Date(
                      item.dataFinal
                    ).toLocaleDateString("pt-BR")}`}</p>
                  </div>
                  <div className={styles.registros}>
                    <p>
                      {`Foram entregues
                      ${
                        itens.registroAtividades.filter(
                          (item) => item.status === "concluido"
                        ).length
                      } de 
                      ${itens.registroAtividades.length} atividades`}
                    </p>
                    <div className={styles.icons}>
                      {itens.registroAtividades
                        .filter((item) => item.status === "concluido")
                        .map((item, i) => (
                          <div
                            key={i}
                            className={`${styles.icon} ${styles.statusConcluido}`}
                          >
                            <RiCheckDoubleLine />
                          </div>
                        ))}
                      {itens.registroAtividades
                        .filter((item) => item.status === "naoEntregue")
                        .map((item, i) => (
                          <div
                            key={i}
                            className={`${styles.icon} ${styles.statusNaoEntregue}`}
                          >
                            <RiCheckDoubleLine />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
