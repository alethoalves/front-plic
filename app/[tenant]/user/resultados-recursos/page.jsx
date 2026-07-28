"use client";
import { useEffect, useRef, useState } from "react";
import {
  RiScales3Line,
  RiUser2Line,
  RiGroupLine,
  RiCursorLine,
} from "@remixicon/react";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import Link from "next/link";

import styles from "./page.module.scss";
import { Badge } from "@/components/Badge";
import Skeleton from "@/components/Skeleton";
import { getResultadosByUser } from "@/app/api/client/resultado";

const NOTAS = [
  { key: "notaProjeto", label: "Projeto", slug: "projeto" },
  { key: "notaPlano", label: "Plano", slug: "plano" },
  { key: "notaOrientador", label: "Orientador", slug: "orientador" },
  { key: "notaAluno", label: "Aluno", slug: "aluno" },
];

const formatarNota = (valor) =>
  valor === null || valor === undefined ? null : Number(valor).toFixed(2);

const EmptyState = () => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>
      <RiScales3Line />
    </div>
    <h6>Nenhum resultado disponível no momento</h6>
    <p>
      Assim que o edital divulgar o resultado da avaliação, os planos de
      trabalho vinculados a você aparecerão aqui.
    </p>
  </div>
);

const PlanoCard = ({ plano, tenant, toast }) => {
  const orientadores = plano.inscricao?.participacoes ?? [];
  const alunos = (plano.participacoes ?? []).filter((p) => p.tipo === "aluno");

  const notasPreenchidas = NOTAS.filter(
    ({ key }) => plano[key] !== null && plano[key] !== undefined,
  );
  const notaTotal =
    notasPreenchidas.length > 0
      ? NOTAS.reduce((soma, { key }) => soma + (plano[key] || 0), 0)
      : null;

  const maximos = plano.notasMaximas ?? {};
  const notaTotalMaximo = NOTAS.every(
    ({ slug }) => typeof maximos[slug] === "number",
  )
    ? NOTAS.reduce((soma, { slug }) => soma + maximos[slug], 0)
    : null;

  return (
    <Card className={styles.planoCard}>
      <div className={styles.cardContent}>
        <p className={styles.editalInfo}>
          {plano.inscricao?.edital?.titulo} ({plano.inscricao?.edital?.ano})
        </p>

        <span
          title={plano.area?.grandeArea?.grandeArea}
          className={styles.areaBadge}
        >
          <Badge>{plano.area?.area ?? "Área não informada"}</Badge>
        </span>

        <h4 className={styles.planoTitulo}>{plano.titulo}</h4>

        <div className={styles.metaItem}>
          <RiUser2Line className={styles.metaIcon} />
          <div className={styles.metaContent}>
            <span className={styles.metaLabel}>Orientador(es)</span>
            <div className={styles.metaValue}>
              {orientadores.length > 0 ? (
                orientadores.map((item, index) => (
                  <span key={index} className={styles.personItem}>
                    {item.user.nome}
                  </span>
                ))
              ) : (
                <span className={styles.personItem}>—</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.metaItem}>
          <RiGroupLine className={styles.metaIcon} />
          <div className={styles.metaContent}>
            <span className={styles.metaLabel}>Aluno(s)</span>
            <div className={styles.metaValue}>
              {alunos.length > 0 ? (
                alunos.map((item, index) => (
                  <span key={index} className={styles.personItem}>
                    {item.user.nome}
                  </span>
                ))
              ) : (
                <span className={styles.personItem}>—</span>
              )}
            </div>
          </div>
        </div>

        <p className={styles.notasHint}>
          <RiCursorLine />
          Clique na nota para entrar com recurso
        </p>

        <div className={styles.notasGrid}>
          {NOTAS.map(({ key, label, slug }) => {
            const semNota = plano[key] === null || plano[key] === undefined;
            const elegibilidade = plano.recursoElegibilidade?.[slug];
            const maximo = maximos[slug];
            return (
              <Link
                key={key}
                href={`/${tenant}/user/resultados-recursos/${plano.id}/recurso/${slug}`}
                className={`${styles.notaMiniCard} ${semNota ? styles.semNota : ""}`}
                onClick={(e) => {
                  if (!elegibilidade?.permitido) {
                    e.preventDefault();
                    toast?.current?.show({
                      severity: "warn",
                      summary: "Recurso não disponível",
                      detail:
                        elegibilidade?.motivo ||
                        "Não é possível abrir recurso para esta nota.",
                      life: 4000,
                    });
                  }
                }}
              >
                <span className={styles.notaMiniLabel}>{label}</span>
                <span className={styles.notaMiniValor}>
                  {formatarNota(plano[key]) ?? "—"}
                </span>
                {typeof maximo === "number" && (
                  <span className={styles.notaMiniMaximo}>
                    de {formatarNota(maximo)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div
          className={`${styles.notaTotalCard} ${
            notaTotal === null ? styles.semAvaliacao : ""
          }`}
        >
          <span className={styles.label}>Nota Total</span>
          <span className={styles.valor}>
            {notaTotal === null ? (
              "Aguardando avaliação"
            ) : (
              <>
                {formatarNota(notaTotal)}
                {notaTotalMaximo !== null && (
                  <span className={styles.valorMaximo}>
                    /{formatarNota(notaTotalMaximo)}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
};

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getResultadosByUser(params.tenant);
        setPlanos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar resultados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  return (
    <div className={styles.navContent}>
      <Toast ref={toast} position="top-right" />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div className={styles.headerIcon}>
            <RiScales3Line />
          </div>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Resultados e Recursos</h1>
            <p className={styles.pageDescription}>
              Confira o resultado da avaliação dos seus planos de trabalho e, se
              necessário, entre com recurso.
            </p>
          </div>
        </div>

        {loading ? (
          <div className={styles.planosGrid}>
            <Skeleton />
            <Skeleton />
          </div>
        ) : planos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={styles.planosGrid}>
            {planos.map((plano) => (
              <PlanoCard
                key={plano.id}
                plano={plano}
                tenant={params.tenant}
                toast={toast}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
