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
import { useState } from "react";

const Page = ({ params }) => {
  const [value, setValue] = useState(0); // Estado inicial como 0

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
        <div className={styles.head}>
          <div className={styles.headIcon}>
            <RiSettingsLine />
          </div>
          <div className={styles.item}>
            <h5>Configurações gerais</h5>
            <p>
              Defina as restrições deste edital. Uma inscrição poderá ter um ou
              mais orientadores. Além disso, uma inscrição poderá ter ou não
              coorientadores. Uma inscrição deverá ter ao menos um plano de
              trabalho. Todo plano de trabalho deverá ter um aluno, mas a
              indicação do aluno pode ser feita em momento posterior à
              inscrição. Um plano de trabalho poderá ou não estar vinculado a um
              projeto.{" "}
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
                  <input type="date" name="dateInput" />
                </div>
              </label>
              <div className={styles.errorLabel}>
                <p>Escolha uma data válida</p>
              </div>
              <Button
                className={"mt-1 btn-secondary"}
                type="button"
                //disabled={loading}
              >
                Salvar
              </Button>
            </div>
            <div className={styles.labelDate}>
              <label>
                <p>As inscrições terminam dia:</p>
                <div className={styles.input}>
                  <div className={styles.icon}>
                    <RiCalendarCloseLine />
                  </div>
                  <input type="date" name="dateInput" />
                </div>
              </label>
              <div className={styles.errorLabel}>
                <p>Escolha uma data válida</p>
              </div>
              <Button
                className={"mt-1 btn-secondary"}
                type="button"
                //disabled={loading}
              >
                Salvar
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
