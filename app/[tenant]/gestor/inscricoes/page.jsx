"use client";
// HOOKS
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiEditLine, RiExternalLinkLine, RiEyeLine } from "@remixicon/react";
// COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Actions from "@/components/Actions";
import FormNewInscricao from "@/components/Formularios/FormNewInscricao";
import Table from "@/components/Table";
import BuscadorBack from "@/components/BuscadorBack";
// FUNÇÕES
import { getEditais } from "@/app/api/client/edital";
import {
  getAllInscricoes,
  getInscricoes,
  searchInscricoes,
} from "@/app/api/client/inscricao";
import {
  downloadExcel,
  flattenInscricoes,
  flattenedData,
  processApiResponse,
} from "@/lib/geradorExcel";
import Button from "@/components/Button";
import Image from "next/image";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  // ESTADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsData, setDetailsData] = useState([]);
  const [editais, setEditais] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 10, total: 0 });
  const [noResults, setNoResults] = useState(false);

  // ROTEAMENTO
  const router = useRouter();

  // BUSCA DE DADOS INICIAIS
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
  const handleSearch = async (search) => {
    if (!search) {
      fetchInitialData();
      return;
    }

    setLoading(true);
    setNoResults(false);
    try {
      const searchResults = await await getInscricoes(
        params.tenant,
        pageInfo.page,
        pageInfo.limit,
        search
      );

      if (searchResults.inscricoes.length > 0) {
        setInscricoes(searchResults.inscricoes);
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
      const resultData = processApiResponse(allInscricoes);
      console.log(resultData);
      downloadExcel(resultData);
    } catch (error) {
      console.error("Erro ao exportar inscrições:", error);
    } finally {
      setLoading(false);
    }
  };

  // Controladores de modais
  const openModalAndSetData = () => {
    setIsModalOpen(true);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
  };

  const openDetailsModal = (data) => {
    setDetailsData(data);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setDetailsData([]);
  };

  // Renderização do conteúdo do modal de criação/edição
  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>Nova Inscrição</h4>
      <p>Preencha os dados abaixo para iniciar o processo de inscrição.</p>
      <FormNewInscricao data={{ editais }} tenant={params.tenant} />
    </Modal>
  );

  // Renderização do conteúdo do modal de detalhes
  const renderDetailsModalContent = () => {
    const { title, data = [], idInscricao, type } = detailsData;
    const navigateTo = title?.includes("Orientador")
      ? "orientadores"
      : title?.includes("Plano")
      ? "planos"
      : title?.includes("Aluno")
      ? "alunos"
      : "";
    return (
      <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal}>
        <div className={styles.modalTable}>
          <h4>{title}</h4>
          {data.length > 0 ? (
            <>
              {data.map((item) => (
                <div className={styles.campo} key={item.id}>
                  <div className={styles.left}>
                    {type != "plano" && (
                      <div
                        className={`${styles.status} 
                        ${item.status === "incompleto" && styles.incompleto}
                        ${
                          (item.status === "ativo" ||
                            item.status === "completo") &&
                          styles.ativo
                        }
                        ${item.status === "inativo" && styles.inativo}
                        `}
                      >
                        <p className={styles[item.status?.toLowerCase()]}>
                          {item.status === "ativo" &&
                            `${item.status} desde ${item.inicio}`}
                          {item.status != "ativo" &&
                            ` participou de ${item.inicio} a ${item.fim}`}
                        </p>
                      </div>
                    )}
                    <div className={styles.label}>
                      <h6>
                        {item.nome_orientador || item.nome_aluno || item.titulo}
                      </h6>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <div className={styles.btn2}>
                      <Button
                        onClick={() => {
                          router.push(
                            `/${params.tenant}/gestor/inscricoes/${idInscricao}/${navigateTo}`
                          );
                        }}
                        icon={RiExternalLinkLine}
                        className="btn-secondary"
                        type="button"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p>Nada encontrado :/</p>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <>
      {renderModalContent()}
      {renderDetailsModalContent()}

      <main className={styles.main}>
        <Actions
          onClickPlus={openModalAndSetData}
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
          {inscricoes[0] ? (
            <Table
              data={inscricoes}
              pageInfo={pageInfo}
              setPageInfo={setPageInfo}
            >
              <thead>
                <tr>
                  <th>
                    <p>nº</p>
                  </th>
                  <th>
                    <p>Iscricão no edital</p>
                  </th>
                  <th>
                    <p>Status da inscrição</p>
                  </th>
                  <th>
                    <p>Orientadores Ativos</p>
                  </th>
                  <th>
                    <p>Orientadores Inativos</p>
                  </th>
                  <th>
                    <p>Alunos Ativos</p>
                  </th>
                  <th>
                    <p>Alunos Inativos</p>
                  </th>
                  <th>
                    <p>Planos de Trabalho</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p
                        className="link"
                        onClick={() => {
                          router.push(
                            `/${params.tenant}/gestor/inscricoes/${item.id}`
                          );
                        }}
                      >
                        {item.id}
                        <RiExternalLinkLine />
                      </p>
                    </td>
                    <td>
                      <p>{item.editalNome}</p>
                    </td>
                    <td>
                      <p
                        className={`status ${
                          item.status === "incompleta" ? "warning" : "green"
                        }`}
                      >
                        {item.status}
                      </p>
                    </td>
                    <td>
                      <p
                        className="status white link"
                        onClick={() => {
                          openDetailsModal({
                            title: "Orientadores ativos",
                            data: item.orientadoresAtivos,
                            idInscricao: item.id,
                            type: "",
                          });
                        }}
                      >
                        {item.totalOrientadoresAtivos}
                      </p>
                    </td>
                    <td>
                      <p
                        className="status white link"
                        onClick={() => {
                          openDetailsModal({
                            title: "Orientadores inativos",
                            data: item.orientadoresInativos,
                            idInscricao: item.id,
                            type: "",
                          });
                        }}
                      >
                        {item.totalOrientadoresInativos}
                      </p>
                    </td>
                    <td>
                      <p
                        className="status white link"
                        onClick={() => {
                          openDetailsModal({
                            title: "Alunos ativos",
                            data: item.alunosAtivos,
                            idInscricao: item.id,
                            type: "",
                          });
                        }}
                      >
                        {item.totalAlunosAtivos}
                      </p>
                    </td>
                    <td>
                      <p
                        className="status white link"
                        onClick={() => {
                          openDetailsModal({
                            title: "Alunos inativos",
                            data: item.alunosInativos,
                            idInscricao: item.id,
                            type: "",
                          });
                        }}
                      >
                        {item.totalAlunosInativos}
                      </p>
                    </td>
                    <td>
                      <p
                        className="status white link"
                        onClick={() => {
                          openDetailsModal({
                            title: "Planos de Trabalho",
                            data: item.planosDeTrabalho,
                            idInscricao: item.id,
                            type: "plano",
                          });
                        }}
                      >
                        {item.planosDeTrabalho?.length}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <NoData />
          )}
        </div>
      </main>
    </>
  );
};

export default Page;
