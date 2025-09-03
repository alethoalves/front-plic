import { getRegistrosAtividadePorPlano } from "@/app/api/client/eventos";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";

export const RenderPlanoCard = ({
  plano,
  type,
  onPlanoSelected,
  eventoSlug,
}) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const handleSelecionarClick = async () => {
    setLoading(true);
    try {
      let response = [];
      if (type === "PLANO") {
        // Chamar a API para obter os registros de atividade
        response = await getRegistrosAtividadePorPlano(plano.id, eventoSlug);

        // Verificar se há registros de atividade
        if (response.data && typeof response.data === "object") {
          // Converter o objeto em array para facilitar a iteração
          const registrosArray = Object.values(response.data).filter(
            (item) => item && typeof item === "object" && item.id
          ); // Filtra apenas os objetos válidos

          // Verificar cada registro
          for (const registro of registrosArray) {
            if (registro.respostas.length === 0) {
              // Mostrar toast de erro para atividades obrigatórias não enviadas
              toast.current.show({
                severity: "error",
                summary: "Atividade obrigatória",
                detail: `${registro.atividade.titulo} é uma atividade obrigatória e não foi enviada. Entre em www.plic.app/${response.data.slugTenant} para enviá-la e concluir sua inscrição.`,
                life: 10000, // 10 segundos
              });
              return; // Interrompe o processo
            }
          }
        }
      }
      // Notificar o componente pai sobre a seleção (se tudo estiver ok)
      if (onPlanoSelected) {
        onPlanoSelected(plano, response.data);
      }

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Plano selecionado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao buscar registros de atividade:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar detalhes do plano",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {" "}
      <Toast ref={toast} position="top-right" />
      <Card key={plano.id} className="w-100 mb-4 p-2">
        <div className="flex flex-column gap-1">
          <div>
            <p>
              <strong>ID: </strong>
              {plano.id}
            </p>
          </div>
          {type === "PLANO" && (
            <>
              <div>
                <p>
                  <strong>{plano.titulo}</strong>
                </p>
              </div>

              {plano.area && (
                <div>
                  <p>
                    <strong>Área: </strong>
                    {plano.area.area}
                  </p>
                </div>
              )}

              {plano.inscricao.participacoes.length > 0 && (
                <div>
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
            </>
          )}
          {type === "PROJETO" && (
            <>
              <div>
                <p>
                  <strong>{plano.projeto.titulo}</strong>
                </p>
              </div>

              {plano.projeto.area && (
                <div>
                  <p>
                    <strong>Área: </strong>
                    {plano.projeto.area.area}
                  </p>
                </div>
              )}

              {plano.inscricao.participacoes.length > 0 && (
                <div>
                  <p>
                    <strong>Orientadores: </strong>
                  </p>
                  <ul className="mt-1">
                    {plano.inscricao.participacoes
                      .filter((p) => p.tipo === "orientador")
                      .map((p, index) => (
                        <li key={index}>
                          <p>{p.user?.nome}</p>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {plano?.inscricao.participacoes?.length > 0 && (
                <div>
                  <p>
                    <strong>Alunos: </strong>
                  </p>
                  <ul className="mt-1">
                    {plano.inscricao.participacoes
                      .filter((p) => p.tipo === "aluno")
                      .map((p, index) => (
                        <li key={index}>
                          <p>{p.user?.nome}</p>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="flex justify-content-end">
            <Button
              label="Selecionar"
              icon={loading ? null : "pi pi-check"} // Remova o ícone quando estiver carregando
              className="w-100"
              onClick={handleSelecionarClick}
              disabled={loading} // Desative o botão durante o loading
            >
              {loading && (
                <ProgressSpinner
                  style={{ width: "20px", height: "20px" }}
                  strokeWidth="6"
                  animationDuration=".5s"
                />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
