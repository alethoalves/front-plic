"use client";
import {
  RiAwardFill,
  RiCalendarEventFill,
  RiCouponLine,
  RiFileList3Line,
  RiFolderFill,
  RiFolderLine,
  RiFoldersLine,
  RiListCheck2,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";
import {
  countRegistroAtividadesWithStatusNaoEntregueByCPF,
  getRegistroAtividadesByCpfEditaisVigentes,
} from "@/app/api/client/registroAtividade";
import { getEventosByTenant } from "@/app/api/client/eventos";
import { getCookie } from "cookies-next";

const Page = ({ params }) => {
  // Estados para gerenciamento do componente
  const [loading, setLoading] = useState(false);
  const [atividadesNaoEntregues, setAtividadesNaoEntregues] = useState(0);
  const [registroAtividadesNaoInscritos, setRegistroAtividadesNaoInscritos] =
    useState(0);
  // ROTEAMENTO
  const router = useRouter();
  const perfil = getCookie("perfilSelecionado");
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const atividadesNaoEntregues =
          await countRegistroAtividadesWithStatusNaoEntregueByCPF(
            params.tenant
          );
        setAtividadesNaoEntregues(atividadesNaoEntregues);
        //
        const registroAtividades =
          await getRegistroAtividadesByCpfEditaisVigentes(
            params.tenant,
            perfil
          );
        const eventos = await getEventosByTenant(params.tenant);
        setRegistroAtividadesNaoInscritos(
          contarTotalPlanosNaoInscritos(registroAtividades, eventos)
        );
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);
  const contarTotalPlanosNaoInscritos = (registrosDeAtividades, eventos) => {
    return eventos.reduce((totalNaoInscritos, evento) => {
      const eventoId = evento.eventoId;

      // Contar planos de trabalho que ainda não foram inscritos no evento específico
      const naoInscritosNoEvento = registrosDeAtividades.filter((registro) => {
        const planoDeTrabalho = registro.planoDeTrabalho;
        const submissao = planoDeTrabalho.submissao;

        // Retornar true se não há submissão para o evento específico
        return (
          submissao.length === 0 ||
          !submissao.some((sub) => sub.eventoId === eventoId)
        );
      }).length;

      return totalNaoInscritos + naoInscritosNoEvento;
    }, 0);
  };
  return (
    <>
      <div className={styles.navContent}>
        <div className={styles.content}>
          <h6>Bem-vindo(a) à </h6>
          <h4>Iniciação Científica</h4>
          <Link href={`/${params.tenant}/user/editais`}>
            <div className={styles.infoBox}>
              <div className={styles.icon}>
                <RiFileList3Line />
              </div>
              <div className={styles.infoBoxContent}>
                <h6>Editais</h6>
                <p>
                  Inscreva-se nos editais de iniciação científica ou acompanhe
                  suas inscrições!
                </p>
              </div>
            </div>
          </Link>
          <Link href={`/${params.tenant}/user/atividades`}>
            <div className={styles.infoBox}>
              <div className={styles.icon}>
                <RiListCheck2 />
              </div>
              <div className={styles.infoBoxContent}>
                <h6>Atividades</h6>
                <p>Não perca os prazos de entrega das atividades!</p>
              </div>
            </div>
          </Link>
          <Link href={`/${params.tenant}/user/documentos`}>
            <div className={styles.infoBox}>
              <div className={styles.icon}>
                <RiFoldersLine />
              </div>
              <div className={styles.infoBoxContent}>
                <h6>Documentos</h6>
                <p>Gerencie e visualize seus documentos.</p>
              </div>
            </div>
          </Link>
          <Link href={`/${params.tenant}/user/eventos`}>
            <div className={styles.infoBox}>
              {false && registroAtividadesNaoInscritos > 0 && (
                <div className={styles.notification}>
                  <p>{registroAtividadesNaoInscritos}</p>
                </div>
              )}
              <div className={styles.icon}>
                <RiCalendarEventFill />
              </div>
              <div className={styles.infoBoxContent}>
                <h6>Eventos</h6>
                <p>
                  Veja os eventos científicos organizados pela sua insituição.
                </p>
              </div>
            </div>
          </Link>
          <Link href={`/${params.tenant}/user/certificados`}>
            <div className={styles.infoBox}>
              <div className={styles.icon}>
                <RiAwardFill />
              </div>
              <div className={styles.infoBoxContent}>
                <h6>Certificados</h6>
                <p>
                  Acesse os certificados de conclusão de projetos de iniciação
                  científica.
                </p>
              </div>
            </div>
          </Link>
          {false && (
            <>
              {" "}
              <Link href={`/${params.tenant}/user/meuseventos`}>
                <div className={styles.infoBox}>
                  <div className={styles.icon}>
                    <RiCouponLine />
                  </div>
                  <div className={styles.infoBoxContent}>
                    <h6>Minhas inscrições</h6>
                    <p>
                      Visualize e gerencie suas inscrições em eventos
                      científicos!
                    </p>
                  </div>
                </div>
              </Link>
              <Link href={`/${params.tenant}/user/certificados`}>
                <div className={styles.infoBox}>
                  <div className={styles.icon}>
                    <RiAwardFill />
                  </div>
                  <div className={styles.infoBoxContent}>
                    <h6>Meus certificados</h6>
                    <p>Baixe seus certificados!</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
