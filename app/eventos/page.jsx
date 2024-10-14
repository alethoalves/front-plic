"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import NoData from "@/components/NoData";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllEvents } from "../api/client/eventos";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState();
  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventos = await getAllEvents();

        setEventos(eventos);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setError("Erro ao buscar eventos.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Image
              priority
              fill
              src={`/image/logoEvenPLIC.svg`}
              alt="logo"
              sizes="300 500 700"
            />
          </div>
        </div>
        {!loading && eventos?.legth === 0 && <NoData />}
        <h6>LISTA DE EVENTOS</h6>
        {loading ? (
          <p className="mt-2">Carregando...</p>
        ) : (
          eventos?.map((evento) => (
            <div key={evento.id} className={styles.eventos}>
              <Link href={`/eventos/${evento.slug}`}>
                <div className={styles.evento}>
                  <div className={styles.banner}>
                    <Image
                      priority
                      fill
                      src={`/image/${evento.pathBanner}`}
                      alt="logo"
                      sizes="300 500 700"
                    />
                  </div>
                  <div className={styles.description}>
                    <h6>{evento.nomeEvento}</h6>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default Page;
