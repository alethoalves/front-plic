import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { useRef } from "react";

export const RenderPlanoCard = ({ plano }) => {
  const toast = useRef(null);
  return (
    <>
      {" "}
      <Toast ref={toast} position="top-right" />
      <Card key={plano.id} className="w-100 mb-4 p-2">
        <div className="flex flex-column gap-2">
          <div className="mt-1 mb-1">
            <p>
              <strong>ID: </strong>
              {plano.id}
            </p>
          </div>
          <div className="mb-1">
            <p>
              <strong>{plano.titulo}</strong>
            </p>
          </div>

          {plano.area && (
            <div className="mb-1">
              <p>
                <strong>Área: </strong>
                {plano.area.area}
              </p>
            </div>
          )}

          {plano.inscricao.participacoes.length > 0 && (
            <div className="mb-1">
              <p>
                <strong>Orientadores: </strong>
              </p>
              <ul className="mt-1">
                {plano.inscricao.participacoes.map((p, index) => (
                  <li key={index}>
                    <p>{p.user?.nome}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plano?.participacoes?.length > 0 && (
            <div>
              <p>
                <strong>Alunos: </strong>
              </p>
              <ul className="mt-1">
                {plano.participacoes.map((p, index) => (
                  <li key={index}>
                    <p>
                      {p.user?.nome} ({p.statusParticipacao.toLowerCase()})
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex justify-content-end">
            <Button
              label="Selecionar"
              icon="pi pi-check"
              className="w-100"
              onClick={() => {
                console.log("Plano selecionado:", plano.id);
                toast.current.show({
                  severity: "success",
                  summary: "Sucesso",
                  detail: "Plano selecionado com sucesso!",
                  life: 3000,
                });
              }}
            />
          </div>
        </div>
      </Card>
    </>
  );
};
