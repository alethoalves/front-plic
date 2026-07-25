import styles from "./page.module.scss";
import {
  RiCalendarEventFill,
  RiMapPinLine,
} from "@remixicon/react";
import {
  getEventoBySlug,
  getEventoProgramacao,
  getEventoRootBySlug,
} from "@/app/api/serverReq";
import NoData from "@/components/NoData";
import { EventoNav } from "@/components/evento/EventoNav";
import { EventoBanner } from "@/components/evento/EventoBanner";

// Função para extrair apenas horas e minutos de uma data ISO
const formatTime = (isoString) => {
  const timePart = isoString.split("T")[1] || "";
  const [hours, minutes] = timePart.split(":");
  return `${hours}:${minutes}`;
};

const formatDateFromISO = (isoString) => {
  if (!isoString) return null;
  const datePart = isoString.split("T")[0];
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}`;
};

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const formatDiaLabel = (dateString) => {
  const [year, month, day] = dateString.split("-");
  const data = new Date(Number(year), Number(month) - 1, Number(day));
  return `${DIAS_SEMANA[data.getDay()]}, ${day} de ${MESES[Number(month) - 1]}`;
};

const Page = async ({ params }) => {
  let eventoRoot;
  let evento;
  let programacao;
  try {
    eventoRoot = await getEventoRootBySlug(params.eventoSlug);
    evento = await getEventoBySlug(params.edicao);
    programacao = await getEventoProgramacao(evento.id);
  } catch (error) {
    return <h6 className="p-4">Evento não encontrado</h6>;
  }

  return (
    <>
      <div className={`${styles.eventoPlatewrap} ${styles.eventoPlatewrapComNav}`}>
        <EventoBanner evento={evento} />
        {eventoRoot?.nome && (
          <p className={styles.eventoPlateCaption}>{eventoRoot.nome}</p>
        )}
      </div>

      <main className={`${styles.eventoSpread} ${styles.eventoSpreadNavFixo}`}>
        <nav className={styles.eventoIndex}>
          <EventoNav params={params} evento={evento} eventoRoot={eventoRoot} />
        </nav>

        <div className={styles.content}>
          <div className={`${styles.eventoCard} mb-3`}>
            {eventoRoot?.nome && (
              <span className={styles.eventoEyebrow}>{eventoRoot.nome}</span>
            )}
            <h1 className={`h-editorial ${styles.title}`}>{evento.nomeEvento}</h1>
            <div className={styles.topline}>
              <span className={styles.eventoDatestamp}>
                <RiCalendarEventFill />
                {evento.inicio && evento.fim
                  ? `${formatDateFromISO(evento.inicio)} – ${formatDateFromISO(evento.fim)}`
                  : "Datas a definir"}
              </span>
              {evento.local && (
                <span className={styles.eventoLoc}>
                  <RiMapPinLine />
                  {evento.local}
                </span>
              )}
            </div>
            {evento.isbn && (
              <div className={styles.isbnRow}>
                <span className={styles.k}>ISBN</span> {evento.isbn}
              </div>
            )}
          </div>

          <div className={styles.sectionHead}>
            <h2 className="h-editorial-sm">Programação</h2>
            <div className={styles.rule}></div>
          </div>

          {!programacao || programacao.length === 0 ? (
            <NoData />
          ) : (
            programacao.map((eventosDoDia) => (
              <div className={styles.eventoAgendaDay} key={eventosDoDia.data}>
                <span className={styles.eventoAgendaDayLabel}>
                  {formatDiaLabel(eventosDoDia.data)}
                </span>
                {eventosDoDia.eventos.map((atividade, i) => (
                  <div className={styles.eventoAgendaItem} key={i}>
                    <div className={styles.eventoAgendaTime}>
                      {formatTime(atividade.inicio)}
                    </div>
                    <div className={styles.eventoAgendaBody}>
                      <h4>{atividade.titulo}</h4>
                      <p>{atividade.descricao}</p>
                      {atividade.local && (
                        <div className={styles.eventoAgendaLoc}>
                          <RiMapPinLine />
                          {atividade.local}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
};

export default Page;
