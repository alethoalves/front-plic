"use client";
import {
  RiCheckDoubleLine,
  RiExternalLinkLine,
  RiInformationLine,
} from "@remixicon/react";
import { Dropdown } from "primereact/dropdown";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getInscricao, updateInscricao } from "@/app/api/client/inscricao";
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
        const itens = await getInscricao(params.tenant, params.idInscricao);
        setItens(itens);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idInscricao]);

  const statusOptions = [
    { value: "pendente", label: "Pendente" },
    { value: "enviada", label: "Enviada" },
    { value: "aprovada", label: "Aprovada" },
    { value: "arquivada", label: "Arquivada" },
  ];
  const handleStatusChange = async (e) => {
    const newStatus = e.value;
    try {
      await updateInscricao(params.tenant, params.idInscricao, {
        status: newStatus,
      });
      setItens((prev) => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      // Adicione aqui tratamento de erro (ex: toast notification)
    }
  };

  return (
    <div className={styles.navContent}>
      {loading && <p className="mt-2">Carregando...</p>}
      {!loading && itens && (
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
                <strong>ID Inscrição: </strong>
                {itens?.id}
              </p>
              <p>
                <strong>Edital: </strong>
                {itens?.editalNome}
              </p>
              <p>
                <strong>Ano do edital: </strong>
                {itens?.editalAno}
              </p>
              <p>
                <strong>Proponente: </strong>
                {itens?.proponente?.nome}
              </p>
              <p>
                <strong>Orientador(es): </strong>
                <strong>Orientador(es): </strong>
                {itens.orientadores
                  ?.map(
                    (orientador) =>
                      `${orientador.nome_orientador} (${orientador.status})`
                  )
                  .join("; ")}
              </p>
              <p>
                <strong>Aluno(s): </strong>
                {itens.alunos
                  ?.map((aluno) => `${aluno.nome_aluno} (${aluno.status})`)
                  .join("; ")}
              </p>
              <div className={styles.statusField}>
                <p>
                  <strong>Status da Inscrição: </strong>
                </p>
                <Dropdown
                  value={itens?.status}
                  options={statusOptions}
                  onChange={handleStatusChange}
                  placeholder="Selecione o status"
                  className={styles.statusDropdown}
                  optionLabel="label"
                  optionValue="value"
                />
              </div>
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
      )}
    </div>
  );
};

export default Page;
