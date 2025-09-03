"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import {
  RiAlertLine,
  RiAtLine,
  RiFlaskLine,
  RiIdCardLine,
} from "@remixicon/react";
import Button from "@/components/Button";
import { getAreas } from "@/app/api/client/area";
import { conviteAvaliadorSchema } from "@/lib/zodSchemas/conviteAvaliadorSchema";
import {
  aceitarConviteAvaliador,
  consultarConviteByToken,
} from "@/app/api/client/avaliador";
import { sanitize } from "@/lib/sanitize";
import { useRouter } from "next/navigation";
import { MultiSelect } from "primereact/multiselect";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [step, setStep] = useState(0);
  const [convite, setConvite] = useState();
  const [conviteRecusado, setConviteRecusado] = useState(false);
  const [conviteAceito, setConviteAceito] = useState(false);
  const [tenant, setTenant] = useState();
  const [areaOptions, setAreaOptions] = useState([]);

  const [errorMessage, setErrorMessage] = useState();
  const router = useRouter();
  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const areas = await getAreas();
        setAreas(areas);
        setAreaOptions(
          areas
            .sort((a, b) => a.area.localeCompare(b.area))
            .map((area) => ({
              label: area.area,
              value: area.id,
            }))
        );
        const convite = await consultarConviteByToken(params.token);

        convite.conteudoConvite = sanitize(convite.conteudoConvite);
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

  const handleAreaClick = (id) => {
    setAreasSelecionadas((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((areaId) => areaId !== id)
        : [...prev, id];

      return updated;
    });
  };

  // ⬇️ Substitua todo o handleFormSubmit pelo trecho abaixo:
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const aceite = await aceitarConviteAvaliador(
        params.token, // token na URL
        data.cpf, // CPF digitado

        areasSelecionadas, // array com ids das áreas escolhidas
        data.email
      );

      if (aceite.status === "success") {
        setConviteAceito(true);
        setStep(5); // exibe tela de sucesso
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(conviteAvaliadorSchema),
    defaultValues: {
      cpf: "",
    },
  });

  return (
    <main className={styles.main}>
      {loading && !tenant && (
        <div className={styles.content}>
          <p>Carregando...</p>
        </div>
      )}
      {tenant && (
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

          {step !== 5 && (
            <div className={`${styles.box} }`}>
              <div className={`${styles.header}`}>
                <h4>Faça parte do Comitê Avaliador!</h4>
              </div>
              <div className={`${styles.boxContent} `}>
                <div
                  className={styles.boxContentHTML}
                  dangerouslySetInnerHTML={{
                    __html: sanitize(convite?.conteudoConvite || ""),
                  }}
                />
                <br></br>

                <form
                  className="mt-2"
                  onSubmit={handleSubmit(handleFormSubmit)}
                >
                  <div className={styles.form}>
                    {step === 0 && (
                      <>
                        {!conviteAceito && (
                          <Button
                            className="btn-primary mt-2"
                            type="button" // submit, reset, button
                            disabled={loading}
                            onClick={() => {
                              setAreasSelecionadas([]);
                              setStep(1);
                              setConviteRecusado(false);
                              setErrorMessage();
                            }}
                          >
                            Aceitar o convite
                          </Button>
                        )}
                        {!conviteRecusado && (
                          <Button
                            className="btn-error mt-2"
                            type="button"
                            disabled={loading}
                            onClick={async () => {
                              setLoading(true);
                              setErrorMessage("");

                              try {
                                router.push(
                                  `/${params.tenant}/public/convite/${params.token}/projeto/recusar-convite`
                                );
                              } catch (error) {
                                setErrorMessage(
                                  error.response?.data?.message ??
                                    "Não conseguimos registrar a recusa."
                                );
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            Recusar o convite
                          </Button>
                        )}
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <h6 className="mb-3">
                          Agora selecione as ÁREAS de maior interesse
                        </h6>
                        <div className="card w-100  justify-content-center">
                          <MultiSelect
                            value={areasSelecionadas}
                            onChange={(e) => setAreasSelecionadas(e.value)}
                            options={areaOptions}
                            optionLabel="label"
                            filter
                            placeholder="Selecione as áreas"
                            maxSelectedLabels={3}
                            className="w-100 md:w-20rem"
                            display="chip"
                          />
                        </div>
                        <Button
                          className="btn-primary mt-2"
                          type="button" // submit, reset, button
                          disabled={loading}
                          onClick={() => {
                            if (areasSelecionadas.length > 0) {
                              setStep(3);
                              setErrorMessage();
                            } else {
                              setErrorMessage(
                                "Selecione ao menos uma área de interesse."
                              );
                            }
                          }}
                        >
                          Salvar e continuar
                        </Button>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <div className={styles.formInput}>
                          <Input
                            control={control}
                            className="cpf-input"
                            name="cpf"
                            label="Digite seu CPF"
                            icon={RiIdCardLine}
                            inputType="text" // text, password
                            placeholder="Digite seu CPF"
                            autoFocus
                            disabled={loading}
                          />
                        </div>
                        <div className={`${styles.formInput} mt-2`}>
                          <Input
                            control={control}
                            name="email"
                            label="Email"
                            icon={RiAtLine}
                            inputType="email" // text, password
                            placeholder="Digite seu email"
                            disabled={loading}
                          />
                        </div>

                        <Button
                          className="btn-primary mt-2"
                          type="submit" // submit, reset, button
                          disabled={loading}
                        >
                          {loading
                            ? "Aguarde alguns minutos. Estamos validando os dados do CPF."
                            : "Concluir"}
                        </Button>
                      </>
                    )}
                    {errorMessage && (
                      <div className={`${styles.errorMsg} mb-3`}>
                        <p>{errorMessage}</p>
                      </div>
                    )}

                    {step > 0 && step < 5 && (
                      <Button
                        className="btn-secondary mt-2"
                        type="button" // submit, reset, button
                        disabled={loading}
                        onClick={() => {
                          setAreasSelecionadas([]);
                          setStep(0);
                          setConviteRecusado(false);
                          setErrorMessage();
                        }}
                      >
                        Voltar
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
          {step === 5 && !conviteRecusado && (
            <div className={styles.conviteAceito}>
              <div className={`${styles.successMsg}`}>
                <h3>Obrigado!</h3>
                <div className={styles.successMsgContent}>
                  <div className={styles.boxButton}>
                    <div className={styles.infoBox}>
                      <div className={styles.description}>
                        <div className={styles.infoBoxDescription}>
                          <h6>
                            Seu cadastro como avaliador foi realizado com
                            sucesso.
                          </h6>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={`${styles.icon} ${styles.iconWarning}`}>
                          <RiAlertLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>
                            <strong>Atenção: </strong>
                          </p>
                          <p>
                            Enviaremos um email assim que os projetos forem
                            atribuídos a você!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {!loading && !tenant && (
        <div className={styles.content}>
          <p>Token não encontrado.</p>
        </div>
      )}
    </main>
  );
};

export default Page;
