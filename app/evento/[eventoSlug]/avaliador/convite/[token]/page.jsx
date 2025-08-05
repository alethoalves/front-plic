"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getEventoBySlug } from "@/app/api/client/eventos";
import { useForm } from "react-hook-form";
import { cpfValidatorSchema } from "@/lib/zodSchemas/cpfValidatorSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import {
  RiAtLine,
  RiCalendarEventLine,
  RiCalendarLine,
  RiFlaskLine,
  RiIdCardLine,
  RiMapPinLine,
} from "@remixicon/react";
import Button from "@/components/Button";
import { getAreas } from "@/app/api/client/area";
import { conviteAvaliadorSchema } from "@/lib/zodSchemas/conviteAvaliadorSchema";
import {
  aceitarConvite,
  consultarConviteByToken,
  recusarConvite,
} from "@/app/api/client/conviteEvento";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [evento, setEvento] = useState();
  const [grandesAreas, setGrandesAreas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subsessoes, setSubsessoes] = useState([]);

  const [grandesAreasSelecionadas, setGrandesAreasSelecionadas] = useState([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [subsessoesSelecionadas, setSubsessoesSelecionadas] = useState([]);
  const [step, setStep] = useState(0);
  const [convite, setConvite] = useState();
  const [conviteRecusado, setConviteRecusado] = useState(false);
  const [conviteAceito, setConviteAceito] = useState(false);

  const [errorMessage, setErrorMessage] = useState();

  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setErrorMessage(error.response.data.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.eventoSlug]);

  const handleGrandeAreaClick = (id) => {
    setGrandesAreasSelecionadas((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((grandeAreaId) => grandeAreaId !== id)
        : [...prev, id];
      //console.log("Grandes Areas Selecionadas Atualizadas:", updated);
      updateAreas(updated);
      if (!updated.includes(id)) {
        setAreasSelecionadas([]);
        setSubsessoesSelecionadas([]);
      }
      return updated;
    });
  };

  const handleAreaClick = (id) => {
    setAreasSelecionadas((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((areaId) => areaId !== id)
        : [...prev, id];
      //console.log("Areas Selecionadas Atualizadas:", updated);

      return updated;
    });
  };

  const handleSubsessaoClick = (id) => {
    setSubsessoesSelecionadas((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((subsId) => subsId !== id)
        : [...prev, id];
      //console.log("Subsessoes Selecionadas Atualizadas:", updated);
      return updated;
    });
  };

  const formatarData = (dataIso) => {
    const data = new Date(dataIso);

    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();

    return `${dia}/${mes}/${ano}`;
  };
  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);

    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");

    return `${horas}h${minutos}`;
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const newData = {
        ...data,
        grandesAreasSelecionadas,
        subsessoesSelecionadas,
        areasSelecionadas,
      };
      const aceite = await aceitarConvite(params.token, newData);
      if (aceite?.convite.status === "ACEITO") {
        console.log(aceite);
        setConviteAceito(true);
        setConvite(aceite);
        setStep(5);
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
      dtNascimento: "",
    },
  });

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        {evento && (
          <div
            className={styles.banner}
            style={{
              backgroundColor: evento?.bgColor ? evento.bgColor : "#FFF",
            }}
          >
            <Image
              priority
              fill
              src={`/image/${evento?.pathBanner}`}
              alt="logo"
              sizes="300 500 700"
            />
          </div>
        )}
        {!evento && (
          <div className={`${styles.box} }`}>
            <NoData description="Link inválido" />
          </div>
        )}
        {convite && (
          <div className={`${styles.box} }`}>
            <div className={`${styles.header}`}>
              <h4>Faça parte do Comitê Avaliador!</h4>
            </div>
            <div className={`${styles.boxContent} `}>
              <p>
                Você recebeu um convite para ser avaliador(a) do{" "}
                <strong>{evento?.nomeEvento}</strong>
              </p>
              <br></br>
              <p>
                As avaliações ocorrerão nos dias{" "}
                <strong>4, 5 e 6 de novembro de 2024 </strong>
                de forma{" "}
                <strong>presencial, no Centro Comunitário Athos Bulcão</strong>,
                localizado no Campus Darcy Ribeiro da Universidade de Brasília.
              </p>
              <form className="mt-2" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className={styles.form}>
                  {step === 0 && (
                    <>
                      {!conviteAceito && (
                        <Button
                          className="btn-primary mt-2"
                          type="button" // submit, reset, button
                          disabled={loading}
                          onClick={() => {
                            setGrandesAreasSelecionadas([]);
                            setAreasSelecionadas([]);
                            setSubsessoesSelecionadas([]);
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
                          type="button" // submit, reset, button
                          disabled={loading}
                          onClick={async () => {
                            setLoading(true);
                            setErrorMessage("");
                            try {
                              await recusarConvite(params.token);
                              setConviteRecusado(true);
                              setStep(0);
                            } catch (error) {
                              setErrorMessage(
                                error.response?.data?.message ??
                                  "Não conseguimos registrar a recusa."
                              );
                            } finally {
                              setLoading(false);
                              setErrorMessage(
                                "Tudo bem! Quem sabe em uma outra oportunidade."
                              );
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
                      <h6>
                        Selecione as GRANDES ÁREAS que você gostaria de avaliar
                      </h6>
                      <div className={styles.grandesAreas}>
                        {grandesAreas.map((item) => (
                          <p
                            key={item.id}
                            className={`${styles.grandeArea} ${
                              grandesAreasSelecionadas.includes(item.id) &&
                              styles.selected
                            }`}
                            onClick={() => handleGrandeAreaClick(item.id)}
                          >
                            {item.grandeArea}
                          </p>
                        ))}
                      </div>
                      <Button
                        className="btn-primary mt-2"
                        type="button" // submit, reset, button
                        disabled={loading}
                        onClick={() => {
                          if (grandesAreasSelecionadas.length > 0) {
                            setStep(2);
                            setErrorMessage();
                          } else {
                            setErrorMessage(
                              "Selecione ao menos uma grande área para avaliar."
                            );
                          }
                        }}
                      >
                        Salvar e continuar
                      </Button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <h6>Agora selecione as ÁREAS de maior interesse</h6>
                      <div className={styles.areas}>
                        {areas.map((item) => (
                          <p
                            key={item.id}
                            className={`${styles.area} ${
                              areasSelecionadas.includes(item.id) &&
                              styles.selected
                            }`}
                            onClick={() => handleAreaClick(item.id)}
                          >
                            {item.area}
                          </p>
                        ))}
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
                      <h6>
                        Escolha as sessões de avaliação que você poderá
                        comparecer:
                      </h6>
                      <div className={styles.subsessoes}>
                        {subsessoes
                          .filter((subs) =>
                            areasSelecionadas.some((areaId) =>
                              subs.areas.some((area) => area.area.id === areaId)
                            )
                          )
                          .map((subs) => (
                            <div
                              key={subs.id}
                              className={`${styles.subsessao} ${
                                subsessoesSelecionadas.includes(subs.id) &&
                                styles.selected
                              }`}
                              onClick={() => handleSubsessaoClick(subs.id)}
                            >
                              <h6>{formatarData(subs.inicio)}</h6>
                              <p>
                                de {formatarHora(subs.inicio)} às{" "}
                                {formatarHora(subs.fim)}
                              </p>
                            </div>
                          ))}
                      </div>
                      <Button
                        className="btn-primary mt-2"
                        type="button" // submit, reset, button
                        disabled={loading}
                        onClick={() => {
                          if (subsessoesSelecionadas.length > 0) {
                            setStep(4);
                            setErrorMessage();
                          } else {
                            setErrorMessage("Selecione ao menos uma sessão.");
                          }
                        }}
                      >
                        Salvar e continuar
                      </Button>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <div className={styles.formInput}>
                        <Input
                          control={control}
                          className="cpf-input"
                          name="cpf"
                          label="CPF"
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
                          name="dtNascimento"
                          label="Data de nascimento"
                          icon={RiCalendarEventLine}
                          inputType="date" // text, password
                          placeholder="Digite sua data de nascimento"
                          disabled={loading}
                        />
                      </div>
                      <div className={`${styles.formInput} mt-2`}>
                        <Input
                          control={control}
                          name="email"
                          label="Digite o email por meio do qual você recebeu o convite"
                          icon={RiAtLine}
                          inputType="email" // text, password
                          placeholder="Digite o email por meio do qual você recebeu o convite"
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
                  {step === 5 && !conviteRecusado && (
                    <div className={styles.conviteAceito}>
                      <div className={`${styles.successMsg}`}>
                        <h3>Aguardamos você!</h3>
                        <div className={styles.successMsgContent}>
                          <div className={styles.boxButton}>
                            <div className={styles.infoBox}>
                              <div className={styles.description}>
                                <div className={styles.infoBoxDescription}>
                                  <h6>
                                    Veja as sessões que você está inscrito como
                                    avaliador(a)
                                  </h6>
                                </div>
                              </div>
                              {convite.convite?.user?.ConviteAvaliadorEvento.map(
                                (con) => {
                                  // Ordena os convites de subsessão pela data de início
                                  const conviteSubsessaoOrdenado =
                                    con.conviteSubsessao.sort((a, b) => {
                                      const dateA = new Date(
                                        a.subsessaoApresentacao.inicio
                                      );
                                      const dateB = new Date(
                                        b.subsessaoApresentacao.inicio
                                      );
                                      return dateA - dateB; // Ordena por data e hora de início
                                    });

                                  // Mapeia e renderiza os itens ordenados
                                  return conviteSubsessaoOrdenado.map(
                                    (item) => (
                                      <div
                                        className={styles.sessao}
                                        key={item.id}
                                      >
                                        <div className={styles.description}>
                                          <div className={styles.icon}>
                                            <RiFlaskLine />
                                          </div>
                                          <div
                                            className={
                                              styles.infoBoxDescription
                                            }
                                          >
                                            <p>
                                              <strong>Sessão: </strong>
                                            </p>
                                            <p>
                                              {
                                                item.subsessaoApresentacao
                                                  .sessaoApresentacao.titulo
                                              }
                                            </p>
                                          </div>
                                        </div>
                                        <div className={styles.description}>
                                          <div className={styles.icon}>
                                            <RiCalendarLine />
                                          </div>
                                          <div
                                            className={
                                              styles.infoBoxDescription
                                            }
                                          >
                                            <p>
                                              <strong>
                                                Início das avaliações:{" "}
                                              </strong>
                                            </p>
                                            <p>
                                              {formatarData(
                                                item.subsessaoApresentacao
                                                  .inicio
                                              )}{" "}
                                              -{" "}
                                              {formatarHora(
                                                item.subsessaoApresentacao
                                                  .inicio
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="btn-error mt-2"
                        type="button" // submit, reset, button
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          setErrorMessage("");
                          try {
                            await recusarConvite(params.token);
                          } catch (error) {
                            setErrorMessage(
                              error.response?.data?.message ??
                                "Não conseguimos registrar a recusa."
                            );
                          } finally {
                            setLoading(false);
                          }
                          setConviteRecusado(true);
                          setErrorMessage(
                            "Tudo bem! Quem sabe em uma outra oportunidade."
                          );
                        }}
                      >
                        Recusar o convite
                      </Button>
                    </div>
                  )}
                  {step > 0 && step < 5 && (
                    <Button
                      className="btn-secondary mt-2"
                      type="button" // submit, reset, button
                      disabled={loading}
                      onClick={() => {
                        setGrandesAreasSelecionadas([]);
                        setAreasSelecionadas([]);
                        setSubsessoesSelecionadas([]);
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
        {errorMessage && (
          <div className={`${styles.errorMsg} mb-3`}>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Page;
