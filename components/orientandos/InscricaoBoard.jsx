"use client";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { RiArrowDownSLine, RiArrowUpSLine, RiFileList3Line, RiFlaskLine } from "@remixicon/react";
import AlunoCard, { BolsaConteudo } from "./AlunoCard";
import { motivoNaoRecebeDe, podeReceberDe } from "@/lib/alteracaoParticipacao";
import styles from "./orientandos.module.scss";

const nomeDoAluno = (alunos, id) => alunos.find((a) => a.participacaoId === id)?.nome || "aluno";
const idDe = (dndId) => (dndId ? Number(String(dndId).split("-")[1]) : null);
const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

// Agrupa as participações: projeto → plano de trabalho → participações.
// Planos ordenados pela nota (mesma base da ordem da lista de espera).
const agruparPorProjetoEPlano = (alunos) => {
  const projetos = new Map();
  for (const aluno of alunos) {
    const nomeProjeto = aluno.plano?.projeto || "Projeto";
    if (!projetos.has(nomeProjeto)) projetos.set(nomeProjeto, new Map());
    const planos = projetos.get(nomeProjeto);
    const chave = aluno.plano?.id ?? `sem-plano-${aluno.participacaoId}`;
    if (!planos.has(chave)) planos.set(chave, { plano: aluno.plano, participacoes: [] });
    planos.get(chave).participacoes.push(aluno);
  }
  return [...projetos.entries()].map(([titulo, planos]) => ({
    titulo,
    planos: [...planos.values()].sort(
      (a, b) =>
        (b.plano?.nota ?? -Infinity) - (a.plano?.nota ?? -Infinity) ||
        (a.plano?.titulo || "").localeCompare(b.plano?.titulo || "", "pt-BR")
    ),
  }));
};

const PlanoDeTrabalho = ({ grupo, alunos, origemId, origem, onAcao, onCancelarSolicitacao }) => {
  const [mostrarAnteriores, setMostrarAnteriores] = useState(false);
  const atuais = grupo.participacoes.filter((p) => p.classe !== "ENCERRADO");
  const anteriores = grupo.participacoes.filter((p) => p.classe === "ENCERRADO");

  const card = (aluno, arrastavel = true) => (
    <AlunoCard
      key={aluno.participacaoId}
      aluno={aluno}
      arrastando={arrastavel && Boolean(origemId)}
      origemId={arrastavel ? origemId : null}
      origem={arrastavel ? origem : null}
      onAcao={(tipo, a) => onAcao(tipo, a, { alunosInscricao: alunos })}
      onCancelarSolicitacao={onCancelarSolicitacao}
      ocultarPlano
    />
  );

  return (
    <article className={styles.plano}>
      <header className={styles.planoCabecalho}>
        <RiFileList3Line size={18} />
        <div className={styles.planoTitulo}>
          <small>Plano de trabalho</small>
          <strong title={grupo.plano?.titulo}>{grupo.plano?.titulo || "Sem plano"}</strong>
        </div>
        {grupo.plano?.nota != null && <span className={styles.chipNota}>Nota {grupo.plano.nota}</span>}
      </header>

      <div className={styles.planoParticipacoes}>
        {atuais.length === 0 && <p className={styles.colunaVazia}>Nenhuma participação ativa neste plano.</p>}
        {atuais.map((aluno) => card(aluno))}
      </div>

      {anteriores.length > 0 && (
        <div className={styles.outros}>
          <button
            type="button"
            className={styles.outrosToggle}
            onClick={() => setMostrarAnteriores((v) => !v)}
          >
            {mostrarAnteriores ? <RiArrowUpSLine size={18} /> : <RiArrowDownSLine size={18} />}
            {plural(anteriores.length, "participação encerrada", "participações encerradas")}
          </button>
          {mostrarAnteriores && (
            <div className={styles.planoParticipacoes}>{anteriores.map((aluno) => card(aluno, false))}</div>
          )}
        </div>
      )}
    </article>
  );
};

// Um contexto de arrastar e soltar por inscrição: a bolsa pode ir para um
// aluno de outro plano da mesma inscrição, mas não de outra inscrição (regra
// do transferirBolsa).
const InscricaoBoard = ({ inscricao, onAcao, onCancelarSolicitacao, onAviso }) => {
  const [origemId, setOrigemId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const alunos = inscricao.alunos;
  const projetos = useMemo(() => agruparPorProjetoEPlano(alunos), [alunos]);
  const totais = useMemo(() => {
    const t = { BOLSISTA: 0, LISTA_ESPERA: 0, VOLUNTARIO: 0, planos: 0 };
    alunos.forEach((a) => (t[a.classe] = (t[a.classe] || 0) + 1));
    t.planos = projetos.reduce((soma, p) => soma + p.planos.length, 0);
    return t;
  }, [alunos, projetos]);

  const origem = alunos.find((a) => a.participacaoId === origemId);
  const podeArrastar = alunos.some((a) => a.acoes.transferirBolsa);

  const anuncios = {
    onDragStart: ({ active }) => {
      const de = alunos.find((a) => a.participacaoId === idDe(active.id));
      return `${de?.classe === "LISTA_ESPERA" ? "Vaga na lista de espera" : "Bolsa"} de ${de?.nome || "aluno"} selecionada.`;
    },
    onDragOver: ({ over }) => {
      if (!over) return "Fora de um aluno.";
      const alvo = alunos.find((a) => a.participacaoId === idDe(over.id));
      return podeReceberDe(alvo, origem)
        ? `Sobre ${alvo.nome}, que pode receber.`
        : `Sobre ${alvo?.nome || "aluno"}, que não pode receber: ${motivoNaoRecebeDe(alvo, origem)}.`;
    },
    onDragEnd: ({ over }) =>
      over ? `Bolsa solta em ${nomeDoAluno(alunos, idDe(over.id))}.` : "Bolsa devolvida ao lugar.",
    onDragCancel: () => "Movimento cancelado.",
  };

  const aoSoltar = ({ active, over }) => {
    setOrigemId(null);
    if (!over) return;
    const de = alunos.find((a) => a.participacaoId === idDe(active.id));
    const para = idDe(over.id);
    if (!de || !para || para === de.participacaoId) return;
    const destino = alunos.find((a) => a.participacaoId === para);
    if (!podeReceberDe(destino, de)) {
      onAviso?.(
        `${destino?.nome || "Este aluno"} não pode receber a ${
          de.classe === "LISTA_ESPERA" ? "vaga na lista de espera" : "bolsa"
        }: ${motivoNaoRecebeDe(destino, de)}.`
      );
      return;
    }
    onAcao("TRANSFERENCIA_BOLSA", de, { destinoInicialId: para, alunosInscricao: alunos });
  };

  return (
    <section className={styles.inscricao}>
      <header className={styles.inscricaoCabecalho}>
        <div>
          <small>Inscrição #{inscricao.id}</small>
          <div className={styles.resumoInscricao}>
            <span>{plural(totais.planos, "plano de trabalho", "planos de trabalho")}</span>
            <span className={`${styles.chipClasse} ${styles.classe_BOLSISTA}`}>
              {plural(totais.BOLSISTA, "bolsista", "bolsistas")}
            </span>
            <span className={`${styles.chipClasse} ${styles.classe_LISTA_ESPERA}`}>
              {totais.LISTA_ESPERA} na lista de espera
            </span>
            <span className={`${styles.chipClasse} ${styles.classe_VOLUNTARIO}`}>
              {plural(totais.VOLUNTARIO, "voluntário", "voluntários")}
            </span>
          </div>
        </div>
        {podeArrastar && (
          <p className={styles.dicaArrastar}>
            Arraste a bolsa (ou a vaga na lista de espera) até um voluntário com participação ativa, de qualquer
            plano desta inscrição, para remanejá-la.
          </p>
        )}
      </header>

      <DndContext
        sensors={sensors}
        accessibility={{
          announcements: anuncios,
          screenReaderInstructions: {
            draggable:
              "Para mover a bolsa, pressione espaço ou enter, use as setas para escolher o aluno e pressione espaço ou enter novamente. Esc cancela.",
          },
        }}
        onDragStart={({ active }) => setOrigemId(idDe(active.id))}
        onDragCancel={() => setOrigemId(null)}
        onDragEnd={aoSoltar}
      >
        {projetos.map((projeto) => (
          <div key={projeto.titulo} className={styles.projeto}>
            <h6 className={styles.projetoTitulo}>
              <RiFlaskLine size={18} />
              <span>
                <small>Projeto</small>
                {projeto.titulo}
              </span>
            </h6>
            <div className={styles.planos}>
              {projeto.planos.map((grupo) => (
                <PlanoDeTrabalho
                  key={grupo.plano?.id ?? grupo.participacoes[0].participacaoId}
                  grupo={grupo}
                  alunos={alunos}
                  origemId={origemId}
                  origem={origem}
                  onAcao={onAcao}
                  onCancelarSolicitacao={onCancelarSolicitacao}
                />
              ))}
            </div>
          </div>
        ))}
        <DragOverlay dropAnimation={null}>
          {origem ? <BolsaConteudo aluno={origem} arrastavel className={styles.bolsaOverlay} /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
};

export default InscricaoBoard;
