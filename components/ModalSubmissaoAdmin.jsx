import {
  getSubmissaoByIdForAdmin,
  updateSubmissaoStatus,
  updateSubmissaoPremiacao,
  updateSubmissaoDados,
  adicionarParticipacaoSubmissao,
  removerParticipacaoSubmissao,
  arquivarAvaliacao,
} from "@/app/api/client/submissao";
import { validarJustificativaManualmente, cpfVerificationForInscricao } from "@/app/api/client/eventos";
import { vincularAutomaticamenteSubmissao } from "@/app/api/client/square"; // Importa a função de vinculação automática
import { getAreas } from "@/app/api/client/area";
import { getSessoesBySlug } from "@/app/api/client/sessoes";
import { transformedArray } from "@/lib/transformedArray";
import styles from "./ModalSubmissaoAdmin.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchableSelect from "@/components/SearchableSelect";
import { useForm } from "react-hook-form";
import { Tag } from "primereact/tag";
import {
  RiArchiveLine,
  RiArticleLine,
  RiBrainLine,
  RiCalendarLine,
  RiCloseLargeLine,
  RiDeleteBinLine,
  RiFlaskFill,
  RiFlaskLine,
  RiInboxUnarchiveLine,
  RiTimeLine,
  RiUserUnfollowLine,
  RiLoginCircleLine,
  RiHourglassLine,
} from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import { desvincularSubmissao } from "@/app/api/client/square";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
import { abrirArquivoPrivado, urlDownloadJustificativaAdmin } from "@/app/api/client/arquivos";

const CARGOS_PARTICIPANTE = [
  { value: "AUTOR", label: "Autor" },
  { value: "COAUTOR", label: "Coautor" },
  { value: "ORIENTADOR", label: "Orientador" },
  { value: "COORIENTADOR", label: "Coorientador" },
  { value: "COLABORADOR", label: "Colaborador" },
];

const Modal = ({ isOpen, onClose, eventoSlug, idSubmissao, onDataUpdated }) => {
  const [visible, setVisible] = useState(false);
  const [submissao, setSubmissao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [vinculando, setVinculando] = useState(false); // Estado para controlar a vinculação automática
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  const [atualizandoPremiacao, setAtualizandoPremiacao] = useState(false);
  const [motivoValidacaoManual, setMotivoValidacaoManual] = useState("");
  const [validandoManualmente, setValidandoManualmente] = useState(false);
  const [arquivandoAvaliacaoId, setArquivandoAvaliacaoId] = useState(null);

  const [activeTab, setActiveTab] = useState("detalhes");
  const [areas, setAreas] = useState([]);
  const [subsessoesOptions, setSubsessoesOptions] = useState([]);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroSalvarDados, setErroSalvarDados] = useState("");
  const [sucessoSalvarDados, setSucessoSalvarDados] = useState(false);
  const [justificativaTitulo, setJustificativaTitulo] = useState("");

  const [cpfParticipante, setCpfParticipante] = useState("");
  const [cargoParticipante, setCargoParticipante] = useState("");
  const [adicionandoParticipante, setAdicionandoParticipante] = useState(false);
  const [erroParticipante, setErroParticipante] = useState("");
  const [removendoParticipacaoId, setRemovendoParticipacaoId] = useState(null);

  const {
    control: controlDados,
    handleSubmit: handleSubmitDados,
    reset: resetDados,
  } = useForm({
    defaultValues: { titulo: "", areaId: null, subsessaoId: null },
  });

  const fetchData = async (eventoSlug, idSubmissao) => {
    setLoading(true); // Define o estado de carregamento como verdadeiro
    try {
      const submissao = await getSubmissaoByIdForAdmin(eventoSlug, idSubmissao);
      setSubmissao(submissao);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setSubmissao(null);
      setActiveTab("detalhes");
      fetchData(eventoSlug, idSubmissao);
    } else {
      // Reset visible state when modal is closed
      setVisible(false);
    }
  }, [isOpen, eventoSlug, idSubmissao]);

  useEffect(() => {
    if (!isOpen) return;
    getAreas()
      .then((data) => setAreas(transformedArray(data) || []))
      .catch(() => setAreas([]));
    getSessoesBySlug(eventoSlug)
      .then((sessoes) => {
        const options = (sessoes || []).flatMap((sessao) =>
          (sessao.subsessaoApresentacao || []).map((sub) => ({
            value: sub.id,
            label: `${sessao.titulo} — ${formatarData(sub.inicio)}, ${formatarHora(
              sub.inicio
            )}`,
          }))
        );
        setSubsessoesOptions(options);
      })
      .catch(() => setSubsessoesOptions([]));
  }, [isOpen, eventoSlug]);

  useEffect(() => {
    if (submissao?.Resumo) {
      resetDados({
        titulo: submissao.Resumo.titulo || "",
        areaId: submissao.Resumo.areaId || null,
        subsessaoId: submissao.subsessaoId || null,
      });
      setSucessoSalvarDados(false);
      setErroSalvarDados("");
      setJustificativaTitulo("");
    }
  }, [submissao, resetDados]);

  const handleCloseWithDelay = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  const handleDeleteSquare = async (idSquare) => {
    setExcluindo(true);
    try {
      await desvincularSubmissao(eventoSlug, idSubmissao, idSquare);
      // Atualiza os dados da submissão para remover o square desvinculado
      fetchData(eventoSlug, idSubmissao);
      // Notifica a página principal que os dados foram atualizados
      if (onDataUpdated) {
        onDataUpdated(); // Chama o callback
      }
    } catch (error) {
      console.error("Erro ao desvincular submissão:", error);
    } finally {
      setExcluindo(false);
    }
  };

  const handleToggleArquivarAvaliacao = async (item) => {
    const alvo = !item.arquivada;
    const mensagem = alvo
      ? "Arquivar esta avaliação? A nota deste avaliador deixará de contar na nota da submissão."
      : "Desarquivar esta avaliação? A nota deste avaliador volta a valer pra submissão.";
    if (!window.confirm(mensagem)) {
      return;
    }
    setArquivandoAvaliacaoId(item.id);
    try {
      await arquivarAvaliacao(eventoSlug, item.id, alvo);
      fetchData(eventoSlug, idSubmissao);
      if (onDataUpdated) {
        onDataUpdated();
      }
    } catch (error) {
      console.error("Erro ao arquivar/desarquivar avaliação:", error);
    } finally {
      setArquivandoAvaliacaoId(null);
    }
  };

  const handleVincularAutomaticamente = async () => {
    setVinculando(true);
    try {
      await vincularAutomaticamenteSubmissao(eventoSlug, idSubmissao);
      // Atualiza os dados da submissão após a vinculação
      fetchData(eventoSlug, idSubmissao);
    } catch (error) {
      console.error("Erro ao vincular submissão automaticamente:", error);
    } finally {
      setVinculando(false);
    }
  };
  const handleStatusUpdate = async (newStatus) => {
    setAlterandoStatus(true);
    try {
      const submissaoAtualizada = await updateSubmissaoStatus(
        eventoSlug,
        idSubmissao,
        newStatus
      );
      setSubmissao(submissaoAtualizada); // Atualiza a submissão no estado com o retorno da API
      if (onDataUpdated) {
        onDataUpdated(); // Notifica que os dados foram atualizados
      }
    } catch (error) {
      console.error("Erro ao atualizar o status da submissão:", error);
    } finally {
      setAlterandoStatus(false);
    }
  };
  const handlePremiacaoChange = async (campo, valor) => {
    setAtualizandoPremiacao(true);
    try {
      const dados = {
        premio: submissao?.premio || false,
        indicacaoPremio: submissao?.indicacaoPremio || false,
        mencaoHonrosa: submissao?.mencaoHonrosa || false,
        [campo]: valor,
      };
      const submissaoAtualizada = await updateSubmissaoPremiacao(
        eventoSlug,
        idSubmissao,
        dados
      );
      setSubmissao((prev) => ({ ...prev, ...submissaoAtualizada }));
      if (onDataUpdated) {
        onDataUpdated();
      }
    } catch (error) {
      console.error("Erro ao atualizar a premiação da submissão:", error);
    } finally {
      setAtualizandoPremiacao(false);
    }
  };

  const handleValidarManualmente = async () => {
    if (!motivoValidacaoManual.trim()) return;
    setValidandoManualmente(true);
    try {
      await validarJustificativaManualmente(
        eventoSlug,
        justificativa.id,
        motivoValidacaoManual.trim()
      );
      setMotivoValidacaoManual("");
      fetchData(eventoSlug, idSubmissao);
      if (onDataUpdated) onDataUpdated();
    } catch (error) {
      console.error("Erro ao validar justificativa manualmente:", error);
    } finally {
      setValidandoManualmente(false);
    }
  };

  const handleSalvarDados = async (data) => {
    setSalvandoDados(true);
    setErroSalvarDados("");
    setSucessoSalvarDados(false);
    try {
      await updateSubmissaoDados(eventoSlug, idSubmissao, {
        titulo: data.titulo?.trim(),
        areaId: data.areaId ? parseInt(data.areaId) : undefined,
        subsessaoId: data.subsessaoId ? parseInt(data.subsessaoId) : undefined,
        justificativaTitulo: justificativaTitulo.trim(),
      });
      await fetchData(eventoSlug, idSubmissao);
      setSucessoSalvarDados(true);
      if (onDataUpdated) onDataUpdated();
    } catch (error) {
      console.error("Erro ao salvar dados da submissão:", error);
      setErroSalvarDados(
        error?.response?.data?.message || "Ocorreu um erro ao salvar os dados."
      );
    } finally {
      setSalvandoDados(false);
    }
  };

  const resetFormParticipante = () => {
    setCpfParticipante("");
    setCargoParticipante("");
    setErroParticipante("");
  };

  const handleAdicionarParticipante = async () => {
    if (!cpfParticipante.trim() || !cargoParticipante) return;
    setAdicionandoParticipante(true);
    setErroParticipante("");
    try {
      const jaParticipa = submissao?.Resumo?.participacoes?.some(
        (p) => p.user?.cpf?.replace(/\D/g, "") === cpfParticipante.replace(/\D/g, "")
      );
      if (jaParticipa) {
        setErroParticipante("Este CPF já é participante desta submissão.");
        return;
      }
      const user = await cpfVerificationForInscricao(cpfParticipante.trim());
      await adicionarParticipacaoSubmissao(eventoSlug, idSubmissao, {
        userId: user.id,
        cargo: cargoParticipante,
      });
      await fetchData(eventoSlug, idSubmissao);
      resetFormParticipante();
      if (onDataUpdated) onDataUpdated();
    } catch (error) {
      console.error("Erro ao adicionar participante:", error);
      setErroParticipante(
        error?.response?.data?.message || "Ocorreu um erro ao adicionar o participante."
      );
    } finally {
      setAdicionandoParticipante(false);
    }
  };

  const podeRemoverParticipacao = (participacaoId) => {
    const restantes = (submissao?.Resumo?.participacoes || []).filter(
      (p) => p.id !== participacaoId
    );
    const temAutor = restantes.some((p) => p.cargo === "AUTOR" || p.cargo === "COAUTOR");
    const temOrientador = restantes.some(
      (p) => p.cargo === "ORIENTADOR" || p.cargo === "COORIENTADOR"
    );
    return temAutor && temOrientador;
  };

  const handleRemoverParticipacao = async (participacaoId) => {
    if (!podeRemoverParticipacao(participacaoId)) return;
    if (!window.confirm("Remover este participante da submissão?")) return;
    setRemovendoParticipacaoId(participacaoId);
    try {
      await removerParticipacaoSubmissao(eventoSlug, participacaoId);
      await fetchData(eventoSlug, idSubmissao);
      if (onDataUpdated) onDataUpdated();
    } catch (error) {
      console.error("Erro ao remover participação:", error);
    } finally {
      setRemovendoParticipacaoId(null);
    }
  };

  const justificativa = submissao?.JustificativaApresentacaoCongresso?.[0];

  if (!isOpen) return null;

  return (
    <div className={`${styles.modalBackdrop} ${visible && styles.visible}`}>
      <div className={`${styles.modalContent} `}>
        <div onClick={handleCloseWithDelay} className={styles.closeIcon}>
          <RiCloseLargeLine />
        </div>
        <div className={`${styles.content}`}>
          <div className={`${styles.icon} mb-2`}>
            <RiArticleLine />
          </div>
          <h4 className="mb-2">Submissão</h4>
          {loading && <p>Carregando...</p>}
          <div className={styles.menu}>
            <div
              className={`${styles.itemMenu} ${
                activeTab === "detalhes" ? styles.itemMenuSelected : ""
              }`}
              onClick={() => setActiveTab("detalhes")}
            >
              <p>Detalhes</p>
            </div>
            <div
              className={`${styles.itemMenu} ${
                activeTab === "editar" ? styles.itemMenuSelected : ""
              }`}
              onClick={() => setActiveTab("editar")}
            >
              <p>Editar dados</p>
            </div>
          </div>
          {activeTab === "detalhes" && (
            <div className={styles.squares}>
              <div className={styles.square}>
                <div className={styles.squareContent}>
                  <div className={styles.info}>
                    <p
                      className={`${styles.status} ${
                        submissao?.status === "DISTRIBUIDA" ||
                        submissao?.status === "SELECIONADA"
                          ? styles.error
                          : submissao?.status === "AGUARDANDO_AVALIACAO"
                          ? styles.warning
                          : submissao?.status === "AVALIADA"
                          ? styles.success
                          : submissao?.status === "AUSENTE"
                          ? styles.inativada
                          : styles.success
                      }
                      }`}
                    >
                      {submissao?.status === "DISTRIBUIDA" ||
                      submissao?.status === "SELECIONADA"
                        ? "checkin pendente"
                        : submissao?.status === "AGUARDANDO_AVALIACAO"
                        ? "aguardando avaliação"
                        : submissao?.status === "AVALIADA"
                        ? "avaliação concluída"
                        : submissao?.status === "AUSENTE"
                        ? "ausente"
                        : submissao?.status}
                    </p>
                    <p className={styles.area}>
                      {submissao?.Resumo?.area?.area
                        ? submissao?.Resumo?.area?.area
                        : "sem área"}{" "}
                      - {getInstituicaoSigla(submissao)}-{" "}
                      {submissao?.categoria?.toUpperCase()}
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{submissao?.Resumo?.titulo}</h6>
                    <p className={styles.participacoes}>
                      <strong>Orientadores: </strong>
                      {submissao?.Resumo?.participacoes
                        .filter(
                          (item) =>
                            item.cargo === "ORIENTADOR" ||
                            item.cargo === "COORIENTADOR"
                        )
                        .map(
                          (item, i) => `${i > 0 ? ", " : ""}${item.user.nome} `
                        )}
                    </p>
                    <p className={styles.participacoes}>
                      <strong>Alunos: </strong>
                      {submissao?.Resumo?.participacoes
                        .filter(
                          (item) =>
                            item.cargo === "AUTOR" || item.cargo === "COAUTOR"
                        )
                        .map(
                          (item, i) => `${i > 0 ? ", " : ""}${item.user.nome} `
                        )}
                    </p>
                  </div>
                </div>

                {submissao?.square?.map((item) => (
                  <div key={item.id} className={styles.squareHeader}>
                    <div className={styles.squareHeaderNumero}>
                      <div>
                        <p>Pôster nº</p>
                        <h6>{item.numero}</h6>
                      </div>
                      <div
                        className={styles.deleteSquare}
                        onClick={() => handleDeleteSquare(item.id)}
                      >
                        <RiDeleteBinLine />
                        {excluindo && <p>Excluindo...</p>}
                      </div>
                    </div>
                    <div className={styles.squareHeaderInfo}>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiFlaskLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>
                            <strong>Sessão: </strong>
                            {
                              item.subsessaoApresentacao.sessaoApresentacao
                                .titulo
                            }
                          </p>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiCalendarLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>
                            <strong>Dia: </strong>
                            {formatarData(item.subsessaoApresentacao.inicio)}
                          </p>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiTimeLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>
                            <strong>Horário: </strong>
                            {formatarHora(item.subsessaoApresentacao.inicio)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {submissao?.square?.length < 1 && (
                  <div className={styles.squareHeader}>
                    <div className={styles.squareHeaderNumero}>
                      <div>
                        <p>Pôster nº</p>
                        <h6>-</h6>
                      </div>
                    </div>
                    <div className={styles.squareHeaderInfo}>
                      <p
                        className={styles.link}
                        onClick={handleVincularAutomaticamente}
                      >
                        Vincular a um pôster vazio
                      </p>
                      {vinculando && <p>Vinculando...</p>}
                    </div>
                  </div>
                )}
                {submissao?.emAvaliacaoPor &&
                  submissao?.emAvaliacaoPor.length > 0 && (
                    <div className={styles.squareHeader}>
                      <div className={styles.squareHeaderNumero}>
                        <div>
                          <p>Trabalho está em avaliação:</p>
                        </div>
                      </div>
                      {submissao.emAvaliacaoPor.map((item) => (
                        <div key={item.id} className={styles.squareHeaderInfo}>
                          <div className={styles.emAvaliacao}>
                            <div className={styles.time}>
                              <h6>{item.tempo}</h6>
                              <p>min</p>
                            </div>
                            <p>
                              {item.avaliador.user.nome} (ID {item.id})
                            </p>
                            {false && (
                              <div className={styles.deletarAvaliador}>
                                <div
                                  className={styles.deleteSquare}
                                  onClick={() => {}}
                                >
                                  <RiDeleteBinLine />
                                  {excluindo && <p>Excluindo...</p>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                <div className={styles.squareHeader}>
                  <div className={styles.squareHeaderNumero}>
                    <div>
                      <p>Avaliações:</p>
                    </div>
                  </div>
                  <div className={styles.squareHeaderInfo}>
                    {submissao?.Avaliacao?.sort((a, b) => a.id - b.id).map(
                      (item) => (
                        <div
                          key={item.id}
                          className={`${styles.avaliador} ${
                            item.arquivada ? styles.avaliadorArquivado : ""
                          }`}
                        >
                          <div className={styles.squareHeaderNumero}>
                            <div>
                              <p>
                                ID da avaliação: <strong>{item.id}</strong>
                              </p>
                              {item.arquivada && (
                                <Tag severity="warning" value="Arquivada" className="mt-1" />
                              )}
                            </div>
                            <div
                              className={styles.deleteSquare}
                              onClick={() => handleToggleArquivarAvaliacao(item)}
                              title={item.arquivada ? "Desarquivar avaliação" : "Arquivar avaliação"}
                            >
                              {item.arquivada ? <RiInboxUnarchiveLine /> : <RiArchiveLine />}
                              {arquivandoAvaliacaoId === item.id && <p>Salvando...</p>}
                            </div>
                          </div>
                          <p>
                            Avaliador: <strong>{item.avaliador?.nome}</strong>
                          </p>
                          <p>
                            Nota:{" "}
                            <strong
                              style={item.arquivada ? { textDecoration: "line-through" } : undefined}
                            >
                              {item.notaTotal}
                            </strong>
                          </p>
                          <p>
                            Prêmios:
                            <strong>
                              {!item.indicacaoPremio &&
                                !item.mencaoHonrosa &&
                                "-"}
                              {item.indicacaoPremio && "indicacão a prêmio"}
                              <br></br>
                              {item.mencaoHonrosa && "menção honrosa"}
                            </strong>
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
                {!(
                  submissao?.emAvaliacaoPor &&
                  submissao?.emAvaliacaoPor.length > 0
                ) && (
                  <div className={styles.squareHeader}>
                    <div className={styles.squareHeaderNumero}>
                      <div>
                        <p>Alterar Status para:</p>
                      </div>
                    </div>
                    {submissao && (
                      <div className={`${styles.squareHeaderInfo} flex gap-1`}>
                        {alterandoStatus && <p className="mb-2">Aguarde...</p>}
                        <Button
                          className={
                            submissao?.status === "AUSENTE"
                              ? "btn-primary"
                              : "btn-secondary"
                          }
                          icon={RiUserUnfollowLine}
                          disabled={alterandoStatus}
                          onClick={() => handleStatusUpdate("AUSENTE")}
                        >
                          Ausente
                        </Button>
                        <Button
                          className={
                            submissao?.status === "DISTRIBUIDA" ||
                            submissao?.status === "SELECIONADA"
                              ? "btn-primary"
                              : "btn-secondary"
                          }
                          icon={RiLoginCircleLine}
                          disabled={alterandoStatus}
                          onClick={() => handleStatusUpdate("DISTRIBUIDA")}
                        >
                          Checkin pendente
                        </Button>
                        <Button
                          className={
                            submissao?.status === "AGUARDANDO_AVALIACAO"
                              ? "btn-primary"
                              : "btn-secondary"
                          }
                          icon={RiHourglassLine}
                          disabled={alterandoStatus}
                          onClick={() =>
                            handleStatusUpdate("AGUARDANDO_AVALIACAO")
                          }
                        >
                          Aguardando avaliação
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {submissao && (
                  <div className={styles.squareHeader}>
                    <div className={styles.squareHeaderNumero}>
                      <div>
                        <p>Premiação:</p>
                      </div>
                    </div>
                    <div className={styles.squareHeaderInfo}>
                      {atualizandoPremiacao && (
                        <p className="mb-2">Aguarde...</p>
                      )}
                      <div className="checkbox-container mb-1">
                        <input
                          type="checkbox"
                          id="indicacaoPremio"
                          checked={!!submissao?.indicacaoPremio}
                          disabled={atualizandoPremiacao}
                          onChange={() =>
                            handlePremiacaoChange(
                              "indicacaoPremio",
                              !submissao?.indicacaoPremio
                            )
                          }
                        />
                        <label htmlFor="indicacaoPremio">
                          <p>Indicação a prêmio</p>
                        </label>
                      </div>
                      <div className="checkbox-container mb-1">
                        <input
                          type="checkbox"
                          id="mencaoHonrosa"
                          checked={!!submissao?.mencaoHonrosa}
                          disabled={atualizandoPremiacao}
                          onChange={() =>
                            handlePremiacaoChange(
                              "mencaoHonrosa",
                              !submissao?.mencaoHonrosa
                            )
                          }
                        />
                        <label htmlFor="mencaoHonrosa">
                          <p>Menção honrosa</p>
                        </label>
                      </div>
                      <div className="checkbox-container">
                        <input
                          type="checkbox"
                          id="premio"
                          checked={!!submissao?.premio}
                          disabled={atualizandoPremiacao}
                          onChange={() =>
                            handlePremiacaoChange("premio", !submissao?.premio)
                          }
                        />
                        <label htmlFor="premio">
                          <p>Premiado</p>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {justificativa && (
                  <div className={styles.squareHeader}>
                    <div className={styles.squareHeaderNumero}>
                      <div>
                        <p>Justificativa de ausência:</p>
                      </div>
                    </div>
                    <div className={styles.squareHeaderInfo}>
                      <p>
                        <strong>Status: </strong>
                        {justificativa.status === "ACEITA"
                          ? "Aceita" +
                            (justificativa.motivoValidacaoManual
                              ? " (validada manualmente pelo gestor)"
                              : " (assinada pelo orientador)")
                          : "Aguardando assinatura do orientador"}
                      </p>
                      <p>{justificativa.justificativa}</p>
                      {justificativa.anexoUrl && (
                        <p>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              abrirArquivoPrivado(
                                urlDownloadJustificativaAdmin(eventoSlug, justificativa.id)
                              );
                            }}
                          >
                            Ver comprovante em PDF
                          </a>
                        </p>
                      )}
                      {justificativa.status === "PENDENTE" && (
                        <div className="mt-2">
                          <textarea
                            className="w-full"
                            rows={2}
                            placeholder="Motivo da validação manual (ex.: orientador falecido/afastado)"
                            value={motivoValidacaoManual}
                            onChange={(e) => setMotivoValidacaoManual(e.target.value)}
                          />
                          <p
                            className={styles.link}
                            onClick={
                              validandoManualmente || !motivoValidacaoManual.trim()
                                ? undefined
                                : handleValidarManualmente
                            }
                          >
                            {validandoManualmente
                              ? "Validando..."
                              : "Validar manualmente (sem assinatura do orientador)"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "editar" && submissao && (
            <div className={styles.editarDados}>
              <form
                onSubmit={handleSubmitDados(handleSalvarDados)}
                className={styles.formEditar}
              >
                <div className={styles.cardLabel}>Dados da submissão</div>
                <Input
                  control={controlDados}
                  name="titulo"
                  label="Título"
                  rules={{ required: "Título é obrigatório" }}
                />
                <SearchableSelect
                  control={controlDados}
                  name="areaId"
                  label="Área"
                  options={areas}
                />
                <SearchableSelect
                  control={controlDados}
                  name="subsessaoId"
                  label="Subsessão de apresentação"
                  options={subsessoesOptions}
                />
                {submissao.planoDeTrabalhoId && (
                  <div className={styles.avisoPlano}>
                    <p>
                      Esta submissão está vinculada a um Plano de Trabalho —
                      alterar o título também atualiza o título do plano.
                    </p>
                    <label htmlFor="justificativaTitulo">
                      <p>Justificativa da alteração de título (opcional)</p>
                    </label>
                    <textarea
                      id="justificativaTitulo"
                      className="w-full"
                      rows={2}
                      placeholder="Motivo da alteração de título (opcional)"
                      value={justificativaTitulo}
                      onChange={(e) => setJustificativaTitulo(e.target.value)}
                    />
                  </div>
                )}
                {erroSalvarDados && (
                  <p className={styles.erroTexto}>{erroSalvarDados}</p>
                )}
                {sucessoSalvarDados && (
                  <p className={styles.sucessoTexto}>Dados salvos com sucesso.</p>
                )}
                <Button
                  className="btn-primary mt-2"
                  type="submit"
                  disabled={salvandoDados}
                >
                  {salvandoDados ? "Salvando..." : "Salvar dados"}
                </Button>
              </form>

              <div className={styles.cardLabel}>Participações</div>
              <ul className={styles.listaParticipacoes}>
                {submissao?.Resumo?.participacoes?.map((participacao) => (
                  <li key={participacao.id}>
                    <div>
                      <p className="p5">
                        <strong>{participacao.user?.nome}</strong>
                      </p>
                      <p className={styles.cargoTag}>{participacao.cargo}</p>
                    </div>
                    <div
                      className={`${styles.deleteSquare} ${
                        !podeRemoverParticipacao(participacao.id) ? styles.disabled : ""
                      }`}
                      title={
                        podeRemoverParticipacao(participacao.id)
                          ? "Remover participante"
                          : "É necessário manter ao menos um autor/coautor e um orientador/coorientador"
                      }
                      onClick={() => handleRemoverParticipacao(participacao.id)}
                    >
                      {removendoParticipacaoId === participacao.id ? (
                        <p>Removendo...</p>
                      ) : (
                        <RiDeleteBinLine />
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.formAdicionarParticipante}>
                <label htmlFor="cpfParticipante">
                  <p>Adicionar participante pelo CPF</p>
                </label>
                <input
                  id="cpfParticipante"
                  type="text"
                  placeholder="Digite o CPF"
                  value={cpfParticipante}
                  onChange={(e) => setCpfParticipante(e.target.value)}
                />
                <p className="mt-1">Cargo</p>
                <div className={styles.cargoOpcoes}>
                  {CARGOS_PARTICIPANTE.map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      className={`${styles.cargoOpcao} ${
                        cargoParticipante === opcao.value ? styles.selected : ""
                      }`}
                      onClick={() => setCargoParticipante(opcao.value)}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
                {erroParticipante && (
                  <p className={styles.erroTexto}>{erroParticipante}</p>
                )}
                <Button
                  className="btn-primary mt-1"
                  type="button"
                  disabled={
                    !cpfParticipante.trim() || !cargoParticipante || adicionandoParticipante
                  }
                  onClick={handleAdicionarParticipante}
                >
                  {adicionandoParticipante ? "Adicionando..." : "Adicionar participante"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
