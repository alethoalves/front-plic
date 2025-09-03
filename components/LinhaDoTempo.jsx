import { Timeline } from "primereact/timeline";
import { getSeverityByStatus } from "../lib/tagUtils";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { useState } from "react";
import styles from "./LinhaDoTempo.module.scss";

export const LinhaTempo = ({ data, onUpdate, tabelaHistorico }) => {
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [dateParts, setDateParts] = useState({
    day: "",
    month: "",
    year: "",
    hour: "",
    minute: "",
  });

  const parseDateString = (dateStr) => {
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    return { day, month, year, hour, minute };
  };

  const formatDateString = ({ day, month, year, hour, minute }) => {
    const pad = (num) => num.toString().padStart(2, "0");
    return `${pad(day)}/${pad(month)}/${year} ${pad(hour)}:${pad(minute)}:00`;
  };

  const handleEditClick = (event) => {
    const { day, month, year, hour, minute } = parseDateString(event.date);
    setCurrentEvent(event);
    setDateParts({ day, month, year, hour, minute });
    setEditDialogVisible(true);
  };

  const handleDateUpdate = () => {
    const newDateStr = formatDateString(dateParts);
    const updatedEvent = {
      ...currentEvent,
      date: newDateStr,
      tabelaHistorico,
      id: currentEvent.id,
    };

    if (onUpdate) {
      onUpdate(updatedEvent);
    }

    setEditDialogVisible(false);
  };

  const renderEditDialog = () => (
    <Dialog
      header="Editar Data e Hora"
      visible={editDialogVisible}
      onHide={() => setEditDialogVisible(false)}
      style={{ width: "450px" }}
    >
      <div className={styles.dataHora}>
        <div className={styles.data}>
          <div className="field col-4">
            <label htmlFor="day">Dia</label>
            <InputNumber
              id="day"
              value={dateParts.day}
              onChange={(e) => setDateParts({ ...dateParts, day: e.value })}
              min={1}
              max={31}
            />
          </div>

          <div className="field col-4">
            <label htmlFor="month">Mês</label>
            <InputNumber
              id="month"
              value={dateParts.month}
              onChange={(e) => setDateParts({ ...dateParts, month: e.value })}
              min={1}
              max={12}
            />
          </div>
          <div className="field col-4">
            <label htmlFor="year">Ano</label>
            <InputNumber
              id="year"
              value={dateParts.year}
              onChange={(e) => setDateParts({ ...dateParts, year: e.value })}
            />
          </div>
        </div>
        <div className={styles.hora}>
          <div className="field col-6">
            <label htmlFor="hour">Hora</label>
            <InputNumber
              id="hour"
              value={dateParts.hour}
              onChange={(e) => setDateParts({ ...dateParts, hour: e.value })}
              min={0}
              max={23}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="minute">Minuto</label>
            <InputNumber
              id="minute"
              value={dateParts.minute}
              onChange={(e) => setDateParts({ ...dateParts, minute: e.value })}
              min={0}
              max={59}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-content-end gap-2 mt-3">
        <Button
          label="Cancelar"
          className="p-button-text"
          onClick={() => setEditDialogVisible(false)}
        />
        <Button
          label="Salvar"
          onClick={handleDateUpdate}
          disabled={!dateParts.day || !dateParts.month || !dateParts.year}
        />
      </div>
    </Dialog>
  );

  return (
    <>
      {data?.length ? (
        <>
          <Timeline
            value={data}
            align="left"
            opposite={(item) =>
              item.isLatest ? (
                <Tag
                  value={item.status}
                  severity={getSeverityByStatus(
                    item.status === "em analise" ? "EM_ANALISE" : item.status
                  )}
                  rounded
                />
              ) : (
                <small>{item.status}</small>
              )
            }
            content={(item) => (
              <div className="flex flex-column">
                <div className="flex align-items-center gap-2">
                  <small className="text-color-secondary">
                    (ID {item.id}) {item.date}
                  </small>
                  {tabelaHistorico && (
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-text p-button-sm"
                      onClick={() => {
                        handleEditClick(item);
                      }}
                      tooltip="Editar data"
                      tooltipOptions={{ position: "top" }}
                    />
                  )}
                </div>
                {item.observacao && (
                  <small>
                    <strong>{item.observacao}</strong>
                  </small>
                )}
              </div>
            )}
          />
          {renderEditDialog()}
        </>
      ) : (
        <small className="text-color-secondary">Sem registros.</small>
      )}
    </>
  );
};
