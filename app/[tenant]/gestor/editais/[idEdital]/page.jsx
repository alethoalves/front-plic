"use client";
import styles from "./page.module.scss";
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiCalendarCheckFill,
  RiCalendarCloseLine,
  RiCalendarEventLine,
  RiListCheck2,
  RiSettings4Line,
  RiSettings5Line,
  RiSettingsLine,
  RiSurveyLine,
} from "@remixicon/react";
import Header from "@/components/Header";
import EditalFormularios from "@/components/EditalFormularios";
import EditalAtividades from "@/components/EditalAtividades";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
import { getEdital, updateEdital } from "@/app/api/client/edital";

const Page = ({ params }) => {
  const [value, setValue] = useState(0); // Estado inicial como 0

  const [dates, setDates] = useState({
    inicio: "",
    fim: "",
  });
  const [loading, setLoading] = useState({ inicio: false, fim: false });
  const [edital, setEdital] = useState(null);

  // Buscar dados do edital
  useEffect(() => {
    const fetchEditalData = async () => {
      try {
        const editalData = await getEdital(params.tenant, params.idEdital);
        if (editalData) {
          setEdital(editalData);
          setDates({
            inicio: editalData.inicioInscricao
              ? new Date(editalData.inicioInscricao).toISOString().split("T")[0]
              : "",
            fim: editalData.fimInscricao
              ? new Date(editalData.fimInscricao).toISOString().split("T")[0]
              : "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar edital:", error);
      }
    };

    fetchEditalData();
  }, [params.editalId, params.tenantSlug]);

  const handleDateChange = (type, value) => {
    setDates((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleSaveDate = async (type) => {
    try {
      setLoading((prev) => ({ ...prev, [type]: true }));

      const field = type === "inicio" ? "inicioInscricao" : "fimInscricao";
      const isoDate = dates[type] ? `${dates[type]}T00:00:00.000Z` : null;

      const updatedEdital = await updateEdital(params.tenant, params.idEdital, {
        [field]: isoDate,
      });

      setEdital((prev) => ({
        ...prev,
        [field]: updatedEdital[field],
      }));
    } catch (error) {
      console.error(`Erro ao atualizar ${type}:`, error);
      // Reverter para o valor anterior em caso de erro
      if (edital) {
        setDates((prev) => ({
          ...prev,
          [type]: edital[field]
            ? new Date(edital[field]).toISOString().split("T")[0]
            : "",
        }));
      }
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleIncrease = () => {
    setValue((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setValue((prev) => (prev > 0 ? prev - 1 : 0)); // Evita valores negativos
  };
  return (
    <>
      <Header />
      <div className={styles.content}>
        {false && (
          <div className={styles.head}>
            <div className={styles.headIcon}>
              <RiSettingsLine />
            </div>

            <div className={styles.item}>
              <h5>Configurações gerais</h5>
              <p>
                Defina as restrições deste edital. Uma inscrição poderá ter um
                ou mais orientadores. Além disso, uma inscrição poderá ter ou
                não coorientadores. Uma inscrição deverá ter ao menos um plano
                de trabalho. Todo plano de trabalho deverá ter um aluno, mas a
                indicação do aluno pode ser feita em momento posterior à
                inscrição. Um plano de trabalho poderá ou não estar vinculado a
                um projeto.{" "}
              </p>
              <div className={styles.labelNumber}>
                <label>
                  <p>Quantidade máxima de orientadores por inscrição:</p>
                  <div className={styles.input}>
                    <input
                      type="text"
                      name="numberInput"
                      value={value}
                      readOnly // Impede que o usuário digite diretamente
                    />
                    <div className={styles.controles}>
                      <div className={styles.aumentar} onClick={handleIncrease}>
                        <RiArrowUpSLine />
                      </div>
                      <div className={styles.diminuir} onClick={handleDecrease}>
                        <RiArrowDownSLine />
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
        <div className={styles.head}>
          <div className={styles.headIcon}>
            <RiCalendarEventLine />
          </div>
          <div className={styles.item}>
            <h5>Período de Inscrições</h5>
            <p>Defina o dia de início e fim das inscrições para este edital.</p>

            <div className={styles.labelDate}>
              <label>
                <p>As inscrições começam dia:</p>
                <div className={styles.input}>
                  <div className={styles.icon}>
                    <RiCalendarCheckFill />
                  </div>
                  <input
                    type="date"
                    value={dates.inicio}
                    onChange={(e) => handleDateChange("inicio", e.target.value)}
                  />
                </div>
              </label>
              <Button
                className="mt-1 btn-secondary"
                onClick={() => handleSaveDate("inicio")}
                disabled={loading.inicio}
              >
                {loading.inicio ? "Salvando..." : "Salvar"}
              </Button>
            </div>

            <div className={styles.labelDate}>
              <label>
                <p>As inscrições terminam dia:</p>
                <div className={styles.input}>
                  <div className={styles.icon}>
                    <RiCalendarCloseLine />
                  </div>
                  <input
                    type="date"
                    value={dates.fim}
                    onChange={(e) => handleDateChange("fim", e.target.value)}
                  />
                </div>
              </label>
              <Button
                className="mt-1 btn-secondary"
                onClick={() => handleSaveDate("fim")}
                disabled={loading.fim}
              >
                {loading.fim ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.head}>
          <div className={styles.headIcon}>
            <RiListCheck2 />
          </div>
          <div className={styles.item}>
            <h5>Atividades</h5>
            <p>Aqui você gerencia as atividades deste edital.</p>
            <EditalAtividades params={params} />
          </div>
        </div>
        <div className={styles.head}>
          <div className={styles.headIcon}>
            <RiSurveyLine />
          </div>
          <div className={styles.item}>
            <h5>Formulários Personalizados</h5>
            <p>
              Aqui você gerencia quais formulários serão utilizados neste
              edital.
            </p>
            <EditalFormularios params={params} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
