import { getEventoBySlug, getSubmissoes } from "@/app/api/serverReq";
import Image from "next/image";
import styles from "./page.module.scss";
import {
  RiDeleteBinLine,
  RiFileList3Line,
  RiListCheck2,
  RiMapPinLine,
  RiMedalLine,
  RiPresentationLine,
  RiQuillPenLine,
  RiSearchLine,
  RiShieldStarFill,
  RiStarLine,
} from "@remixicon/react";
import BuscaSubmissoes from "@/components/BuscaSubmissoes";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
const Page = async ({ params }) => {
  const evento = await getEventoBySlug(params.eventoSlug);
  const submissoes = await getSubmissoes(evento.id);
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.eventos}>
          <div className={styles.evento}>
            <div className={styles.banner}>
              <Image
                priority
                fill
                src={`/image/${evento.pathBanner}`}
                alt="logo"
                sizes="300 500 700"
              />
            </div>
            <div className={styles.cards}>
              <div className={styles.card}>
                <div className={styles.head}>
                  <div className={styles.left}>
                    <div className={styles.icon}>
                      <RiSearchLine />
                    </div>
                    <div className={styles.title}>
                      <h5>Busque por nome de aluno ou orientador</h5>
                    </div>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <BuscaSubmissoes idEvento={evento.id} />
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.head}>
                  <div className={styles.left}>
                    <div className={styles.icon}>
                      <RiPresentationLine />
                    </div>
                    <div className={styles.title}>
                      <h5>Apresentações</h5>
                    </div>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <p className="mb-2">
                    O checkin será feito no dia da apresentação conforme
                    orientações passadas pela equipe do evento. Trabalhos com
                    checkin pendentes não serão avaliados.
                  </p>
                  <p className="mb-2">
                    TRABALHOS SEM NÚMERO DE PÔSTER - alunos cujos trabalhos não
                    tenham número de pôster, deverão informar esta situação no
                    dia do evento. Essa situação não impedirá a apresentação,
                    apenas indica ao aluno que será necessário esperar até que
                    um pôster fique disponível.
                  </p>
                  <div className={styles.squares}>
                    {submissoes.length > 0 &&
                      submissoes.map((item, index) => (
                        <div key={item.id} className={styles.square}>
                          {item.indicacaoPremio ||
                            item.mencaoHonrosa ||
                            (item.premio && (
                              <div className={styles.premios}>
                                {item.premio && (
                                  <div className={`${styles.squareHeader} `}>
                                    <RiShieldStarFill />
                                    <p>Premiado</p>
                                  </div>
                                )}
                                {item.indicacaoPremio && (
                                  <div className={`${styles.squareHeader} `}>
                                    <RiMedalLine />
                                    <p>Indicado ao Prêmio</p>
                                  </div>
                                )}
                                {item.premio && (
                                  <div className={`${styles.squareHeader} `}>
                                    <RiStarLine />
                                    <p>Menção Honrosa</p>
                                  </div>
                                )}
                              </div>
                            ))}

                          <div className={styles.squareContent}>
                            <div className={styles.info}>
                              <p
                                className={`${styles.status} ${
                                  item.status === "DISTRIBUIDA"
                                    ? styles.error
                                    : item.status === "AGUARDANDO_AVALIACAO"
                                    ? styles.warning
                                    : item.status === "AVALIADA"
                                    ? styles.success
                                    : item.status === "AUSENTE"
                                    ? styles.inativada
                                    : styles.success
                                }`}
                              >
                                {item.status === "DISTRIBUIDA"
                                  ? "checkin pendente"
                                  : item.status === "AGUARDANDO_AVALIACAO"
                                  ? "aguardando avaliação"
                                  : item.status === "AVALIADA"
                                  ? "avaliação concluída"
                                  : item.status === "AUSENTE"
                                  ? "ausente"
                                  : item.status}
                              </p>
                              <p className={styles.area}>
                                {item.planoDeTrabalho?.area?.area
                                  ? item.planoDeTrabalho?.area?.area
                                  : "sem área"}{" "}
                                -{" "}
                                {item.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}
                                -{" "}
                                {item.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                              </p>
                            </div>
                            <div className={styles.submissaoData}>
                              <h6>{item.planoDeTrabalho?.titulo}</h6>
                              <p className={styles.participacoes}>
                                <strong>Orientadores: </strong>
                                {item.planoDeTrabalho?.inscricao.participacoes
                                  .filter(
                                    (item) =>
                                      item.tipo === "orientador" ||
                                      item.tipo === "coorientador"
                                  )
                                  .map(
                                    (item, i) =>
                                      `${i > 0 ? ", " : ""}${item.user.nome} (${
                                        item.status
                                      })`
                                  )}
                              </p>
                              <p className={styles.participacoes}>
                                <strong>Alunos: </strong>
                                {item.planoDeTrabalho?.participacoes.map(
                                  (item, i) =>
                                    `${i > 0 ? ", " : ""}${item.user.nome} (${
                                      item.status
                                    })`
                                )}
                              </p>
                            </div>
                          </div>
                          <div className={styles.informacoes}>
                            <div className={styles.squareHeader}>
                              <p>Dia</p>
                              <p>
                                <strong>
                                  {formatarData(item.subsessao.inicio)}
                                </strong>
                              </p>
                              <p>{item.subsessao.sessaoApresentacao.titulo}</p>
                            </div>
                            <div className={styles.squareHeader}>
                              <p>Horário</p>
                              <p>
                                <strong>
                                  {formatarHora(item.subsessao.inicio)}
                                </strong>
                              </p>
                            </div>
                            {item.square.map((squareItem) => (
                              <div
                                key={squareItem.id}
                                className={styles.squareHeader}
                              >
                                <p>Pôster nº</p>
                                <h6>{squareItem.numero}</h6>
                              </div>
                            ))}
                            {item.square.length == 0 && (
                              <div className={styles.squareHeader}>
                                <p>Pôster nº</p>
                                <h6>-</h6>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
