"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  RiDeleteBinLine,
  RiQuillPenLine,
  RiInformationLine,
  RiWhatsappFill,
  RiEditLine,
  RiAddCircleLine,
  RiShuffleLine,
  RiStarFill,
} from "@remixicon/react";
import { MultiSelect } from "primereact/multiselect";
import Modal from "@/components/Modal";
import NoData from "@/components/NoData";
import Button from "@/components/Button";
import AreaSelector from "@/components/Formularios/AreaSelector";
import {
  associarAvaliadorInscricaoProjeto,
  desassociarAvaliadorInscricaoProjeto,
  getEstatisticasAvaliador,
  getProjetosAguardandoAvaliacao,
  getProjetosEmAvaliacao,
} from "@/app/api/client/avaliador";
import { getUserAreas } from "@/app/api/client/userTenant";
import { getAreas } from "@/app/api/client/area";
import { getCurrentUserId } from "@/lib/headers";

// Suporte do PLIC (não é o contato do tenant) — mesmo número já usado em
// ConviteAvaliadorClient.jsx, FluxoInscricaoEdital.jsx e EditarParticipacao.jsx.
const SUPORTE_PLIC_WHATSAPP = "5561991651494";

const SuporteWhatsapp = () => (
  <a
    className={styles.suporteWhatsapp}
    href={`https://wa.me/${SUPORTE_PLIC_WHATSAPP}?text=${encodeURIComponent(
      "Olá! Preciso de ajuda para avaliar projetos no PLIC.",
    )}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <RiWhatsappFill />
    <div>
      <p className={styles.suporteWhatsappTitulo}>Precisa de ajuda?</p>
      <p>Fale com o suporte do PLIC pelo WhatsApp: +55 (61) 99165-1494</p>
    </div>
  </a>
);

const ABAS = [
  { id: "emAndamento", label: "Em andamento" },
  { id: "escolherNovo", label: "Escolher novo trabalho" },
];

const Page = ({ params }) => {
  const [abaAtiva, setAbaAtiva] = useState("emAndamento");
  const [abaInicialDefinida, setAbaInicialDefinida] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({}); // Erros individuais por submissão
  const [loadingSubmissao, setLoadingSubmissao] = useState({}); // Carregamento individual por submissão
  const [selectedAreas, setSelectedAreas] = useState([]); // Estado para áreas selecionadas (usando nomes)
  const [submissoes, setSubmissoes] = useState({
    submissoesData: [],
    areasPendentesDeAvaliacao: {},
  }); // Estado para submissões e áreas pendentes de avaliação
  const [submissoesEmAvaliacao, setSubmissoesEmAvaliacao] = useState([]);
  const [filteredSubmissoes, setFilteredSubmissoes] = useState([]); // Submissões filtradas exibidas
  const [loadingDevolver, setLoadingDevolver] = useState({});
  const [podeAtribuirNovoProjeto, setPodeAtribuirNovoProjeto] = useState(true);
  const router = useRouter();

  const anoCorrente = new Date().getFullYear();
  const [userId] = useState(() => getCurrentUserId());

  // Áreas de interesse do avaliador
  const [userAreaIds, setUserAreaIds] = useState([]);
  const [areasCatalogo, setAreasCatalogo] = useState({}); // { [id]: nome da área }
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [continuarSorteioAoSalvarArea, setContinuarSorteioAoSalvarArea] =
    useState(false);

  // Estatísticas do ano corrente
  const [estatisticas, setEstatisticas] = useState(null);

  // Atribuição aleatória com base nas áreas de interesse
  const [sorteando, setSorteando] = useState(false);
  const [mensagemSorteio, setMensagemSorteio] = useState("");
  const [erroSorteio, setErroSorteio] = useState("");

  // Função de busca dos dados ao renderizar o componente
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getProjetosAguardandoAvaliacao(
        params.tenant,
        [],
        anoCorrente,
      );
      setSubmissoes(data);
      setFilteredSubmissoes(data.submissoesData); // Inicializa com todas as submissões
      setPodeAtribuirNovoProjeto(
        data?.limiteAtribuicao?.podeAtribuirNovoProjeto !== false,
      );
      const submissaoEmAvaliacao = await getProjetosEmAvaliacao(
        params.tenant,
        anoCorrente,
      );
      setSubmissoesEmAvaliacao(submissaoEmAvaliacao);
      // Só decide a aba inicial uma vez (no primeiro carregamento) — evita
      // pular de aba embaixo do usuário quando fetchData roda de novo depois
      // de um "Devolver".
      if (!abaInicialDefinida) {
        setAbaAtiva(
          submissaoEmAvaliacao?.length > 0 ? "emAndamento" : "escolherNovo",
        );
        setAbaInicialDefinida(true);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Busca áreas de interesse do avaliador (+ catálogo global de áreas, pra
  // resolver o nome a partir do id) e as estatísticas do ano corrente.
  const fetchAreasEEstatisticas = async () => {
    setLoadingAreas(true);
    try {
      const [areaIds, todasAreas, stats] = await Promise.all([
        getUserAreas(params.tenant, userId),
        getAreas(),
        getEstatisticasAvaliador(params.tenant, anoCorrente),
      ]);
      setUserAreaIds(areaIds || []);
      const catalogo = {};
      (todasAreas || []).forEach((area) => {
        catalogo[area.id] = area.area;
      });
      setAreasCatalogo(catalogo);
      setEstatisticas(stats || null);
    } catch (error) {
      console.error("Erro ao buscar áreas de interesse/estatísticas:", error);
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    fetchData(); // Inicializa sem filtros
    if (userId) {
      fetchAreasEEstatisticas();
    }
  }, []);

  // Aplica o filtro por área a partir do array completo vindo do dropdown
  // (o próprio MultiSelect já cuida de adicionar/remover da seleção).
  const handleAreaFilterChange = (updatedSelectedAreas) => {
    setSelectedAreas(updatedSelectedAreas);

    if (updatedSelectedAreas.length === 0) {
      // Se nenhuma área for selecionada, mostrar todas as submissões
      setFilteredSubmissoes(submissoes.submissoesData);
    } else {
      // Filtra localmente para submissões das áreas selecionadas
      const filtered = submissoes.submissoesData.filter((item) => {
        const areaNome = item.projeto?.area?.area || "Área não definida";
        return updatedSelectedAreas.includes(areaNome);
      });
      setFilteredSubmissoes(filtered);
    }
  };

  // Nomes (não ids) das áreas de interesse do avaliador, pra priorizá-las no
  // dropdown "Filtre por área" e destacar visualmente cada opção.
  const nomesDasMinhasAreas = userAreaIds
    .map((id) => areasCatalogo[id])
    .filter(Boolean);

  const areaFiltroOpcoes = Object.entries(submissoes.areasPendentesDeAvaliacao)
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

  // Enquanto uma atribuição estiver em andamento (clique num card específico
  // ou sorteio aleatório), os demais cards ficam travados — o limite é de 1
  // projeto por vez, então não faz sentido permitir clicar em outro card
  // (ou disparar o sorteio de novo) até essa requisição terminar.
  const algumaAtribuicaoEmAndamento =
    sorteando || Object.values(loadingSubmissao).some(Boolean);

  // Função para tratar o clique na submissão (usada tanto pela seleção
  // manual quanto pela atribuição aleatória). Retorna a submissão
  // atualizada em caso de sucesso, ou null em caso de falha — quem chamar
  // decide como exibir o erro (por card, no caso manual; num aviso próprio,
  // no caso do sorteio).
  const handleClickOnSquare = async (tenant, idInscricaoProjeto) => {
    setError({}); // Limpa qualquer erro anterior
    setLoadingSubmissao((prevLoading) => ({
      ...prevLoading,
      [idInscricaoProjeto]: true, // Define o estado de carregamento para esta submissão
    }));

    try {
      const updatedSubmissao = await associarAvaliadorInscricaoProjeto(
        tenant,
        idInscricaoProjeto,
      );
      if (updatedSubmissao) {
        // Remove a submissão da lista de submissões que aguardam avaliação
        setFilteredSubmissoes((prevSubmissoes) =>
          prevSubmissoes.filter(
            (submissao) => submissao.id !== idInscricaoProjeto,
          ),
        );

        // Adiciona a submissão à lista de submissões em avaliação
        setSubmissoesEmAvaliacao((prevSubmissoes) => [
          ...prevSubmissoes,
          updatedSubmissao, // Assumindo que a submissão atualizada é retornada da função
        ]);
        setPodeAtribuirNovoProjeto(false);
        // Muda pra aba "Em andamento" pra já mostrar o projeto recém-atribuído
        // (vale tanto pro clique manual num card quanto pro sorteio aleatório).
        setAbaAtiva("emAndamento");
        // Rola a página para o topo
        window.scrollTo({
          top: 0,
          behavior: "smooth", // Opção para rolar suavemente
        });
      }
      return updatedSubmissao;
    } catch (err) {
      // Define o erro para a submissão específica
      setError((prevErrors) => ({
        ...prevErrors,
        [idInscricaoProjeto]:
          err.response?.data?.message || "Erro ao associar submissão",
      }));
      return null;
    } finally {
      setLoadingSubmissao((prevLoading) => ({
        ...prevLoading,
        [idInscricaoProjeto]: false, // Remove o estado de carregamento para esta submissão
      }));
    }
  };

  // Função para tratar a desvinculação do avaliador
  const handleDesvincularAvaliador = async (eventoId, idSubmissao) => {
    setError({});
    setLoadingDevolver((prevLoading) => ({
      ...prevLoading,
      [idSubmissao]: true, // Define o carregamento do botão "Devolver"
    }));

    try {
      const updatedSubmissao = await desassociarAvaliadorInscricaoProjeto(
        eventoId,
        idSubmissao,
      );
      if (updatedSubmissao) {
        setSubmissoesEmAvaliacao((prevSubmissoes) =>
          prevSubmissoes.filter((submissao) => submissao.id !== idSubmissao),
        );
        setFilteredSubmissoes((prevSubmissoes) => [
          ...prevSubmissoes,
          updatedSubmissao,
        ]);
        // Recarrega do backend para reavaliar podeAtribuirNovoProjeto de forma
        // confiável — o limite é global (todos os tenants/anos do avaliador),
        // então devolver este projeto não garante que o total caiu a zero.
        fetchData();
      }
    } catch (err) {
      setError((prevErrors) => ({
        ...prevErrors,
        [idSubmissao]:
          err.response?.data?.error || "Erro ao desvincular submissão",
      }));
    } finally {
      setLoadingDevolver((prevLoading) => ({
        ...prevLoading,
        [idSubmissao]: false, // Remove o estado de carregamento do botão "Devolver"
      }));
    }
  };

  // Atribui aleatoriamente um projeto pendente dentre as áreas de interesse
  // do avaliador. Se ainda não houver áreas cadastradas, abre o cadastro
  // primeiro e continua o sorteio assim que ele for salvo.
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
      const resultado = await getProjetosAguardandoAvaliacao(
        params.tenant,
        areaIds,
        anoCorrente,
      );
      const candidatos = resultado?.submissoesData ?? [];
      if (candidatos.length === 0) {
        setMensagemSorteio(
          "Não encontramos nenhum projeto pendente que combine com suas áreas de interesse no momento. Selecione manualmente na lista abaixo.",
        );
        return;
      }
      const escolhido =
        candidatos[Math.floor(Math.random() * candidatos.length)];
      const updated = await handleClickOnSquare(params.tenant, escolhido.id);
      if (!updated) {
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

  return (
    <>
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

      <div className={styles.navContent}>
        <SuporteWhatsapp />

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
                  projetos mais alinhadas ao seu perfil.
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

        {estatisticas && (
          <>
            <h6 className="mb-1">Minhas avaliações em {anoCorrente}</h6>
            <div className={styles.totais}>
              <div className={`${styles.total} ${styles.somenteLeitura}`}>
                <p>{estatisticas.totalProjetosAvaliados}</p>
                <h6>
                  {estatisticas.totalProjetosAvaliados === 1
                    ? "projeto avaliado"
                    : "projetos avaliados"}
                </h6>
              </div>
              <div className={`${styles.total} ${styles.somenteLeitura}`}>
                <p>{estatisticas.totalPlanosAvaliados}</p>
                <h6>
                  {estatisticas.totalPlanosAvaliados === 1
                    ? "plano de trabalho avaliado"
                    : "planos de trabalho avaliados"}
                </h6>
              </div>
            </div>
          </>
        )}

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
            {submissoesEmAvaliacao && submissoesEmAvaliacao.length > 0 && (
              <>
                <div className={`${styles.squares} ${styles.minhasAvaliacoes}`}>
                  {submissoesEmAvaliacao.length > 0 &&
                    submissoesEmAvaliacao.map((item, index) => (
                      <div
                        key={index}
                        className={`${styles.square}  ${styles.squareWarning}`}
                      >
                        <div className={styles.squareContent}>
                          <div className={styles.info}>
                            <p className={styles.area}>
                              {item?.projeto?.area?.area || "sem área"} -{" "}
                              {item?.inscricao?.edital?.titulo?.toUpperCase()}
                            </p>
                            <p className={styles.planos}>
                              {item?._count?.PlanoDeTrabalho ?? 0}{" "}
                              {item?._count?.PlanoDeTrabalho === 1
                                ? "plano de trabalho"
                                : "planos de trabalho"}
                            </p>
                          </div>
                          <div className={styles.submissaoData}>
                            <h6>{item?.projeto?.titulo}</h6>
                          </div>
                          {error[item.id] && (
                            <div className={styles.error}>
                              <p>{error[item.id]}</p>
                            </div>
                          )}
                        </div>

                        <div className={styles.actions}>
                          <div className={styles.item1}>
                            <div
                              className={`${styles.squareHeader} ${styles.action} ${styles.actionError}`}
                              onClick={() =>
                                handleDesvincularAvaliador(
                                  params.tenant,
                                  item.id,
                                )
                              }
                            >
                              <RiDeleteBinLine />
                              <p>
                                {loadingDevolver[item.id]
                                  ? "Devolvendo..."
                                  : "Devolver"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`${styles.squareHeader}  ${styles.action} ${styles.actionPrimary}`}
                            onClick={() =>
                              router.push(
                                `/${params.tenant}/avaliador/avaliacoes/projetos/${item.id}`,
                              )
                            }
                          >
                            <RiQuillPenLine />
                            <p>Avaliar agora</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
            {(!submissoesEmAvaliacao || submissoesEmAvaliacao.length === 0) && (
              <div className={styles.noData}>
                {loading && <p className="p-4">Carregando...</p>}
                {!loading && (
                  <NoData description="Os trabalhos que vocês selecionar para avaliar aparecerão aqui! Clique na aba ao lado para escolher." />
                )}
              </div>
            )}
          </>
        )}

        {abaAtiva === "escolherNovo" && (
          <>
            {!podeAtribuirNovoProjeto ? (
              <div className={styles.avisoInfo}>
                <RiInformationLine size={20} />
                <p>
                  Você já possui um projeto em avaliação. Finalize a avaliação
                  ou devolva o projeto atual (aba ao lado) para poder escolher
                  um novo projeto.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.sorteioSection}>
                  <h6 className="mb-1">Atribuição rápida</h6>
                  <p className="mb-2">
                    Prefere não escolher manualmente? Deixe o sistema atribuir
                    um projeto pendente com base nas suas áreas de interesse.
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
                <h6 className="mb-1">Selecione um trabalho para avaliar</h6>
                {loading ? (
                  <p>Carregando...</p>
                ) : (
                  <div className={styles.squares}>
                    {filteredSubmissoes.length > 0 ? (
                      filteredSubmissoes.map((item, index) => {
                        const estaCarregando = !!loadingSubmissao[item.id];
                        const bloqueado =
                          algumaAtribuicaoEmAndamento && !estaCarregando;
                        return (
                          <div
                            key={index}
                            className={`${styles.square} ${bloqueado ? styles.squareBloqueado : ""}`}
                            onClick={() => {
                              if (bloqueado) return;
                              handleClickOnSquare(params.tenant, item.id);
                            }} // Chama a função ao clicar na submissão (ignorado se outra atribuição já estiver em andamento)
                          >
                            <div className={styles.squareContent}>
                              <div className={styles.info}>
                                <p className={styles.area}>
                                  {item?.projeto?.area?.area || "sem área"} -
                                  Edital {item?.inscricao?.edital?.titulo}
                                </p>
                                <p className={styles.planos}>
                                  {item?._count?.PlanoDeTrabalho ?? 0}{" "}
                                  {item?._count?.PlanoDeTrabalho === 1
                                    ? "plano de trabalho"
                                    : "planos de trabalho"}
                                </p>
                              </div>
                              <div className={styles.submissaoData}>
                                <h6>
                                  [ID_{item?.projeto?.id}]{" "}
                                  {item?.projeto?.titulo}
                                </h6>
                                {loadingSubmissao[item.id] && (
                                  <p className={styles.waiting}>
                                    Aguarde... Fazendo a vinculação do projeto
                                  </p> // Mensagem de carregamento
                                )}
                              </div>
                              {error[item.id] && (
                                <div className={styles.error}>
                                  <p>{error[item.id]}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <NoData description="Nenhum projeto pendente para as áreas selecionadas." />
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Page;
