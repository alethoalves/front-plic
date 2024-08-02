"use client";
// HOOKS
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiEditLine } from "@remixicon/react";
// COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Actions from "@/components/Actions";
import FormNewInscricao from "@/components/FormNewInscricao";
import Table from "@/components/Table";
import BuscadorBack from "@/components/BuscadorBack";
// FUNÇÕES
import { getEditais } from "@/app/api/client/edital";
import {
  getAllInscricoes,
  getInscricoes,
  searchInscricoes,
} from "@/app/api/clientReq";
import {
  downloadExcel,
  flattenInscricoes,
  flattenedData,
} from "@/lib/geradorExcel";

const Page = ({ params }) => {
  // ESTADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 10, total: 0 });
  const [noResults, setNoResults] = useState(false);

  // ROTEAMENTO
  const router = useRouter();

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setNoResults(false);
    try {
      const fetchedEditais = await getEditais(params.tenant);
      if (fetchedEditais) {
        fetchedEditais.sort((a, b) => b.ano - a.ano);
        setEditais(fetchedEditais);
      }

      const fetchedInscricoes = await getInscricoes(
        params.tenant,
        pageInfo.page,
        pageInfo.limit
      );
      if (fetchedInscricoes) {
        setInscricoes(fetchedInscricoes.inscricoes);
        setPageInfo((prev) => ({ ...prev, total: fetchedInscricoes.total }));
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [params.tenant, pageInfo.page, pageInfo.limit]);

  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, pageInfo.page, pageInfo.limit, fetchInitialData]);

  // BUSCA DE INSCRIÇÕES COM BASE NO TERMO DE BUSCA
  const handleSearch = async (searchTerm) => {
    if (!searchTerm) {
      fetchInitialData();
      return;
    }

    setLoading(true);
    setNoResults(false);
    try {
      const searchResults = await searchInscricoes(params.tenant, searchTerm);
      if (searchResults.length > 0) {
        setInscricoes(searchResults);
        setPageInfo((prev) => ({ ...prev, total: searchResults.length }));
      } else {
        setInscricoes([]);
        setNoResults(true);
      }
    } catch (error) {
      console.error("Erro ao buscar inscrições:", error);
      setInscricoes([]);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (id) => {
    router.push(`/${params.tenant}/gestor/inscricoes/${id}`);
  };
  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      console.log("ENTROU");
      const allInscricoes = await getAllInscricoes(params.tenant);
      console.log(allInscricoes);
      const resultData = flattenedData(allInscricoes.inscricoes);
      console.log(resultData);
      downloadExcel(resultData);
    } catch (error) {
      console.error("Erro ao exportar inscrições:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className={`${styles.icon} mb-2`}>
          <RiEditLine />
        </div>
        <h4>Nova Inscrição</h4>
        <p>Preencha os dados abaixo para iniciar o processo de inscrição.</p>
        <FormNewInscricao data={{ editais }} tenant={params.tenant} />
      </Modal>

      <main className={styles.main}>
        <Actions
          onClickPlus={() => setIsModalOpen(true)}
          onClickExport={handleDownloadExcel}
        />

        <Header
          className="mb-3"
          titulo="Inscrições"
          subtitulo="Inscrições da Iniciação Científica"
          descricao="Aqui você gerencia as inscrições nos editais da Iniciação Científica."
        />

        <div>
          <BuscadorBack onSearch={handleSearch} />
        </div>
        <div className={`${styles.content}`}>
          {loading ? (
            <p>Carregando...</p>
          ) : noResults ? (
            <p>Nenhuma inscrição encontrada.</p>
          ) : (
            <Table
              data={inscricoes}
              pageInfo={pageInfo}
              setPageInfo={setPageInfo}
              onRowClick={handleRowClick}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default Page;
