"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getEventoBySlug } from "@/app/api/client/eventos";
import { useForm } from "react-hook-form";
import { cpfValidatorSchema } from "@/lib/zodSchemas/cpfValidatorSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import { RiIdCardLine } from "@remixicon/react";
import Button from "@/components/Button";
import { getAreas } from "@/app/api/client/area";

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

  const [errorMessage, setErrorMessage] = useState();

  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const evento = await getEventoBySlug(params.eventoSlug);
        setEvento(evento);
        console.log("Evento:", evento);

        // Filtrar apenas as subsessões
        const subsessoesApresentacao = evento.sessao.flatMap((sessao) =>
          sessao.subsessaoApresentacao.map((subsessao) => ({
            ...subsessao,
            areas: sessao.sessaoArea,
          }))
        );
        console.log("Subsessoes de Apresentacao:", subsessoesApresentacao);
        setSubsessoes(subsessoesApresentacao);

        // Extraindo grandes áreas sem repetir
        const uniqueGrandesAreas = [];
        const grandesAreasSet = new Set();

        subsessoesApresentacao.forEach((subs) => {
          subs.areas.forEach((area) => {
            const grandeArea = area.area.grandeArea;
            if (!grandesAreasSet.has(grandeArea.id)) {
              grandesAreasSet.add(grandeArea.id);
              uniqueGrandesAreas.push(grandeArea);
            }
          });
        });

        setGrandesAreas(uniqueGrandesAreas);
        console.log("Grandes Areas Unicas:", uniqueGrandesAreas);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setErrorMessage("Erro ao buscar eventos.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.eventoSlug]);

  const updateAreas = (selectedGrandesAreas) => {
    console.log(
      "Atualizando Areas com as Grandes Areas Selecionadas:",
      selectedGrandesAreas
    );
    const uniqueAreas = [];
    const areasSet = new Set();

    subsessoes.forEach((subs) => {
      subs.areas.forEach((area) => {
        if (selectedGrandesAreas.includes(area.area.grandeArea.id)) {
          if (!areasSet.has(area.area.id)) {
            areasSet.add(area.area.id);
            uniqueAreas.push(area.area);
          }
        }
      });
    });

    setAreas(uniqueAreas);
    console.log("Areas Atualizadas:", uniqueAreas);
  };

  const updateSubsessoes = (selectedAreas) => {
    console.log(
      "Atualizando Subsessoes com as Areas Selecionadas:",
      selectedAreas
    );
    const filteredSubsessoes = subsessoes.filter((subs) =>
      subs.areas.some(
        (area) =>
          grandesAreasSelecionadas.includes(area.area.grandeArea.id) &&
          selectedAreas.includes(area.area.id)
      )
    );
    setSubsessoes(filteredSubsessoes);
    console.log("Subsessoes Atualizadas:", filteredSubsessoes);
  };

  const handleGrandeAreaClick = (id) => {
    setGrandesAreasSelecionadas((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((grandeAreaId) => grandeAreaId !== id)
        : [...prev, id];
      console.log("Grandes Areas Selecionadas Atualizadas:", updated);
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
      console.log("Areas Selecionadas Atualizadas:", updated);

      return updated;
    });
  };

  const handleSubsessaoClick = (id) => {
    setSubsessoesSelecionadas((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((subsId) => subsId !== id)
        : [...prev, id];
      console.log("Subsessoes Selecionadas Atualizadas:", updated);
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
      // lógica para submissão do formulário
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
    resolver: zodResolver(cpfValidatorSchema),
    defaultValues: {
      cpf: "",
    },
  });

  return (
    <main className={styles.main}>
      {evento ? (
        <div className={styles.content}>
          <div
            className={styles.banner}
            style={{
              backgroundColor: evento?.bgColor ? evento.bgColor : "#FFF",
            }}
          >
            <Image
              priority
              fill
              src={`/image/${evento.pathBanner}`}
              alt="logo"
              sizes="300 500 700"
            />
          </div>
          <div className={`${styles.box} }`}>
            <div className={`${styles.header}`}>
              <h4>Faça parte do Comitê Avaliador!</h4>
            </div>
            <div className={`${styles.boxContent} `}>
              <p>
                Você recebeu um convite para ser avaliador(a) do{" "}
                {evento?.nomeEvento}
              </p>
              <br></br>
              <p>
                As avaliações ocorrerão nos dias 4, 5 e 6 de novembro de 2024 de
                forma presencial no Centro Comunitário Athos Bulcão localizado
                no Campus Darcy Ribeiro da Universidade de Brasília.
              </p>
              <form className="mt-2" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className={styles.form}>
                  {step === 0 && (
                    <>
                      <Button
                        className="btn-primary mt-2"
                        type="button" // submit, reset, button
                        disabled={loading}
                        onClick={() => {
                          setGrandesAreasSelecionadas([]);
                          setAreasSelecionadas([]);
                          setSubsessoesSelecionadas([]);
                          setStep(1);
                        }}
                      >
                        Aceitar o convite
                      </Button>
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
                      <h6>
                        Escolha as sessões de avaliação que você poderá
                        comparecer:
                      </h6>
                      <div className={styles.subsessoes}>
                        {subsessoes
                          .filter((subs) =>
                            grandesAreasSelecionadas.some((grandeAreaId) =>
                              subs.areas.some(
                                (area) =>
                                  area.area.grandeAreaId === grandeAreaId
                              )
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
                            setStep(3);
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
                  {step === 3 && (
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
                            setStep(4);
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

                      <Button
                        className="btn-primary mt-2"
                        type="submit" // submit, reset, button
                        disabled={loading}
                      >
                        Aceitar convite
                      </Button>
                    </>
                  )}

                  {errorMessage && (
                    <div className={styles.errorMsg}>
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  {step > 0 && (
                    <Button
                      className="btn-secondary mt-2"
                      type="button" // submit, reset, button
                      disabled={loading}
                      onClick={() => {
                        setGrandesAreasSelecionadas([]);
                        setAreasSelecionadas([]);
                        setSubsessoesSelecionadas([]);
                        setStep(0);
                      }}
                    >
                      Voltar
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <p>Carregando...</p>
      )}
    </main>
  );
};

export default Page;
