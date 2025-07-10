"use client"; // Mantenha o "use client"
import { useEffect, useState } from "react"; // Importe useEffect e useState
import { useRouter } from "next/navigation"; // Importe useRouter para redirecionamento
import styles from "./page.module.scss";
import FluxoInscricaoEdital from "@/components/FluxoInscricaoEdital";
import { getInscricaoUserById } from "@/app/api/client/inscricao";

export default function Page({ params }) {
  const [inscricao, setInscricao] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Busca os dados da inscrição no lado do cliente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInscricaoUserById(
          params.tenant,
          params.idInscricao
        );
        if (data.status !== "pendente") {
          router.push(
            `/${params.tenant}/user/editais/inscricoes/${params.idInscricao}/acompanhamento`
          );
        } else {
          setInscricao(data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.tenant, params.idInscricao]);

  // Exibe um carregamento enquanto os dados são buscados
  if (loading) {
    return <p>Carregando...</p>;
  }

  // Renderiza o conteúdo se a inscrição estiver "pendente"
  return (
    <>
      <div className={styles.navContent}>
        <div className={styles.content}>
          <FluxoInscricaoEdital
            tenant={params.tenant}
            inscricaoSelected={params.idInscricao}
          />
        </div>
      </div>
    </>
  );
}
