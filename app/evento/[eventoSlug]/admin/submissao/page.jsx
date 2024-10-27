"use client";
import {
  RiCalendarLine,
  RiGroupLine,
  RiSurveyLine,
  RiTimeLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessaoById, getSessoesBySlug } from "@/app/api/client/sessoes";
import Link from "next/link";
import BuscadorBack from "@/components/BuscadorBack";
import Header from "@/components/Header";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState(null);
  const [sessoes, setSessoes] = useState(null);

  // ROTEAMENTO
  const router = useRouter();
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sessoes = await getSessoesBySlug(params.eventoSlug);
        setSessoes(sessoes);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  // Função para formatar data
  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar hora
  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);
    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");
    return `${horas}h${minutos}`;
  };
  // Função para lidar com a busca
  const handleSearch = async (value) => {
    setSearchValue(value); // Atualiza o valor de busca

    // Cria os filtros com o valor de busca aplicado a nome, cpf, e título
    const filters = {
      nome: value,
      cpf: value,
      titulo: value,
    };

    // Refaz a busca com os filtros aplicados
    fetchData(params.eventoSlug, params.idSubsessao, filters);
  };
  return (
    <>
      <main className={styles.main}>
        <Header
          className="mb-3"
          //titulo="Submissões"
          subtitulo="Submissões de trabalhos"
          //descricao="Aqui você gerencia as submissões nos editais da Iniciação Científica."
        />
        <div className={`${styles.buscador} mb-2`}>
          <BuscadorBack onSearch={handleSearch} />
          {loading && <p className="mt-2">Carregando...</p>}{" "}
          {/* Exibe o indicador de carregamento dentro do modal */}
        </div>
        {!loading && (
          <div className={styles.squares}>
            <div
              className={styles.square}
              onClick={() => alocarSubmissao(item)}
            >
              <div className={styles.squareContent}>
                <div className={styles.info}>
                  <p className={styles.status}>Aguardando avaliação</p>
                  <p className={styles.area}>Fisioterapia</p>
                </div>
                <div className={styles.submissaoData}>
                  <h6>A lutas das mulheres pretas periféricas e inférteis</h6>
                  <p className={styles.participacoes}>
                    <strong>Orientadores: </strong>
                    Aletho Alves
                  </p>
                  <p className={styles.participacoes}>
                    <strong>Alunos: </strong>
                    Botswana
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Page;
