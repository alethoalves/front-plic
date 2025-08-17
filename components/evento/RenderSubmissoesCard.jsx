import {
  deleteSubmissaoByUser,
  getSubmissoesByCPFAndEvento,
} from "@/app/api/client/eventos";
import formatDateTime from "@/lib/formatData";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";
import { formatarHora } from "@/lib/formatarDatas";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { Accordion, AccordionTab } from "primereact/accordion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export const RenderSubmissoesCard = ({
  params,
  cpf,
  eventoSlug,
  onDeleteSuccess,
  onBack,
}) => {
  const toast = useRef(null);
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  const showSuccess = (message) => {
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: message,
      life: 5000,
    });
  };

  const fetchSubmissoes = async () => {
    try {
      setLoading(true);
      const data = await getSubmissoesByCPFAndEvento(cpf, eventoSlug);
      setSubmissoes(data);
    } catch (error) {
      showError("Erro ao carregar submissões");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteSubmissaoByUser(id, cpf);
      showSuccess("Submissão excluída com sucesso!");
      fetchSubmissoes(); // Recarrega a lista
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      showError("Erro ao excluir submissão");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (cpf && eventoSlug) {
      fetchSubmissoes();
    }
  }, [cpf, eventoSlug]);

  return (
    <>
      <Toast ref={toast} />

      {loading ? (
        <div className="flex justify-content-center">
          <ProgressSpinner />
        </div>
      ) : submissoes.length === 0 ? (
        <Card className="p-2 mt-1">
          {" "}
          <p>Você ainda não tem inscrições!</p>{" "}
        </Card>
      ) : (
        <Accordion
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
          className="mb-3"
        >
          {submissoes[0].Resumo &&
            submissoes.map((submissao, index) => (
              <AccordionTab
                key={submissao.id}
                header={
                  <div>
                    <p>
                      <span>{submissao.Resumo.titulo}</span>{" "}
                      <span>
                        ({submissao.tenant?.sigla} - {submissao.categoria})
                      </span>
                    </p>
                  </div>
                }
              >
                <div>
                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <Card className="p-2 mb-2">
                        <h6 className="mb-1">Detalhes do Resumo</h6>
                        <p>
                          <strong>Instituição:</strong>{" "}
                          {submissao.tenant?.sigla}
                        </p>
                        <p>
                          <strong>Área:</strong> {submissao.Resumo?.area?.area}
                        </p>
                        <p>
                          <strong>Categoria:</strong> {submissao.categoria}
                        </p>
                        <p>
                          <strong>Participantes:</strong>{" "}
                          {submissao.Resumo?.participacoes
                            ?.map(
                              (p) => `${p.user.nome} (${p.cargo.toLowerCase()})`
                            )
                            .join(", ")}
                        </p>
                      </Card>
                    </div>
                    <div className="col-12 md:col-6">
                      <Card className="p-2 mb-2">
                        <h6 className="mb-1">Dados da Apresentação</h6>
                        <p>
                          <strong>Sessão:</strong>{" "}
                          {submissao.subsessao?.sessaoApresentacao?.titulo}
                        </p>
                        <p>
                          <strong>Data:</strong>{" "}
                          {formatDateForDisplay(submissao.subsessao?.inicio)}
                        </p>
                        <p>
                          <strong>Hora:</strong>{" "}
                          {formatarHora(submissao.subsessao?.inicio)}
                        </p>
                        <p>
                          <strong>Local:</strong> {submissao.subsessao?.local}
                        </p>
                      </Card>
                    </div>
                  </div>
                  <div className="flex justify-content-end gap-2 mt-3">
                    <Button
                      label="Excluir"
                      severity="danger"
                      loading={deletingId === submissao.id}
                      onClick={() => handleDelete(submissao.id)}
                      className="p-button-sm w-100"
                    />
                    <Link
                      href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/publicacoes/${submissao.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button p-button-sm "
                    >
                      <p>Ver resumo</p>
                    </Link>
                  </div>
                </div>
              </AccordionTab>
            ))}
        </Accordion>
      )}
    </>
  );
};
