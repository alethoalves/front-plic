"use client";

// HOOKS
import { useState, useEffect } from "react";

// ESTILOS E ÍCONES
import styles from "@/components/dashboards/Atividades.module.scss";
import {
  RiBarChart2Fill,
  RiDashboardLine,
  RiFilter2Fill,
  RiListCheck2,
  RiListOrdered2,
  RiMenuSearchFill,
  RiMenuSearchLine,
} from "@remixicon/react";

// COMPONENTES
import Select2 from "@/components/Select2";
import BuscadorBack from "../BuscadorBack";

// FUNÇÕES
import Link from "next/link";
import { registroAtividadesDashboard } from "@/app/api/client/registroAtividade";

const Inscricoes = ({ tenantSlug }) => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Novos estados para anos, títulos e dados do gráfico
  const [listAnos, setListAnos] = useState([]);
  const [listEditais, setListEditais] = useState([]);
  const [listAtividades, setListAtividades] = useState([]);
  const [editalAno, setEditalAno] = useState("");
  const [editalTitulo, setEditalTitulo] = useState("");
  const [idFormularioAtividade, setIdFormularioAtividade] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusAtividade, setStatusAtividade] = useState("");

  // Função para buscar as atividades da API
  const fetchAtividades = async (
    tenantSlug,
    searchValue,
    statusAtividade,
    editalAno,
    editalTitulo,
    idFormularioAtividade
  ) => {
    setLoading(true);
    try {
      const data = await registroAtividadesDashboard(tenantSlug, {
        searchValue,
        statusAtividade,
        editalAno,
        editalTitulo,
        idFormularioAtividade,
      });

      // Atualiza os estados com os dados retornados da API
      setListAnos(data.info.anoEditalUnico);
      setListEditais(data.info.tituloEditalUnico);
      setListAtividades(data.info.formularioUnico);
    } catch (error) {
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtividades(tenantSlug);
  }, [tenantSlug]);

  // Chamando a API sempre que os filtros mudarem
  useEffect(() => {
    fetchAtividades(
      tenantSlug,
      searchValue || null,
      statusAtividade || null,
      editalAno || null,
      editalTitulo || null,
      idFormularioAtividade || null
    ); // Passa valores nulos se os filtros estiverem vazios
  }, [
    statusAtividade,
    editalAno,
    editalTitulo,
    idFormularioAtividade,
    searchValue,
    tenantSlug, //ALTEREI AQUI
  ]);

  // Função chamada quando os filtros são alterados
  const handleFilterChange = (filtro, valor) => {
    if (filtro === "editalAno") setEditalAno(valor || "");
    if (filtro === "editalTitulo") setEditalTitulo(valor || "");
    if (filtro === "idFormularioAtividade")
      setIdFormularioAtividade(valor || "");
    if (filtro === "searchValue") setSearchValue(valor || "");
    if (filtro === "statusAtividade") setStatusAtividade(valor || "");
  };

  return (
    <div className={`${styles.dashboard} `}>
      <div className={styles.head}>
        <div className={styles.left}>
          <div className={styles.icon}>
            <RiListCheck2 />
          </div>
          <div className={styles.title}>
            <h5>Atividades</h5>
          </div>
        </div>
        <div className={styles.actions}>
          <div
            className={`${styles.btn} ${showFilters ? styles.selected : ""}`}
            onClick={() => {
              setShowFilters(!showFilters);
            }}
          >
            <RiFilter2Fill />
          </div>
        </div>
      </div>

      {showFilters && (
        <>
          <div className={styles.filters}>
            <div className={styles.filter}>
              <Select2
                label="Selecione um ano"
                options={listAnos.map((ano) => ({
                  label: ano.toString(),
                  value: ano,
                }))}
                extendedOpt={true}
                onChange={(value) => handleFilterChange("editalAno", value)}
              />
            </div>

            <div className={styles.filter}>
              <Select2
                label="Selecione uma atividade"
                options={listAtividades.map((atividade) => ({
                  label: atividade.titulo,
                  value: atividade.id,
                }))}
                onChange={(value) =>
                  handleFilterChange("idFormularioAtividade", value)
                }
              />
            </div>
          </div>
        </>
      )}

      <div className={styles.content}>
        <div className={styles.barras}>
          {listAtividades.map(
            (atividade) =>
              atividade.totalConcluido + atividade.totalNaoEntregue != 0 && (
                <div className={styles.contentBarra} key={atividade.id}>
                  <div className={styles.labelBarra}>
                    <h6>{atividade.titulo}</h6>
                  </div>
                  <div className={styles.barra}>
                    <div
                      className={styles.left}
                      style={{ width: `${atividade.porcentagemConcluido}%` }}
                    >
                      <div className={styles.porcentagem}>
                        <p>{`${atividade.porcentagemConcluido}% entregues - faltam ${atividade.totalNaoEntregue}`}</p>
                      </div>
                    </div>
                    <div
                      className={styles.right}
                      onClick={() =>
                        handleFilterChange("statusAtividade", "naoEntregue")
                      }
                    ></div>
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};

export default Inscricoes;
