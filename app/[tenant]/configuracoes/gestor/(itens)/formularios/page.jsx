"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.scss";
import { RiAddCircleLine, RiEditLine, RiSurveyLine } from "@remixicon/react";

import Header from "@/components/Header";
import Modal from "@/components/Modal";
import BuscadorFront from "@/components/BuscadorFront";
import Card from "@/components/Card";
import ModalDelete from "@/components/ModalDelete";
import Skeleton from "@/components/Skeleton";
import FormNewFormulario from "@/components/Formularios/FormNewFormulario";
import NoData from "@/components/NoData";

import { deleteFormulario, getFormularios } from "@/app/api/client/formulario";
import {
  getQuestionarios,
  deleteQuestionario,
  createQuestionario,
} from "@/app/api/client/questionarioSatisfacao";

const ABAS = [
  { id: "formularios", label: "Formulários padrão" },
  { id: "questionarios", label: "Questionários de satisfação" },
];

const Page = ({ params }) => {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState("formularios");

  // ─── Formulários ────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formularios, setFormularios] = useState([]);
  const [formularioToEdit, setFormularioToEdit] = useState(null);
  const [formularioToDelete, setFormularioToDelete] = useState(null);

  useEffect(() => {
    if (abaAtiva !== "formularios") return;
    const fetchData = async () => {
      setLoading(true);
      try {
        setFormularios(await getFormularios(params.tenant));
      } catch {
        setError("Erro ao buscar formulários.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, abaAtiva]);

  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      setFormularios(await getFormularios(params.tenant));
    } catch {
      console.error("Erro ao buscar formulários.");
    }
  }, [params.tenant]);

  const handleDeleteFormulario = useCallback(async () => {
    setErrorDelete("");
    try {
      await deleteFormulario(params.tenant, formularioToDelete.id);
      setFormularios((prev) => prev.filter((f) => f.id !== formularioToDelete.id));
      setDeleteModalOpen(false);
      setFormularioToDelete(null);
    } catch (error) {
      setErrorDelete(error.response?.data?.message ?? "Erro na conexão com o servidor.");
    }
  }, [params.tenant, formularioToDelete]);

  const openFormularioModal = (data) => {
    setIsModalOpen(true);
    setFormularioToEdit(data);
  };

  const closeFormularioModal = () => {
    setIsModalOpen(false);
    setFormularioToEdit(null);
    setDeleteModalOpen(false);
    setErrorDelete(null);
  };

  const filteredFormularios = searchTerm
    ? formularios.filter((f) =>
        f.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : formularios;

  // ─── Questionários de satisfação ─────────────────────────────────────────
  const [loadingQ, setLoadingQ] = useState(false);
  const [errorQ, setErrorQ] = useState(null);
  const [questionarios, setQuestionarios] = useState([]);
  const [deleteQModalOpen, setDeleteQModalOpen] = useState(false);
  const [errorDeleteQ, setErrorDeleteQ] = useState(null);
  const [questionarioToDelete, setQuestionarioToDelete] = useState(null);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    if (abaAtiva !== "questionarios") return;
    const fetchData = async () => {
      setLoadingQ(true);
      try {
        setQuestionarios(await getQuestionarios(params.tenant));
      } catch {
        setErrorQ("Erro ao buscar questionários.");
      } finally {
        setLoadingQ(false);
      }
    };
    fetchData();
  }, [params.tenant, abaAtiva]);

  const handleNovoQuestionario = async () => {
    setCriando(true);
    try {
      const novo = await createQuestionario(params.tenant, {
        titulo: "Novo questionário de satisfação",
        contexto: "inscricao",
        schema: { apresentacao: "", blocos: [] },
        ativo: false,
      });
      router.push(`/${params.tenant}/configuracoes/gestor/formularios/questionarios/${novo.id}`);
    } catch {
      setErrorQ("Erro ao criar questionário.");
    } finally {
      setCriando(false);
    }
  };

  const handleDeleteQuestionario = useCallback(async () => {
    setErrorDeleteQ("");
    try {
      await deleteQuestionario(params.tenant, questionarioToDelete.id);
      setQuestionarios((prev) => prev.filter((q) => q.id !== questionarioToDelete.id));
      setDeleteQModalOpen(false);
      setQuestionarioToDelete(null);
    } catch (error) {
      setErrorDeleteQ(error.response?.data?.message ?? "Erro na conexão com o servidor.");
    }
  }, [params.tenant, questionarioToDelete]);

  return (
    <>
      {/* Modal novo/editar formulário */}
      <Modal isOpen={isModalOpen} onClose={closeFormularioModal}>
        <div className={`${styles.icon} mb-2`}>
          <RiEditLine />
        </div>
        <h4>{formularioToEdit ? "Editar formulário" : "Novo formulário"}</h4>
        <p>
          {formularioToEdit
            ? "Edite os dados do formulário."
            : "Preencha os dados abaixo para criar um novo formulário."}
        </p>
        <FormNewFormulario
          tenantSlug={params.tenant}
          initialData={formularioToEdit}
          onClose={closeFormularioModal}
          onSuccess={handleCreateOrEditSuccess}
        />
      </Modal>

      {/* Modal excluir formulário */}
      <ModalDelete
        isOpen={deleteModalOpen}
        title="Excluir formulário"
        onClose={closeFormularioModal}
        confirmationText={`Tem certeza que deseja excluir o formulário ${formularioToDelete?.titulo}`}
        errorDelete={errorDelete}
        handleDelete={handleDeleteFormulario}
      />

      {/* Modal excluir questionário */}
      <ModalDelete
        isOpen={deleteQModalOpen}
        title="Excluir questionário"
        onClose={() => { setDeleteQModalOpen(false); setErrorDeleteQ(null); }}
        confirmationText={`Tem certeza que deseja excluir o questionário "${questionarioToDelete?.titulo}"?`}
        errorDelete={errorDeleteQ}
        handleDelete={handleDeleteQuestionario}
      />

      <main>
        <Header
          className="mb-3"
          titulo="Formulários"
          subtitulo="Edite e crie os formulários da sua instituição"
          descricao="Aqui você gerencia os formulários usados nas diversas etapas da iniciação científica."
        />

        {/* Abas */}
        <div className={styles.abas}>
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              className={`${styles.aba} ${abaAtiva === aba.id ? styles.abaAtiva : ""}`}
              onClick={() => setAbaAtiva(aba.id)}
              type="button"
            >
              {aba.label}
            </button>
          ))}
        </div>

        {/* ─── ABA: Formulários padrão ─── */}
        {abaAtiva === "formularios" && (
          <>
            <div className="mt-3">
              <BuscadorFront setSearchTerm={setSearchTerm} />
            </div>
            <div className={styles.content}>
              <div
                onClick={() => openFormularioModal(null)}
                className={styles.btnNewItem}
              >
                <div className={styles.icon}>
                  <RiAddCircleLine />
                </div>
                <p>Criar novo</p>
              </div>

              {loading ? (
                <><Skeleton /><Skeleton /><Skeleton /></>
              ) : error ? (
                <p>{error}</p>
              ) : (
                filteredFormularios.map((formulario) => (
                  <div className={styles.card} key={formulario.id}>
                    <Card
                      title={
                        formulario.tipo === "planoDeTrabalho"
                          ? "Plano de Trabalho"
                          : formulario.tipo
                      }
                      subtitle={formulario.titulo}
                      onEdit={() => openFormularioModal(formulario)}
                      onDelete={() => {
                        setDeleteModalOpen(true);
                        setFormularioToDelete(formulario);
                      }}
                      onView={() =>
                        router.push(
                          `/${params.tenant}/configuracoes/gestor/formularios/${formulario.id}`
                        )
                      }
                    />
                  </div>
                ))
              )}
              {!loading && !error && filteredFormularios.length === 0 && (
                <div className={styles.card}><NoData /></div>
              )}
            </div>
          </>
        )}

        {/* ─── ABA: Questionários de satisfação ─── */}
        {abaAtiva === "questionarios" && (
          <div className={styles.content}>
            <div
              onClick={!criando ? handleNovoQuestionario : undefined}
              className={styles.btnNewItem}
            >
              <div className={styles.icon}>
                <RiAddCircleLine />
              </div>
              <p>{criando ? "Criando..." : "Criar novo"}</p>
            </div>

            {loadingQ ? (
              <><Skeleton /><Skeleton /></>
            ) : errorQ ? (
              <p>{errorQ}</p>
            ) : (
              questionarios.map((q) => (
                <div className={styles.card} key={q.id}>
                  <Card
                    title={q.contexto === "inscricao" ? "Inscrição" : q.contexto}
                    subtitle={q.titulo}
                    badge={q.ativo ? "Ativo" : "Inativo"}
                    onView={() =>
                      router.push(
                        `/${params.tenant}/configuracoes/gestor/formularios/questionarios/${q.id}`
                      )
                    }
                    onDelete={() => {
                      setDeleteQModalOpen(true);
                      setQuestionarioToDelete(q);
                    }}
                  />
                </div>
              ))
            )}
            {!loadingQ && !errorQ && questionarios.length === 0 && (
              <div className={styles.card}><NoData /></div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default Page;
