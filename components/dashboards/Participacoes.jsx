"use client";

//HOOKS
import { useState, useEffect } from "react";

//ESTILOS E ÍCONES
import styles from "@/components/dashboards/Participacoes.module.scss";
import { RiGroupLine } from "@remixicon/react";

//COMPONENTES
import Select2 from "@/components/Select2";

//FUNÇÕES
import { inscricoesDashboard } from "@/app/api/client/inscricao";

// Importações necessárias para o gráfico
import { Bar } from "react-chartjs-2";

import BuscadorBack from "../BuscadorBack";
import NoData from "../NoData";
import { getParticipacoes } from "@/app/api/client/participacao";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Participacoes = ({ tenantSlug }) => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [participacoes, setParticipacoes] = useState([]);
  const [searchValue, setSearchValue] = useState(""); // Para armazenar o valor de busca
  // ROTEAMENTO
  const router = useRouter();
  // Função para buscar as inscrições da API
  const fetchInscricoes = async (tenantSlug, searchValue) => {
    setLoading(true);
    try {
      const participacoes = await getParticipacoes(
        tenantSlug,
        null, // ou inscrevaçõesId, caso precise
        null, // tipo, se necessário
        searchValue, // Passando o valor da busca (cpf ou nome)
        searchValue // Passando o valor da busca para o nome (caso esteja usando um campo genérico)
      );
      setParticipacoes(participacoes);
    } catch (error) {
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInscricoes(tenantSlug, searchValue);
  }, [tenantSlug, searchValue]);

  const handleSearch = async (value) => {
    setSearchValue(value); // Atualizando o valor de busca
    fetchInscricoes(tenantSlug, value); // Refaz a busca com o valor atualizado
  };

  return (
    <div className={`${styles.dashboard} `}>
      <div className={styles.head}>
        <div className={styles.left}>
          <div className={styles.icon}>
            <RiGroupLine />
          </div>
          <div className={styles.title}>
            <h5>Participações</h5>
          </div>
        </div>
      </div>

      <div className={styles.buscador}>
        <BuscadorBack onSearch={handleSearch} />
      </div>
      <div className={styles.content}>
        <div className={styles.lista}>
          {participacoes && searchValue && (
            <>
              {participacoes.map((participacao) => (
                <Link
                  key={participacao.id}
                  href={`/${tenantSlug}/gestor/inscricoes/${
                    participacao.inscricao.id
                  }${
                    participacao.tipo === "aluno" ? "/planos" : "/orientadores"
                  }`}
                >
                  <div className={styles.itemLista}>
                    <div className={`${styles.infos}`}>
                      <div
                        className={`${styles.status} ${
                          participacao.status === "ativo"
                            ? styles.green
                            : styles.light
                        }`}
                      >
                        <p>{participacao.status}</p>
                      </div>
                      <div className={`${styles.status} ${styles.light}`}>
                        <p>{participacao.tipo}</p>
                      </div>
                    </div>
                    <h6>{participacao.user.nome}</h6>
                    <p>
                      CPF: <strong>{participacao.user.cpf}</strong>
                    </p>
                    <p>
                      Plano de Trabalho:{" "}
                      <strong>{participacao.planodeTrabalho.titulo}</strong>
                    </p>
                    <p>
                      ANO: <strong>{participacao.inscricao.edital.ano}</strong>{" "}
                      | EDITAL:{" "}
                      <strong>{participacao.inscricao.edital.titulo}</strong>
                    </p>
                  </div>
                </Link>
              ))}
            </>
          )}
          {searchValue && participacoes.length === 0 && (
            <div className="mb-3">
              <NoData />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Participacoes;
