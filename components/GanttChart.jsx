"use client";
import React from "react";
import styles from "./GanttChart.module.scss";
import { RiDeleteBinLine } from "@remixicon/react";

// Função para converter datas no formato DD/MM/AAAA para Date
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // `month - 1` porque os meses no JS começam em 0
};

const GanttChart = ({ cronograma }) => {
  const dayWidth = 5; // Cada dia corresponde a 5px

  // Determinar a data mínima e máxima no cronograma
  const getMinMaxDates = (activities) => {
    const dates = activities.flatMap((activity) => [
      parseDate(activity.inicio),
      parseDate(activity.fim),
    ]);
    return {
      minDate: new Date(Math.min(...dates)),
      maxDate: new Date(Math.max(...dates)),
    };
  };

  const { minDate, maxDate } = getMinMaxDates(cronograma);

  // Gerar os meses entre minDate e maxDate
  const generateMonths = (startDate, endDate) => {
    const months = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (current <= endDate) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        days: new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0
        ).getDate(),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const months = generateMonths(minDate, maxDate);

  // Calcular a posição inicial e largura da barra
  const calculatePosition = (start, end) => {
    const startDate = parseDate(start);
    const endDate = parseDate(end);

    const daysFromStart = Math.floor(
      (startDate - minDate) / (1000 * 60 * 60 * 24)
    );
    const duration =
      Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    return { left: daysFromStart * dayWidth, width: duration * dayWidth };
  };

  // Ordenar as atividades pelo dia de início
  const sortedCronograma = [...cronograma].sort(
    (a, b) => parseDate(a.inicio) - parseDate(b.inicio)
  );

  return (
    <div className={styles.ganttContainer}>
      {/* Cabeçalho como uma barra contínua com subbarras para os meses */}
      <div className={styles.ganttHeader}>
        {months.map(({ year, month, days }, index) => (
          <div
            key={index}
            className={styles.ganttMonth}
            style={{ width: `${days * dayWidth}px` }}
          >
            <p>
              {new Date(year, month).toLocaleString("pt-BR", {
                month: "short",
              })}{" "}
              {year}
            </p>
          </div>
        ))}
      </div>
      {/* Corpo com as barras */}
      <div className={styles.ganttBody}>
        {sortedCronograma.map((activity, index) => {
          const { left, width } = calculatePosition(
            activity.inicio,
            activity.fim
          );

          return (
            <div key={index} className={styles.ganttRow}>
              <div
                className={styles.ganttBar}
                style={{
                  left: `${left}px`,
                  width: `${width}px`,
                }}
              >
                <span className={styles.ganttBarText}>
                  <p>
                    {activity.nome}
                    {activity.atividade}
                  </p>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttChart;
