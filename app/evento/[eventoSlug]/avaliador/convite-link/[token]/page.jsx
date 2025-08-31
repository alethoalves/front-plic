// app/avaliador/[eventoSlug]/[tokenConvite]/page.js
"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { conviteAvaliadorSchema } from "@/lib/zodSchemas/conviteAvaliadorSchema";
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
import {
  aceitarConvite,
  getEventoByTokenConvite,
} from "@/app/api/client/conviteEvento";
import NoData from "@/components/NoData";
import { useRouter } from "next/navigation";

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
  const [cadastroSucesso, setCadastroSucesso] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const [convite, setConvite] = useState();
  const [conviteAceito, setConviteAceito] = useState();
  // Formulário
  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(conviteAvaliadorSchema),
    defaultValues: {
      cpf: "",
      dtNascimento: "",
      email: "",
    },
  });

  // Buscar dados do evento ao carregar a página
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventoData = await getEventoByTokenConvite(params.token);
        setEvento(eventoData);

        // Extrair grandes áreas, áreas e subsessões
        const uniqueGrandesAreas = [];
        const grandesAreasSet = new Set();

        eventoData.sessao.forEach((sessao) => {
          sessao.sessaoArea.forEach((sessaoArea) => {
            const grandeArea = sessaoArea.area.grandeArea;
            if (!grandesAreasSet.has(grandeArea.id)) {
              grandesAreasSet.add(grandeArea.id);
              uniqueGrandesAreas.push(grandeArea);
            }
          });
        });

        setGrandesAreas(uniqueGrandesAreas);

        // Extrair subsessões
        const subsessoesApresentacao = eventoData.sessao.flatMap((sessao) =>
          sessao.subsessaoApresentacao.map((subsessao) => ({
            ...subsessao,
            areas: sessao.sessaoArea,
          }))
        );

        setSubsessoes(subsessoesApresentacao);
      } catch (error) {
        console.error("Erro ao buscar evento:", error);
        setErrorMessage(error.message || "Evento não encontrado");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.token]);

  // Atualizar áreas quando grandes áreas são selecionadas
  useEffect(() => {
    if (grandesAreasSelecionadas.length > 0) {
      const uniqueAreas = [];
      const areasSet = new Set();

      subsessoes.forEach((subs) => {
        subs.areas.forEach((area) => {
          if (grandesAreasSelecionadas.includes(area.area.grandeArea.id)) {
            if (!areasSet.has(area.area.id)) {
              areasSet.add(area.area.id);
              uniqueAreas.push(area.area);
            }
          }
        });
      });

      setAreas(uniqueAreas);
    } else {
      setAreas([]);
      setAreasSelecionadas([]);
      setSubsessoesSelecionadas([]);
    }
  }, [grandesAreasSelecionadas, subsessoes]);

  // Funções para manipular seleções
  const handleGrandeAreaClick = (id) => {
    setGrandesAreasSelecionadas((prev) =>
      prev.includes(id)
        ? prev.filter((grandeAreaId) => grandeAreaId !== id)
        : [...prev, id]
    );
  };

  const handleAreaClick = (id) => {
    setAreasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((areaId) => areaId !== id) : [...prev, id]
    );
  };

  const handleSubsessaoClick = (id) => {
    setSubsessoesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((subsId) => subsId !== id) : [...prev, id]
    );
  };

  // Formatadores de data/hora
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

  const router = useRouter();

  // Enviar formulário
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
      router.replace(
        `/evento/cicdf25/avaliador/convite/${aceite.convite.token}`
      );
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

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
              <h4>Cadastro de Avaliador</h4>
            </div>
            <div className={`${styles.boxContent} `}>
              <p>
                Preencha o formulário para se cadastrar como avaliador(a) do{" "}
                <strong>{evento?.nomeEvento}</strong>
              </p>

              <form className="mt-2" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className={styles.form}>
                  {step === 0 && (
                    <>
                      <Button
                        className="btn-primary mt-2"
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setGrandesAreasSelecionadas([]);
                          setAreasSelecionadas([]);
                          setSubsessoesSelecionadas([]);
                          setStep(1);
                          setErrorMessage("");
                        }}
                      >
                        Iniciar Cadastro
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
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (grandesAreasSelecionadas.length > 0) {
                            setStep(2);
                            setErrorMessage("");
                          } else {
                            setErrorMessage(
                              "Selecione ao menos uma grande área para avaliar."
                            );
                          }
                        }}
                      >
                        Continuar
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
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (areasSelecionadas.length > 0) {
                            setStep(3);
                            setErrorMessage("");
                          } else {
                            setErrorMessage(
                              "Selecione ao menos uma área de interesse."
                            );
                          }
                        }}
                      >
                        Continuar
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
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (subsessoesSelecionadas.length > 0) {
                            setStep(4);
                            setErrorMessage("");
                          } else {
                            setErrorMessage("Selecione ao menos uma sessão.");
                          }
                        }}
                      >
                        Continuar
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
                          inputType="text"
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
                          inputType="date"
                          placeholder="Digite sua data de nascimento"
                          disabled={loading}
                        />
                      </div>
                      <div className={`${styles.formInput} mt-2`}>
                        <Input
                          control={control}
                          name="email"
                          label="Email"
                          icon={RiAtLine}
                          inputType="email"
                          placeholder="Digite seu email"
                          disabled={loading}
                        />
                      </div>

                      <Button
                        className="btn-primary mt-2"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Processando..." : "Finalizar Cadastro"}
                      </Button>
                    </>
                  )}
                  {step === 5 && cadastroSucesso && (
                    <div className={styles.successMsg}>
                      <h3>Cadastro realizado com sucesso!</h3>
                      <p>
                        Obrigado por se cadastrar como avaliador do{" "}
                        {evento.nomeEvento}.
                      </p>
                    </div>
                  )}
                  {errorMessage && (
                    <div className={`${styles.errorMsg} mb-3`}>
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  {step > 0 && step < 5 && (
                    <Button
                      className="btn-secondary mt-2"
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setStep(step - 1);
                        setErrorMessage("");
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
        <div className={styles.content}>
          {loading ? (
            <div className={`${styles.box} } p-3`}>
              <p>Carregando...</p>
            </div>
          ) : (
            <div className={`${styles.box} }`}>
              <div className="w-100">
                <NoData description="Token inválido" />
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Page;
