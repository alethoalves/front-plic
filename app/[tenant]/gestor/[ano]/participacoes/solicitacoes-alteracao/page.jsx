"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { RiArrowRightLine, RiInboxArchiveLine } from "@remixicon/react";
import PreviaAlteracao from "@/components/alteracoesParticipacao/PreviaAlteracao";
import CardSolicitacaoPendente from "@/components/alteracoesParticipacao/CardSolicitacaoPendente";
import filaStyles from "@/components/alteracoesParticipacao/fila.module.scss";
import StatusSolicitacaoTag from "@/components/alteracoesParticipacao/StatusSolicitacaoTag";
import {
  decidirSolicitacaoAlteracao,
  getPreviaSolicitacaoGestor,
  getSolicitacoesAlteracaoGestor,
  notificarAlteracoesParticipacao,
} from "@/app/api/client/alteracaoParticipacao";
import {
  ICONE_TIPO,
  ROTULO_TIPO,
  estadoAntesDe,
  situacaoDoAluno,
  formatarCpf,
  formatarDataCurta,
  formatarDataHora,
  mensagemErro,
  rotuloSolicitacao,
} from "@/lib/alteracaoParticipacao";
import styles from "./page.module.scss";

const ABAS = [
  { id: "pendentes", label: "Pendentes", status: "PENDENTE" },
  { id: "historico", label: "Histórico", status: "APROVADA,RECUSADA,CANCELADA,PREJUDICADA" },
];

const OPCOES_TIPO = [
  { label: "Todos os tipos", value: null },
  ...Object.entries(ROTULO_TIPO).map(([value, label]) => ({ value, label })),
];

const OPCOES_ORIGEM = [
  { label: "Todas as origens", value: null },
  { label: "Solicitadas pelo orientador", value: "ORIENTADOR" },
  { label: "Ações diretas da gestão", value: "GESTOR" },
];

// Data do <input type="date"> a partir de "AAAA-MM-DD" ou "DD/MM/AAAA".
const paraInputData = (valor) => {
  if (!valor) return "";
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : valor.slice(0, 10);
};

const PessoaComCpf = ({ pessoa }) => (
  <span className={styles.pessoaTabela}>
    <span>{pessoa?.nome || "—"}</span>
    {pessoa?.cpf && <small>CPF {formatarCpf(pessoa.cpf)}</small>}
    {pessoa?.email && <small>{pessoa.email}</small>}
  </span>
);

const envolvidosTemplate = (s) => {
  const outro = s.tipo === "SUBSTITUICAO" ? s.novoUser : s.participacaoDestino?.user;
  return (
    <div className={styles.envolvidos}>
      <PessoaComCpf pessoa={s.participacao?.user} />
      {outro && (
        <>
          <RiArrowRightLine size={14} />
          <PessoaComCpf pessoa={outro} />
        </>
      )}
    </div>
  );
};

const Situacao = ({ situacao }) =>
  situacao ? (
    // div (e não span/small): as regras ".pessoa span/small" do painel não se aplicam
    <div className={`${filaStyles.situacao} ${filaStyles[`situacao_${situacao.tom}`]}`}>
      {situacao.texto} <span className={styles.situacaoNota}>(antes do pedido)</span>
    </div>
  ) : null;

const Email = ({ email }) => (
  <a className={styles.email} href={`mailto:${email}`} title="Enviar e-mail">
    {email}
  </a>
);

// Quem sai / quem entra, conforme o tipo da solicitação.
const ROTULOS_ENVOLVIDOS = {
  SUBSTITUICAO: ["Sai do plano", "Entra no plano"],
  TRANSFERENCIA_BOLSA: ["Bolsa sai de", "Bolsa vai para"],
  CANCELAMENTO: ["Participação cancelada", "Recebe a bolsa"],
  DEVOLUCAO_BOLSA: ["Devolve a bolsa", null],
};

const Envolvidos = ({ solicitacao: s }) => {
  const [rotuloA, rotuloB] = s.payload?.vagaNaFila
    ? s.tipo === "DEVOLUCAO_BOLSA"
      ? ["Desiste da vaga na fila", null]
      : ["Vaga na fila sai de", "Vaga na fila vai para"]
    : ROTULOS_ENVOLVIDOS[s.tipo] || ["Aluno", "Aluno"];
  const alvo = s.participacao?.user;
  const outro = s.tipo === "SUBSTITUICAO" ? s.novoUser : s.participacaoDestino?.user;
  return (
    <div className={styles.envolvidosCard}>
      <div className={styles.pessoa}>
        <small>{rotuloA}</small>
        <strong>{alvo?.nome || "—"}</strong>
        {alvo?.cpf && <span className={styles.cpf}>CPF {formatarCpf(alvo.cpf)}</span>}
        {alvo?.email && <Email email={alvo.email} />}
        <Situacao situacao={situacaoDoAluno(estadoAntesDe(s, s.participacaoId))} />
        {s.participacao?.planoDeTrabalho?.titulo && <span>{s.participacao.planoDeTrabalho.titulo}</span>}
      </div>
      {outro && rotuloB && (
        <>
          <RiArrowRightLine className={styles.setaEnvolvidos} />
          <div className={`${styles.pessoa} ${styles.pessoaDestino}`}>
            <small>{rotuloB}</small>
            <strong>{outro.nome}</strong>
            {outro.cpf && <span className={styles.cpf}>CPF {formatarCpf(outro.cpf)}</span>}
            {outro.email && <Email email={outro.email} />}
            <Situacao
              situacao={
                s.tipo === "SUBSTITUICAO"
                  ? { texto: "Novo no plano", tom: "neutro" }
                  : situacaoDoAluno(estadoAntesDe(s, s.participacaoDestinoId))
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

const Page = ({ params }) => {
  const toast = useRef(null);
  const [abaAtiva, setAbaAtiva] = useState("pendentes");
  const [tipo, setTipo] = useState(null);
  const [origem, setOrigem] = useState(null);
  const [cota, setCota] = useState(null);
  const [cotasDisponiveis, setCotasDisponiveis] = useState([]);
  const [busca, setBusca] = useState("");
  const [dados, setDados] = useState({ itens: [], total: 0 });
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState({ first: 0, rows: 25 });

  const [selecionada, setSelecionada] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [dataEfeito, setDataEfeito] = useState("");
  const [observacao, setObservacao] = useState("");
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [modoRecusa, setModoRecusa] = useState(false);
  const [decidindo, setDecidindo] = useState(false);

  const aba = ABAS.find((a) => a.id === abaAtiva);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      // Pendentes: todos de uma vez (cards); histórico: paginado (tabela).
      const pendentes = abaAtiva === "pendentes";
      const resposta = await getSolicitacoesAlteracaoGestor(params.tenant, params.ano, {
        status: aba.status,
        ...(tipo ? { tipo } : {}),
        ...(cota ? { cota } : {}),
        ...(origem && !pendentes ? { origem } : {}),
        page: pendentes ? 1 : pagina.first / pagina.rows + 1,
        pageSize: pendentes ? 200 : pagina.rows,
      });
      setDados({ itens: resposta.itens || [], total: resposta.total || 0 });
      setCotasDisponiveis(resposta.cotasDisponiveis || []);
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "Erro", detail: mensagemErro(error), life: 4000 });
    } finally {
      setCarregando(false);
    }
  }, [params.tenant, params.ano, aba.status, abaAtiva, tipo, cota, origem, pagina]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Solicitações de um mesmo bloco viram um item só (a decisão vale para todas).
  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const casa = (s) =>
      [s.participacao?.user?.nome, s.participacaoDestino?.user?.nome, s.novoUser?.nome, s.solicitante?.nome, s.edital?.titulo]
        .filter(Boolean)
        .some((t) => t.toLowerCase().includes(termo));
    const grupos = new Map();
    const linhas = [];
    for (const s of dados.itens) {
      if (!s.grupoId) {
        linhas.push(s);
        continue;
      }
      if (!grupos.has(s.grupoId)) {
        const grupo = { membros: [] };
        grupos.set(s.grupoId, grupo);
        linhas.push(grupo);
      }
      grupos.get(s.grupoId).membros.push(s);
    }
    const resolvidas = linhas.map((linha) => {
      if (!linha.membros) return linha;
      const membros = [...linha.membros].sort((a, b) => (a.ordemNoGrupo ?? 0) - (b.ordemNoGrupo ?? 0));
      return { ...membros[0], membros, avisos: membros.flatMap((m) => m.avisos || []) };
    });
    return termo ? resolvidas.filter((l) => (l.membros || [l]).some(casa)) : resolvidas;
  }, [dados.itens, busca]);

  // Fila: o pedido mais antigo primeiro.
  const pendentesOrdenados = useMemo(
    () => [...itensFiltrados].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [itensFiltrados]
  );

  const abrirDetalhe = async (solicitacao) => {
    setSelecionada(solicitacao);
    setDataEfeito(paraInputData(solicitacao.dataEfeitoSolicitada));
    setObservacao("");
    setMotivoRecusa("");
    setModoRecusa(false);
    setPrevia(null);
    if (solicitacao.status !== "PENDENTE") return;
    setCarregandoPrevia(true);
    try {
      setPrevia(await getPreviaSolicitacaoGestor(params.tenant, solicitacao.id));
    } catch (error) {
      setPrevia({ valida: false, erro: mensagemErro(error, "Não foi possível simular a solicitação.") });
    } finally {
      setCarregandoPrevia(false);
    }
  };

  const decidir = async (decisao) => {
    if (decisao === "RECUSAR" && !motivoRecusa.trim()) {
      toast.current?.show({ severity: "warn", summary: "Informe o motivo da recusa", life: 3000 });
      return;
    }
    setDecidindo(true);
    try {
      const resposta = await decidirSolicitacaoAlteracao(params.tenant, selecionada.id, {
        decisao,
        data: dataEfeito,
        observacaoGestor: observacao,
        motivoRecusa,
      });
      toast.current?.show({ severity: "success", summary: resposta.message, life: 4000 });
      setSelecionada(null);
      notificarAlteracoesParticipacao();
      carregar();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: decisao === "APROVAR" ? "Não foi possível aprovar" : "Não foi possível recusar",
        detail: mensagemErro(error),
        life: 6000,
      });
      if (decisao === "APROVAR") abrirDetalhe(selecionada);
    } finally {
      setDecidindo(false);
    }
  };

  const ehBloco = selecionada?.membros?.length > 1;

  const resultadoExecutado = selecionada?.resultado?.antes
    ? {
        valida: true,
        antes: selecionada.resultado.antes,
        depois: selecionada.resultado.depois,
        documentos: selecionada.resultado.documentos,
        avisos: selecionada.avisos || [],
      }
    : null;

  return (
    <main className={styles.pagina}>
      <Toast ref={toast} position="top-right" />

      <div className={styles.cabecalho}>
        <div>
          <h5>Solicitações dos orientadores</h5>
          <p>
            Substituições, remanejamentos e devoluções de bolsa e cancelamentos pedidos pelos orientadores. Ao
            aprovar, a alteração é executada com as mesmas regras e documentos automáticos da ação direta da gestão.
          </p>
        </div>
      </div>

      <div className={styles.abas}>
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`${styles.aba} ${abaAtiva === a.id ? styles.abaAtiva : ""}`}
            onClick={() => {
              setAbaAtiva(a.id);
              setPagina((p) => ({ ...p, first: 0 }));
            }}
          >
            {a.label}
            {a.id === "pendentes" && abaAtiva === "pendentes" ? ` (${dados.total})` : ""}
          </button>
        ))}
      </div>

      <div className={styles.filtros}>
        <InputText value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por aluno, orientador ou edital" />
        <Dropdown value={tipo} options={OPCOES_TIPO} onChange={(e) => setTipo(e.value)} placeholder="Tipo" />
        <Dropdown
          value={cota}
          options={[{ label: "Todas as cotas", value: null }, ...cotasDisponiveis.map((c) => ({ label: c, value: c }))]}
          onChange={(e) => {
            setCota(e.value);
            setPagina((p) => ({ ...p, first: 0 }));
          }}
          placeholder="Cota"
          emptyMessage="Nenhuma cota nas solicitações"
        />
        {abaAtiva === "historico" && (
          <Dropdown value={origem} options={OPCOES_ORIGEM} onChange={(e) => setOrigem(e.value)} placeholder="Origem" />
        )}
      </div>

      {abaAtiva === "pendentes" && (
        <>
          {carregando && <p className={styles.carregando}>Carregando solicitações…</p>}
          {!carregando && pendentesOrdenados.length === 0 && (
            <div className={filaStyles.vazio}>
              <RiInboxArchiveLine size={32} />
              <span>Nenhuma solicitação aguardando decisão.</span>
            </div>
          )}
          {!carregando && pendentesOrdenados.length > 0 && (
            <div className={filaStyles.lista}>
              {pendentesOrdenados.map((item) => (
                <CardSolicitacaoPendente key={item.grupoId ? `g${item.grupoId}` : item.id} item={item} onAnalisar={abrirDetalhe} />
              ))}
            </div>
          )}
        </>
      )}

      {abaAtiva === "historico" && (
      <DataTable
        value={itensFiltrados}
        loading={carregando}
        lazy
        paginator
        first={pagina.first}
        rows={pagina.rows}
        totalRecords={dados.total}
        rowsPerPageOptions={[25, 50, 100]}
        onPage={(e) => setPagina({ first: e.first, rows: e.rows })}
        dataKey="id"
        selectionMode="single"
        onRowClick={(e) => abrirDetalhe(e.data)}
        rowClassName={() => styles.linhaClicavel}
        emptyMessage={
          <div className={styles.vazio}>
            <RiInboxArchiveLine size={28} />
            <span>{abaAtiva === "pendentes" ? "Nenhuma solicitação aguardando decisão." : "Nenhum registro."}</span>
          </div>
        }
        size="small"
        stripedRows
      >
        <Column header="Data" body={(s) => formatarDataHora(s.createdAt)} style={{ width: "8.5rem" }} />
        <Column
          header="Tipo"
          body={(s) => (
            <span className={styles.tipoBloco}>
              {s.membros?.length > 1 ? (
                <>
                  <span className={styles.seloBloco}>Bloco #{s.grupoId}</span>
                  {s.membros.map((m) => rotuloSolicitacao(m)).join(" → ")}
                </>
              ) : (
                rotuloSolicitacao(s)
              )}
              <small className={styles.editalPequeno}>
                {s.edital?.titulo} · {s.edital?.ano}
              </small>
            </span>
          )}
        />
        <Column
          header="Aluno(s)"
          body={(s) =>
            s.membros?.length > 1 ? (
              <div className={styles.envolvidosBloco}>{s.membros.map((m) => <div key={m.id}>{envolvidosTemplate(m)}</div>)}</div>
            ) : (
              envolvidosTemplate(s)
            )
          }
        />
        <Column
          header="Cota"
          body={(s) => {
            const lista = [...new Set((s.membros || [s]).flatMap((m) => m.cotas || []))];
            return lista.length ? (
              <span className={styles.cotasTabela}>
                {lista.map((c) => (
                  <span key={c} className={styles.cotaTabela}>
                    {c}
                  </span>
                ))}
              </span>
            ) : (
              "—"
            );
          }}
        />
        <Column
          header="Solicitante"
          body={(s) => (s.origem === "GESTOR" ? <em>Gestão: {s.solicitante?.nome}</em> : s.solicitante?.nome)}
        />
        <Column header="Status" body={(s) => <StatusSolicitacaoTag status={s.status} />} style={{ width: "8rem" }} />
      </DataTable>
      )}

      <Sidebar
        visible={Boolean(selecionada)}
        position="right"
        onHide={() => !decidindo && setSelecionada(null)}
        className={styles.painel}
        blockScroll
      >
        {selecionada && (
          <div className={styles.detalhe}>
            <header className={styles.detalheCabecalho}>
              <div className={styles.detalheIcone}>
                {(() => {
                  const Icone = ICONE_TIPO[selecionada.tipo];
                  return Icone ? <Icone /> : null;
                })()}
              </div>
              <div className={styles.detalheTitulo}>
                <small>
                  {ehBloco ? `Bloco #${selecionada.grupoId}` : `Solicitação #${selecionada.id}`} ·{" "}
                  {selecionada.edital?.titulo} · {selecionada.edital?.ano}
                </small>
                <h5>
                  {ehBloco
                    ? `Bloco de ${selecionada.membros.length} solicitações`
                    : rotuloSolicitacao(selecionada)}
                </h5>
              </div>
              <StatusSolicitacaoTag status={selecionada.status} />
            </header>

            {ehBloco ? (
              <div className={styles.etapasBloco}>
                <p className={styles.etapasAviso}>
                  Pedidos dependentes do mesmo orientador: a decisão vale para o bloco inteiro e, ao aprovar, as
                  etapas são executadas nesta ordem numa só operação — se uma falhar, nada é aplicado.
                </p>
                {selecionada.membros.map((m, i) => (
                  <div key={m.id} className={styles.etapa}>
                    <div className={styles.etapaCabecalho}>
                      <span className={styles.etapaNumero}>{i + 1}</span>
                      <strong>{rotuloSolicitacao(m)}</strong>
                      <small>
                        #{m.id} · data solicitada {formatarDataCurta(m.dataEfeitoSolicitada)}
                      </small>
                    </div>
                    <Envolvidos solicitacao={m} />
                    <div className={styles.motivo}>
                      <small>Motivo informado</small>
                      <p>{m.motivo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Envolvidos solicitacao={selecionada} />
            )}

            <div className={styles.infos}>

              <div className={styles.info}>
                <small>{selecionada.origem === "GESTOR" ? "Executada por" : "Solicitante"}</small>
                <strong>{selecionada.solicitante?.nome || "—"}</strong>
                <span>
                  {selecionada.origem === "GESTOR" ? "Ação direta da gestão" : "Orientador"}
                  {selecionada.solicitante?.cpf ? ` · CPF ${formatarCpf(selecionada.solicitante.cpf)}` : ""}
                </span>
                {selecionada.solicitante?.email && <Email email={selecionada.solicitante.email} />}
              </div>
              <div className={styles.info}>
                <small>Enviada em</small>
                <strong>{formatarDataHora(selecionada.createdAt)}</strong>
                <span>Data solicitada: {formatarDataCurta(selecionada.dataEfeitoSolicitada)}</span>
              </div>
              {selecionada.decididoEm && selecionada.origem !== "GESTOR" && (
                <div className={styles.info}>
                  <small>Decisão</small>
                  <strong>{formatarDataHora(selecionada.decididoEm)}</strong>
                  <span>{selecionada.decididoPor?.nome || "—"}</span>
                </div>
              )}
            </div>

            {!ehBloco && (
              <div className={styles.motivo}>
                <small>Motivo informado</small>
                <p>{selecionada.motivo}</p>
              </div>
            )}

            {selecionada.motivoRecusa && (
              <div className={`${styles.motivo} ${styles.motivoRecusa}`}>
                <small>Motivo da recusa</small>
                <p>{selecionada.motivoRecusa}</p>
              </div>
            )}
            {selecionada.observacaoGestor && (
              <div className={styles.motivo}>
                <small>Observação da gestão</small>
                <p>{selecionada.observacaoGestor}</p>
              </div>
            )}

            {selecionada.status === "PENDENTE" && (
              <section className={styles.secao}>
                <h6>Efeito ao aprovar</h6>
                <p className={styles.secaoAjuda}>Simulação com os dados atuais — nada é gravado até a aprovação.</p>
                {carregandoPrevia ? (
                  <div className={styles.carregando}>
                    <i className="pi pi-spin pi-spinner" />
                    <span>Simulando a operação… pode levar alguns segundos.</span>
                  </div>
                ) : (
                  <PreviaAlteracao previa={previa} />
                )}
              </section>
            )}

            {selecionada.status === "APROVADA" && resultadoExecutado && (
              <section className={styles.secao}>
                <h6>Resultado da execução</h6>
                <PreviaAlteracao previa={resultadoExecutado} executada />
              </section>
            )}

            {selecionada.status === "PENDENTE" && (
              <div className={styles.decisao}>
                {!modoRecusa ? (
                  <>
                    <div className={styles.decisaoCampos}>
                      <div className={styles.campo}>
                        <label htmlFor="dataEfeito">Data de efeito</label>
                        <input
                          id="dataEfeito"
                          type="date"
                          className="p-inputtext p-component w-full"
                          value={dataEfeito}
                          onChange={(e) => setDataEfeito(e.target.value)}
                        />
                      </div>
                      <div className={styles.campo}>
                        <label htmlFor="observacaoGestor">Observação (opcional)</label>
                        <InputTextarea
                          id="observacaoGestor"
                          rows={1}
                          autoResize
                          className="w-full"
                          value={observacao}
                          onChange={(e) => setObservacao(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={styles.decisaoAcoes}>
                      <Button
                        label="Recusar"
                        className="p-button-danger p-button-outlined"
                        onClick={() => setModoRecusa(true)}
                        disabled={decidindo}
                      />
                      <Button
                        label="Aprovar e executar"
                        icon="pi pi-check"
                        onClick={() => decidir("APROVAR")}
                        loading={decidindo}
                        disabled={carregandoPrevia || previa?.valida === false}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.campo}>
                      <label htmlFor="motivoRecusa">Motivo da recusa (o orientador verá este texto)</label>
                      <InputTextarea
                        id="motivoRecusa"
                        rows={3}
                        className="w-full"
                        value={motivoRecusa}
                        onChange={(e) => setMotivoRecusa(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className={styles.decisaoAcoes}>
                      <Button
                        label="Voltar"
                        className="p-button-secondary p-button-outlined"
                        onClick={() => setModoRecusa(false)}
                        disabled={decidindo}
                      />
                      <Button
                        label="Confirmar recusa"
                        className="p-button-danger"
                        onClick={() => decidir("RECUSAR")}
                        loading={decidindo}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Sidebar>
    </main>
  );
};

export default Page;
