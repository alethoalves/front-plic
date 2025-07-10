"use client";

import styles from "./NovaInscricao.module.scss";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { getEditais, getEdital } from "@/app/api/client/edital";
import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import Button from "./Button";
import { RiSurveyLine } from "@remixicon/react";
import { createInscricaoByGestor } from "@/app/api/client/inscricao";
import FluxoInscricaoEdital from "./FluxoInscricaoEdital"; // Importe o componente
import FluxoInscricaoGESTOR from "./FluxoInscricaoGESTOR";
import Inscricao from "./Inscricao";

const NovaInscricao = ({ params }) => {
  const [editais, setEditais] = useState([]);
  const [selectedEdital, setSelectedEdital] = useState(null);
  const [dates, setDates] = useState({ inicio: "", fim: "" });
  const [loadingEdital, setLoadingEdital] = useState(false);
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdInscricaoId, setCreatedInscricaoId] = useState(null); // Novo estado para controlar a inscrição criada
  const [inscricaoReady, setInscricaoReady] = useState(false);

  const toast = useRef(null);

  const showError = (error, defaultMessage) => {
    const errorMessage =
      error?.response?.data?.message || error?.message || defaultMessage;

    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: errorMessage,
      life: 5000,
    });
  };

  useEffect(() => {
    (async () => {
      try {
        setEditais(await getEditais(params.tenant, params.ano));
      } catch (e) {
        console.error(e);
        showError(e, "Falha ao buscar editais");
      }
    })();
  }, [params.tenant, params.ano]);

  useEffect(() => {
    if (!selectedEdital) return;
    (async () => {
      setLoadingEdital(true);
      try {
        const ed = await getEdital(params.tenant, selectedEdital.id);
        setDates({
          inicio: ed?.inicioInscricao?.split("T")[0] || "",
          fim: ed?.fimInscricao?.split("T")[0] || "",
        });
      } catch (e) {
        console.error(e);
        showError(e, "Falha ao carregar edital");
      } finally {
        setLoadingEdital(false);
      }
    })();
  }, [selectedEdital, params.tenant]);

  const handleCpfVerified = (data) => {
    setUserData(data);
    setEmail(data?.email || "");
  };

  const options = editais.map((e) => ({
    label: `${e.titulo} (${e.ano})`,
    value: e,
  }));

  const createNewInscricao = async (editalId) => {
    setLoading(true);

    try {
      const response = await createInscricaoByGestor(params.tenant, {
        editalId,
        userId: userData.userId,
        email: email,
      });

      if (response?.inscricao?.id) {
        toast.current?.show({
          severity: "success",
          summary: "Sucesso",
          detail: "Inscrição criada com sucesso!",
          life: 3000,
        });

        // Em vez de abrir em nova aba, armazena o ID para mostrar o fluxo de edição
        setCreatedInscricaoId(response.inscricao.id);
      }
    } catch (error) {
      console.error("Error:", error);
      showError(
        error,
        error.response?.status === 409
          ? "Usuário já está inscrito neste edital"
          : "Falha ao criar inscrição"
      );
    } finally {
      setLoading(false);
    }
  };

  // Se tivermos uma inscrição criada, mostra apenas o fluxo de edição
  if (createdInscricaoId) {
    return (
      <div className={styles.content}>
        <Toast ref={toast} position="top-right" />

        <Inscricao params={params} inscricaoId={createdInscricaoId} />
        {false && (
          <FluxoInscricaoGESTOR
            tenant={params.tenant}
            inscricaoSelected={createdInscricaoId}
          />
        )}
      </div>
    );
  }

  // Caso contrário, mostra o formulário de criação
  return (
    <div className={styles.content}>
      <Toast ref={toast} position="top-right" />

      <div className={styles.head}>
        <div className={styles.item}>
          <h5>Nova Inscrição</h5>

          <label>
            <span className="mt-3 mr-2">Escolha o edital:</span>
            <Dropdown
              value={selectedEdital}
              options={options}
              onChange={(e) => setSelectedEdital(e.value)}
              placeholder="Selecione o edital"
              className="w-full md:w-20rem"
            />
          </label>

          {selectedEdital && loadingEdital && <p>Carregando edital…</p>}

          {selectedEdital && (
            <div className="mt-4">
              <CPFVerificationForm
                tenantSlug={params.tenant}
                onCpfVerified={handleCpfVerified}
              />
            </div>
          )}

          {selectedEdital && userData && (
            <div className="mt-4">
              <div className="field mb-3 ">
                <label htmlFor="nome" className="block mb-2 ">
                  Nome
                </label>
                <InputText
                  id="nome"
                  value={userData.nome}
                  readOnly
                  className="w-100"
                />
              </div>

              <div className="field mb-3">
                <label htmlFor="cpf" className="block mb-2">
                  CPF
                </label>
                <InputText
                  id="cpf"
                  value={userData.cpf}
                  readOnly
                  className="w-100"
                />
              </div>

              <div className="field mb-3">
                <label htmlFor="email" className="block mb-2">
                  E-mail
                </label>
                <InputText
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-100"
                  placeholder="Digite o e-mail se não estiver preenchido"
                />
              </div>
              <Button
                className="btn-secondary mt-2"
                icon={RiSurveyLine}
                type="button"
                disabled={loading}
                onClick={() => createNewInscricao(selectedEdital.id)}
              >
                {loading && "Aguarde..."}
                {!loading && "Fazer inscrição"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovaInscricao;
