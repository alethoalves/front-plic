"use client";
import {
  RiAwardFill,
  RiCouponLine,
  RiIdCardLine,
  RiKeyLine,
  RiFileListLine, // Adicione este ícone para a ficha de avaliação
} from "@remixicon/react";
import styles from "./CertificadoEvento.module.scss";
import { useState, useEffect, useRef } from "react";
import Modal from "../Modal";
import Input from "../Input";
import { useForm } from "react-hook-form";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import {
  generateAndDownloadCertificatePDF,
  getCertificados,
} from "@/app/api/client/certificado";
import { getUltimaAvaliacaoDepurada } from "@/app/api/client/eventos";

export const CertificadoEvento = ({ params, eventoId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cpf"); // 'cpf' ou 'codigo'
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAvaliacao, setLoadingAvaliacao] = useState({}); // Para controlar loading individual por certificado
  const [error, setError] = useState(null);
  const toast = useRef(null);

  const { control, watch, reset } = useForm({
    defaultValues: {
      cpf: "",
      codigo: "",
    },
  });

  const cpfValue = watch("cpf");
  const codigoValue = watch("codigo");

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  const showSuccess = (message) => {
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: message,
      life: 5000,
    });
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setActiveTab("cpf");
    setCertificados([]);
    setError(null);
    reset();
  };

  // Função para buscar ficha de avaliação
  const handleVerFichaAvaliacao = async (certificado) => {
    if (!certificado.submissaoId) {
      showError("Submissão não encontrada para este certificado.");
      return;
    }

    // Define o loading para este certificado específico
    setLoadingAvaliacao((prev) => ({
      ...prev,
      [certificado.id]: true,
    }));

    try {
      const eventoSlug = params.eventoSlug; // Ajuste conforme sua estrutura

      const avaliacao = await getUltimaAvaliacaoDepurada(
        eventoSlug,
        certificado.submissaoId
      );

      console.log("Dados da avaliação:", avaliacao);

      // Gerar o HTML da ficha de avaliação (agora só com os dados da API)
      const fichaHTML = gerarFichaAvaliacaoHTML(avaliacao);

      // Abrir nova aba com o HTML
      const novaAba = window.open();
      novaAba.document.write(fichaHTML);
      novaAba.document.close();

      showSuccess("Ficha de avaliação aberta em nova aba!");
    } catch (error) {
      console.error("Erro ao buscar ficha de avaliação:", error);
      showError("Erro ao carregar ficha de avaliação. Tente novamente.");
    } finally {
      setLoadingAvaliacao((prev) => ({
        ...prev,
        [certificado.id]: false,
      }));
    }
  };

  // Função para gerar o HTML da ficha de avaliação
  const gerarFichaAvaliacaoHTML = (avaliacaoData) => {
    const avaliacao = avaliacaoData.avaliacao;
    const tituloTrabalho = avaliacaoData.titulo || "Trabalho não identificado";
    const eventoNome = avaliacaoData.eventoNome || "Evento não identificado";
    const participacoesByCargo = avaliacaoData.participacoesByCargo || {};

    // Função para formatar as participações por cargo
    const formatarParticipacoes = () => {
      if (
        !participacoesByCargo ||
        Object.keys(participacoesByCargo).length === 0
      ) {
        return '<div class="participacao-item">Nenhuma informação de participação disponível</div>';
      }

      let html = "";

      // Ordenar os cargos para exibição consistente
      const cargosOrdenados = Object.keys(participacoesByCargo).sort();

      cargosOrdenados.forEach((cargo) => {
        const participacoes = participacoesByCargo[cargo];
        if (participacoes && participacoes.length > 0) {
          const nomes = participacoes
            .map((p) => p.user?.nome || "Nome não informado")
            .join(", ");
          html += `
          <div class="participacao-item">
            <span class="participacao-cargo">${cargo}:</span>
            <span class="participacao-nomes">${nomes}</span>
          </div>
        `;
        }
      });

      return html;
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha de Avaliação - ${tituloTrabalho}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }

        .header h1 {
            color: #2c3e50;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .evento-info {
            color: #6c757d;
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 15px;
        }

        .titulo-trabalho {
            color: #495057;
            font-size: 18px;
            font-weight: 500;
            margin: 15px 0;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 8px;
            border-left: 4px solid #6c757d;
            line-height: 1.5;
            text-align: center;
            font-style: italic;
        }

        .header .subtitle {
            color: #6c757d;
            font-size: 16px;
            font-weight: 400;
        }

        .print-button {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.3s;
        }

        .print-button:hover {
            background: #495057;
        }

        .nota-total {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%);
            color: #495057;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
            border: 1px solid #dee2e6;
        }

        .nota-total .label {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #6c757d;
        }

        .nota-total .valor {
            font-size: 48px;
            font-weight: 700;
            color: #495057;
        }

        .participacoes {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .participacoes h3 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }

        .participacao-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            padding: 8px 0;
        }

        .participacao-cargo {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
            margin-right: 15px;
        }

        .participacao-nomes {
            color: #6c757d;
            flex: 1;
            line-height: 1.4;
        }

        .criterios {
            margin-bottom: 30px;
        }

        .criterio-item {
            background: #f8f9fa;
            border-left: 4px solid #6c757d;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 0 8px 8px 0;
            border: 1px solid #e9ecef;
        }

        .criterio-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .criterio-titulo {
            font-weight: 600;
            color: #495057;
            font-size: 16px;
            flex: 1;
            margin-right: 15px;
        }

        .criterio-nota {
            background: #6c757d;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            min-width: 70px;
            text-align: center;
        }

        .criterio-descricao {
            color: #6c757d;
            font-size: 14px;
            line-height: 1.5;
        }

        .indicacoes {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .indicacoes h3 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }

        .indicacoes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .indicacao-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
        }

        .indicacao-label {
            font-weight: 500;
            color: #495057;
        }

        .indicacao-badge {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-sim {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .badge-nao {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .observacao {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
        }

        .observacao h3 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }

        .observacao-texto {
            color: #495057;
            line-height: 1.6;
            font-size: 14px;
            white-space: pre-line;
        }

        .observacao-ia {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
        }

        .observacao-ia h3 {
            color: #004085;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .observacao-ia-texto {
            color: #004085;
            line-height: 1.6;
            font-size: 14px;
            white-space: pre-line;
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }

        .metadata-item {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }

        .metadata-label {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 5px;
            font-weight: 500;
        }

        .metadata-value {
            font-size: 14px;
            font-weight: 600;
            color: #495057;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                padding: 20px;
                margin: 0;
            }
            
            .print-button {
                display: none;
            }
            
            .nota-total {
                background: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .container {
                padding: 20px;
            }
            
            .participacao-item {
                flex-direction: column;
                gap: 5px;
            }
            
            .participacao-cargo {
                min-width: auto;
                margin-right: 0;
            }
            
            .criterio-header {
                flex-direction: column;
                gap: 10px;
            }
            
            .criterio-nota {
                align-self: flex-start;
            }
            
            .indicacoes-grid {
                grid-template-columns: 1fr;
            }
            
            .metadata {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .titulo-trabalho {
                font-size: 16px;
                padding: 15px;
            }
            
            .nota-total .valor {
                font-size: 36px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <button class="print-button" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
            Imprimir
        </button>

        <div class="header">
            <h1>FICHA DE AVALIAÇÃO</h1>
            <div class="evento-info">${eventoNome}</div>
            <div class="subtitle">Avaliação detalhada do trabalho submetido</div>
            <div class="titulo-trabalho">
                "${tituloTrabalho}"
            </div>
        </div>

        <div class="nota-total">
            <div class="label">NOTA FINAL</div>
            <div class="valor">${avaliacao.notaTotal.toFixed(1)}</div>
        </div>

        <div class="participacoes">
            <h3>PARTICIPAÇÕES</h3>
            ${formatarParticipacoes()}
        </div>

        <div class="criterios">
            ${avaliacao.registros
              .map(
                (registro) => `
                <div class="criterio-item">
                    <div class="criterio-header">
                        <div class="criterio-titulo">${registro.titulo}</div>
                        <div class="criterio-nota">${registro.nota.toFixed(
                          1
                        )}</div>
                    </div>
                    <div class="criterio-descricao">${registro.descricao}</div>
                </div>
            `
              )
              .join("")}
        </div>

        <div class="indicacoes">
            <h3>INDICAÇÕES E PREMIAÇÕES</h3>
            <div class="indicacoes-grid">
                <div class="indicacao-item">
                    <span class="indicacao-label">Menção Honrosa:</span>
                    <span class="indicacao-badge ${
                      avaliacao.mencaoHonrosa ? "badge-sim" : "badge-nao"
                    }">
                        ${avaliacao.mencaoHonrosa ? "SIM" : "NÃO"}
                    </span>
                </div>
                <div class="indicacao-item">
                    <span class="indicacao-label">Indicado a Prêmio:</span>
                    <span class="indicacao-badge ${
                      avaliacao.indicacaoPremio ? "badge-sim" : "badge-nao"
                    }">
                        ${avaliacao.indicacaoPremio ? "SIM" : "NÃO"}
                    </span>
                </div>
            </div>
        </div>

        ${
          avaliacao.observacaoRetornada
            ? `
        <div class="observacao-ia">
            <h3>ANÁLISE DA AVALIAÇÃO</h3>
            <div class="observacao-ia-texto">${avaliacao.observacaoRetornada}</div>
        </div>
        `
            : ""
        }

        <div class="metadata">
            <div class="metadata-item">
                <div class="metadata-label">ID DA AVALIAÇÃO</div>
                <div class="metadata-value">${avaliacao.id}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">DURAÇÃO DA AVALIAÇÃO</div>
                <div class="metadata-value">${avaliacao.duracao} minutos</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">DATA DE EMISSÃO</div>
                <div class="metadata-value">${new Date().toLocaleDateString(
                  "pt-BR"
                )}</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
  };
  // CertificadoEvento.js
  const buscarCertificados = async (tipo, valor) => {
    setLoading(true);
    setError(null);
    setCertificados([]);

    try {
      const response = await getCertificados(eventoId, tipo, valor);

      if (response.status === "success") {
        // Formatar os dados para exibição
        const certificadosFormatados = response.data.flatMap((item) => {
          if (item.viaCodigo) {
            // Certificado buscado por código
            return [
              {
                id: item.id,
                titulo: item.titulo,
                evento: item.evento,
                edicao: item.edicao,
                tipo: item.tipo,
                data: new Date(item.dataEmissao).toLocaleDateString("pt-BR"),
                participantes: item.participantes,
                codigo: item.codigo,
                eventoId: item.eventoId,
                submissaoId: item.submissaoId,
                viaCodigo: true,
              },
            ];
          } else {
            // Submissões buscadas por CPF - criar entradas para cada tipo disponível
            return item.tiposCertificado
              .filter((tipo) => tipo.disponivel)
              .map((tipoCert) => ({
                id: `${item.submissaoId}-${tipoCert.tipo}`,
                titulo: tipoCert.titulo,
                evento: item.evento,
                edicao: item.edicao,
                tipo: tipoCert.tipo,
                data: "Disponível para emissão",
                participantes: [...item.alunos, ...item.orientadores],
                tituloTrabalho: item.tituloTrabalho,
                eventoId: item.eventoId,
                submissaoId: item.submissaoId,
                viaCodigo: false,
              }));
          }
        });

        setCertificados(certificadosFormatados);

        if (certificadosFormatados.length === 0) {
          showError("Nenhum certificado encontrado.");
        }
      } else {
        setError(response.message);
        showError(response.message);
      }
    } catch (error) {
      console.error("Erro ao buscar certificados:", error);
      setError("Erro ao buscar certificados. Tente novamente.");
      showError("Erro ao buscar certificados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificado) => {
    try {
      await generateAndDownloadCertificatePDF(
        eventoId,
        certificado.tipo,
        certificado.submissaoId,
        certificado.viaCodigo ? certificado.codigo : null
      );
      showSuccess("Download iniciado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar certificado:", error);
      showError(error.message);
    }
  };

  useEffect(() => {
    if (cpfValue && cpfValue.length >= 11 && activeTab === "cpf") {
      buscarCertificados("cpf", cpfValue);
    }
  }, [cpfValue, activeTab]);

  useEffect(() => {
    if (codigoValue && codigoValue.length >= 6 && activeTab === "codigo") {
      buscarCertificados("codigo", codigoValue);
    }
  }, [codigoValue, activeTab]);

  return (
    <>
      <Toast ref={toast} position="top-right" />

      <div
        className={`w-100 ${styles.action} `}
        onClick={() => setIsModalOpen(true)}
      >
        <RiAwardFill />
        <h6>Emitir Certificado</h6>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        size="medium"
        showIconClose={true}
      >
        <div className={styles.dialogEventoContent}>
          <h5 className="mb-4">Emitir Certificado</h5>

          <div className="card">
            <div className={styles.contentBox}>
              <div className={styles.tabContainer}>
                <button
                  className={`${styles.tab} ${
                    activeTab === "cpf" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("cpf")}
                >
                  <RiIdCardLine className={styles.tabIcon} />
                  Buscar por CPF
                </button>
                <button
                  className={`${styles.tab} ${
                    activeTab === "codigo" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("codigo")}
                >
                  <RiKeyLine className={styles.tabIcon} />
                  Buscar por Código
                </button>
              </div>

              <div className={styles.content}>
                {activeTab === "cpf" ? (
                  <div className="flex flex-column gap-2">
                    <Input
                      control={control}
                      name="cpf"
                      label="Digite seu CPF"
                      icon={RiIdCardLine}
                      inputType="text"
                      placeholder="Digite seu CPF"
                      mask="999.999.999-99"
                    />
                  </div>
                ) : (
                  <div className="flex flex-column gap-2">
                    <Input
                      control={control}
                      name="codigo"
                      label="Digite o código de verificação"
                      icon={RiKeyLine}
                      inputType="text"
                      placeholder="Digite o código do certificado"
                    />
                    <p className={styles.helpText}>
                      Digite o código de verificação do certificado
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex justify-content-center mt-4">
                    <ProgressSpinner />
                  </div>
                )}

                {certificados.length > 0 && !loading && (
                  <div className="mt-4">
                    <h5 className="mb-3">Certificados disponíveis:</h5>
                    <div className={styles.certificadosList}>
                      {certificados.map((certificado) => (
                        <Card
                          key={certificado.id}
                          className={styles.certificadoCard}
                        >
                          <div className={styles.certificadoInfo}>
                            <h6>{certificado.titulo}</h6>
                            <p className={styles.eventoNome}>
                              {certificado.evento} - Edição {certificado.edicao}
                            </p>
                            {certificado.tituloTrabalho && (
                              <p className={styles.tituloTrabalho}>
                                <strong>Trabalho:</strong>{" "}
                                {certificado.tituloTrabalho}
                              </p>
                            )}
                            <p className={styles.participantes}>
                              <strong>Participantes:</strong>{" "}
                              {certificado.participantes.join(", ")}
                            </p>
                            <div className={styles.certificadoMeta}>
                              <span className={styles.certificadoData}>
                                {certificado.data}
                              </span>
                              {certificado.codigo && (
                                <span className={styles.codigoVerificacao}>
                                  Código: {certificado.codigo}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={styles.certificadoActions}>
                            <button
                              className={styles.downloadButton}
                              onClick={() => handleDownload(certificado)}
                            >
                              Baixar Certificado
                            </button>
                            {/* Botão Ver Ficha de Avaliação */}
                            <button
                              className={styles.avaliacaoButton}
                              onClick={() =>
                                handleVerFichaAvaliacao(certificado)
                              }
                              disabled={loadingAvaliacao[certificado.id]}
                            >
                              {loadingAvaliacao[certificado.id] ? (
                                <>
                                  <ProgressSpinner
                                    style={{ width: "16px", height: "16px" }}
                                  />
                                  Gerando Ficha...
                                </>
                              ) : (
                                <>Ver Ficha de Avaliação</>
                              )}
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {error && !loading && (
                  <div className={styles.errorMessage}>{error}</div>
                )}

                {!loading &&
                  certificados.length === 0 &&
                  (cpfValue.length >= 11 || codigoValue.length >= 6) && (
                    <div className={styles.noResults}>
                      Nenhum certificado encontrado.
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
