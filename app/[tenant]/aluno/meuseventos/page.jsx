"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

import { deleteSubmissao, getSubmissoesEvento } from "@/app/api/client/eventos";
import NoData from "@/components/NoData";
import {
  RiCalendarLine,
  RiCouponLine,
  RiFlaskLine,
  RiMapPinLine,
} from "@remixicon/react";

const Page = ({ params }) => {
  // Estados para gerenciamento do componente
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEventoOpen, setIsModalEventoOpen] = useState(false);
  const [error, setError] = useState(null);
  const [tela, setTela] = useState(0);
  const [submissao, setSubmissao] = useState([]);
  const [submissoes, setSubmissoes] = useState(null); // Mantém null até que os dados sejam carregados

  // ROTEAMENTO
  const router = useRouter();

  // EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const submissoes = await getSubmissoesEvento(params.tenant);
        setSubmissoes(submissoes);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setSubmissoes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, isModalOpen]);

  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);
    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");
    return `${horas}h${minutos}`;
  };

  const closeModalAndResetDataModalEvento = () => {
    setIsModalEventoOpen(false);
    setTela(0);
    setLoading(false);
    setError(null);
  };

  // Renderiza o conteúdo do modal
  const renderModalEventoContent = () => {
    return (
      <Modal
        isOpen={isModalEventoOpen}
        onClose={closeModalAndResetDataModalEvento}
        noPadding={true}
      >
        <div className={styles.modal}>
          <div
            className={`${styles.successMsg} ${
              tela === 1 ? styles.modalError : " "
            }`}
          >
            <h3>
              {tela === 0 ? "Inscrição confirmada!" : "Inscrição excluída!"}
            </h3>
            <div className={styles.successMsgContent}>
              <div className={styles.boxButton}>
                <div className={styles.infoBox}>
                  <div className={styles.description}>
                    <div className={styles.infoBoxDescription}>
                      <h6>{submissao?.evento?.nomeEvento}</h6>
                    </div>
                  </div>
                  <div className={styles.description}>
                    <div className={styles.icon}>
                      <RiFlaskLine />
                    </div>
                    <div className={styles.infoBoxDescription}>
                      <p>
                        <strong>Sessão: </strong>
                      </p>
                      <p>{submissao?.subsessao?.sessaoApresentacao?.titulo}</p>
                    </div>
                  </div>
                  <div className={styles.description}>
                    <div className={styles.icon}>
                      <RiCalendarLine />
                    </div>
                    <div className={styles.infoBoxDescription}>
                      <p>
                        <strong>Início: </strong>
                      </p>
                      <p>
                        {formatarData(submissao?.subsessao?.inicio)} -{" "}
                        {formatarHora(submissao?.subsessao?.inicio)}
                      </p>
                      <p className="mt-1">
                        <strong>Fim: </strong>
                      </p>
                      <p>
                        {formatarData(submissao?.subsessao?.fim)} -{" "}
                        {formatarHora(submissao?.subsessao?.fim)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.description}>
                    <div className={styles.icon}>
                      <RiMapPinLine />
                    </div>
                    <div className={styles.infoBoxDescription}>
                      <p>
                        <strong>Local: </strong>
                      </p>
                      <p>{submissao?.subsessao?.local}</p>
                    </div>
                  </div>
                </div>
              </div>
              {tela === 0 && (
                <Button
                  className="btn-error"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await deleteSubmissao(
                        params.tenant,
                        submissao.id
                      );
                      const submissoes = await getSubmissoesEvento(
                        params.tenant
                      );
                      setSubmissoes(submissoes);
                      setTela(1);
                    } catch (error) {
                      setSubmissoes([]);
                      console.error("Erro ao buscar dados:", error);
                      setError(error.response?.data?.message);
                      setTela(1);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  CANCELAR INSCRIÇÃO
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <>
      {renderModalEventoContent()}

      <div className={styles.navContent}>
        {loading ? (
          <div className={styles.loading}>
            <p>Carregando...</p>
          </div>
        ) : submissoes === null ? ( // Aguarda o carregamento inicial
          <div className={styles.loading}>
            <p>Carregando...</p>
          </div>
        ) : submissoes.length > 0 ? (
          <div className={styles.content}>
            <div className={styles.header}>
              <h4>Inscrições em eventos:</h4>
              <p className="mt-1">
                Os projetos abaixo estão inscritos em eventos.
              </p>
            </div>
            <div className={styles.mainContent}>
              {submissoes.map((item) => (
                <div key={item.id} className={styles.submissao}>
                  <div className={`${styles.submissaoInfo} `}>
                    <div className={styles.icon}>
                      <RiCouponLine />
                    </div>
                    <h6>{item.evento.nomeEvento}</h6>
                    <p>
                      <strong>Projeto inscrito:</strong>
                    </p>
                    <p>{item.planoDeTrabalho.titulo}</p>
                  </div>
                  <div className={styles.submissaoActions}>
                    <div className={styles.status}>
                      <p>
                        {item.status === "DISTRIBUIDA" && "Aguardando Check-in"}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setTela(0);
                        setIsModalEventoOpen(true);
                        setSubmissao(item);
                      }}
                      className="btn-link"
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                className="btn-secondary mt-3"
                linkTo={`/${params.tenant}/aluno/eventos`}
                disabled={loading}
              >
                VER OUTROS EVENTOS
              </Button>
            </div>
          </div>
        ) : (
          <div className={` ${styles.noData} ${styles.margin}`}>
            <NoData description="Você não está inscrito em eventos. Inscreva-se!" />
            <Button
              className="btn-primary mt-3"
              linkTo={`/${params.tenant}/aluno/eventos`}
              disabled={loading}
            >
              VER EVENTOS DISPONÍVEIS
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
