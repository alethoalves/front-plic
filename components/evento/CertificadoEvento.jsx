"use client";
import {
  RiAwardFill,
  RiCouponLine,
  RiIdCardLine,
  RiKeyLine,
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

export const CertificadoEvento = ({ params, eventoId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cpf"); // 'cpf' ou 'codigo'
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // CertificadoEvento.js
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
