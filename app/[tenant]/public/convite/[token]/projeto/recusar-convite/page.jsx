"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conviteAvaliadorSchema } from "@/lib/zodSchemas/conviteAvaliadorSchema";
import {
  consultarConviteByToken,
  recusarConvitePorToken,
} from "@/app/api/client/avaliador";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [convite, setConvite] = useState();
  const [tenant, setTenant] = useState();

  const [errorMessage, setErrorMessage] = useState();

  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const convite = await recusarConvitePorToken(params.token);
        setConvite(convite);
        setTenant(convite.tenant);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setErrorMessage(error.response.data.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.eventoSlug]);

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(conviteAvaliadorSchema),
    defaultValues: {
      cpf: "",
      dtNascimento: "",
    },
  });

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
              /* enquanto carrega pode exibir um skeleton, spinner ou nada */
              <div style={{ height: 120 }} /> // placeholder
            )}
          </div>

          <div className={`${styles.box} }`}>
            <div className={`${styles.header} ${styles.titleError}`}>
              <h4>Tudo bem, quem sabe da próxima vez!</h4>
            </div>
          </div>
        </div>
      )}
      {!loading && !convite && (
        <div className={styles.content}>
          <p>Token não encontrado.</p>
        </div>
      )}
    </main>
  );
};

export default Page;
