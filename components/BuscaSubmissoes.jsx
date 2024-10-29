"use client";
import Button from "@/components/Button";

import {
  RiAddLine,
  RiFileExcelLine,
  RiMedalLine,
  RiShieldStarFill,
  RiStarLine,
} from "@remixicon/react";
import styles from "./BuscaSubmissoes.module.scss";
import BuscadorBack from "./BuscadorBack";
import { useState, useEffect } from "react";
import { getSubmissoesFiltered } from "@/app/api/client/submissao";
import { formatarData, formatarHora } from "@/lib/formatarDatas";

const BuscaSubmissoes = ({ idEvento }) => {
  const [submissoes, setSubmissoes] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  // Função para buscar submissões com o filtro de pesquisa
  const fetchSubmissoes = async () => {
    try {
      setLoading(true);
      const result = await getSubmissoesFiltered(idEvento, searchValue);
      setSubmissoes(result || []); // Atualiza as submissões com o resultado da busca
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
    } finally {
      setLoading(false);
    }
  };

  // Chama a busca quando o valor de searchValue é alterado
  useEffect(() => {
    fetchSubmissoes();
  }, [searchValue]);

  return (
    <div>
      <div className={styles.buscador}>
        <BuscadorBack onSearch={(value) => setSearchValue(value)} />
      </div>
      {loading && <p className="mt-2">Carregando...</p>}
      {submissoes && submissoes.length > 0 && (
        <div className={styles.squares}>
          {submissoes.length > 0 &&
            submissoes.map((item, index) => (
              <div key={item.id} className={styles.square}>
                {item.indicacaoPremio ||
                  item.mencaoHonrosa ||
                  (item.premio && (
                    <div className={styles.premios}>
                      {item.premio && (
                        <div className={`${styles.squareHeader} `}>
                          <RiShieldStarFill />
                          <p>Premiado</p>
                        </div>
                      )}
                      {item.indicacaoPremio && (
                        <div className={`${styles.squareHeader} `}>
                          <RiMedalLine />
                          <p>Indicado ao Prêmio</p>
                        </div>
                      )}
                      {item.premio && (
                        <div className={`${styles.squareHeader} `}>
                          <RiStarLine />
                          <p>Menção Honrosa</p>
                        </div>
                      )}
                    </div>
                  ))}
                <div className={styles.squareContent}>
                  <div className={styles.info}>
                    <p
                      className={`${styles.status} ${
                        item.status === "DISTRIBUIDA"
                          ? styles.error
                          : item.status === "AGUARDANDO_AVALIACAO"
                          ? styles.warning
                          : item.status === "AVALIADA"
                          ? styles.success
                          : item.status === "AUSENTE"
                          ? styles.inativada
                          : styles.success
                      }`}
                    >
                      {item.status === "DISTRIBUIDA"
                        ? "checkin pendente"
                        : item.status === "AGUARDANDO_AVALIACAO"
                        ? "aguardando avaliação"
                        : item.status === "AVALIADA"
                        ? "avaliação concluída"
                        : item.status === "AUSENTE"
                        ? "ausente"
                        : item.status}
                    </p>
                    <p className={styles.area}>
                      {item.planoDeTrabalho?.area?.area
                        ? item.planoDeTrabalho?.area?.area
                        : "sem área"}{" "}
                      -{" "}
                      {item.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}
                      -{" "}
                      {item.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{item.planoDeTrabalho?.titulo}</h6>
                    <p className={styles.participacoes}>
                      <strong>Orientadores: </strong>
                      {item.planoDeTrabalho?.inscricao.participacoes
                        .filter(
                          (item) =>
                            item.tipo === "orientador" ||
                            item.tipo === "coorientador"
                        )
                        .map(
                          (item, i) =>
                            `${i > 0 ? ", " : ""}${item.user.nome} (${
                              item.status
                            })`
                        )}
                    </p>
                    <p className={styles.participacoes}>
                      <strong>Alunos: </strong>
                      {item.planoDeTrabalho?.participacoes.map(
                        (item, i) =>
                          `${i > 0 ? ", " : ""}${item.user.nome} (${
                            item.status
                          })`
                      )}
                    </p>
                  </div>
                </div>
                <div className={styles.informacoes}>
                  <div className={styles.squareHeader}>
                    <p>Dia</p>
                    <p>
                      <strong>{formatarData(item.subsessao.inicio)}</strong>
                    </p>
                    <p>{item.subsessao.sessaoApresentacao.titulo}</p>
                  </div>
                  <div className={styles.squareHeader}>
                    <p>Horário</p>
                    <p>
                      <strong>{formatarHora(item.subsessao.inicio)}</strong>
                    </p>
                  </div>
                  {item.square.map((squareItem) => (
                    <div key={squareItem.id} className={styles.squareHeader}>
                      <p>Pôster nº</p>
                      <h6>{squareItem.numero}</h6>
                    </div>
                  ))}
                  {item.square.length == 0 && (
                    <div className={styles.squareHeader}>
                      <p>Pôster nº</p>
                      <h6>-</h6>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default BuscaSubmissoes;
