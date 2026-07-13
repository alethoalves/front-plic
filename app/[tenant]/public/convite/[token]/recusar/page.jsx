"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { recusarConvitePorToken } from "@/app/api/client/avaliador";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [convite, setConvite] = useState();
  const [tenant, setTenant] = useState();
  const [errorMessage, setErrorMessage] = useState();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const convite = await recusarConvitePorToken(params.token);
        setConvite(convite);
        setTenant(convite.tenant);
      } catch (error) {
        console.error("Erro ao recusar convite:", error);
        setErrorMessage(
          error.response?.data?.message ?? "Não foi possível registrar a recusa."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.token]);

  return (
    <main className={styles.main}>
      {loading && !convite && (
        <div className={styles.content}>
          <p>Carregando...</p>
        </div>
      )}
      {convite && (
        <div className={styles.content}>
          <div className={styles.logo}>
            {tenant?.pathLogo ? (
              <Image
                priority
                fill
                src={`/image/${tenant.pathLogo}`}
                alt="logo do tenant"
                sizes="300 500 700"
              />
            ) : (
              <div style={{ height: 120 }} />
            )}
          </div>

          <div className={styles.box}>
            <div className={`${styles.header} ${styles.titleError}`}>
              <h4>Tudo bem, quem sabe da próxima vez!</h4>
            </div>
          </div>
        </div>
      )}
      {!loading && !convite && (
        <div className={styles.content}>
          <p>{errorMessage || "Token não encontrado."}</p>
        </div>
      )}
    </main>
  );
};

export default Page;
