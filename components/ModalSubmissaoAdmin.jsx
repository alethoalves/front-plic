import {
  getSubmissaoByIdForAdmin,
  updateSubmissaoStatus,
} from "@/app/api/client/submissao";
import { vincularAutomaticamenteSubmissao } from "@/app/api/client/square"; // Importa a função de vinculação automática
import styles from "./ModalSubmissaoAdmin.module.scss";
import Button from "@/components/Button";
import {
  RiArticleLine,
  RiBrainLine,
  RiCalendarLine,
  RiCloseLargeLine,
  RiDeleteBinLine,
  RiFlaskFill,
  RiFlaskLine,
  RiTimeLine,
} from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import { desvincularSubmissao } from "@/app/api/client/square";

const Modal = ({ isOpen, onClose, eventoSlug, idSubmissao, onDataUpdated }) => {
  const [visible, setVisible] = useState(false);
  const [submissao, setSubmissao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [vinculando, setVinculando] = useState(false); // Estado para controlar a vinculação automática
  const [alterandoStatus, setAlterandoStatus] = useState(false);
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
      fetchData(eventoSlug, idSubmissao);
    } else {
      // Reset visible state when modal is closed
      setVisible(false);
    }
  }, [isOpen, eventoSlug, idSubmissao]);

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
      console.log(submissaoAtualizada);
      if (onDataUpdated) {
        onDataUpdated(); // Notifica que os dados foram atualizados
      }
    } catch (error) {
      console.error("Erro ao atualizar o status da submissão:", error);
    } finally {
      setAlterandoStatus(false);
    }
  };
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
          <h4>Submissão</h4>
          {loading && <p>Carregando...</p>}
          {true && (
            <div className={styles.squares}>
              <div className={styles.square}>
                <div className={styles.squareContent}>
                  <div className={styles.info}>
                    <p
                      className={`${styles.status} ${
                        submissao?.status === "DISTRIBUIDA"
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
                      {submissao?.status === "DISTRIBUIDA"
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
                      {submissao?.planoDeTrabalho?.area?.area
                        ? submissao?.planoDeTrabalho?.area?.area
                        : "sem área"}{" "}
                      -{" "}
                      {submissao?.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}
                      -{" "}
                      {submissao?.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{submissao?.planoDeTrabalho?.titulo}</h6>
                    <p className={styles.participacoes}>
                      <strong>Orientadores: </strong>
                      {submissao?.planoDeTrabalho?.inscricao?.participacoes
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
                      {submissao?.planoDeTrabalho?.participacoes?.map(
                        (item, i) =>
                          `${i > 0 ? ", " : ""}${item.user.nome} (${
                            item.status
                          })`
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
                        <div key={item.id} className={styles.avaliador}>
                          <p>
                            ID da avaliação: <strong>{item.id}</strong>
                          </p>
                          <p>
                            Avaliador: <strong>{item.avaliador?.nome}</strong>
                          </p>
                          <p>
                            Nota: <strong>{item.notaTotal}</strong>
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
                      <div className={styles.squareHeaderInfo}>
                        {alterandoStatus && <p className="mb-2">Aguarde...</p>}
                        <ul>
                          <li
                            className={`${
                              submissao?.status === "AUSENTE"
                                ? styles.selected
                                : ""
                            }`}
                            onClick={() => handleStatusUpdate("AUSENTE")} // Chama a função para atualizar o status
                          >
                            <p>Ausente</p>
                          </li>
                          <li
                            className={`${
                              submissao?.status === "DISTRIBUIDA"
                                ? styles.selected
                                : ""
                            }`}
                            onClick={() => handleStatusUpdate("DISTRIBUIDA")} // Chama a função para atualizar o status
                          >
                            <p>Checkin pendente</p>
                          </li>
                          <li
                            className={`${
                              submissao?.status === "AGUARDANDO_AVALIACAO"
                                ? styles.selected
                                : ""
                            }`}
                            onClick={() =>
                              handleStatusUpdate("AGUARDANDO_AVALIACAO")
                            } // Chama a função para atualizar o status
                          >
                            <p>Aguardando avaliação</p>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
