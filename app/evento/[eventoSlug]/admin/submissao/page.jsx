"use client";
import {
  RiBatteryLowLine,
  RiCalendarLine,
  RiCheckDoubleLine,
  RiExternalLinkLine,
  RiFilePaper2Fill,
  RiFilePaper2Line,
  RiGroupLine,
  RiInformationLine,
  RiSurveyLine,
  RiTimeLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getInscricao } from "@/app/api/client/inscricao";
import Table from "@/components/Table";
import { useRouter } from "next/navigation";
import { getSessaoById, getSessoesBySlug } from "@/app/api/client/sessoes";
import Link from "next/link";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState(null);
  const [sessoes, setSessoes] = useState(null);

  // ROTEAMENTO
  const router = useRouter();
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sessoes = await getSessoesBySlug(params.eventoSlug);
        setSessoes(sessoes);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  // Função para formatar data
  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar hora
  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);
    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");
    return `${horas}h${minutos}`;
  };
  return (
    <div className={styles.navContent}>
      {sessoes?.map((sessao) => (
        <div key={sessao.id} className={styles.content}>
          <div className={styles.header}>
            <h5>Sessão {sessao?.titulo}</h5>
          </div>
          <div className={styles.mainContent}>
            <div className={styles.edital}>
              <p>
                <strong>Tipo de sessão: </strong>
                {sessao?.tipo === "APRESENTACAO_POSTER"
                  ? "Apresentação de Pôsteres"
                  : ""}
              </p>
              <p>
                <strong>Capacidade de cada subsessão: </strong>
                {sessao?.capacidade} pôsteres
              </p>
              <p className="mt-2">
                <strong>Subsessões: </strong>
              </p>
              <div className={styles.subsessoes}>
                {sessao?.subsessaoApresentacao?.map((subs) => (
                  <Link
                    key={subs.id}
                    href={`/evento/${params.eventoSlug}/admin/submissao/${subs.id}`}
                  >
                    <div className={styles.subsessao}>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiCalendarLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>Dia</p>
                          <h6>{formatarData(subs.inicio)}</h6>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiTimeLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>Horário</p>
                          <h6>
                            de {formatarHora(subs.inicio)} às{" "}
                            {formatarHora(subs.fim)}
                          </h6>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiGroupLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>Inscritos</p>
                          <h6>{subs.submissaoCount}</h6>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiSurveyLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>Avaliadores</p>
                          <h6>{subs.conviteSubsessaoCount}</h6>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Page;
