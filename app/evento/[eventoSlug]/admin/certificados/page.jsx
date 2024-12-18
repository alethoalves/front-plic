"use client";

import styles from "./page.module.scss";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiEditLine, RiImageAddLine, RiMedalLine } from "@remixicon/react";
import Modal from "@/components/Modal";
import {
  getLayoutCertificados,
  uploadAndSaveCertificateImage,
} from "@/app/api/client/certificado";
import Image from "next/image";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoCertificado, setTipoCertificado] = useState(null);
  const [selectedCertificado, setSelectedCertificado] = useState(null);
  const [certificados, setCertificados] = useState([]);
  const [error, setError] = useState(""); // Mensagens de erro
  const [isUploading, setIsUploading] = useState(false); // Estado de upload
  const fileInputRef = useRef(); // Referência para o input de arquivo

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const certificados = await getLayoutCertificados(params.eventoSlug);
        setCertificados(certificados);
        console.log(certificados);
      } catch (error) {
        console.error("Erro ao buscar formulários:", error);
        setError("Erro ao buscar formulários.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.eventoSlug]);

  const openModalAndSetData = (certificado) => {
    setIsModalOpen(true);
    setTipoCertificado(certificado.tipo);
    setSelectedCertificado(certificado);
    setError("");
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setSelectedCertificado(null);
    setError("");
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    console.log("Arquivo selecionado:", selectedFile);

    if (!selectedFile) {
      setError("Nenhum arquivo selecionado.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    console.log("FormData enviado:");
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]); // Deve mostrar: "file: [Object File]"
    }

    setIsUploading(true);
    try {
      const response = await uploadAndSaveCertificateImage(
        params.eventoSlug,
        selectedCertificado.id,
        formData
      );

      console.log("Resposta do servidor:", response);

      // Atualize o certificado na listagem
      const updatedCertificados = certificados.map((cert) =>
        cert.id === selectedCertificado.id
          ? { ...cert, imagemFundo: response.fileUrl }
          : cert
      );
      setCertificados(updatedCertificados);

      // Atualize a imagem de fundo no modal
      setSelectedCertificado((prev) => ({
        ...prev,
        imagemFundo: response.fileUrl,
      }));

      setError(""); // Limpa possíveis erros
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError("Erro ao fazer upload. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDivClick = () => {
    console.log("Clique detectado na div");
    fileInputRef.current.click(); // Simula o clique no input de arquivo
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>{<RiMedalLine />}</div>
      <h4>
        {tipoCertificado === "PARTICIPACAO"
          ? "Participante"
          : tipoCertificado === "EXPOSITOR"
          ? "Apresentador"
          : tipoCertificado === "AVALIADOR"
          ? "Avaliador"
          : tipoCertificado === "PREMIADO"
          ? "Premiado"
          : tipoCertificado === "INDICADO"
          ? "Indicado ao Prêmio"
          : "Menção Honrosa"}
      </h4>
      <div
        className={`${styles.bgCertificado} mt-2`}
        onClick={handleDivClick} // Simula o clique no input ao clicar na div
      >
        <div className={styles.certificadoImg}>
          {selectedCertificado?.imagemFundo ? (
            <Image
              priority
              fill
              src={selectedCertificado.imagemFundo}
              alt={`Certificado ${selectedCertificado.tipo}`}
              sizes="300 500 700"
            />
          ) : (
            <RiImageAddLine />
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef} // Conecta o input ao ref
          style={{ display: "none" }} // Esconde o input
          accept=".jpg,.jpeg,.png,.svg"
          onChange={handleFileChange} // Faz o upload ao selecionar o arquivo
        />
      </div>
      {isUploading && <p className={styles.uploading}>Enviando arquivo...</p>}
      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  );

  return (
    <div className={styles.navContent}>
      {renderModalContent()}
      <div className={styles.certificados}>
        {certificados.map((item) => (
          <div
            key={item.id}
            className={styles.certificado}
            onClick={() => openModalAndSetData(item)}
          >
            <div className={styles.certificadoImg}>
              {item.imagemFundo ? (
                <Image
                  src={item.imagemFundo}
                  alt={`Certificado ${item.tipo}`}
                />
              ) : (
                <RiImageAddLine />
              )}
            </div>
            <div className={styles.descricao}>
              <p>
                {item.tipo === "PARTICIPACAO"
                  ? "Certificado de Participante"
                  : item.tipo === "EXPOSITOR"
                  ? "Certificado de Apresentador"
                  : item.tipo === "AVALIADOR"
                  ? "Certificado de Avaliador"
                  : item.tipo === "PREMIADO"
                  ? "Certificado de Premiado"
                  : item.tipo === "INDICADO"
                  ? "Certificado de Indicado ao Prêmio"
                  : "Certificado de Menção Honrosa"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
