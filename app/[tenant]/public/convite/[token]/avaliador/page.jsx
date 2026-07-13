"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Signin from "@/components/Signin";
import { consultarConviteByToken } from "@/app/api/client/avaliador";
import { sanitize } from "@/lib/sanitize";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [convite, setConvite] = useState();
  const [tenant, setTenant] = useState();
  const [aceito, setAceito] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const convite = await consultarConviteByToken(params.token);
        convite.conteudoConvite = sanitize(convite.conteudoConvite);
        setConvite(convite);
        setTenant(convite.tenant);
      } catch (error) {
        console.error("Erro ao buscar convite:", error);
        setErrorMessage(
          error.response?.data?.message ?? "Não foi possível carregar o convite."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.token]);

  return (
    <main className={styles.main}>
      {loading && !tenant && (
        <div className={styles.content}>
          <p>Carregando...</p>
        </div>
      )}

      {tenant && !aceito && (
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
            <div className={styles.header}>
              <h4>Faça parte do Comitê Avaliador!</h4>
            </div>
            <div className={styles.boxContent}>
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitize(convite?.conteudoConvite || ""),
                }}
              />
              <br />
              <div className="flex-space">
                <Button
                  className="btn-primary mt-2"
                  type="button"
                  disabled={loading}
                  onClick={() => setAceito(true)}
                >
                  Aceitar o convite
                </Button>
                <Button
                  className="btn-error mt-2"
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    router.push(
                      `/${params.tenant}/public/convite/${params.token}/recusar`
                    )
                  }
                >
                  Recusar o convite
                </Button>
              </div>
              {errorMessage && (
                <div className={`${styles.errorMsg} mb-3`}>
                  <p>{errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tenant && aceito && (
        <div className={styles.signinWrapper}>
          <Signin
            slug={params.tenant}
            pathLogo={tenant.pathLogo}
            tokenConvite={params.token}
          />
        </div>
      )}

      {!loading && !tenant && (
        <div className={styles.content}>
          <p>{errorMessage || "Token não encontrado."}</p>
        </div>
      )}
    </main>
  );
};

export default Page;
