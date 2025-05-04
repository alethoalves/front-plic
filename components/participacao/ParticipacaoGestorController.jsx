"use client";

import CPFVerificationForm from "../Formularios/CPFVerificationForm";
import { useEffect, useRef, useState } from "react";
import styles from "./ParticipacaoGestorController.module.scss";
import {
  ativarParticipacao,
  getParticipacao,
  inativarParticipacao,
} from "@/app/api/client/participacao";
import { Checkbox } from "primereact/checkbox";

import {
  RiAddCircleLine,
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiCheckboxFill,
  RiCheckboxLine,
  RiCloseLine,
  RiExchangeLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiP2pFill,
  RiProhibited2Line,
  RiSwapLine,
  RiUserUnfollowLine,
} from "@remixicon/react";
import { getFormulario } from "@/app/api/client/formulario";
import Modal from "../Modal";
import NewCargo from "../Formularios/NewCargo";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { formatarData } from "@/lib/formatarDatas";
import { toggleStatusSolicitacaoBolsa } from "@/app/api/client/bolsa";
import { Tag } from "primereact/tag";
import { formatStatusText, getSeverityByStatus } from "@/lib/tagUtils";

const ParticipacaoGestorController = ({
  tenant,
  participacaoId,
  onSuccess,
  onClose,
}) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [editalInfo, setEditalInfo] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);
  const [isModalAvaliadorOpen, setIsModalAvaliadorOpen] = useState(false);
  const [avaliadorToEdit, setAvaliadorToEdit] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const [isModalCancelamentoOpen, setIsModalCancelamentoOpen] = useState(false);
  const [dataInativacao, setDataInativacao] = useState("");
  const [isLoadingAtivacao, setIsLoadingAtivacao] = useState(false);
  const [isLoadingToggle, setIsLoadingToggle] = useState(false);
  // Adicione este estado no componente
  const [justificativaInativacao, setJustificativaInativacao] = useState("");
  const handleToggleStatusBolsa = async () => {
    setIsLoadingToggle(true);
    try {
      if (!item?.SolicitacaoBolsa?.id) {
        throw new Error("Solicitação de bolsa não encontrada");
      }

      const result = await toggleStatusSolicitacaoBolsa(
        tenant,
        item.SolicitacaoBolsa.id
      );

      // Atualiza o estado local
      setItem((prev) => ({
        ...prev,
        SolicitacaoBolsa: {
          ...prev.SolicitacaoBolsa,
          pendente: !prev.SolicitacaoBolsa.pendente,
        },
      }));

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: `Bolsa ${
          !item.SolicitacaoBolsa.pendente ? "ativada" : "inativada"
        } com sucesso!`,
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao alternar status da bolsa:", error);

      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Ocorreu um erro ao alterar o status da bolsa",
        life: 3000,
      });
    } finally {
      setIsLoadingToggle(false);
    }
  };
  const handleAtivarParticipacao = async () => {
    setIsLoadingAtivacao(true);
    try {
      const participacaoAtivada = await ativarParticipacao(
        tenant,
        participacaoId
      );

      // Atualiza o estado local imediatamente
      setItem((prev) => ({
        ...prev,
        status: "ativo",
        inicio: participacaoAtivada.inicio, // Atualiza a data de início se retornada pela API
      }));

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Participação ativada com sucesso!",
        life: 3000,
      });

      // Opcional: ainda chamamos onSuccess() para atualizar qualquer estado externo se necessário
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Erro ao ativar participação:", error);

      let errorMessage = "Ocorreu um erro ao ativar a participação";
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || errorMessage;
        } else if (error.response.status === 404) {
          errorMessage = "Participação não encontrada";
        }
      }

      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: errorMessage,
        life: 3000,
      });
    } finally {
      setIsLoadingAtivacao(false);
    }
  };
  // Funções para abrir/fechar o modal de cancelamento
  const openModalCancelamento = () => {
    setIsModalCancelamentoOpen(true);
  };

  const closeModalCancelamento = () => {
    setIsModalCancelamentoOpen(false);
    setDataInativacao("");
  };

  // Função para lidar com o cancelamento/inativação
  const handleConfirmarCancelamento = async () => {
    if (!dataInativacao && item.inicio) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, selecione uma data de inativação",
        life: 3000,
      });
      return;
    }

    if (!justificativaInativacao) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Por favor, informe uma justificativa para a inativação",
        life: 3000,
      });
      return;
    }

    try {
      // Formata a data para o formato DD/MM/YYYY esperado pelo backend
      const formattedDate = new Date(dataInativacao).toLocaleDateString(
        "pt-BR"
      );

      await inativarParticipacao(tenant, participacaoId, {
        fim: formattedDate, // Corrigido: usando o nome do parâmetro esperado pela API
        justificativa: justificativaInativacao, // Corrigido: usando o nome do parâmetro esperado pela API
      });
      const item = await getParticipacao(tenant, participacaoId);
      setItem(item);
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Participação inativada com sucesso",
        life: 3000,
      });

      closeModalCancelamento();
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Erro ao inativar participação:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Ocorreu um erro ao inativar a participação",
        life: 3000,
      });
    }
  };

  // Renderização do modal de cancelamento
  const renderModalCancelamento = () => (
    <Modal isOpen={isModalCancelamentoOpen} onClose={closeModalCancelamento}>
      <div className="mb-2">
        <h4>Confirmar Inativação</h4>

        {/* Mensagens de erro/bloqueio */}
        {item?.statusParticipacao !== "APROVADA" && (
          <div className="p-message p-message-error mb-3 mt-3">
            Esta participação não pode ser inativada porque seu status não é
            "APROVADO"
          </div>
        )}

        {item?.VinculoSolicitacaoBolsa?.some(
          (v) => v.status !== "RECUSADO"
        ) && (
          <div className="p-message p-message-warn mb-3 mt-3">
            Existem vínculos de bolsa ativos associados a esta participação. É
            necessário recusar todos os vínculos antes de inativar.
          </div>
        )}

        {/* Mostrar campos apenas se a participação puder ser inativada */}
        {item?.statusParticipacao === "APROVADA" &&
          (!item?.VinculoSolicitacaoBolsa?.length ||
            item?.VinculoSolicitacaoBolsa?.every(
              (v) => v.status === "RECUSADO"
            )) && (
            <>
              <p>Informe os dados para inativação:</p>

              {/* Campo de data apenas se houver data de início */}
              {item?.inicio && (
                <div className="field mt-3">
                  <label htmlFor="dataInativacao">Data de inativação</label>
                  <input
                    id="dataInativacao"
                    type="date"
                    className="p-inputtext p-component w-full"
                    value={dataInativacao}
                    onChange={(e) => setDataInativacao(e.target.value)}
                    min={
                      new Date(item.inicio.split("/").reverse().join("-"))
                        .toISOString()
                        .split("T")[0]
                    }
                  />
                </div>
              )}

              {/* Campo de justificativa sempre visível quando pode inativar */}
              <div className="field mt-3">
                <label htmlFor="justificativa">Justificativa *</label>
                <textarea
                  id="justificativa"
                  className="p-inputtext p-component w-full"
                  value={justificativaInativacao}
                  onChange={(e) => setJustificativaInativacao(e.target.value)}
                  rows={3}
                  placeholder="Informe o motivo da inativação..."
                  required
                />
              </div>
            </>
          )}

        <div className="flex justify-content-end gap-1 mt-4">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            onClick={closeModalCancelamento}
          />
          <Button
            label="Confirmar Inativação"
            severity="danger"
            onClick={handleConfirmarCancelamento}
            disabled={
              // Desabilitar se:
              // 1. Status não for APROVADA
              item?.statusParticipacao !== "APROVADA" ||
              // 2. Há vínculos não recusados
              (item?.VinculoSolicitacaoBolsa?.length > 0 &&
                item?.VinculoSolicitacaoBolsa?.some(
                  (v) => v.status !== "RECUSADO"
                )) ||
              // 3. Falta justificativa
              !justificativaInativacao ||
              // 4. Falta data de inativação (se houver data de início)
              (item?.inicio && !dataInativacao)
            }
            tooltip={
              item?.statusParticipacao !== "APROVADA"
                ? "Só é possível inativar participações com status APROVADA"
                : item?.VinculoSolicitacaoBolsa?.some(
                    (v) => v.status !== "RECUSADO"
                  )
                ? "Recuse todos os vínculos de bolsa antes de inativar"
                : !justificativaInativacao
                ? "Informe uma justificativa"
                : item?.inicio && !dataInativacao
                ? "Informe a data de inativação"
                : "Confirmar inativação"
            }
          />
        </div>
      </div>
    </Modal>
  );

  const openModalAvaliador = (data) => {
    setIsModalAvaliadorOpen(true);
    setAvaliadorToEdit(data);
    setVerifiedData(null);
  };

  const closeModalAvaliador = () => {
    setIsModalAvaliadorOpen(false);
    setAvaliadorToEdit(null);
    setVerifiedData(null);
  };
  const renderModalAvaliador = () => (
    <Modal isOpen={isModalAvaliadorOpen} onClose={closeModalAvaliador}>
      <div className="mb-2">
        <h4>Editar Avaliador</h4>
        <p>Preencha os dados abaixo para editar o avaliador.</p>
        {!avaliadorToEdit && (
          <CPFVerificationForm
            tenantSlug={tenant}
            onCpfVerified={setVerifiedData}
          />
        )}
        {(verifiedData || avaliadorToEdit) && (
          <NewCargo
            tenantSlug={tenant}
            initialData={{ ...verifiedData, ...avaliadorToEdit }}
            onClose={closeModalAvaliador}
            onSuccess={() => {
              // Adicione aqui qualquer lógica de sucesso necessária
              closeModalAvaliador();
            }}
            //avaliador={true}
          />
        )}
      </div>
    </Modal>
  );

  const toast = useRef(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const item = await getParticipacao(tenant, participacaoId);
        console.log(item);
        setItem(item);
        setEditalInfo(item.inscricao.edital);
        setTipoParticipacao(item.tipo);
        if (
          item.tipo === "orientador" &&
          item.inscricao.edital.formOrientadorId
        ) {
          const responseFormOrientador = await getFormulario(
            tenant,
            item.inscricao.edital.formOrientadorId
          );
          setCamposFormOrientador(
            responseFormOrientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
        if (
          item.tipo === "coorientador" &&
          item.inscricao.edital.formCoorientadorId
        ) {
          const responseFormCoorientador = await getFormulario(
            tenant,
            item.inscricao.edital.formCoorientadorId
          );
          setCamposFormCoorientador(
            responseFormCoorientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
        if (item.tipo === "aluno" && item.inscricao.edital.formAlunoId) {
          const responseFormAluno = await getFormulario(
            tenant,
            item.inscricao.edital.formAlunoId
          );
          setCamposFormAluno(
            responseFormAluno.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, participacaoId]);

  const documentosBolsa = [
    { name: "Termo de Compromisso", key: "TC" },
    { name: "Declaração de Vínculo", key: "DV" },
    { name: "Comprovante de Conta Bancária", key: "CCB" },
    { name: "Histórico Escolar", key: "HE" },
  ];

  const documentosAluno = [
    { name: "RG e CPF", key: "RG_CPF" },
    { name: "Comprovante de Matrícula", key: "CM" },
    { name: "Plano de Trabalho", key: "PT" },
    { name: "Declaração de Disponibilidade", key: "DD" },
  ];

  // Estados para documentos da bolsa
  const [selectedDocBolsa, setSelectedDocBolsa] = useState([]);
  const [disregardedDocBolsa, setDisregardedDocBolsa] = useState([]);

  // Estados para documentos do aluno
  const [selectedDocAluno, setSelectedDocAluno] = useState([]);
  const [disregardedDocAluno, setDisregardedDocAluno] = useState([]);

  // Estados para comprovantes de pagamento
  const [selectedComprovantes, setSelectedComprovantes] = useState([]);
  const [disregardedComprovantes, setDisregardedComprovantes] = useState([]);

  // Lista de comprovantes mensais
  const comprovantesPagamento = [
    { name: "Janeiro", key: "CP_01" },
    { name: "Fevereiro", key: "CP_02" },
    { name: "Março", key: "CP_03" },
    { name: "Abril", key: "CP_04" },
    { name: "Maio", key: "CP_05" },
    { name: "Junho", key: "CP_06" },
    { name: "Julho", key: "CP_07" },
    { name: "Agosto", key: "CP_08" },
    { name: "Setembro", key: "CP_09" },
    { name: "Outubro", key: "CP_10" },
    { name: "Novembro", key: "CP_11" },
    { name: "Dezembro", key: "CP_12" },
  ];
  // Função genérica para alternar desconsideração
  const toggleDisregard = (docKey, type) => {
    if (type === "bolsa") {
      setSelectedDocBolsa((prev) => prev.filter((item) => item.key !== docKey));
      setDisregardedDocBolsa((prev) =>
        prev.includes(docKey)
          ? prev.filter((key) => key !== docKey)
          : [...prev, docKey]
      );
    } else {
      setSelectedDocAluno((prev) => prev.filter((item) => item.key !== docKey));
      setDisregardedDocAluno((prev) =>
        prev.includes(docKey)
          ? prev.filter((key) => key !== docKey)
          : [...prev, docKey]
      );
    }
  };

  // Função genérica para alterar seleção
  const onDocChange = (e, type) => {
    const newSelection = e.checked
      ? [...(type === "bolsa" ? selectedDocBolsa : selectedDocAluno), e.value]
      : (type === "bolsa" ? selectedDocBolsa : selectedDocAluno).filter(
          (doc) => doc.key !== e.value.key
        );

    type === "bolsa"
      ? setSelectedDocBolsa(newSelection)
      : setSelectedDocAluno(newSelection);
  };

  // Determina o status de cada item
  const getItemStatus = (docKey, type) => {
    const selectedList = type === "bolsa" ? selectedDocBolsa : selectedDocAluno;
    const disregardedList =
      type === "bolsa" ? disregardedDocBolsa : disregardedDocAluno;

    const isSelected = selectedList.some((doc) => doc.key === docKey);
    const isDisregarded = disregardedList.includes(docKey);

    return {
      isSelected,
      isDisregarded,
      isUnselected: !isSelected && !isDisregarded,
    };
  };
  // Função para comprovantes
  const toggleComprovante = (compKey) => {
    setSelectedComprovantes((prev) =>
      prev.includes(compKey)
        ? prev.filter((key) => key !== compKey)
        : [...prev, compKey]
    );
  };

  const toggleDisregardComprovante = (compKey) => {
    setSelectedComprovantes((prev) => prev.filter((key) => key !== compKey));
    setDisregardedComprovantes((prev) =>
      prev.includes(compKey)
        ? prev.filter((key) => key !== compKey)
        : [...prev, compKey]
    );
  };
  const formatarDataParaBackend = (dataISO) => {
    const date = new Date(dataISO);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  return (
    <>
      <Toast ref={toast} />
      {renderModalAvaliador()}
      {renderModalCancelamento()}
      {loading && <p>Carregando...</p>}
      {item && !loading && (
        <>
          {/* TELA DE VISUALIZAÇÃO */}
          <div className={styles.content}>
            <div className={styles.mainContent}>
              <div className="mb-2">
                <div className={styles.userCard}>
                  <div className={styles.user}>
                    <h6>{item.user?.nome}</h6>
                    <div className={styles.actions}>
                      {item.status === "aprovada" && (
                        <div
                          onClick={handleAtivarParticipacao}
                          className={`${styles.action} ${styles.normal}`}
                          disabled={
                            isLoadingAtivacao ||
                            item.statusParticipacao !== "APROVADA"
                          }
                          title={
                            item.statusParticipacao !== "APROVADA"
                              ? "Só é possível ativar participações com status APROVADA"
                              : "Ativar participação"
                          }
                        >
                          {isLoadingAtivacao ? (
                            <i className="pi pi-spinner pi-spin" />
                          ) : (
                            <RiCheckboxCircleLine />
                          )}
                          <p>Ativar</p>
                        </div>
                      )}

                      <div
                        onClick={() => openModalAvaliador()}
                        className={`${styles.action} ${styles.warning}`}
                      >
                        <RiP2pFill />
                        <p>Substituir</p>
                      </div>
                      <div
                        onClick={openModalCancelamento}
                        className={`${styles.action} ${styles.error}`}
                        disabled={
                          item.statusParticipacao !== "APROVADA" ||
                          item.VinculoSolicitacaoBolsa?.some(
                            (v) => v.status !== "RECUSADO"
                          )
                        }
                        title={
                          item.statusParticipacao !== "APROVADA"
                            ? "Só é possível inativar participações com status APROVADA"
                            : item.VinculoSolicitacaoBolsa?.some(
                                (v) => v.status !== "RECUSADO"
                              )
                            ? "Recuse todos os vínculos de bolsa antes de inativar"
                            : "Inativar participação"
                        }
                      >
                        <RiUserUnfollowLine />
                        <p>Cancelar</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.contentCard}>
                    <Tag
                      rounded
                      className="mb-1"
                      severity={getSeverityByStatus(item.statusParticipacao)}
                      value={formatStatusText(item.statusParticipacao)}
                    ></Tag>
                    <div
                      className={`flex flex-column  ${styles.checkboxList} `}
                    >
                      {false && (
                        <>
                          <h6 className="mb-2">Documentos do Aluno:</h6>
                          {documentosAluno.map((doc) => {
                            const { isSelected, isDisregarded, isUnselected } =
                              getItemStatus(doc.key, "aluno");
                            return (
                              <div
                                key={`aluno-${doc.key}`}
                                className={`flex align-items-center ${
                                  styles.checkboxItemList
                                } ${
                                  isDisregarded ? styles.disregardedItem : ""
                                }`}
                              >
                                <Checkbox
                                  inputId={`aluno-${doc.key}`}
                                  name="docAluno"
                                  value={doc}
                                  onChange={(e) => onDocChange(e, "aluno")}
                                  checked={isSelected}
                                  disabled={isDisregarded}
                                />
                                <label
                                  htmlFor={`aluno-${doc.key}`}
                                  className="ml-2"
                                >
                                  <p
                                    className={
                                      isUnselected ? styles.unselectedText : ""
                                    }
                                  >
                                    {doc.name}
                                  </p>
                                </label>
                                {isDisregarded ? (
                                  <RiAddCircleLine
                                    className={styles.reactivateIcon}
                                    onClick={() =>
                                      toggleDisregard(doc.key, "aluno")
                                    }
                                    title="Reativar item"
                                  />
                                ) : (
                                  <RiCloseLine
                                    className={styles.disregardIcon}
                                    onClick={() =>
                                      toggleDisregard(doc.key, "aluno")
                                    }
                                    title="Desconsiderar e desmarcar item"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                    {item.VinculoSolicitacaoBolsa.length > 0 &&
                      item.VinculoSolicitacaoBolsa.map((vinculo) => (
                        <div
                          key={vinculo.id}
                          className={`${styles.userCard} mt-2`}
                        >
                          <div className={styles.user}>
                            <h6>Bolsa</h6>
                            <div className={styles.actions}>
                              <div
                                onClick={handleToggleStatusBolsa}
                                className={`${styles.action} ${styles.warning}`}
                                disabled={isLoadingToggle}
                              >
                                {isLoadingToggle ? (
                                  <i className="pi pi-spinner pi-spin" />
                                ) : (
                                  <RiProhibited2Line />
                                )}
                                <p>Inativar</p>
                              </div>
                              <div
                                onClick={handleToggleStatusBolsa}
                                className={`${styles.action} ${styles.normal}`}
                                disabled={isLoadingToggle}
                              >
                                {isLoadingToggle ? (
                                  <i className="pi pi-spinner pi-spin" />
                                ) : (
                                  <RiCheckboxCircleLine />
                                )}
                                <p>Ativar</p>
                              </div>
                              <div
                                className={`${styles.action} ${styles.normal}`}
                              >
                                <RiExchangeLine />
                                <p>Transferir</p>
                              </div>
                              <div
                                className={`${styles.action} ${styles.error}`}
                              >
                                <RiSwapLine />
                                <p>Devolver Bolsa</p>
                              </div>
                            </div>
                          </div>
                          <div className={styles.contentCard}>
                            <h6>Status da solicitação da Bolsa: </h6>
                            <Tag
                              className="mb-1"
                              rounded
                              severity={getSeverityByStatus(
                                vinculo.solicitacaoBolsa?.status
                              )}
                            >
                              {formatStatusText(
                                vinculo.solicitacaoBolsa?.status
                              )}
                            </Tag>
                            <h6>Status da vinculação entre aluno e Bolsa: </h6>
                            <Tag
                              className="mb-1"
                              rounded
                              severity={getSeverityByStatus(vinculo?.status)}
                            >
                              {formatStatusText(vinculo?.status)}
                            </Tag>
                            <h6>Fonte pagadora: </h6>
                            <p>Aluno deve aguardar disponbilização de bolsa</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className={styles.box}>
                <div className={styles.header}>
                  <div className={styles.icon}>
                    <RiGroupLine />
                  </div>
                  <h6>Plano de Trabalho</h6>
                </div>
                <div className={styles.list}>
                  <div className={styles.itemList}>
                    <div className={styles.content1}>
                      <p>{item.planoDeTrabalho?.titulo}</p>
                    </div>
                    <div className={styles.content2} onClick={() => {}}>
                      <RiArrowRightSLine />
                    </div>
                  </div>
                </div>
              </div>
              {item.tipo === "aluno" && (
                <div className={styles.box}>
                  <div className={styles.header}>
                    <div className={styles.icon}>
                      <RiGroupLine />
                    </div>
                    <h6>Orientador</h6>
                  </div>
                  <div className={styles.list}>
                    <div className={styles.itemList}>
                      <div className={styles.content1}>
                        <p>
                          {item.inscricao?.participacoes?.find(
                            (p) => p.tipo === "orientador"
                          )?.user?.nome || "Nenhum orientador encontrado"}
                        </p>
                      </div>
                      <div className={styles.content2} onClick={() => {}}>
                        <RiArrowRightSLine />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ParticipacaoGestorController;
