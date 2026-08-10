import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import Input from "../Input";
import { RiIdCardLine } from "@remixicon/react";
import { cpfVerificationForInscricao } from "@/app/api/client/eventos";
import Select2 from "../Select2";

export const RenderParticipantesCard = ({
  cpf,
  type,
  proponenteUserId,
  initialParticipantes = [],
  onSaveParticipantes,
}) => {
  const toast = useRef(null);

  const [loading, setLoading] = useState(false);
  const [participantes, setParticipantes] = useState(initialParticipantes);
  const [nomeParticipante, setNomeParticipante] = useState("");
  const [cpfVerificado, setCpfVerificado] = useState(false);
  const [cpfParticipante, setCpfParticipante] = useState("");
  const [cpfParticipanteUserId, setCpfParticipanteUserId] = useState(null);
  // Participantes pré-preenchidos a partir de um plano/projeto não trazem
  // `cpf` (só `userId`) — a resposta de getPlanosOuProjetos não expõe mais
  // CPF de terceiros. `limparCPF` precisa tolerar isso.
  const limparCPF = (cpf) => {
    return cpf ? cpf.replace(/\D/g, "") : null;
  };
  const mesmoParticipante = (a, b) =>
    a?.userId != null && b?.userId != null
      ? a.userId === b.userId
      : limparCPF(a?.cpf) === limparCPF(b?.cpf) && limparCPF(a?.cpf) !== null;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      cpf: "",
      tipo: "",
    },
  });
  // Determina quais participantes são iniciais e não podem ser removidos
  const isParticipanteInicial = (participante) => {
    if (type !== "PLANO" && type !== "PROJETO") return false;
    return initialParticipantes.some((p) => mesmoParticipante(p, participante));
  };
  const tiposParticipante = [
    { label: "AUTOR", value: "AUTOR" },
    { label: "COAUTOR", value: "COAUTOR" },
    { label: "ORIENTADOR", value: "ORIENTADOR" },
    { label: "COORIENTADOR", value: "COORIENTADOR" },
    { label: "COLABORADOR", value: "COLABORADOR" },
  ];

  const tipoSelecionado = watch("tipo");

  const verificarCPF = async (cpf) => {
    const cpfLimpo = limparCPF(cpf);

    if (participantes.some((p) => p.cpf && limparCPF(p.cpf) === cpfLimpo)) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Este CPF já foi adicionado à lista de participantes",
        life: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await cpfVerificationForInscricao(cpf);

      if (participantes.some((p) => p.userId === response.id)) {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Este CPF já foi adicionado à lista de participantes",
          life: 5000,
        });
        return;
      }

      setNomeParticipante(response.nome);
      setCpfParticipante(cpf);
      setCpfParticipanteUserId(response.id);
      setCpfVerificado(true);
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "CPF verificado com sucesso",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Erro ao verificar CPF",
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarParticipante = (data) => {
    if (!data.tipo) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Selecione um tipo para o participante",
        life: 5000,
      });
      return;
    }

    const novoParticipante = {
      cpf: cpfParticipante,
      userId: cpfParticipanteUserId,
      nome: nomeParticipante,
      tipo: data.tipo,
    };

    if (participantes.some((p) => mesmoParticipante(p, novoParticipante))) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Este CPF já foi adicionado à lista de participantes",
        life: 5000,
      });
      return;
    }

    setParticipantes([...participantes, novoParticipante]);
    reset({
      cpf: "",
      tipo: "",
    });
    setNomeParticipante("");
    setCpfParticipante("");
    setCpfParticipanteUserId(null);
    setCpfVerificado(false);
  };

  const removerParticipante = (participanteRemovido) => {
    setParticipantes(
      participantes.filter((p) => !mesmoParticipante(p, participanteRemovido)),
    );
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: "Participante removido",
      life: 3000,
    });
  };

  const canSave = () => {
    const hasMainParticipant = participantes.some((p) =>
      mesmoParticipante(p, { userId: proponenteUserId, cpf }),
    );
    const hasAluno = participantes.some((p) => p.tipo === "AUTOR");
    const hasOrientador = participantes.some((p) => p.tipo === "ORIENTADOR");

    return (
      participantes.length > 0 &&
      hasMainParticipant &&
      hasAluno &&
      hasOrientador
    );
  };

  const salvarParticipantes = () => {
    if (!canSave()) {
      if (
        !participantes.some((p) =>
          mesmoParticipante(p, { userId: proponenteUserId, cpf }),
        )
      ) {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Você deve incluir pelo menos um participante com seu CPF",
          life: 5000,
        });
        return;
      }

      if (
        !participantes.some((p) => p.tipo === "AUTOR" || p.tipo === "COAUTOR")
      ) {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "É necessário ter pelo menos um aluno (AUTOR ou COAUTOR)",
          life: 5000,
        });
        return;
      }

      if (
        !participantes.some(
          (p) => p.tipo === "ORIENTADOR" || p.tipo === "COORIENTADOR",
        )
      ) {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail:
            "É necessário ter pelo menos um orientador (ORIENTADOR ou COORIENTADOR)",
          life: 5000,
        });
        return;
      }
    }

    onSaveParticipantes(participantes);
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: "Participantes salvos com sucesso",
      life: 3000,
    });
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <div className="flex flex-column gap-3">
        <div className="card">
          <h6 className="mb-1">Participantes Adicionados</h6>
          {participantes.length === 0 ? (
            <p>Nenhum participante adicionado</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {participantes.map((participante) => {
                const isInicial = isParticipanteInicial(participante);
                return (
                  <li
                    key={participante.userId ?? participante.cpf}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      borderBottom: "1px solid #eee",
                      backgroundColor: isInicial ? "#f8f9fa" : "transparent",
                    }}
                  >
                    <div>
                      <p>
                        <strong>{participante.nome}</strong> -{" "}
                        {participante.tipo}
                      </p>
                    </div>
                    {!isInicial && (
                      <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-danger p-button-sm"
                        onClick={() => removerParticipante(participante)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <form onSubmit={handleSubmit(adicionarParticipante)}>
          <div className="flex flex-column gap-2">
            <Input
              control={control}
              name="cpf"
              label="Se necessário, inclua outros participantes indicando o CPF"
              icon={RiIdCardLine}
              inputType="text"
              placeholder="Digite o CPF"
              rules={{
                required: "CPF é obrigatório",
                validate: (value) => {
                  const cpfLimpo = limparCPF(value);
                  if (
                    participantes.some((p) => limparCPF(p.cpf) === cpfLimpo)
                  ) {
                    return "Este CPF já foi adicionado";
                  }
                  return true;
                },
              }}
              disabled={cpfVerificado}
            />

            {!cpfVerificado && (
              <Button
                label={loading ? "Verificando..." : "Verificar CPF"}
                type="button"
                loading={loading}
                onClick={handleSubmit((data) => verificarCPF(data.cpf))}
              />
            )}

            {nomeParticipante && (
              <div className="field">
                <label htmlFor="nomeParticipante" className="block">
                  Nome
                </label>
                <div className="p-inputgroup">
                  <input
                    id="nomeParticipante"
                    value={nomeParticipante}
                    readOnly
                    className="p-inputtext"
                    placeholder="Nome do participante"
                  />
                </div>
              </div>
            )}

            {cpfVerificado && (
              <>
                <Select2
                  control={control}
                  name="tipo"
                  options={tiposParticipante}
                  label="Tipo de Participante*"
                  rules={{ required: "Tipo é obrigatório" }}
                  value={tipoSelecionado}
                  onChange={(value) => setValue("tipo", value)}
                  extendedOpt={true}
                />
                {errors.tipo && (
                  <small className="p-error">{errors.tipo.message}</small>
                )}

                <div className="flex justify-content-end gap-1">
                  <Button
                    label="Cancelar"
                    severity="secondary"
                    type="button"
                    onClick={() => {
                      reset();
                      setNomeParticipante("");
                      setCpfParticipante("");
                      setCpfParticipanteUserId(null);
                      setCpfVerificado(false);
                    }}
                  />
                  <Button
                    label="Adicionar Participante"
                    type="submit"
                    disabled={!nomeParticipante || !tipoSelecionado}
                  />
                </div>
              </>
            )}
          </div>
        </form>

        <div className="flex flex-column gap-2">
          <div className="card p-3">
            <h6>Requisitos:</h6>
            <ul className="m-0">
              <li>
                <p
                  className={
                    participantes.some((p) =>
                      mesmoParticipante(p, { userId: proponenteUserId, cpf }),
                    )
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  • Pelo menos um participante deve ser você (CPF: {cpf})
                </p>
              </li>
              <li>
                <p
                  className={
                    participantes.some((p) => p.tipo === "AUTOR")
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  • Pelo menos um aluno (AUTOR)
                </p>
              </li>
              <li>
                <p
                  className={
                    participantes.some((p) => p.tipo === "ORIENTADOR")
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  • Pelo menos um orientador
                </p>
              </li>
            </ul>
          </div>

          <div className="flex justify-content-end">
            <Button
              label="Salvar Participantes"
              onClick={salvarParticipantes}
              disabled={!canSave()}
            />
          </div>
        </div>
      </div>
    </>
  );
};
