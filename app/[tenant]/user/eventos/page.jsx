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
import { getCookie } from "cookies-next";
import Link from "next/link";

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
  const perfil = getCookie("perfilSelecionado");
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventos = await getEventosByTenant(params.tenant);
        console.log(eventos);
        setEventos(eventos);

        const areas = await getAreas(params.tenant);
        setAreas(transformedArray(areas));
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getRegistroAtividadesByCpfEditaisVigentes(
          params.tenant,
          perfil
        );

        setPlanosDeTrabalho(transformData(response));

        setRegistrosAtividadesEditaisVigentes(
          response.sort(
            (a, b) =>
              new Date(a.atividade.dataInicio) -
              new Date(b.atividade.dataInicio)
          )
        );

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

  return (
    <>
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.header}>
              <h4>Eventos científicos:</h4>
              <p className="mt-1">
                Eventos científicos organizados pela sua instituição.
              </p>
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-center">
              <p>Carregando eventos...</p>
            </div>
          ) : (
            <div className={styles.mainContent}>
              <div className={`${styles.tela1} gap-2`}>
                {eventos?.filter(
                  (item) =>
                    Array.isArray(item.evento.sessao) &&
                    item.evento.sessao.length > 0
                ).length > 0 ? (
                  eventos
                    .filter(
                      (item) =>
                        Array.isArray(item.evento.sessao) &&
                        item.evento.sessao.length > 0
                    )
                    .sort(
                      (a, b) => b.evento.edicaoEvento - a.evento.edicaoEvento
                    )
                    .map((item) => (
                      <Link
                        key={`tenant_${item.tenantId}_evento${item.eventoId}`}
                        href={`/evento/${item.evento.eventoRoot.slug}/edicao/${item.evento.slug}`}
                      >
                        <div
                          className={`${styles.evento} mb-1 ${styles.boxButton}`}
                        >
                          <h6>{item.evento.nomeEvento}</h6>
                          <p>{`Edição de ${item.evento.edicaoEvento}`}</p>
                        </div>
                      </Link>
                    ))
                ) : (
                  <NoData description="Não há eventos com inscrições abertas. Tente mais tarde." />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
