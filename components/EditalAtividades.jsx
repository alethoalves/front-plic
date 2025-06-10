"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./EditalAtividades.module.scss";
import { RiAddCircleLine, RiDeleteBinLine, RiEditLine } from "@remixicon/react";

// componentes reutilizáveis
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Item from "@/components/Item";

// APIs
import {
  deleteAtividade,
  getAtividadesByAno,
} from "@/app/api/client/atividade";
import { getEditais } from "@/app/api/client/edital";
import { getFormularios } from "@/app/api/client/formulario";

// Formulário de criação/edição (multiselect)
import FormNewAtividade from "./Formularios/FormNewAtividade";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";

const EditalAtividades = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal criar/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [atividadeParaEditar, setAtividadeParaEditar] = useState(null);
  const [removerVinculo, setRemoverVinculo] = useState({
    show: false,
    atividadeId: null,
    editalId: null,
    tituloAtividade: "",
  });

  // Lista de atividades
  const [atividades, setAtividades] = useState([]);

  // Opções para o formulário
  const [editaisDoAno, setEditaisDoAno] = useState([]);
  const [formulariosDoAno, setFormulariosDoAno] = useState([]);

  // 1) Fetch inicial de dados (atividades, editais, formulários)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1a) Buscar todas as atividades do ano
        const respAtividades = await getAtividadesByAno(
          params.tenant,
          params.ano
        );
        setAtividades(respAtividades || []);

        // 1b) Buscar todos os editais daquele ano
        const respEditais = await getEditais(params.tenant, params.ano);
        setEditaisDoAno(Array.isArray(respEditais) ? respEditais : []);

        // 1c) Buscar todos os formulários disponíveis
        const respFormularios = await getFormularios(params.tenant);
        const listaDeFormularios = Array.isArray(respFormularios)
          ? respFormularios.filter((f) => f.tipo === "atividade")
          : [];
        setFormulariosDoAno(listaDeFormularios);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Erro ao buscar atividades/editais/formulários.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.ano]);

  // 2) Função de "refresh" para recarregar tudo após criar/editar
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getAtividadesByAno(params.tenant, params.ano);
      setAtividades(resp || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.ano]);

  // 3) Remover atividade
  const handleConfirmRemoverVinculo = useCallback(async () => {
    setErrorDelete("");
    setIsDeleting(true);
    const { atividadeId, editalId } = removerVinculo;
    try {
      await deleteAtividade(params.tenant, editalId, atividadeId);
      await refresh();
    } catch (err) {
      console.error("Erro ao remover atividade:", err);
      setErrorDelete("Não foi possível remover esta atividade.");
    } finally {
      setRemoverVinculo({
        show: false,
        atividadeId: null,
        editalId: null,
        tituloAtividade: "",
      });
      setIsDeleting(false);
    }
  }, [removerVinculo, params.tenant, refresh]);

  // 4) Abrir modal para nova atividade
  const openModalNova = () => {
    setAtividadeParaEditar(null);
    setIsModalOpen(true);
  };

  // 5) Abrir modal para editar uma atividade existente
  const openModalEditar = (atividade) => {
    setAtividadeParaEditar(atividade);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setAtividadeParaEditar(null);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* ——— Modal de criar/editar atividade ——— */}
      {isModalOpen && (
        <Modal isOpen={true} onClose={closeModal}>
          <div className={`${styles.icon} mb-2`}>
            <RiEditLine />
          </div>
          <h4>{atividadeParaEditar ? "Editar Atividade" : "Nova Atividade"}</h4>
          <p>
            {atividadeParaEditar
              ? "Altere os campos desta atividade."
              : "Preencha os dados para criar uma nova atividade."}
          </p>
          <FormNewAtividade
            tenantSlug={params.tenant}
            ano={params.ano}
            todosEditais={editaisDoAno}
            formularios={formulariosDoAno}
            atividadeExistente={atividadeParaEditar}
            onClose={closeModal}
            onSuccess={refresh}
          />
        </Modal>
      )}

      {/* ——— Modal de confirmação de remoção ——— */}
      {removerVinculo.show && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) {
              setRemoverVinculo({
                show: false,
                atividadeId: null,
                editalId: null,
                tituloAtividade: "",
              });
            }
          }}
        >
          <div className={`${styles.icon} mb-2`}>
            <RiDeleteBinLine />
          </div>
          <h4>Confirmar Exclusão</h4>
          <p className="mt-1">{`Remover a atividade "${removerVinculo.tituloAtividade}"?`}</p>
          {errorDelete && (
            <div className={`notification notification-error`}>
              <p className="p5">{errorDelete}</p>
            </div>
          )}
          <div className={styles.btnSubmit}>
            <Button
              className="btn-error mt-4"
              onClick={handleConfirmRemoverVinculo}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className={styles.loadingIndicator}>
                  <span>Excluindo...</span>
                </div>
              ) : (
                "Excluir"
              )}
            </Button>
          </div>
        </Modal>
      )}

      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.mainContent}>
            {/* Botão + para nova atividade */}
            <div className={styles.addItem} onClick={openModalNova}>
              <div className={styles.icon}>
                <RiAddCircleLine />
              </div>
              <p>Adicionar atividade</p>
            </div>

            {loading && <p>Carregando...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* ——— Exibição das atividades ——— */}
            {!loading &&
              !error &&
              atividades
                .sort((a, b) => a.id - b.id)
                .map((atividade) => (
                  <div key={atividade.id} className={styles.activityContainer}>
                    <Item
                      titulo={atividade.titulo}
                      subtitulo={`De ${formatDateForDisplay(
                        atividade.dataInicio
                      )} a ${formatDateForDisplay(atividade.dataFinal)}`}
                      //descricao={atividade.descricao}
                      handleEdit={() => openModalEditar(atividade)}
                    >
                      <div className={styles.editalBadge}>
                        <span>{atividade.edital.titulo}</span>
                        {false && (
                          <RiDeleteBinLine
                            className={styles.deleteIcon}
                            onClick={() =>
                              setRemoverVinculo({
                                show: true,
                                atividadeId: atividade.id,
                                editalId: atividade.edital.id,
                                tituloAtividade: atividade.titulo,
                              })
                            }
                          />
                        )}
                      </div>
                    </Item>
                  </div>
                ))}

            {/* Se não houver nenhuma atividade para este ano */}
            {!loading && !error && atividades.length === 0 && (
              <p>Nenhuma atividade encontrada para este ano.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EditalAtividades;
