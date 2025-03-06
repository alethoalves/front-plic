"use client";
import Button from "@/components/Button";
import {
  RiAddCircleLine,
  RiAddLine,
  RiArrowRightSLine,
  RiCheckDoubleLine,
  RiDraftLine,
  RiEditLine,
  RiExternalLinkLine,
  RiFileExcelLine,
  RiFileList3Line,
  RiFolder2Line,
  RiFoldersLine,
  RiGraduationCapLine,
  RiGroupLine,
  RiInformationLine,
} from "@remixicon/react";
import styles from "./ModalInscricao.module.scss";
import { useEffect, useState } from "react";
import { getInscricao, updateInscricao } from "@/app/api/client/inscricao";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { DataView } from "primereact/dataview";
import Modal from "./Modal";
import ParticipacaoController from "./participacao/ParticipacaoController";
import ParticipacaoGestorController from "./participacao/ParticipacaoGestorController";
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";
import calcularMedia from "@/lib/calcularMedia";
import CPFVerificationForm from "./Formularios/CPFVerificationForm";
import ParticipacaoForm from "./Formularios/ParticipacaoForm";
import FormProjetoCreateOrEdit from "./Formularios/FormProjetoCreateOrEdit";
import FormGestorProjetoCreateOrEdit from "./Formularios/FormGestorProjetoCreateOrEdit";

const ModalInscricao = ({ selected, atualizarItens }) => {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState(null);
  const [isModalParticipacaoOpen, setIsModalParticipacaoOpen] = useState(false);
  const [participacaoSelected, setParticipacaoSelected] = useState();
  const [verifiedData, setVerifiedData] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);

  const [isModalProjetoOpen, setIsModalProjetoOpen] = useState(false);
  const [projetoSelected, setProjetoSelected] = useState();

  const toast = useRef(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const itens = await getInscricao(selected.tenant, selected.idInscricao);
        setItens(itens);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selected]);
  const statusOptions = [
    { value: "pendente", label: "Pendente" },
    { value: "enviada", label: "Enviada" },
    { value: "aprovada", label: "Aprovada" },
    { value: "arquivada", label: "Arquivada" },
  ];
  const handleCreateOrEditSuccess = async () => {
    //Atualiza os dados no modal de inscricao
    const item = await getInscricao(selected.tenant, selected.idInscricao);
    setItens(item);
    //Atualiza os dados na tabela de planos de trabalho
    const itens = await getAllPlanoDeTrabalhosByTenant(selected.tenant);
    // Adicionar campos virtuais
    const itensComCamposVirtuais = itens.map((item) => ({
      ...item,
      qtdFichas: item.projeto?.InscricaoProjeto?.FichaAvaliacao?.length || 0, // Corrigido com optional chaining
      mediaNotas: calcularMedia(
        item.projeto?.InscricaoProjeto?.FichaAvaliacao || []
      ), // Garante array vazio como fallback
      avaliadores:
        item.projeto?.InscricaoProjeto?.InscricaoProjetoAvaliador?.map(
          // Adicionado optional chaining
          (a) => a.avaliador?.nome
        )
          .filter(Boolean) // Filtra nomes nulos/vazios
          .join("; ") || "Nenhum avaliador",
      // Novo campo virtual para alunos
      alunoParticipacoes:
        item.participacoes
          ?.map((p) => `${p.user?.nome} (${p.status})`)
          ?.join("; ") || "Nenhum aluno vinculado",
    }));
    atualizarItens(itensComCamposVirtuais || []);
  };
  const handleStatusChange = async (e) => {
    const newStatus = e.value;
    try {
      await updateInscricao(selected.tenant, selected.idInscricao, {
        status: newStatus,
      });
      await handleCreateOrEditSuccess();

      // Exibe uma notificação de sucesso
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status da inscrição atualizado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      // Exibe uma notificação de erro
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Ocorreu um erro ao atualizar o status da inscrição.",
        life: 3000,
      });
    }
  };
  const listTemplateParticipante = (participantes) => {
    return (
      <div className={styles.list}>
        {participantes.map((participante) => (
          <div
            key={participante.id}
            className={styles.itemList}
            onClick={() => {
              setParticipacaoSelected(participante);
              setIsModalParticipacaoOpen(true);
            }}
          >
            <div className={styles.content1}>
              <p
                className={`${styles.status} ${
                  participante.status === "ativo" ||
                  participante.status === "completo"
                    ? styles.statusSuccess
                    : participante.status === "incompleto"
                    ? styles.statusWarning
                    : styles.statusDefault
                }`}
              >
                {participante.status}
              </p>
              <p>
                {participante.nome_orientador ||
                  participante.nome_coorientador ||
                  participante.nome_aluno}
              </p>
            </div>
            <div className={styles.content2}>
              <RiArrowRightSLine />
            </div>
          </div>
        ))}
      </div>
    );
  };
  const listTemplatePlanosDeTrabalho = (planos) => {
    return (
      <div className={styles.list}>
        {planos.map((plano) => (
          <div
            key={plano.id}
            className={styles.itemList}
            onClick={() => {
              //setProjetoSelected(inscricaoProjeto.projeto);
              //setIsModalProjetoOpen(true);
            }}
          >
            <div className={styles.content1}>
              <p>{plano.titulo}</p>
            </div>
            <div className={styles.content2}>
              <RiArrowRightSLine />
            </div>
          </div>
        ))}
      </div>
    );
  };
  const listTemplateProjeto = (projetos) => {
    return (
      <div className={styles.list}>
        {projetos.map((inscricaoProjeto) => (
          <div
            key={inscricaoProjeto.id}
            className={styles.itemList}
            onClick={() => {
              setProjetoSelected(inscricaoProjeto.projeto);
              setIsModalProjetoOpen(true);
            }}
          >
            <div className={styles.content1}>
              <p className={`mr-1 ${styles.status} ${styles.statusDefault}`}>
                {inscricaoProjeto.notaFinal
                  ? `Nota Final: ${inscricaoProjeto.notaFinal}`
                  : "Não avaliado"}
              </p>
              {inscricaoProjeto.statusAvaliacao && (
                <p className={`${styles.status} ${styles.statusDefault}`}>
                  {inscricaoProjeto.statusAvaliacao}
                </p>
              )}
              <p>{inscricaoProjeto.projeto.titulo}</p>
            </div>
            <div className={styles.content2}>
              <RiArrowRightSLine />
            </div>
          </div>
        ))}
      </div>
    );
  };
  const closeModalAndResetData = () => {
    setIsModalParticipacaoOpen(false);
  };

  const renderModalParticipacao = () => (
    <Modal isOpen={isModalParticipacaoOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      {!participacaoSelected?.id && (
        <div>
          <h4>Nova participação</h4>
          <p>Preencha os dados abaixo para adicionar uma nova participação.</p>

          <CPFVerificationForm
            tenantSlug={selected.tenant}
            onCpfVerified={setVerifiedData}
          />
          {verifiedData && (
            <ParticipacaoForm
              tenantSlug={selected.tenant}
              inscricaoId={`${selected.idInscricao}`}
              initialData={verifiedData || {}}
              onClose={() => setIsModalParticipacaoOpen(false)}
              onSuccess={() => {
                handleCreateOrEditSuccess();
                setIsModalParticipacaoOpen(false);
              }}
              showLabelInicio={false}
              tipoParticipacao={tipoParticipacao}
            />
          )}
        </div>
      )}
      {participacaoSelected?.id && (
        <ParticipacaoGestorController
          tenant={selected.tenant}
          participacaoId={participacaoSelected?.id}
          onClose={closeModalAndResetData}
          onSuccess={handleCreateOrEditSuccess}
        />
      )}
    </Modal>
  );
  const renderModalProjeto = () => (
    <Modal
      isOpen={isModalProjetoOpen}
      onClose={() => {
        setIsModalProjetoOpen(false);
        setProjetoSelected(null);
      }}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>

      <FormGestorProjetoCreateOrEdit
        projetoId={projetoSelected?.id}
        tenantSlug={selected.tenant}
        idInscricao={selected.idInscricao}
        onSuccess={handleCreateOrEditSuccess}
        onClose={() => {
          setIsModalProjetoOpen(false);
          setProjetoSelected(null);
        }}
      />
    </Modal>
  );
  return (
    <div className={styles.inscricao}>
      {renderModalParticipacao()}
      {renderModalProjeto()}
      <div className={styles.toast}>
        <Toast ref={toast} />
      </div>

      <h4>Inscrição</h4>
      <p>ID {selected?.idInscricao}</p>
      {loading && <p className="mt-2">Carregando...</p>}
      {!loading && itens && (
        <div className={styles.content}>
          <div className={styles.mainContent}>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiInformationLine />
                </div>
                <h6>Dados gerais</h6>
              </div>
              <div className="pl-2 pr-2 pb-2">
                <p>
                  <strong>ID Inscrição: </strong>
                  {itens?.id}
                </p>
                <p>
                  <strong>Edital: </strong>
                  {itens?.editalNome}
                </p>
                <p>
                  <strong>Ano do edital: </strong>
                  {itens?.editalAno}
                </p>
                <p>
                  <strong>Proponente: </strong>
                  {itens?.proponente?.nome}
                </p>
                <div className={styles.statusField}>
                  <p>
                    <strong>Status da Inscrição: </strong>
                  </p>
                  <Dropdown
                    value={itens?.status}
                    options={statusOptions}
                    onChange={handleStatusChange}
                    placeholder="Selecione o status"
                    className={styles.statusDropdown}
                    optionLabel="label"
                    optionValue="value"
                  />
                </div>
              </div>
            </div>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiGroupLine />
                </div>
                <h6>Orientadores</h6>
                <div
                  onClick={() => {
                    setParticipacaoSelected(null);
                    setTipoParticipacao("orientador");
                    setVerifiedData(null);
                    setIsModalParticipacaoOpen(true);
                  }}
                  className={`ml-1 ${styles.icon} ${styles.iconClick}`}
                >
                  <RiAddCircleLine />
                </div>
              </div>
              {itens?.orientadores && itens.orientadores.length > 0 && (
                <DataView
                  value={itens.orientadores}
                  listTemplate={listTemplateParticipante}
                  layout="list" // Define o layout como lista
                />
              )}
            </div>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiGraduationCapLine />
                </div>
                <h6>Alunos</h6>
              </div>
              {itens?.alunos && itens.alunos.length > 0 && (
                <DataView
                  value={itens.alunos}
                  listTemplate={listTemplateParticipante}
                  layout="list" // Define o layout como lista
                />
              )}
            </div>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiFoldersLine />
                </div>
                <h6>Projetos</h6>
                <div
                  onClick={() => {
                    setProjetoSelected(null);
                    setIsModalProjetoOpen(true);
                  }}
                  className={`ml-1 ${styles.icon} ${styles.iconClick}`}
                >
                  <RiAddCircleLine />
                </div>
              </div>
              {itens?.InscricaoProjeto && itens.InscricaoProjeto.length > 0 && (
                <DataView
                  value={itens.InscricaoProjeto}
                  listTemplate={listTemplateProjeto}
                  layout="list" // Define o layout como lista
                />
              )}
            </div>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiFileList3Line />
                </div>
                <h6>Planos de Trabalho</h6>
                <div className={`ml-1 ${styles.icon}`}>
                  <RiAddCircleLine />
                </div>
              </div>
              {itens?.planosDeTrabalho && itens.planosDeTrabalho.length > 0 && (
                <DataView
                  value={itens.planosDeTrabalho}
                  listTemplate={listTemplatePlanosDeTrabalho}
                  layout="list" // Define o layout como lista
                />
              )}
            </div>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiDraftLine />
                </div>
                <h6>Atividades</h6>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalInscricao;
