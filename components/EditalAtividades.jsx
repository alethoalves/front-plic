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

// utilitário para agrupar por título:
const agruparPorTitulo = (atividades) => {
  const mapa = new Map();
  atividades.forEach((item) => {
    const chave = item.id;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        titulo: item.titulo,
        descricao: item.descricao,
        dataInicio: item.dataInicio,
        dataFinal: item.dataFinal,
        formularioId: item.formularioId,
        vinculacoes: [],
      });
    }
    const agrupado = mapa.get(chave);
    agrupado.vinculacoes.push({
      atividadeId: item.id,
      editalId: item.edital.id,
      editalTitulo: item.edital.titulo,
    });
  });
  return Array.from(mapa.values());
};

const EditalAtividades = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal criar/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grupoParaEditar, setGrupoParaEditar] = useState(null);
  const [removerVinculo, setRemoverVinculo] = useState({
    show: false,
    atividadeId: null,
    editalId: null,
    tituloAtividade: "",
  });

  // Lista bruta de atividades, antes de agrupar
  const [atividadesRaw, setAtividadesRaw] = useState([]);
  // Lista de grupos (após agrupamento)
  const [gruposAtividades, setGruposAtividades] = useState([]);

  // Opções para o formulário
  const [editaisDoAno, setEditaisDoAno] = useState([]); // array de {id, titulo, ano,…}
  const [formulariosDoAno, setFormulariosDoAno] = useState([]); // array de {id, titulo, tipo,…}

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
        // respAtividades é algo como { status:"success", message:"…", atividades:[ … ] }
        setAtividadesRaw(respAtividades || []);

        // 1b) Buscar todos os editais daquele ano
        const respEditais = await getEditais(params.tenant, params.ano);
        // getEditais já retorna diretamente um array:
        //   respEditais === [ { id:…, titulo:…, ano:…, … }, … ]
        setEditaisDoAno(Array.isArray(respEditais) ? respEditais : []);

        // 1c) Buscar todos os formulários disponíveis
        const respFormularios = await getFormularios(params.tenant);
        // Supondo que getFormularios também retorne diretamente um array:
        //   respFormularios === [ { id:…, titulo:…, tipo:…, … }, … ]
        // Se quiser filtrar por tipo “atividade”:
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

  // 2) sempre que “atividadesRaw” mudar, reagrupar por título
  useEffect(() => {
    const grupos = agruparPorTitulo(atividadesRaw);
    console.log(">>> gruposAtividades:", grupos);
    setGruposAtividades(grupos);
  }, [atividadesRaw]);

  // 3) Função de “refresh” para recarregar tudo após criar/editar
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getAtividadesByAno(params.tenant, params.ano);
      setAtividadesRaw(resp || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.ano]);

  // 4) Remover vínculo (apenas a instância da atividade para aquele edital)
  const handleConfirmRemoverVinculo = useCallback(async () => {
    setErrorDelete("");
    setIsDeleting(true);
    const { atividadeId, editalId } = removerVinculo;
    try {
      await deleteAtividade(params.tenant, editalId, atividadeId);
      await refresh();
    } catch (err) {
      console.error("Erro ao remover vínculo:", err);
      setErrorDelete("Não foi possível remover esta vinculação.");
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

  // 5) Abrir modal para nova atividade
  const openModalNova = () => {
    setGrupoParaEditar(null);
    setIsModalOpen(true);
  };
  // 6) Abrir modal para editar um grupo já existente
  const openModalEditar = (grupo) => {
    console.log(">>> abrir edição para grupo:", grupo);
    setGrupoParaEditar(grupo);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setGrupoParaEditar(null);
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
          <h4>{grupoParaEditar ? "Editar Atividade" : "Nova Atividade"}</h4>
          <p>
            {grupoParaEditar
              ? "Altere os campos e marque/desmarque os editais para esta atividade."
              : "Preencha os dados e selecione todos os editais que devem receber esta atividade."}
          </p>
          <FormNewAtividade
            tenantSlug={params.tenant}
            ano={params.ano}
            todosEditais={editaisDoAno}
            formularios={formulariosDoAno}
            grupoExistente={grupoParaEditar}
            onClose={closeModal}
            onSuccess={refresh}
          />
        </Modal>
      )}

      {/* ——— Modal de confirmação de remoção de vínculo ——— */}
      {removerVinculo.show && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) {
              // Só permite fechar se não estiver excluindo
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
          <p className="mt-1">{`Remover vinculação da atividade "${removerVinculo.tituloAtividade}" do edital selecionado?`}</p>
          {errorDelete && (
            <div className={`notification notification-error`}>
              <p className="p5">{errorDelete}</p>
            </div>
          )}
          <div className={styles.btnSubmit}>
            <Button
              className="btn-error mt-4"
              onClick={handleConfirmRemoverVinculo}
              disabled={isDeleting} // Desabilita o botão durante o loading
            >
              {isDeleting ? (
                <div className={styles.loadingIndicator}>
                  {/* Ícone de loading (substitua pelo seu componente) */}
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

            {/* ——— Exibição dos grupos ——— */}
            {!loading &&
              !error &&
              gruposAtividades.map((grupo, index) => {
                const uniqueKey = index;
                return (
                  <div key={uniqueKey} className={styles.groupContainer}>
                    <Item
                      titulo={grupo.titulo}
                      subtitulo={`De ${grupo.dataInicio} a ${grupo.dataFinal}`}
                      descricao={grupo.descricao}
                      handleEdit={() => openModalEditar(grupo)}
                    >
                      {/* → Aqui dentro, renderizamos cada “edital” como uma tag */}
                      <div className={styles.listaEditais}>
                        {grupo.vinculacoes.map((vinc) => (
                          <div
                            key={vinc.atividadeId}
                            className={styles.editalBadge}
                          >
                            <span>{vinc.editalTitulo}</span>
                            {/* Ícone de lixeira que abre o modal de confirmação */}
                            <RiDeleteBinLine
                              className={styles.deleteIcon}
                              onClick={() =>
                                setRemoverVinculo({
                                  show: true,
                                  atividadeId: vinc.atividadeId,
                                  editalId: vinc.editalId,
                                  tituloAtividade: grupo.titulo,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </Item>
                  </div>
                );
              })}

            {/* Se não houver nenhuma atividade para este ano */}
            {!loading && !error && gruposAtividades.length === 0 && (
              <p>Nenhuma atividade encontrada para este ano.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EditalAtividades;
