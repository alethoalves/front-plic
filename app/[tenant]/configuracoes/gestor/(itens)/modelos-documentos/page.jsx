"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiAddLine,
  RiArchiveLine,
  RiFileCopyLine,
  RiInboxUnarchiveLine,
  RiPencilLine,
} from "@remixicon/react";

import Header from "@/components/Header";
import ModeloDocumentoDialog from "@/components/modeloDocumento/ModeloDocumentoDialog";
import { TIPOS_DOCUMENTO } from "@/components/modeloDocumento/constantes";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import {
  listarModelosDocumento,
  duplicarModeloDocumento,
  arquivarModeloDocumento,
} from "@/app/api/client/documentos";
import {
  getConfiguracaoTabela,
  upsertConfiguracaoTabela,
} from "@/app/api/client/configuracaoTabela";

import styles from "./page.module.scss";

const CHAVE_DOCUMENTO_OBRIGATORIO_SUBSTITUICAO_ALUNO =
  "documentoTemplateObrigatorioSubstituicaoAluno";

const ABAS = [
  { id: "modelos", label: "Modelos" },
  { id: "substituicao", label: "Substituição de aluno" },
];

const Page = ({ params }) => {
  const { tenant } = params;
  const toast = useRef(null);

  const [abaAtiva, setAbaAtiva] = useState("modelos");
  const [modelos, setModelos] = useState([]);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modeloAbertoId, setModeloAbertoId] = useState(null);
  const [modeloADuplicar, setModeloADuplicar] = useState(null);
  const [tituloNovaVersao, setTituloNovaVersao] = useState("");
  const [duplicando, setDuplicando] = useState(false);

  const [documentoTemplateId, setDocumentoTemplateId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const mostrarErro = useCallback((err, padrao) => {
    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: err?.response?.data?.message ?? padrao,
    });
  }, []);

  // Sempre carrega todos (inclusive arquivados): o filtro é local, e o
  // dropdown da substituição usa só os ativos.
  const carregarModelos = useCallback(async () => {
    try {
      setModelos((await listarModelosDocumento(tenant, { incluirArquivados: true })) || []);
    } catch (err) {
      mostrarErro(err, "Falha ao carregar os modelos de documento.");
    }
  }, [tenant, mostrarErro]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await carregarModelos();
        const valor = await getConfiguracaoTabela(
          tenant,
          CHAVE_DOCUMENTO_OBRIGATORIO_SUBSTITUICAO_ALUNO
        );
        setDocumentoTemplateId(valor?.documentoTemplateId ?? null);
      } catch (err) {
        mostrarErro(err, "Falha ao carregar a configuração.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, carregarModelos, mostrarErro]);

  const fecharModelo = useCallback(() => setModeloAbertoId(null), []);

  const handleSalvarSubstituicao = async () => {
    setSalvando(true);
    try {
      await upsertConfiguracaoTabela(
        tenant,
        CHAVE_DOCUMENTO_OBRIGATORIO_SUBSTITUICAO_ALUNO,
        { documentoTemplateId }
      );
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Configuração salva com sucesso!",
      });
      // o modelo escolhido passa a constar como "em uso" na lista
      carregarModelos();
    } catch (err) {
      mostrarErro(err, "Falha ao salvar a configuração.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirDuplicar = (modelo) => {
    setModeloADuplicar(modelo);
    setTituloNovaVersao(`${modelo.titulo} (nova versão)`);
  };

  const handleDuplicar = async () => {
    setDuplicando(true);
    try {
      const novo = await duplicarModeloDocumento(
        tenant,
        modeloADuplicar.id,
        tituloNovaVersao
      );
      toast.current?.show({
        severity: "success",
        summary: "Nova versão criada",
        detail:
          "Revise a cópia, troque-a onde a versão antiga é usada (cotas, substituição) e arquive a antiga.",
        life: 8000,
      });
      setModeloADuplicar(null);
      await carregarModelos();
      setModeloAbertoId(novo.id);
    } catch (err) {
      mostrarErro(err, "Falha ao criar a nova versão.");
    } finally {
      setDuplicando(false);
    }
  };

  const alterarArquivado = async (modelo, arquivado) => {
    try {
      await arquivarModeloDocumento(tenant, modelo.id, arquivado);
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: arquivado ? "Modelo arquivado." : "Modelo desarquivado.",
      });
      await carregarModelos();
    } catch (err) {
      mostrarErro(err, "Falha ao alterar o modelo.");
    }
  };

  const confirmarArquivar = (modelo) => {
    if (modelo.arquivado) {
      alterarArquivado(modelo, false);
      return;
    }
    if (modelo.usos.length > 0) {
      confirmDialog({
        header: "Não é possível arquivar",
        message: (
          <div>
            <p>Este modelo ainda gera documentos automaticamente:</p>
            <ul className={styles.listaUsos}>
              {modelo.usos.map((uso, i) => (
                <li key={i}>{uso.descricao}</li>
              ))}
            </ul>
            <p>Desvincule-o desses lugares antes de arquivar.</p>
          </div>
        ),
        acceptLabel: "Entendi",
        rejectClassName: styles.oculto,
      });
      return;
    }
    confirmDialog({
      header: "Arquivar modelo",
      message: `"${modelo.titulo}" deixará de aparecer para o gestor nas telas de gerar documentos e de cotas. Os ${modelo.totalRegistros} documento(s) já gerados continuam como estão.`,
      acceptLabel: "Arquivar",
      rejectLabel: "Cancelar",
      accept: () => alterarArquivado(modelo, true),
    });
  };

  const modelosVisiveis = mostrarArquivados
    ? modelos
    : modelos.filter((m) => !m.arquivado);
  const totalArquivados = modelos.filter((m) => m.arquivado).length;

  const opcoesSubstituicao = modelos
    .filter((m) => !m.arquivado)
    .map((m) => ({ label: m.titulo, value: m.id }));

  return (
    <main>
      <Toast ref={toast} />
      <ConfirmDialog />
      <ModeloDocumentoDialog
        tenant={tenant}
        modeloId={modeloAbertoId}
        onClose={fecharModelo}
        onSalvo={carregarModelos}
        toast={toast}
      />
      <Dialog
        visible={!!modeloADuplicar}
        onHide={() => setModeloADuplicar(null)}
        header="Criar nova versão"
        style={{ width: "520px", maxWidth: "95vw" }}
        draggable={false}
        footer={
          <div>
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={() => setModeloADuplicar(null)}
            />
            <Button
              label={duplicando ? "Criando..." : "Criar"}
              className="p-button-success"
              onClick={handleDuplicar}
              disabled={duplicando || !tituloNovaVersao.trim()}
            />
          </div>
        }
      >
        <p className="mb-2">
          Cria uma cópia de &quot;{modeloADuplicar?.titulo}&quot; com o mesmo texto e as
          mesmas regras. A versão atual e os documentos dela não mudam.
        </p>
        <label className={styles.label} htmlFor="titulo-nova-versao">
          Título da nova versão
        </label>
        <InputText
          id="titulo-nova-versao"
          value={tituloNovaVersao}
          onChange={(e) => setTituloNovaVersao(e.target.value)}
          className={styles.inputCheio}
        />
      </Dialog>

      <Header
        className="mb-3"
        titulo="Modelos de Documentos"
        subtitulo="Crie, edite e organize os modelos de documento"
        descricao="Modelos arquivados deixam de aparecer nas telas de gerar documentos e de cotas, mas os documentos já gerados continuam valendo."
      />

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

      {abaAtiva === "modelos" && (
        <div className="mt-3">
          <div className="flex-space mb-2">
            <div className={styles.filtro}>
              <Checkbox
                inputId="mostrar-arquivados"
                checked={mostrarArquivados}
                onChange={(e) => setMostrarArquivados(e.checked)}
              />
              <label htmlFor="mostrar-arquivados">
                Mostrar arquivados ({totalArquivados})
              </label>
            </div>
            <Button
              icon={<RiAddLine size={18} />}
              label="Novo modelo"
              className={styles.botaoNovo}
              onClick={() => setModeloAbertoId("novo")}
            />
          </div>

          <DataTable
            value={modelosVisiveis}
            loading={loading}
            dataKey="id"
            emptyMessage="Nenhum modelo encontrado."
            onRowClick={(e) => setModeloAbertoId(e.data.id)}
            rowClassName={(m) => `clickable-row ${m.arquivado ? styles.linhaArquivada : ""}`}
          >
            <Column
              header="Modelo"
              body={(m) => (
                <div>
                  <div className={styles.titulo}>
                    {m.titulo}
                    {m.arquivado && <Tag severity="warning" value="Arquivado" className="ml-1" />}
                  </div>
                  {m.descricao && <div className={styles.descricao}>{m.descricao}</div>}
                </div>
              )}
            />
            <Column
              header="Tipo"
              body={(m) => TIPOS_DOCUMENTO[m.tipoDocumento] ?? m.tipoDocumento}
            />
            <Column header="Documentos" field="totalRegistros" />
            <Column
              header="Gera automaticamente"
              body={(m) =>
                m.usos.length === 0 ? (
                  <span className={styles.descricao}>—</span>
                ) : (
                  <ul className={styles.listaUsos}>
                    {m.usos.map((uso, i) => (
                      <li key={i}>{uso.descricao}</li>
                    ))}
                  </ul>
                )
              }
            />
            <Column
              header="Ações"
              body={(m) => (
                <div className={styles.acoes} onClick={(e) => e.stopPropagation()}>
                  <Button
                    icon={<RiPencilLine size={18} />}
                    className="p-button-rounded p-button-text"
                    tooltip="Ver / editar"
                    tooltipOptions={{ position: "top" }}
                    onClick={() => setModeloAbertoId(m.id)}
                  />
                  <Button
                    icon={<RiFileCopyLine size={18} />}
                    className="p-button-rounded p-button-text"
                    tooltip="Criar nova versão"
                    tooltipOptions={{ position: "top" }}
                    onClick={() => abrirDuplicar(m)}
                  />
                  <Button
                    icon={
                      m.arquivado ? (
                        <RiInboxUnarchiveLine size={18} />
                      ) : (
                        <RiArchiveLine size={18} />
                      )
                    }
                    className={`p-button-rounded p-button-text ${m.arquivado ? "" : "p-button-danger"}`}
                    tooltip={m.arquivado ? "Desarquivar" : "Arquivar"}
                    tooltipOptions={{ position: "top" }}
                    onClick={() => confirmarArquivar(m)}
                  />
                </div>
              )}
            />
          </DataTable>
        </div>
      )}

      {abaAtiva === "substituicao" && (
        <div className={styles.content}>
          <p className="mb-2">
            Escolha qual modelo de documento deve se tornar obrigatório automaticamente para
            toda nova participação do tipo aluno criada por substituição.
          </p>
          <label className={styles.label}>Modelo de documento obrigatório</label>
          <Dropdown
            value={documentoTemplateId}
            options={opcoesSubstituicao}
            onChange={(e) => setDocumentoTemplateId(e.value)}
            placeholder="Nenhum (não exigir documento)"
            showClear
            disabled={loading}
            className={styles.dropdown}
          />

          <Button
            label={salvando ? "Salvando..." : "Salvar"}
            className="p-button-success mt-3"
            onClick={handleSalvarSubstituicao}
            disabled={loading || salvando}
          />
        </div>
      )}
    </main>
  );
};

export default Page;
