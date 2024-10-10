"use client";

import styles from "./page.module.scss";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import {
  getRegistroAtividadesByCPF,
  getRegistroAtividadesByCpfEditaisVigentes,
} from "@/app/api/client/registroAtividade";

import {
  getEventosByTenant,
  startSubmissaoEvento,
} from "@/app/api/client/eventos";
import Select2 from "@/components/Select2";
import NoData from "@/components/NoData";
import Image from "next/image";
import {
  RiCalendarLine,
  RiCouponLine,
  RiFlaskLine,
  RiMapPinLine,
  RiMicroscopeLine,
} from "@remixicon/react";
import SearchableSelect from "@/components/SearchableSelect";
import SearchableSelect2 from "@/components/SearchableSelect2";
import { getAreas } from "@/app/api/client/area";

const Page = ({ params }) => {
  // Estados para gerenciamento do componente
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEventoOpen, setIsModalEventoOpen] = useState(false);

  const [error, setError] = useState(null);

  const [
    registroAtividadesEditaisVigentes,
    setRegistrosAtividadesEditaisVigentes,
  ] = useState(null);
  const [tela, setTela] = useState(0);
  const [eventos, setEventos] = useState([]);
  const [planosDeTrabalho, setPlanosDeTrabalho] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [sessaoSelecionada, setSessaoSelecionada] = useState(null);
  const [selectedSessaoPorPlano, setSelectedSessaoPorPlano] = useState({});
  const [submissao, setSubmissao] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);

  // ROTEAMENTO
  const router = useRouter();
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getRegistroAtividadesByCpfEditaisVigentes(
          params.tenant
        );
        const eventos = await getEventosByTenant(params.tenant);

        setEventos(eventos);
        setPlanosDeTrabalho(transformData(response));

        setRegistrosAtividadesEditaisVigentes(
          response.sort(
            (a, b) =>
              new Date(a.atividade.dataInicio) -
              new Date(b.atividade.dataInicio)
          )
        );
        const areas = await getAreas(params.tenant);
        setAreas(transformedArray(areas));
        setItens(response);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, isModalOpen]);
  const transformedArray = (items) => {
    const data = items?.flatMap((item) => {
      // Criar um array inicial com a área principal
      const result = [{ value: item.id, label: item.area }];

      // Adicionar subáreas, se houver
      const subareaResults = item.subareas.map((subarea) => ({
        value: item.id,
        label: `${item.area} - ${subarea.subarea}`,
      }));

      // Concatenar o array da área principal com as subáreas
      return result.concat(subareaResults);
    });

    // Organizar por `value` crescente e depois por `label`
    return data.sort((a, b) => {
      // Primeiro, organizar por `value` crescente
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;

      // Se os `values` forem iguais, organizar por `label`
      return a.label.localeCompare(b.label);
    });
  };
  const transformData = (data) => {
    const uniqueItems = {};

    data.forEach((item) => {
      const planoId = item.planoDeTrabalho.id;
      if (!uniqueItems[planoId]) {
        uniqueItems[planoId] = {
          id: planoId,
          titulo: item.planoDeTrabalho.titulo,
          edital: item.planoDeTrabalho.inscricao.edital.titulo,
          anoEdital: item.planoDeTrabalho.inscricao.edital.ano,
          item,
        };
      }
    });

    return Object.values(uniqueItems);
  };

  const formatarData = (dataIso) => {
    const data = new Date(dataIso);

    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();

    return `${dia}/${mes}/${ano}`;
  };
  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);

    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");

    return `${horas}h${minutos}`;
  };

  const closeModalAndResetDataModalEvento = async () => {
    setIsModalEventoOpen(false);
    setTela(0);
    setEventoSelecionado(null);
    setSessaoSelecionada(null);
    setLoading(false);
    setError(null);
    setSelectedSessaoPorPlano({});
    setLoading(true);
    try {
      const response = await getRegistroAtividadesByCpfEditaisVigentes(
        params.tenant
      );
      setPlanosDeTrabalho(transformData(response));
      setRegistrosAtividadesEditaisVigentes(
        response.sort(
          (a, b) =>
            new Date(a.atividade.dataInicio) - new Date(b.atividade.dataInicio)
        )
      );
      setItens(response);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSessaoChange = (planoId, selectedAreaId) => {
    const selectedSessao = eventoSelecionado?.evento?.sessao.find((sessao) =>
      sessao.sessaoArea.find((item) => item.areaId === selectedAreaId)
    );
    setSelectedSessaoPorPlano((prev) => ({
      ...prev,
      [planoId]: selectedSessao,
    }));
  };
  // Renderiza o conteúdo do modal
  const renderModalEventoContent = () => {
    let planosSemSubmissao = [];
    if (eventoSelecionado) {
      planosSemSubmissao = planosDeTrabalho.filter((plano) => {
        return !plano.item.planoDeTrabalho.submissao.some(
          (submissao) => submissao.eventoId === eventoSelecionado.eventoId
        );
      });
    }

    return (
      <Modal
        isOpen={isModalEventoOpen}
        onClose={closeModalAndResetDataModalEvento}
        noPadding={true}
      >
        <div className={styles.modal}>
          {tela === 0 && planosSemSubmissao?.length > 0 && (
            <>
              <div className={styles.modalHeader}>
                <h5>
                  {`Você tem ${planosSemSubmissao.length} projeto${
                    planosSemSubmissao.length > 1 ? "s" : ""
                  } que pode${planosSemSubmissao.length > 1 ? "m" : ""}
              ser inscrito${
                planosSemSubmissao.length > 1 ? "s" : ""
              } neste evento.`}
                </h5>
                <p className="mt-2">
                  <strong>Passo 1: </strong>Identifique a área do projeto
                </p>
                <p>
                  <strong>Passo 2: </strong>Inscreva o projeto no turno de sua
                  preferência
                </p>
              </div>

              {planosSemSubmissao.map((plano) => {
                const idPlano = plano.id;
                const sessaoSelecionada = selectedSessaoPorPlano[idPlano];

                return (
                  <div
                    key={idPlano}
                    className={`mt-2 ${styles.boxButton}  ${styles.margin}`}
                  >
                    <div>
                      <p className="mb-2">TÍTULO DO PROJETO:</p>
                      <h6 className="mb-2">{plano.titulo}</h6>
                      <SearchableSelect2
                        className="mb-2"
                        name="areaId"
                        label="Selecione a área de Conhecimento"
                        options={areas || []} // Garante que o options seja um array
                        disabled={loading}
                        onChange={(value) => handleSessaoChange(idPlano, value)}
                      />
                    </div>

                    {error && (
                      <div className={`notification notification-error`}>
                        <p className="p5">{error}</p>
                      </div>
                    )}

                    {sessaoSelecionada?.subsessaoApresentacao?.map(
                      (subsessao) => {
                        const [dataISOInicio, horaISOInicio] =
                          subsessao.inicio.split("T");
                        const [, horaISOFim] = subsessao.fim.split("T");

                        const [ano, mes, dia] = dataISOInicio.split("-");
                        const dataFormatada = `${dia}/${mes}/${ano}`;

                        const horaInicio = horaISOInicio
                          .substring(0, 5)
                          .replace(":", "h");
                        const horaFim = horaISOFim
                          .substring(0, 5)
                          .replace(":", "h");

                        return (
                          <div
                            key={subsessao.id}
                            className={`mt-2 ${styles.boxButton} ${styles.inscricaoEvento}`}
                          >
                            <div className={styles.infoEvento}>
                              <p>Sessão:</p>
                              <h6 className="mb-1">
                                {sessaoSelecionada.titulo.toUpperCase()}
                              </h6>
                              <p>Dia da apresentação:</p>
                              <h6 className="mb-1">{dataFormatada}</h6>
                              <p>Período:</p>
                              <h6>
                                de {horaInicio} às {horaFim}
                              </h6>
                            </div>
                            <Button
                              className="btn-primary"
                              type="button"
                              disabled={loading}
                              onClick={async () => {
                                setLoading(true);
                                try {
                                  const submissao = await startSubmissaoEvento(
                                    params.tenant,
                                    eventoSelecionado.eventoId,
                                    idPlano,
                                    eventoSelecionado.formularioId,
                                    subsessao.id
                                  );
                                  //await refresh();
                                  setTela(1);
                                  setSubmissao(submissao);
                                } catch (error) {
                                  console.error("Erro ao buscar dados:", error);
                                  setError(error.response?.data?.message);
                                  setTela(1);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              {loading
                                ? "Finalizando a inscrição"
                                : "Inscrever"}
                            </Button>
                          </div>
                        );
                      }
                    )}

                    {sessaoSelecionada &&
                      !sessaoSelecionada?.subsessaoApresentacao?.length && (
                        <div>
                          <NoData description="Parece que ainda não há subsessões cadastradas." />
                        </div>
                      )}
                  </div>
                );
              })}
            </>
          )}
          {tela === 0 && planosSemSubmissao?.length === 0 && (
            <div className={`${styles.noData} ${styles.margin}`}>
              <NoData description="Creio que não haja mais projetos a serem inscritos. Visualize suas inscrições!" />
              <Button
                className="btn-green mt-3"
                linkTo={`/${params.tenant}/aluno/meuseventos`}
                disabled={loading}
              >
                VER MINHAS INSCRIÇÕES
              </Button>
            </div>
          )}
          {tela === 1 && (
            <div className={styles.successMsg}>
              <h3>Inscrição confirmada!</h3>
              <div className={styles.successMsgContent}>
                <div className={styles.boxButton}>
                  <div className={styles.infoBox}>
                    <div className={styles.description}>
                      <div className={styles.infoBoxDescription}>
                        <h6>{submissao?.evento?.nomeEvento}</h6>
                      </div>
                    </div>
                    <div className={styles.description}>
                      <div className={styles.icon}>
                        <RiFlaskLine />
                      </div>
                      <div className={styles.infoBoxDescription}>
                        <p>
                          <strong>Sessão: </strong>
                        </p>
                        <p>
                          {submissao?.subsessao?.sessaoApresentacao?.titulo}
                        </p>
                      </div>
                    </div>
                    <div className={styles.description}>
                      <div className={styles.icon}>
                        <RiCalendarLine />
                      </div>
                      <div className={styles.infoBoxDescription}>
                        <p>
                          <strong>Início: </strong>
                        </p>
                        <p>
                          {formatarData(submissao?.subsessao?.inicio)} -{" "}
                          {formatarHora(submissao?.subsessao?.inicio)}
                        </p>
                        <p className="mt-1">
                          <strong>Fim: </strong>
                        </p>
                        <p>
                          {formatarData(submissao?.subsessao?.fim)} -{" "}
                          {formatarHora(submissao?.subsessao?.fim)}
                        </p>
                      </div>
                    </div>
                    <div className={styles.description}>
                      <div className={styles.icon}>
                        <RiMapPinLine />
                      </div>
                      <div className={styles.infoBoxDescription}>
                        <p>
                          <strong>Local: </strong>
                        </p>
                        <p>{submissao?.subsessao?.local}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  className="btn-green"
                  linkTo={`/${params.tenant}/aluno/meuseventos`}
                  disabled={loading}
                >
                  VER MINHAS INSCRIÇÕES
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <>
      {renderModalEventoContent()}

      <div className={styles.navContent}>
        {eventos[0] && (
          <div className={styles.content}>
            <div className={styles.header}>
              {registroAtividadesEditaisVigentes?.length > 0 && (
                <>
                  <h4>Inscreva seu(s) projeto(s) em eventos científicos:</h4>
                  <p className="mt-1">
                    Apresente seu(s) projeto(s) nos eventos abaixo para divulgar
                    os resultados da sua pesquisa!
                  </p>
                </>
              )}
            </div>
            <div className={styles.mainContent}>
              <div className={styles.tela1}>
                {eventos
                  ?.filter(
                    (item) =>
                      Array.isArray(item.evento.sessao) &&
                      item.evento.sessao.length > 0
                  )
                  .map((item) => (
                    <div
                      key={`tenant_${item.tenantId}_evento${item.eventoId}`}
                      className={`${styles.evento} ${styles.boxButton}`}
                      onClick={() => {
                        setEventoSelecionado(item);

                        setIsModalEventoOpen(true);
                      }}
                    >
                      <h6>{item.evento.nomeEvento}</h6>
                      <p>{`Edição de ${item.evento.edicaoEvento}`}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
