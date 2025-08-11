"use client";
import { RiCouponLine, RiIdCardLine } from "@remixicon/react";
import styles from "./InscricaoButton.module.scss";
import { useState, useEffect, useRef, useMemo } from "react";
import Modal from "../Modal";

import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import {
  getTenantsByEventoSlug,
  getPlanosOuProjetos,
} from "@/app/api/client/eventos";
import SearchableSelect2 from "../SearchableSelect2";
import Input from "../Input";
import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { RenderPlanoCard } from "./RenderPlanoCard";

export const InscricaoButton = ({ params }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stepperRef = useRef(null);
  const toast = useRef(null);

  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      cpf: "",
    },
  });

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  const cpfValue = watch("cpf");

  const tenantsMap = useMemo(() => {
    const map = new Map();
    tenants.forEach((tenant) => map.set(tenant.value, tenant));
    return map;
  }, [tenants]);

  const resetForm = () => {
    setIsModalOpen(false);
    setSelectedTenant(null);
    setActiveStep(0);
    setPlanos([]);
    setError(null);
  };

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await getTenantsByEventoSlug(params.edicao);
        const formattedTenants = data.map((tenant) => ({
          ...tenant,
          label: `${tenant.slug.toUpperCase()} - ${tenant.nome}`,
          value: tenant.slug,
        }));
        setTenants(formattedTenants);
      } catch (error) {
        console.error("Erro ao buscar instituições:", error);
        showError(
          "Erro ao carregar lista de instituições. Tente novamente mais tarde."
        );
      }
    };

    fetchTenants();
  }, [params]);

  const handleTenantChange = (value) => {
    const tenant = tenantsMap.get(value);
    setSelectedTenant(tenant);
  };

  const onSubmit = async (data) => {
    if (!selectedTenant || !data.cpf) return;

    setLoading(true);
    setError(null);

    try {
      const planosData = await getPlanosOuProjetos(
        data.cpf,
        params.edicao,
        selectedTenant.value
      );
      setPlanos(planosData.data);
      console.log(planosData.data);
      setActiveStep(2);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      const errorMessage =
        "Erro ao buscar planos. Verifique o CPF e tente novamente.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />

      <div
        className={`w-100 ${styles.action} ${styles.primary}`}
        onClick={() => setIsModalOpen(true)}
      >
        <RiCouponLine />
        <h6>Inscreva-se aqui!</h6>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        size="medium"
        showIconClose={true}
      >
        <div className={styles.dialogEventoContent}>
          <h5 className="mb-4">Faça sua inscrição!</h5>

          <div className="card">
            <Stepper
              ref={stepperRef}
              style={{ flexBasis: "50rem" }}
              orientation="vertical"
              activeStep={activeStep}
            >
              <StepperPanel header="Selecione sua instituição">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <SearchableSelect2
                      label="Instituição"
                      options={tenants}
                      onChange={handleTenantChange}
                      value={selectedTenant?.value}
                      extendedOpt={true}
                    />
                  </div>
                </div>
                <div className="flex pt-3">
                  <Button
                    label="Próximo"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => {
                      reset({ cpf: "" });
                      setActiveStep(1);
                    }}
                    disabled={!selectedTenant}
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Informe seu CPF">
                <div className={styles.contentBox}>
                  <div className={styles.content}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <div className="flex flex-column gap-3">
                        <Input
                          control={control}
                          name="cpf"
                          label="Digite seu CPF"
                          icon={RiIdCardLine}
                          inputType="text"
                          placeholder="Digite seu CPF"
                        />
                      </div>
                      <div className="flex pt-3 gap-1">
                        <Button
                          label="Voltar"
                          severity="secondary"
                          icon="pi pi-arrow-left"
                          onClick={() => {
                            setSelectedTenant();
                            setActiveStep(0);
                          }}
                          type="button"
                        />
                        <Button
                          label={loading ? "Buscando..." : "Próximo"}
                          icon={loading ? null : "pi pi-arrow-right"}
                          iconPos="right"
                          type="submit"
                          disabled={!cpfValue || loading}
                        >
                          {loading && (
                            <ProgressSpinner
                              style={{ width: "20px", height: "20px" }}
                              strokeWidth="6"
                              animationDuration=".5s"
                            />
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </StepperPanel>

              <StepperPanel header="Selecione um Plano ou Projeto">
                <div className="flex flex-column gap-3">
                  {loading ? (
                    <div className="flex justify-content-center">
                      <ProgressSpinner />
                    </div>
                  ) : error ? (
                    <div className="p-error">{error}</div>
                  ) : planos?.length === 0 ? (
                    <div>Nenhum plano/projeto encontrado para este CPF.</div>
                  ) : (
                    planos?.map((plano) => (
                      <RenderPlanoCard key={plano.id} plano={plano} />
                    ))
                  )}
                </div>
                <div className="flex pt-3">
                  <Button
                    label="Voltar"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => setActiveStep(1)}
                    type="button"
                  />
                </div>
              </StepperPanel>
            </Stepper>
          </div>
        </div>
      </Modal>
    </>
  );
};
