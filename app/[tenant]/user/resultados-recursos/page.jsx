"use client";
import { useEffect, useRef, useState } from "react";
import {
  RiScales3Line,
  RiUser2Line,
  RiGroupLine,
  RiCursorLine,
  RiLockLine,
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

  // "Nota Final" (extras de recurso já deferidos) só aparece se o edital
  // habilitou explicitamente — por padrão a tela continua mostrando a nota
  // pura (notaTotal), sem nenhuma menção a recurso.
  const recursoHabilitado = !!plano.inscricao?.edital?.habilitarRecurso;
  const notaFinalHabilitada = !!plano.inscricao?.edital?.habilitarNotaFinal;
  const notaExtraTotal =
    (plano.notaExtraRecursoProjeto || 0) + (plano.notaExtraRecursoPlano || 0);
  const mostrarNotaFinal = notaFinalHabilitada && notaTotal !== null;
  const valorExibido = mostrarNotaFinal ? notaTotal + notaExtraTotal : notaTotal;
  const labelNota = mostrarNotaFinal ? "Nota Final" : "Nota Total";
  const temExtra = mostrarNotaFinal && notaExtraTotal > 0;

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

        <p
          className={`${styles.notasHint} ${
            !recursoHabilitado ? styles.notasHintIndisponivel : ""
          }`}
        >
          {recursoHabilitado ? (
            <>
              <RiCursorLine />
              Clique na nota para entrar com recurso
            </>
          ) : (
            <>
              <RiLockLine />
              Recurso não está disponível para este edital
            </>
          )}
        </p>

        <div className={styles.notasGrid}>
          {NOTAS.map(({ key, label, slug }) => {
            const semNota = plano[key] === null || plano[key] === undefined;
            const elegibilidade = plano.recursoElegibilidade?.[slug];
            const maximo = maximos[slug];
            // Só projeto e plano têm coluna de extra de recurso própria
            // (orientador/aluno não têm ajuste de recurso — ver schema).
            const extraDoCard =
              slug === "projeto"
                ? plano.notaExtraRecursoProjeto || 0
                : slug === "plano"
                  ? plano.notaExtraRecursoPlano || 0
                  : 0;
            const temExtraNoCard = mostrarNotaFinal && extraDoCard > 0;
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
                {temExtraNoCard && (
                  <span className={styles.notaMiniBadgeExtra}>
                    +{formatarNota(extraDoCard)} recurso
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div
          className={`${styles.notaTotalCard} ${
            valorExibido === null ? styles.semAvaliacao : ""
          }`}
        >
          <div className={styles.notaTotalHeader}>
            <span className={styles.label}>{labelNota}</span>
            {temExtra && (
              <span className={styles.badgeExtra}>
                +{formatarNota(notaExtraTotal)} pontos após recurso
              </span>
            )}
          </div>
          <div className={styles.notaTotalValorBloco}>
            <span className={styles.valor}>
              {valorExibido === null ? (
                "Aguardando avaliação"
              ) : (
                <>
                  {formatarNota(valorExibido)}
                  {notaTotalMaximo !== null && (
                    <span className={styles.valorMaximo}>
                      /{formatarNota(notaTotalMaximo)}
                    </span>
                  )}
                </>
              )}
            </span>
            {temExtra && (
              <span className={styles.detalheExtra}>
                (nota anterior: {formatarNota(notaTotal)} + Recurso: {formatarNota(notaExtraTotal)})
              </span>
            )}
          </div>
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
