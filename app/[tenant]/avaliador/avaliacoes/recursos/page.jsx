"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiInformationLine,
  RiQuillPenLine,
  RiLogoutBoxRLine,
  RiQuestionLine,
  RiScales3Line,
  RiEditLine,
  RiAddCircleLine,
  RiShuffleLine,
  RiStarFill,
} from "@remixicon/react";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";

import styles from "./page.module.scss";
import NoData from "@/components/NoData";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import Button from "@/components/Button";
import AreaSelector from "@/components/Formularios/AreaSelector";
import {
  listarFamiliasRecursoAvaliador,
  pegarFamiliaRecursoAvaliador,
  devolverFamiliaRecursoAvaliador,
} from "@/app/api/client/avaliador";
import { getUserAreas } from "@/app/api/client/userTenant";
import { getAreas } from "@/app/api/client/area";
import { getCurrentUserId } from "@/lib/headers";
import { useModalAjuda } from "@/lib/useModalAjuda";

const ABAS = [
  { id: "emAndamento", label: "Em andamento" },
  { id: "escolherNovo", label: "Escolher novo recurso" },
];

const Page = ({ params }) => {
  const router = useRouter();
  const toast = useRef(null);
  const anoCorrente = new Date().getFullYear();

  const [abaAtiva, setAbaAtiva] = useState("emAndamento");
  const [abaInicialDefinida, setAbaInicialDefinida] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disponiveis, setDisponiveis] = useState([]);
  const [filteredDisponiveis, setFilteredDisponiveis] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [emAndamento, setEmAndamento] = useState(null);
  const [limiteAtribuicao, setLimiteAtribuicao] = useState({ podeReivindicarNova: true });
  const [pegandoId, setPegandoId] = useState(null);
  const [erroPegar, setErroPegar] = useState({});
  const [devolvendo, setDevolvendo] = useState(false);
  const [modalDevolverAberto, setModalDevolverAberto] = useState(false);
  const [erroDevolver, setErroDevolver] = useState("");
  const ajuda = useModalAjuda("plic:avaliador:ajudaRecursos", params.tenant);
  const [userId] = useState(() => getCurrentUserId());

  // Áreas de interesse do avaliador (mesmo padrão de avaliacoes/projetos/page.jsx)
  const [userAreaIds, setUserAreaIds] = useState([]);
  const [areasCatalogo, setAreasCatalogo] = useState({});
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [continuarSorteioAoSalvarArea, setContinuarSorteioAoSalvarArea] =
    useState(false);

  // Atribuição aleatória com base nas áreas de interesse
  const [sorteando, setSorteando] = useState(false);
  const [mensagemSorteio, setMensagemSorteio] = useState("");
  const [erroSorteio, setErroSorteio] = useState("");

  const fetchDados = async () => {
    setLoading(true);
    try {
      const data = await listarFamiliasRecursoAvaliador(params.tenant, anoCorrente);
      setDisponiveis(data.disponiveis || []);
      setFilteredDisponiveis(data.disponiveis || []);
      setEmAndamento(data.emAndamento || null);
      setLimiteAtribuicao(data.limiteAtribuicao || { podeReivindicarNova: true });
      // Só decide a aba inicial uma vez (no primeiro carregamento) — evita
      // pular de aba embaixo do usuário quando fetchDados roda de novo depois
      // de um "Devolver" ou de uma tentativa de "Pegar" que falhou (mesmo
      // padrão de avaliacoes/projetos/page.jsx).
      if (!abaInicialDefinida) {
        setAbaAtiva(data.emAndamento ? "emAndamento" : "escolherNovo");
        setAbaInicialDefinida(true);
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message ||
          "Não foi possível carregar os recursos disponíveis.",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      const [areaIds, todasAreas] = await Promise.all([
        getUserAreas(params.tenant, userId),
        getAreas(),
      ]);
      setUserAreaIds(areaIds || []);
      const catalogo = {};
      (todasAreas || []).forEach((area) => {
        catalogo[area.id] = area.area;
      });
      setAreasCatalogo(catalogo);
    } catch (error) {
      console.error("Erro ao buscar áreas de interesse:", error);
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    fetchDados();
    if (userId) {
      fetchAreas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tenant]);

  // Aplica o filtro por área a partir do array completo vindo do dropdown.
  const handleAreaFilterChange = (updatedSelectedAreas) => {
    setSelectedAreas(updatedSelectedAreas);
    if (updatedSelectedAreas.length === 0) {
      setFilteredDisponiveis(disponiveis);
    } else {
      setFilteredDisponiveis(
        disponiveis.filter((item) =>
          updatedSelectedAreas.includes(item.area?.area || "Área não definida"),
        ),
      );
    }
  };

  // Nomes (não ids) das áreas de interesse do avaliador, pra priorizá-las no
  // dropdown "Filtre por área" e destacar visualmente cada opção.
  const nomesDasMinhasAreas = userAreaIds
    .map((id) => areasCatalogo[id])
    .filter(Boolean);

  // Backend não devolve uma contagem por área pronta (diferente de
  // getProjetosAguardandoAvaliacao) — agrega localmente a partir da lista já
  // carregada de famílias disponíveis.
  const areasPendentes = disponiveis.reduce((acc, item) => {
    const nome = item.area?.area || "Área não definida";
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {});

  const areaFiltroOpcoes = Object.entries(areasPendentes)
    .map(([nome, total]) => ({
      label: nome,
      value: nome,
      total,
      minhaArea: nomesDasMinhasAreas.includes(nome),
    }))
    .sort((a, b) => {
      if (a.minhaArea !== b.minhaArea) return a.minhaArea ? -1 : 1;
      return a.label.localeCompare(b.label);
    });

  const renderAreaOption = (option) => (
    <div className={styles.areaOption}>
      {option.minhaArea && <RiStarFill className={styles.areaOptionStar} />}
      <span className={styles.areaOptionLabel}>{option.label}</span>
      <span className={styles.areaOptionCount}>{option.total}</span>
    </div>
  );

  // Enquanto uma reivindicação estiver em andamento (clique num card
  // específico ou sorteio aleatório), os demais cards ficam travados — o
  // limite é de 1 recurso por vez.
  const algumaAtribuicaoEmAndamento = sorteando || !!pegandoId;

  const handlePegar = async (planoId) => {
    setPegandoId(planoId);
    setErroPegar((prev) => ({ ...prev, [planoId]: null }));
    try {
      await pegarFamiliaRecursoAvaliador(params.tenant, planoId);
      router.push(`/${params.tenant}/avaliador/avaliacoes/recursos/${planoId}`);
      return true;
    } catch (error) {
      setErroPegar((prev) => ({
        ...prev,
        [planoId]: error.response?.data?.message || "Não foi possível reivindicar este recurso.",
      }));
      // Alguém pode ter reivindicado no mesmo instante — recarrega a lista.
      fetchDados();
      return false;
    } finally {
      setPegandoId(null);
    }
  };

  // Reivindica aleatoriamente uma família pendente dentre as áreas de
  // interesse do avaliador. Se ainda não houver áreas cadastradas, abre o
  // cadastro primeiro e continua o sorteio assim que ele for salvo.
  const handleSortear = async (areaIdsParam) => {
    const areaIds = areaIdsParam ?? userAreaIds;
    if (!areaIds || areaIds.length === 0) {
      setContinuarSorteioAoSalvarArea(true);
      setIsAreaModalOpen(true);
      return;
    }

    setSorteando(true);
    setMensagemSorteio("");
    setErroSorteio("");
    try {
      const nomesAreas = areaIds.map((id) => areasCatalogo[id]).filter(Boolean);
      const candidatos = disponiveis.filter((item) =>
        nomesAreas.includes(item.area?.area),
      );
      if (candidatos.length === 0) {
        setMensagemSorteio(
          "Não encontramos nenhum recurso pendente que combine com suas áreas de interesse no momento. Selecione manualmente na lista abaixo.",
        );
        return;
      }
      const escolhido =
        candidatos[Math.floor(Math.random() * candidatos.length)];
      const ok = await handlePegar(escolhido.planoId);
      if (!ok) {
        setErroSorteio(
          "Não foi possível concluir a atribuição aleatória. Tente novamente.",
        );
      }
    } catch (err) {
      setErroSorteio(
        err.response?.data?.message ||
          "Não foi possível concluir a atribuição aleatória. Tente novamente.",
      );
    } finally {
      setSorteando(false);
    }
  };

  const handleAreaModalClose = () => {
    setIsAreaModalOpen(false);
    setContinuarSorteioAoSalvarArea(false);
  };

  const handleAreaSaved = (novosAreaIds) => {
    setUserAreaIds(novosAreaIds);
    setIsAreaModalOpen(false);
    if (continuarSorteioAoSalvarArea) {
      setContinuarSorteioAoSalvarArea(false);
      handleSortear(novosAreaIds);
    }
  };

  const handleDevolver = async () => {
    if (!emAndamento) return;
    setDevolvendo(true);
    setErroDevolver("");
    try {
      await devolverFamiliaRecursoAvaliador(params.tenant, emAndamento.planoId);
      setModalDevolverAberto(false);
      setEmAndamento(null);
      fetchDados();
    } catch (error) {
      setErroDevolver(
        error.response?.data?.message || "Não foi possível devolver este recurso.",
      );
    } finally {
      setDevolvendo(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} position="top-right" />
      <ModalDelete
        isOpen={modalDevolverAberto}
        title="Devolver recurso"
        onClose={() => {
          setModalDevolverAberto(false);
          setErroDevolver("");
        }}
        confirmationText={`Tem certeza que deseja devolver a análise de "${emAndamento?.titulo ?? ""}"? Os itens ainda não decididos voltam para a fila e ficam disponíveis para outro avaliador.`}
        errorDelete={erroDevolver}
        handleDelete={handleDevolver}
        icon={RiLogoutBoxRLine}
        txtBtn={devolvendo ? "Devolvendo..." : "Devolver"}
      />

      <Modal isOpen={ajuda.isOpen} onClose={ajuda.fechar} size="large">
        <div className={styles.explicacaoHeader}>
          <span className={styles.explicacaoIcon}>
            <RiScales3Line size={22} />
          </span>
          <div>
            <h5 className={styles.explicacaoTitulo}>
              Como funciona a avaliação de recursos
            </h5>
            <p className={styles.explicacaoSubtitulo}>
              Quando um orientador contesta a nota de um projeto ou plano de
              trabalho, o recurso pode ser analisado por um avaliador.
            </p>
          </div>
        </div>

        <div className={styles.comoFuncionaBox}>
          <ol className={styles.comoFuncionaLista}>
            <li>
              <strong>Um recurso por vez.</strong> Assim como na avaliação de
              projetos, você só pode estar analisando um recurso (projeto e
              seus respectivos planos de trabalho) de cada vez.
            </li>
            <li>
              <strong>Reivindicação exclusiva.</strong> Ao reivindicar um
              recurso para análise, ele fica indisponível para outros
              avaliadores até você concluir ou devolvê-lo — o sistema impede
              que dois avaliadores peguem o mesmo recurso simultaneamente.
            </li>
            <li>
              <strong>Você não pode analisar seus próprios recursos.</strong>
              {" "}Se você avaliou originalmente o projeto ou plano cujo
              recurso está sendo contestado, ele não aparecerá para você.
            </li>
            <li>
              <strong>Análise anônima.</strong> Os dados de identificação do
              aluno e do orientador não são exibidos — a análise considera
              apenas o conteúdo do projeto/plano e a justificativa do recurso.
            </li>
            <li>
              <strong>O gestor mantém supervisão.</strong> A qualquer momento,
              o gestor pode reverter uma decisão já tomada e reabrir o recurso
              para nova análise.
            </li>
          </ol>
        </div>

        <div className={styles.modalAcoes}>
          <div className={styles.checkboxRow}>
            <Checkbox
              inputId="naoMostrarAjudaRecursos"
              checked={ajuda.naoMostrarNovamente}
              onChange={(e) => ajuda.setNaoMostrarNovamente(e.checked)}
            />
            <label htmlFor="naoMostrarAjudaRecursos">
              Não mostrar novamente
            </label>
          </div>
          <Button className="btn-primary" onClick={ajuda.fechar}>
            Entendi
          </Button>
        </div>
      </Modal>

      {isAreaModalOpen && (
        <Modal isOpen={isAreaModalOpen} onClose={handleAreaModalClose}>
          <AreaSelector
            tenant={params.tenant}
            userId={userId}
            initialAreaIds={userAreaIds}
            onSaved={handleAreaSaved}
          />
        </Modal>
      )}

      <div className="flex-space mb-1">
        <h4>Sala de Recursos</h4>
        <button
          type="button"
          className={styles.botaoAjuda}
          onClick={ajuda.reabrir}
          title="Como funciona a avaliação de recursos"
        >
          <RiQuestionLine size={20} />
        </button>
      </div>
      <p className="mb-3">
        Analise recursos enviados por orientadores contra notas de projetos e
        planos de trabalho. Os dados de aluno e orientador não são exibidos
        aqui — a análise é anônima.
      </p>

      <div className={styles.areasInteresse}>
        <div className="flex-space mb-1">
          <h6>Minhas áreas de interesse</h6>
          {!loadingAreas && userAreaIds.length > 0 && (
            <div className={styles.editarAreasBtn}>
              <Button
                className="btn-secondary"
                icon={RiEditLine}
                onClick={() => setIsAreaModalOpen(true)}
              >
                Editar áreas
              </Button>
            </div>
          )}
        </div>

        {!loadingAreas && userAreaIds.length === 0 && (
          <>
            <div className={styles.avisoInfo}>
              <RiInformationLine size={20} />
              <p>
                Você ainda não cadastrou áreas de interesse. Cadastre para
                poder usar a atribuição aleatória e receber sugestões de
                recursos mais alinhadas ao seu perfil.
              </p>
            </div>
            <Button
              className="btn-primary mt-2"
              icon={RiAddCircleLine}
              onClick={() => setIsAreaModalOpen(true)}
            >
              Cadastrar áreas de interesse
            </Button>
          </>
        )}

        {userAreaIds.length > 0 && (
          <div className={styles.areaTags}>
            {userAreaIds.map((id) => (
              <span key={id} className={styles.areaTag}>
                {areasCatalogo[id] || `Área #${id}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.abas}>
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={`${styles.aba} ${abaAtiva === aba.id ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {abaAtiva === "emAndamento" && (
        <>
          {loading ? (
            <p className="p-4">Carregando...</p>
          ) : emAndamento ? (
            <div className={styles.squares}>
              <div className={`${styles.square} ${styles.squareWarning}`}>
                <div className={styles.squareContent}>
                  <div className={styles.info}>
                    <p className={styles.area}>
                      {emAndamento.area?.area || "sem área"}
                    </p>
                    <p className={styles.planos}>
                      {emAndamento.pendentes} de {emAndamento.totalItens} item(ns)
                      pendente(s)
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{emAndamento.titulo}</h6>
                  </div>
                </div>

                <div className={styles.actions}>
                  <div className={styles.item1}>
                    <div
                      className={`${styles.squareHeader} ${styles.action} ${styles.actionError}`}
                      onClick={() => setModalDevolverAberto(true)}
                    >
                      <RiLogoutBoxRLine />
                      <p>Devolver</p>
                    </div>
                  </div>
                  <div
                    className={`${styles.squareHeader} ${styles.action} ${styles.actionPrimary}`}
                    onClick={() =>
                      router.push(
                        `/${params.tenant}/avaliador/avaliacoes/recursos/${emAndamento.planoId}`,
                      )
                    }
                  >
                    <RiQuillPenLine />
                    <p>Continuar análise</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noData}>
              <NoData description="Os recursos que você reivindicar para análise aparecerão aqui! Clique na aba ao lado para escolher um." />
            </div>
          )}
        </>
      )}

      {abaAtiva === "escolherNovo" && (
        <>
          {!limiteAtribuicao.podeReivindicarNova ? (
            <div className={styles.avisoInfo}>
              <RiInformationLine size={20} />
              <p>
                Você já possui um recurso em análise. Finalize ou devolva o
                recurso atual (aba ao lado) para poder escolher um novo.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.sorteioSection}>
                <h6 className="mb-1">Atribuição rápida</h6>
                <p className="mb-2">
                  Prefere não escolher manualmente? Deixe o sistema atribuir
                  um recurso pendente com base nas suas áreas de interesse.
                </p>
                <Button
                  className="btn-primary"
                  icon={RiShuffleLine}
                  loading={sorteando}
                  disabled={algumaAtribuicaoEmAndamento}
                  onClick={() => handleSortear()}
                >
                  Atribuir aleatoriamente com base nas minhas áreas de
                  interesse
                </Button>
                {mensagemSorteio && (
                  <div className={`${styles.avisoInfo} mt-2`}>
                    <RiInformationLine size={20} />
                    <p>{mensagemSorteio}</p>
                  </div>
                )}
                {erroSorteio && (
                  <div className={`${styles.error} mt-2`}>
                    <p>{erroSorteio}</p>
                  </div>
                )}
              </div>

              <h6 className="mb-1">Filtre por área</h6>
              <MultiSelect
                value={selectedAreas}
                onChange={(e) => handleAreaFilterChange(e.value)}
                options={areaFiltroOpcoes}
                itemTemplate={renderAreaOption}
                placeholder="Todas as áreas"
                display="chip"
                filter
                className={`${styles.areaFiltroSelect} mb-2`}
                style={{ width: "100%" }}
              />
              <h6 className="mb-1">Selecione um recurso para analisar</h6>
            </>
          )}
          {limiteAtribuicao.podeReivindicarNova && (loading ? (
            <p className="p-4">Carregando...</p>
          ) : filteredDisponiveis.length > 0 ? (
            <div className={styles.squares}>
              {filteredDisponiveis.map((item) => {
                const carregandoEste = pegandoId === item.planoId;
                const bloqueado =
                  algumaAtribuicaoEmAndamento && !carregandoEste;
                return (
                  <div
                    key={item.planoId}
                    className={`${styles.square} ${bloqueado ? styles.squareBloqueado : ""}`}
                    onClick={() => {
                      if (bloqueado || carregandoEste) return;
                      handlePegar(item.planoId);
                    }}
                  >
                    <div className={styles.squareContent}>
                      <div className={styles.info}>
                        <p className={styles.area}>
                          {item.area?.area || "sem área"} —{" "}
                          {item.edital?.titulo?.toUpperCase()}
                        </p>
                        <p className={styles.planos}>
                          {item.pendentes} de {item.totalItens} item(ns) pendente(s)
                        </p>
                      </div>
                      <div className={styles.submissaoData}>
                        <h6>{item.titulo}</h6>
                        {carregandoEste && (
                          <p className={styles.waiting}>
                            Aguarde... Reivindicando este recurso
                          </p>
                        )}
                      </div>
                      {erroPegar[item.planoId] && (
                        <div className={styles.error}>
                          <p>{erroPegar[item.planoId]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.noData}>
              <NoData description="Não há recursos disponíveis para análise no momento." />
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default Page;
