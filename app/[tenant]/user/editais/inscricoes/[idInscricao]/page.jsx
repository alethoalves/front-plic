"use client";
import {
  RiAlertLine,
  RiCalendarEventFill,
  RiCheckDoubleLine,
  RiDraftLine,
  RiEditLine,
  RiFolder2Line,
  RiFoldersLine,
  RiGroupLine,
  RiMenuLine,
  RiSurveyLine,
  RiUser2Line,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import {
  getRegistroAtividadesByCPF,
  getRegistroAtividadesByCpfEditaisVigentes,
  updateRegistroAtividade,
} from "@/app/api/client/registroAtividade";
import Campo from "@/components/Campo";
import { startSubmission } from "@/app/api/client/resposta";
import FormArea from "@/components/Formularios/FormArea";
import NoData from "@/components/NoData";
import { getEditais, getEditaisByUser } from "@/app/api/client/edital";
import { formatarData } from "@/lib/formatarDatas";
import FluxoInscricaoEdital from "@/components/FluxoInscricaoEdital";
import {
  createInscricaoByUser,
  getInscricoesByUser,
  getMinhasInscricoes,
} from "@/app/api/client/inscricao";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);

  const [inscricaoSelected, setInscricaoSelected] = useState(null);
  const [errorMessages, setErrorMessages] = useState({}); // Alterado para armazenar erros por edital

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const editais = await getEditais(params.tenant);
        setEditais(editais);
        const minhasInscricoes = await getMinhasInscricoes(params.tenant);
        setInscricoes(minhasInscricoes);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setInscricaoSelected(null);
  };

  const renderModalContent = () => {
    return (
      <Modal
        size="large"
        isOpen={isModalOpen}
        onClose={closeModalAndResetData}
      ></Modal>
    );
  };

  const openModalAndSetData = async (data) => {
    setInscricaoSelected(data);
    setIsModalOpen(true);
  };

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
};

export default Page;
