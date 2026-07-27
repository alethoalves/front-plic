"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styles from "@/components/Formularios/Form.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import {
  RiBuildingLine,
  RiToggleLine,
  RiToggleFill,
  RiAddCircleLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiSave2Line,
  RiDownload2Line,
} from "@remixicon/react";
import {
  criarInstituicaoParceira,
  atualizarInstituicaoParceira,
  excluirInstituicaoParceira,
  getInstituicoesParceirasEdicaoAnterior,
  importarInstituicoesParceirasDaEdicaoAnterior,
} from "@/app/api/client/eventos";

// Form pequeno usado dentro do modal de edição — key={parceira.id} no
// componente pai garante que ele remonta com os defaultValues certos a cada
// instituição diferente, sem precisar sincronizar via useEffect/setValue.
const EditarParceiraForm = ({ parceira, eventoSlug, onClose, onSuccess }) => {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const { control, handleSubmit } = useForm({
    defaultValues: { nome: parceira.nome, sigla: parceira.sigla },
  });

  const onSalvar = async (data) => {
    setSalvando(true);
    setErro("");
    try {
      const resposta = await atualizarInstituicaoParceira(
        eventoSlug,
        parceira.id,
        data
      );
      onSuccess(resposta.instituicaoParceira);
      onClose();
    } catch (error) {
      setErro(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSalvar)}>
      <div className={styles.input}>
        <Input
          className="mb-2"
          control={control}
          name="nome"
          label="Nome da instituição"
          inputType="text"
          disabled={salvando}
        />
        <Input
          className="mb-2"
          control={control}
          name="sigla"
          label="Sigla"
          inputType="text"
          disabled={salvando}
        />
      </div>
      <div className={styles.btnSubmit}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {erro && (
        <div className="notification notification-error">
          <p className="p5">{erro}</p>
        </div>
      )}
    </form>
  );
};

// Instituições que só participam do congresso enviando resumos, sem virar um
// Tenant completo (sem editais, formulários, cargos etc.). Excluir é
// bloqueado pelo backend (FK) enquanto houver submissão vinculada — nesse
// caso o modal de exclusão mostra o erro em vez de fechar; desativar
// (`ativo: false`) continua sendo a forma de "remover" sem esse risco.
const FormInstituicoesParceiras = ({ eventoSlug, initialParceiras }) => {
  const [parceiras, setParceiras] = useState(initialParceiras || []);
  const [salvando, setSalvando] = useState(false);
  const [alternandoId, setAlternandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [excluindoLoading, setExcluindoLoading] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [edicaoAnterior, setEdicaoAnterior] = useState(null);
  const [importando, setImportando] = useState(false);
  const [erroImportar, setErroImportar] = useState("");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { nome: "", sigla: "" },
  });

  // Só faz sentido oferecer "importar da edição anterior" quando esta
  // edição ainda não tem nenhuma instituição parceira cadastrada.
  useEffect(() => {
    if (parceiras.length > 0) {
      setEdicaoAnterior(null);
      return;
    }
    let ativo = true;
    getInstituicoesParceirasEdicaoAnterior(eventoSlug)
      .then((resultado) => {
        if (ativo) setEdicaoAnterior(resultado || null);
      })
      .catch(() => {
        // Falha silenciosa aqui — é só a sugestão de import, não impede o resto da tela
      });
    return () => {
      ativo = false;
    };
  }, [eventoSlug, parceiras.length]);

  const onImportar = async () => {
    setImportando(true);
    setErroImportar("");
    try {
      const resposta = await importarInstituicoesParceirasDaEdicaoAnterior(eventoSlug);
      setParceiras(resposta.instituicoesParceiras);
      setEdicaoAnterior(null);
    } catch (error) {
      setErroImportar(
        error.response?.data?.message ??
          "Erro ao importar instituições parceiras da edição anterior."
      );
    } finally {
      setImportando(false);
    }
  };

  const onCriar = async (data) => {
    setSalvando(true);
    setErro("");
    try {
      const resposta = await criarInstituicaoParceira(eventoSlug, data);
      setParceiras((prev) => [...prev, resposta.instituicaoParceira]);
      reset();
    } catch (error) {
      setErro(
        error.response?.data?.message ??
          "Erro ao criar instituição parceira."
      );
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (parceira) => {
    setAlternandoId(parceira.id);
    setErro("");
    try {
      const resposta = await atualizarInstituicaoParceira(
        eventoSlug,
        parceira.id,
        { ativo: !parceira.ativo }
      );
      setParceiras((prev) =>
        prev.map((p) =>
          p.id === parceira.id ? resposta.instituicaoParceira : p
        )
      );
    } catch (error) {
      setErro(
        error.response?.data?.message ??
          "Erro ao atualizar instituição parceira."
      );
    } finally {
      setAlternandoId(null);
    }
  };

  const handleExcluir = async () => {
    setErroExclusao("");
    setExcluindoLoading(true);
    try {
      await excluirInstituicaoParceira(eventoSlug, excluindo.id);
      setParceiras((prev) => prev.filter((p) => p.id !== excluindo.id));
      setExcluindo(null);
    } catch (error) {
      setErroExclusao(
        error.response?.data?.message ??
          "Erro na conexão com o servidor."
      );
    } finally {
      setExcluindoLoading(false);
    }
  };

  return (
    <div className={styles.secao}>
      <div className={styles.secaoHead}>
        <div className={styles.secaoIcon}>
          <RiBuildingLine />
        </div>
        <h6>Instituições parceiras</h6>
      </div>
      <div className={styles.secaoContent}>
        <p className={styles.dica}>
          Instituições que só participam deste congresso enviando resumos, sem
          cadastro completo no plic. Aparecem junto com as instituições
          cadastradas na etapa de inscrição do evento.
        </p>

        {parceiras.length === 0 && edicaoAnterior && (
          <div className="mb-2">
            <p className={styles.dica}>
              A edição anterior ({edicaoAnterior.nomeEvento} —{" "}
              {edicaoAnterior.edicaoEvento}) tem{" "}
              {edicaoAnterior.totalInstituicoes} instituição(ões) parceira(s)
              cadastrada(s). Importar em vez de cadastrar uma por uma?
            </p>
            <Button
              icon={RiDownload2Line}
              className="btn-secondary mt-1"
              type="button"
              onClick={onImportar}
              disabled={importando}
            >
              {importando ? "Importando..." : "Importar da edição anterior"}
            </Button>
            {erroImportar && (
              <p className={`${styles.statusErro} mt-1`}>{erroImportar}</p>
            )}
          </div>
        )}

        {parceiras.length > 0 && (
          <div className={styles.lista}>
            {parceiras.map((parceira) => (
              <div key={parceira.id} className={styles.listaItem}>
                <div
                  className={styles.icon}
                  onClick={() => toggleAtivo(parceira)}
                  title={parceira.ativo ? "Desativar" : "Reativar"}
                >
                  {alternandoId === parceira.id ? (
                    "..."
                  ) : parceira.ativo ? (
                    <RiToggleFill />
                  ) : (
                    <RiToggleLine />
                  )}
                </div>
                <div className={`${styles.content} ${styles.betweenIcons}`}>
                  <p>
                    <strong>{parceira.sigla}</strong> - {parceira.nome}
                    {!parceira.ativo && " (inativa)"}
                  </p>
                </div>
                <div className={styles.listaItemActions}>
                  <div
                    className={`${styles.actionIcon} ${styles.actionIconEdit}`}
                    onClick={() => setEditando(parceira)}
                    title="Editar"
                  >
                    <RiPencilLine />
                  </div>
                  <div
                    className={`${styles.actionIcon} ${styles.actionIconDelete}`}
                    onClick={() => {
                      setErroExclusao("");
                      setExcluindo(parceira);
                    }}
                    title="Excluir"
                  >
                    <RiDeleteBinLine />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onCriar)}
          className={`${styles.secaoGrid} mt-2`}
        >
          <Input
            control={control}
            name="nome"
            label="Nome da instituição"
            inputType="text"
          />
          <Input control={control} name="sigla" label="Sigla" inputType="text" />
          <Button
            icon={RiAddCircleLine}
            className="btn-secondary"
            type="submit"
            disabled={salvando}
          >
            {salvando ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
        {erro && <p className={styles.statusErro}>{erro}</p>}
      </div>

      <Modal
        isOpen={!!editando}
        onClose={() => setEditando(null)}
        edit
        itemName="instituição parceira"
      >
        {editando && (
          <EditarParceiraForm
            key={editando.id}
            parceira={editando}
            eventoSlug={eventoSlug}
            onClose={() => setEditando(null)}
            onSuccess={(atualizada) =>
              setParceiras((prev) =>
                prev.map((p) => (p.id === atualizada.id ? atualizada : p))
              )
            }
          />
        )}
      </Modal>

      <ModalDelete
        isOpen={!!excluindo}
        onClose={() => setExcluindo(null)}
        title="Excluir instituição parceira"
        confirmationText={`Tem certeza que deseja excluir ${excluindo?.sigla ?? ""}? Se houver submissões vinculadas a ela, a exclusão será bloqueada — nesse caso, desative-a em vez de excluir.`}
        errorDelete={erroExclusao}
        handleDelete={handleExcluir}
        txtBtn={excluindoLoading ? "Excluindo..." : "Excluir"}
      />
    </div>
  );
};

export default FormInstituicoesParceiras;
