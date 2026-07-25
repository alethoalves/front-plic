import Link from "next/link";
import styles from "./page.module.scss";
import { getEventoRootBySlug } from "@/app/api/serverReq";
import { EventoBanner } from "@/components/evento/EventoBanner";

const Page = async ({ params }) => {
  let evento;
  try {
    evento = await getEventoRootBySlug(params.eventoSlug);
  } catch (error) {
    return <h6 className="p-4">Evento não encontrado</h6>;
  }

  // EventoRoot (a série) não tem campos de imagem próprios — usa os da
  // edição mais recente como representante visual da série
  const edicoesOrdenadas = evento?.eventos
    ? [...evento.eventos].sort((a, b) => b.id - a.id)
    : [];
  const edicaoMaisRecente = edicoesOrdenadas[0] || null;

  return (
    <>
      <div className={styles.eventoPlatewrap}>
        <EventoBanner evento={edicaoMaisRecente} />
      </div>

      <main className={styles.eventoSpread}>
        <nav className={styles.eventoIndex}>
          {edicoesOrdenadas.length > 0 && (
            <div className={styles.eventoEditions}>
              <span className={styles.eventoIndexLabel}>Edições</span>
              <div>
                {edicoesOrdenadas.map((edicao) => (
                  <Link
                    key={edicao.id}
                    href={`/evento/${params.eventoSlug}/edicao/${edicao.slug}`}
                    className={styles.eventoEditionItem}
                  >
                    {edicao.edicaoEvento}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className={styles.content}>
          <div className={`${styles.eventoCard} mb-3`}>
            <h1 className="h-editorial">{evento.nome}</h1>
          </div>

          {evento?.EventoPage?.map((page) => (
            <div key={page.id} className={`${styles.eventoCard} mb-3`}>
              <h2 className="h-editorial-sm mb-2">{page.titulo}</h2>
              {page.conteudo
                .split("\n")
                .filter((paragraph) => paragraph.trim() !== "")
                .map((paragraph, index) => (
                  <p key={index} className={styles.paragraph}>
                    {paragraph}
                  </p>
                ))}
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default Page;
