import { Timeline } from "primereact/timeline";
import { getSeverityByStatus } from "./tagUtils";
import { Tag } from "primereact/tag";

export const LinhaTempo = ({ data }) =>
    data?.length ? (
      <Timeline
        value={data}
        align="left"
        opposite={(item) =>
          item.isLatest ? (
            <Tag
              value={item.status}
              severity={getSeverityByStatus(
                item.status === "em analise" ? "EM_ANALISE" : item.status
              )} // ou use getSeverityByStatus
              rounded
            />
          ) : (
            <small>{item.status}</small>
          )
        }
        content={(i) => (
          <div className="flex flex-column">
            <small className="text-color-secondary">{i.date}</small>
            {i.observacao && (
              <small className="mt-1">
                <strong>{i.observacao}</strong>
              </small>
            )}
          </div>
        )}
      />
    ) : (
      <small className="text-color-secondary">Sem registros.</small>
    );