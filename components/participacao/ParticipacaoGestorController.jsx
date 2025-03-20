"use client";

import ParticipacaoForm from "../Formularios/ParticipacaoForm";
import CPFVerificationForm from "../Formularios/CPFVerificationForm";
import { useCallback, useEffect, useRef, useState } from "react";
import EditarParticipacao from "./EditarParticipacao";
import styles from "./ParticipacaoGestorController.module.scss";
import { Chart } from "primereact/chart";
import { Column } from "primereact/column";
import {
  deleteParticipacao,
  getParticipacao,
  updateParticipacao,
  validarParticipacao,
} from "@/app/api/client/participacao";
import ParticipacaoFormAluno from "../Formularios/ParticipacaoFormAluno";
import generateLattesText from "@/lib/generateLattesText";
import Campo from "../Campo";
import FileInput from "../FileInput";
import { RiDeleteBinLine, RiExternalLinkLine } from "@remixicon/react";
import Button from "../Button";
import { getFormulario } from "@/app/api/client/formulario";
import { xmlLattes } from "@/app/api/clientReq";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import NoData from "../NoData";

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
  const [fileInputErrors, setFileInputErrors] = useState({}); // Estado para mensagens de erro por FileInput
  const [deletingId, setDeletingId] = useState(null); // ID da participação sendo deletada
  const [errorMessages, setErrorMessages] = useState({});
  const [editalInfo, setEditalInfo] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);
  const [activeTab, setActiveTab] = useState("geral");
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  const toast = useRef(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const item = await getParticipacao(tenant, participacaoId);
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
  // Define os campos a serem exibidos com base no tipo de participação
  const getCamposByTipoParticipacao = () => {
    switch (tipoParticipacao) {
      case "orientador":
        return camposFormOrientador;
      case "coorientador":
        return camposFormCoorientador;
      case "aluno":
        return camposFormAluno;
      default:
        return [];
    }
  };

  const campos = getCamposByTipoParticipacao();
  const handleFileUpload = async (file, userId) => {
    if (!file) {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Nenhum arquivo selecionado.",
      }));
      return;
    }

    if (file.type !== "text/xml" && file.type !== "application/zip") {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Por favor, selecione um arquivo XML ou ZIP válido.",
      }));
      return;
    }

    setFileInputErrors((prev) => ({ ...prev, [userId]: "" })); // Limpa erros específicos
    setLoading(true); // Inicia o estado de carregamento

    try {
      const response = await xmlLattes(file, tenant, userId);
      await handleCreateOrEditSuccess();
      await onSuccess();
      alert("Arquivo enviado e URL do Lattes atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao enviar o arquivo.";
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: errorMessage,
      }));
    } finally {
      setLoading(false); // Finaliza o estado de carregamento
    }
  };
  const handleCreateOrEditSuccess = async () => {
    setLoading(true);
    await onSuccess();
    const item = await getParticipacao(tenant, participacaoId);
    setItem(item);

    setLoading(false);
  };
  const handleDeleteParticipacao = async (idParticipacao) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta participação?"
    );
    if (!confirmed) return;

    setDeletingId(idParticipacao); // Ativa o loading para a participação específica
    setErrorMessages((prev) => ({ ...prev, [idParticipacao]: "" })); // Limpa erros anteriores

    try {
      await deleteParticipacao(tenant, idParticipacao);
      await onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao excluir participação:", error);
      // Atualiza a mensagem de erro específica para a participação
      setErrorMessages((prev) => ({
        ...prev,
        [idParticipacao]:
          error.response?.data?.message || "Erro ao excluir participação.",
      }));
    } finally {
      setDeletingId(null); // Desativa o loading
    }
  };
  const handleStatusChange = async (e) => {
    const newStatus = e.value;
    try {
      await updateParticipacao(tenant, participacaoId, {
        status: newStatus,
      });
      await handleCreateOrEditSuccess();

      // Exibe uma notificação de sucesso
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status da inscrição atualizado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      // Exibe uma notificação de erro
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Ocorreu um erro ao atualizar o status da inscrição.",
        life: 3000,
      });
    }
  };
  // Função para agrupar dados por ano e tipo
  const agruparPorAnoETipo = (dados, tipos) => {
    const agrupado = {};
    dados?.forEach((item) => {
      const ano = item.ano;
      const tipo = tipos.find((t) => t.condicao(item))?.label || item.natureza; // Usa a natureza como tipo

      if (!agrupado[ano]) {
        agrupado[ano] = {};
      }
      if (!agrupado[ano][tipo]) {
        agrupado[ano][tipo] = 0;
      }
      agrupado[ano][tipo]++;
    });
    return agrupado;
  };

  // Tipos de orientações concluídas (sem agrupar em "Outros")
  const tiposOrientacoes = [
    {
      label: "Dissertação de mestrado",
      condicao: (item) => item.natureza === "Dissertação de mestrado",
    },
    {
      label: "Tese de doutorado",
      condicao: (item) => item.natureza === "Tese de doutorado",
    },
    {
      label: "Iniciação Científica",
      condicao: (item) => item.natureza === "INICIACAO_CIENTIFICA",
    },
    {
      label: "Pós-Doutorado",
      condicao: (item) => item.natureza === "Pós-Doutorado",
    },
    {
      label: "Graduação",
      condicao: (item) =>
        item.natureza === "TRABALHO_DE_CONCLUSAO_DE_CURSO_GRADUACAO",
    },
    {
      label: "Monografia Especialização/Aperfeiçoamento",
      condicao: (item) =>
        item.natureza ===
        "MONOGRAFIA_DE_CONCLUSAO_DE_CURSO_APERFEICOAMENTO_E_ESPECIALIZACAO",
    },
    // Adicione mais tipos conforme necessário
  ];

  // Tipos de produção bibliográfica
  const tiposProducao = [
    {
      label: "Artigos",
      condicao: (item) => item.tipo === "ARTIGO_PUBLICADO",
    },
    {
      label: "Trabalhos em Eventos",
      condicao: (item) => item.tipo === "TRABALHO_EM_EVENTO",
    },
    {
      label: "Livros/Capítulos",
      condicao: (item) =>
        item.tipo === "LIVRO_PUBLICADO_OU_ORGANIZADO" ||
        item.tipo === "CAPITULO_DE_LIVRO_PUBLICADO",
    },
  ];

  // Dados de orientações concluídas por ano e tipo
  const orientacoesPorAnoETipo = agruparPorAnoETipo(
    item?.user?.lattesJSON?.orientacoesConcluidas,
    tiposOrientacoes
  );

  // Dados de produção bibliográfica por ano e tipo
  const producaoPorAnoETipo = agruparPorAnoETipo(
    item?.user?.lattesJSON?.producaoBibliografica,
    tiposProducao
  );

  // Labels (anos) para os gráficos
  const anosOrientacoes = Object.keys(orientacoesPorAnoETipo).sort(
    (a, b) => a - b
  );
  const anosProducao = Object.keys(producaoPorAnoETipo).sort((a, b) => a - b);

  // Cores fixas para os tipos de orientações concluídas
  const coresOrientacoes = {
    "Dissertação de mestrado": "#42A5F5", // Azul
    "Tese de doutorado": "#66BB6A", // Verde
    "Iniciação Científica": "#FFA726", // Laranja
    "Pós-Doutorado": "#FF6384", // Vermelho
    Graduação: "#8A2BE2", // Roxo (nova cor para Graduação)
    "Monografia Especialização/Aperfeiçoamento": "#FF69B4", // Rosa (nova cor para Monografia)
  };

  // Cores fixas para os tipos de produção bibliográfica
  const coresProducao = {
    Artigos: "#36A2EB", // Azul claro
    "Trabalhos em Eventos": "#FFCE56", // Amarelo
    "Livros/Capítulos": "#4BC0C0", // Ciano
    // Adicione mais cores conforme necessário
  };

  // Dados para o gráfico de orientações concluídas
  const dadosOrientacoes = {
    labels: anosOrientacoes,
    datasets: tiposOrientacoes.map((tipo) => ({
      label: tipo.label,
      data: anosOrientacoes.map(
        (ano) => orientacoesPorAnoETipo[ano][tipo.label] || 0
      ),
      backgroundColor: coresOrientacoes[tipo.label], // Usa a cor fixa
    })),
  };

  // Dados para o gráfico de produção bibliográfica
  const dadosProducao = {
    labels: anosProducao,
    datasets: tiposProducao.map((tipo) => ({
      label: tipo.label,
      data: anosProducao.map(
        (ano) => producaoPorAnoETipo[ano][tipo.label] || 0
      ),
      backgroundColor: coresProducao[tipo.label], // Usa a cor fixa
    })),
  };
  // Altura base e altura por label
  const alturaBase = 100; // Altura base para o gráfico
  const alturaPorLabel = 30; // Altura adicional por label

  // Calcular o height dinâmico para o gráfico de orientações
  const heightOrientacoes =
    alturaBase + anosOrientacoes.length * alturaPorLabel;

  // Calcular o height dinâmico para o gráfico de produção
  const heightProducao = alturaBase + anosProducao.length * alturaPorLabel;

  return (
    <>
      {loading && <p>Carregando...</p>}
      {item && !loading && (
        <>
          <div className={`${styles.nav}`}>
            <div className={`${styles.menu}`}>
              <div
                className={`${styles.itemMenu} ${
                  activeTab === "geral" ? styles.itemMenuSelected : ""
                }`}
                onClick={() => handleTabChange("geral")}
              >
                <p>Geral</p>
              </div>
              <div
                className={`${styles.itemMenu} ${
                  activeTab === "curriculo" ? styles.itemMenuSelected : ""
                }`}
                onClick={() => handleTabChange("curriculo")}
              >
                <p>Currículo</p>
              </div>

              <div
                className={`${styles.itemMenu} ${
                  activeTab === "edicao" ? styles.itemMenuSelected : ""
                }`}
                onClick={() => handleTabChange("edicao")}
              >
                <p>Edição</p>
              </div>
            </div>
          </div>
          {/* TELA DE VISUALIZAÇÃO */}
          {activeTab === "geral" && (
            <div className={styles.participacao}>
              <div className={styles.toast}>
                <Toast ref={toast} />
              </div>
              <div className={styles.label}>
                <h6>Nome</h6>
                <p>{item?.user?.nome}</p>
              </div>
              <div className={styles.label}>
                <h6>CPF</h6>
                <p>{item?.user?.cpf}</p>
              </div>
              {tipoParticipacao === "aluno" && (
                <div className={styles.label}>
                  <h6>Solicitou bolsa?</h6>
                  <p>{item?.solicitarBolsa ? "Sim" : "Não"}</p>
                </div>
              )}
              <div className={styles.label}>
                <h6>Titulação</h6>
                <p>
                  {item?.user?.lattesJSON?.formacaoAcademicaTitulacao?.doutorado
                    ? "Doutor"
                    : item?.user?.lattesJSON?.formacaoAcademicaTitulacao
                        ?.mestrado
                    ? "Mestre"
                    : item?.user?.lattesJSON?.formacaoAcademicaTitulacao
                        ?.graduacao
                    ? "Graduado"
                    : "Não informado"}
                </p>
              </div>
              <div className={styles.label}>
                <h6>Link do Lattes</h6>
                {!item?.user?.lattesJSON?.numeroIdentificador && (
                  <p>Não informado</p>
                )}
                {item?.user?.lattesJSON?.numeroIdentificador && (
                  <a
                    href={`http://lattes.cnpq.br/${item?.user?.lattesJSON?.numeroIdentificador}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline" }}
                  >
                    {`http://lattes.cnpq.br/${item?.user?.lattesJSON?.numeroIdentificador}`}
                  </a>
                )}
              </div>

              {campos?.map((campo) => {
                // Encontra a resposta correspondente ao campo atual
                const resposta = item?.respostas.find(
                  (resposta) => resposta.campoId === campo.id
                );

                return (
                  <div key={campo.id} className={styles.label}>
                    {/* Exibe o label do campo */}
                    <h6>{campo.label}</h6>

                    {/* Exibe o valor da resposta ou 'N/A' se não houver resposta */}
                    <p>{resposta?.value || "N/A"}</p>
                  </div>
                );
              })}
              <div className={`${styles.statusField} ${styles.label}`}>
                <h6>Status da Participação:</h6>
                <Dropdown
                  value={item?.status}
                  options={[
                    { label: "completo", value: "completo" },
                    { label: "analisado", value: "analisado" },
                    { label: "reprovado", value: "reprovado" },
                  ]}
                  onChange={handleStatusChange}
                  placeholder="Selecione o status"
                  className={styles.statusDropdown}
                  optionLabel="label"
                  optionValue="value"
                />
              </div>
            </div>
          )}

          {/* TELA DO CV LATTES */}
          {activeTab === "curriculo" && (
            <div className={styles.participacao}>
              {/* Gráfico de Orientações Concluídas por Ano e Tipo */}
              <div className="card">
                <h6>Orientações Concluídas por Ano</h6>
                {dadosOrientacoes.labels.length > 0 ? (
                  <Chart
                    type="bar"
                    data={dadosOrientacoes}
                    options={{
                      indexAxis: "y", // Barras horizontais
                      responsive: true,
                      maintainAspectRatio: false, // Desabilita a manutenção da proporção
                      scales: {
                        x: {
                          stacked: true,
                          title: {
                            display: true,
                            text: "Quantidade",
                          },
                          beginAtZero: true,
                        },
                        y: {
                          stacked: true,
                          title: {
                            display: true,
                            text: "Ano",
                          },
                        },
                      },
                    }}
                    height={heightOrientacoes}
                  />
                ) : (
                  <NoData description="Sem orientações" />
                )}
              </div>

              {/* Gráfico de Produção Bibliográfica por Ano e Tipo */}
              <div className="card">
                <h6>Produção Bibliográfica por Ano</h6>
                {dadosProducao.labels.length > 0 ? (
                  <Chart
                    type="bar"
                    data={dadosProducao}
                    options={{
                      indexAxis: "y", // Barras horizontais
                      responsive: true,
                      maintainAspectRatio: false, // Desabilita a manutenção da proporção
                      scales: {
                        x: {
                          stacked: true,
                          title: {
                            display: true,
                            text: "Quantidade",
                          },
                          beginAtZero: true,
                        },
                        y: {
                          stacked: true,
                          title: {
                            display: true,
                            text: "Ano",
                          },
                        },
                      },
                    }}
                    height={heightProducao}
                  />
                ) : (
                  <NoData description="Sem produção bibliográfica"></NoData>
                )}
              </div>
            </div>
          )}
          {/* TELA DE EDIÇÃO */}
          {activeTab === "edicao" && (
            <div className={styles.participacao}>
              <div className={styles.toast}>
                <Toast ref={toast} />
              </div>
              <div className={styles.label}>
                <h6>Nome</h6>
                <p>{item?.user?.nome}</p>
              </div>
              <div className={styles.label}>
                <h6>CPF</h6>
                <p>{item?.user?.cpf}</p>
              </div>
              {tipoParticipacao === "aluno" && (
                <div className={styles.label}>
                  <h6>Solicitou bolsa?</h6>
                  <p>{item?.solicitarBolsa ? "Sim" : "Não"}</p>
                </div>
              )}
              <div className={`${styles.statusField} ${styles.label}`}>
                <p>Status da Participação:</p>
                <Dropdown
                  value={item?.status}
                  options={[
                    { label: "completo", value: "completo" },
                    { label: "incompleto", value: "incompleto" },
                  ]}
                  onChange={handleStatusChange}
                  placeholder="Selecione o status"
                  className={styles.statusDropdown}
                  optionLabel="label"
                  optionValue="value"
                />
              </div>
              <div className={styles.label}>
                <h6>CV Lattes</h6>
                {item?.user?.cvLattes?.length > 0 && (
                  <div className={styles.urlCvLattes}>
                    <RiExternalLinkLine />
                    <a
                      href={
                        item.user.cvLattes[item.user.cvLattes?.length - 1]?.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {generateLattesText(
                        item.user.cvLattes[item.user.cvLattes?.length - 1]?.url
                      )}
                    </a>
                  </div>
                )}
                <div className="mt-2">
                  <FileInput
                    onFileSelect={(file) =>
                      handleFileUpload(file, item.user.id)
                    }
                    label={
                      item?.user?.cvLattes?.length > 0
                        ? "Quer atualizar o Lattes?"
                        : "Enviar CV Lattes"
                    }
                    disabled={loading}
                    errorMessage={fileInputErrors[item?.user?.id] || ""}
                  />
                </div>
              </div>
              {campos.length > 0 && (
                <div className={styles.label}>
                  <h6>
                    Preencha os campos abaixo para o tipo:{" "}
                    {tipoParticipacao.toUpperCase()}
                  </h6>
                  <div className={`${styles.campos} mt-2`}>
                    {campos?.map((campo, index) => (
                      <Campo
                        perfil="participante"
                        readOnly={false}
                        key={campo.id}
                        schema={campo}
                        camposForm={campos}
                        respostas={item?.respostas}
                        tenantSlug={tenant}
                        participacaoId={item?.id}
                        onSuccess={handleCreateOrEditSuccess}
                        loading={loading}
                        setLoading={setLoading}
                      />
                    ))}
                  </div>
                </div>
              )}
              {!loading && (
                <div
                  className={styles.delete}
                  onClick={() => handleDeleteParticipacao(item.id)}
                >
                  <RiDeleteBinLine />
                  {deletingId === item.id && <p>Excluindo...</p>}
                </div>
              )}
              <div className={styles.excluirParticipacao}>
                {errorMessages[item.id] && ( // Exibe a mensagem de erro específica se existir
                  <div className={`${styles.errorMsg}`}>
                    <p>{errorMessages[item.id]}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ParticipacaoGestorController;
