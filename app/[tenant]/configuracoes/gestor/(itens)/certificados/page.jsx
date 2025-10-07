"use client";
//HOOKS
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

//ESTILO E ÍCONES
import styles from "./page.module.scss";
import {
  RiAddCircleLine,
  RiEditLine,
  RiImageAddLine,
  RiMedalLine,
} from "@remixicon/react";

//COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import BuscadorFront from "@/components/BuscadorFront";
import Card from "@/components/Card";
import ModalDelete from "@/components/ModalDelete";
import Skeleton from "@/components/Skeleton";

//FUNÇÕES
import { deleteFormulario, getFormularios } from "@/app/api/client/formulario";

import NoData from "@/components/NoData";
import Image from "next/image";
import {
  getLayoutCertificados,
  uploadAndSaveCertificateImagePlano,
  // Vamos assumir que precisa de uma função específica para upload de imagem
  uploadCertificateImage, // Esta função precisa ser criada na API
} from "@/app/api/client/certificadoPlanoDeTrabalho";

const Page = ({ params }) => {
  //ESTADOS
  //de busca,loading ou erro
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  //do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  //de armazenamento de dados
  const [certificados, setCertificados] = useState([]);
  const [selectedCertificado, setSelectedCertificado] = useState(null);
  const [tipoCertificado, setTipoCertificado] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newCertificadoTipo, setNewCertificadoTipo] = useState("PARTICIPACAO");
  const [isCreating, setIsCreating] = useState(false);

  //REF
  const fileInputRef = useRef();

  //ROTEAMENTO
  const router = useRouter();

  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const certificadosData = await getLayoutCertificados(params.tenant);
        setCertificados(certificadosData || []);
      } catch (error) {
        console.error("Erro ao buscar certificados:", error);
        setError("Erro ao buscar certificados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  //FUNÇÕES DO MODAL
  const openModalAndSetData = (certificado) => {
    setIsModalOpen(true);
    setTipoCertificado(certificado.tipo);
    setSelectedCertificado(certificado);
    setError("");
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setSelectedCertificado(null);
    setTipoCertificado(null);
    setError("");
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setNewCertificadoTipo("PARTICIPACAO");
    setError("");
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewCertificadoTipo("PARTICIPACAO");
    setError("");
  };

  //FUNÇÕES DE CRIAÇÃO DE NOVO CERTIFICADO
  const handleCreateCertificado = async () => {
    if (!newCertificadoTipo) {
      setError("Selecione um tipo de certificado.");
      return;
    }

    setIsCreating(true);
    try {
      const novoCertificado = await uploadAndSaveCertificateImagePlano(
        params.tenant,
        newCertificadoTipo
      );

      // Adiciona o novo certificado à lista
      setCertificados((prev) => [...prev, novoCertificado]);

      setError("");
      closeCreateModal();

      // Opcional: Abrir o modal de edição do novo certificado
      setTimeout(() => {
        openModalAndSetData(novoCertificado);
      }, 500);
    } catch (err) {
      console.error("Erro ao criar certificado:", err);
      setError("Erro ao criar certificado. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  //FUNÇÕES DE UPLOAD DE IMAGEM (CORRIGIDA)
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      setError("Nenhum arquivo selecionado.");
      return;
    }

    // Validação básica do tipo de arquivo
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Tipo de arquivo não permitido. Use JPG, PNG ou SVG.");
      return;
    }

    // Validação do tamanho do arquivo (opcional - 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Tamanho máximo: 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    try {
      // CHAMADA CORRETA PARA UPLOAD DE IMAGEM
      // Você precisa criar esta função na sua API
      const response = await uploadAndSaveCertificateImagePlano(
        params.tenant,
        selectedCertificado.id,
        formData
      );

      // Atualiza a lista de certificados
      const updatedCertificados = certificados.map((cert) =>
        cert.id === selectedCertificado.id
          ? {
              ...cert,
              imagemFundo:
                response.fileUrl || response.imageUrl || response.url,
            }
          : cert
      );
      setCertificados(updatedCertificados);

      // Atualiza o certificado selecionado no modal
      setSelectedCertificado((prev) => ({
        ...prev,
        imagemFundo: response.fileUrl || response.imageUrl || response.url,
      }));

      setError("");

      // Limpa o input file para permitir novo upload do mesmo arquivo
      event.target.value = "";
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      setError(err.message || "Erro ao fazer upload. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  //OPÇÕES DE TIPOS DE CERTIFICADO
  const tipoCertificadoOptions = [
    { value: "CONCLUSAO", label: "Certificado de Conclusão" },
    { value: "AVALIADOR", label: "Certificado de Avaliador" },
  ];

  //RENDERIZAÇÃO DO MODAL DE EDIÇÃO
  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiMedalLine />
      </div>
      <h4>{tipoCertificado === "CONCLUSAO" ? "Conclusão" : "Avaliador"}</h4>

      <div className={`${styles.bgCertificado} mt-2`} onClick={handleDivClick}>
        <div className={styles.certificadoImg}>
          {selectedCertificado?.imagemFundo ? (
            <Image
              priority
              fill
              src={selectedCertificado.imagemFundo}
              alt={`Certificado ${selectedCertificado.tipo}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div className={styles.uploadArea}>
              <RiImageAddLine size={48} />
              <p>Clique para adicionar imagem de fundo</p>
              <span>Formatos: JPG, PNG, SVG (Máx: 5MB)</span>
            </div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png,.svg"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      {isUploading && (
        <div className={styles.uploading}>
          <p>Enviando arquivo...</p>
          <div className={styles.loadingBar}></div>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.uploadInstructions}>
        <p>
          <strong>Instruções:</strong>
        </p>
        <ul>
          <li>Clique na área acima para selecionar uma imagem</li>
          <li>Formatos suportados: JPG, PNG, SVG</li>
          <li>Tamanho máximo: 5MB</li>
          <li>Recomendado: imagem com resolução mínima de 1200x800 pixels</li>
        </ul>
      </div>
    </Modal>
  );

  //RENDERIZAÇÃO DO MODAL DE CRIAÇÃO
  const renderCreateModalContent = () => (
    <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
      <div className={styles.modalHeader}>
        <div className={styles.icon}>
          <RiAddCircleLine />
        </div>
        <h4>Novo Layout de Certificado</h4>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="tipoCertificado" className={styles.label}>
          Tipo de Certificado *
        </label>
        <select
          id="tipoCertificado"
          value={newCertificadoTipo}
          onChange={(e) => setNewCertificadoTipo(e.target.value)}
          className={styles.select}
          required
        >
          <option value="">Selecione um tipo</option>
          {tipoCertificadoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.modalActions}>
        <button
          onClick={closeCreateModal}
          className={styles.btnSecondary}
          disabled={isCreating}
        >
          Cancelar
        </button>
        <button
          onClick={handleCreateCertificado}
          className={styles.btnPrimary}
          disabled={isCreating || !newCertificadoTipo}
        >
          {isCreating ? "Criando..." : "Criar Certificado"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  );

  //FILTRAR CERTIFICADOS BASEADO NA BUSCA
  const filteredCertificados = certificados.filter((certificado) => {
    const tipoTexto =
      certificado.tipo === "PARTICIPACAO"
        ? "participante"
        : certificado.tipo === "EXPOSITOR"
        ? "apresentador"
        : certificado.tipo === "AVALIADOR"
        ? "avaliador"
        : certificado.tipo === "PREMIADO"
        ? "premiado"
        : certificado.tipo === "INDICADO"
        ? "indicado"
        : "menção honrosa";

    return tipoTexto.toLowerCase().includes(searchTerm.toLowerCase());
  });

  //RENDERIZAÇÃO DOS CARDS DE CERTIFICADOS
  const renderCertificados = () => {
    if (loading) {
      return (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} height="250px" borderRadius="12px" />
          ))}
        </div>
      );
    }

    return (
      <div className={styles.certificados}>
        {/* Card para adicionar novo certificado */}
        {false && (
          <div className={styles.certificadoAdd} onClick={openCreateModal}>
            <div className={styles.addIcon}>
              <RiAddCircleLine />
            </div>
            <div className={styles.descricao}>
              <p>Novo Layout de Certificado</p>
            </div>
          </div>
        )}

        {/* Lista de certificados existentes */}
        {filteredCertificados.map((item) => (
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
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <div className={styles.placeholder}>
                  <RiImageAddLine />
                  <span>Adicionar imagem</span>
                </div>
              )}
            </div>
            <div className={styles.descricao}>
              <p>
                {item.tipo === "CONCLUSAO"
                  ? "Certificado de Conclusão"
                  : item.tipo === "AVALIADOR"}
              </p>
              <span className={styles.status}>
                {item.imagemFundo ? "Imagem adicionada" : "Sem imagem"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <main>
        <Header
          className="mb-3"
          titulo="Certificados e Declarações"
          subtitulo="Crie e edite os certificados e declarações da sua instituição"
        />

        <div className={styles.navContent}>
          {renderModalContent()}
          {renderCreateModalContent()}

          {/* Lista de Certificados */}
          {renderCertificados()}

          {/* Mensagem de erro geral */}
          {error && !isModalOpen && !isCreateModalOpen && (
            <div className={styles.error}>{error}</div>
          )}
        </div>
      </main>
    </>
  );
};

export default Page;
