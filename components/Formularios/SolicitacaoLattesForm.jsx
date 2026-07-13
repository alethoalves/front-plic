"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MultiSelect } from "primereact/multiselect";
import styles from "@/components/Formularios/Form.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Notification } from "@/components/Notification";
import { RiAtLine, RiLinksLine, RiLock2Line, RiPhoneLine } from "@remixicon/react";
import {
  solicitacaoLattesCadastroSchema,
  solicitacaoLattesSoLattesSchema,
} from "@/lib/zodSchemas/avaliadorLattesSchema";
import { solicitarAnaliseLattes } from "@/app/api/client/avaliador";
import { getAreas } from "@/app/api/client/area";

const SolicitacaoLattesForm = ({
  tenant,
  ano,
  cpf,
  dtNascimento,
  precisaCadastro,
  onSubmitted,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [areaOpcoes, setAreaOpcoes] = useState([]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areas = await getAreas();
        setAreaOpcoes(
          (areas || [])
            .slice()
            .sort((a, b) => a.area.localeCompare(b.area))
            .map((area) => ({ label: area.area, value: area.id }))
        );
      } catch (error) {
        console.error("Erro ao buscar áreas:", error);
      }
    };
    fetchAreas();
  }, []);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(
      precisaCadastro ? solicitacaoLattesCadastroSchema : solicitacaoLattesSoLattesSchema
    ),
    defaultValues: {
      linkLattes: "",
      areaIds: [],
      email: "",
      celular: "",
      senha: "",
      confirmacaoSenha: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const resp = await solicitarAnaliseLattes(tenant, ano, {
        cpf,
        dtNascimento,
        linkLattes: data.linkLattes,
        areaIds: data.areaIds,
        ...(precisaCadastro
          ? {
              email: data.email,
              celular: data.celular,
              senha: data.senha,
              confirmacaoSenha: data.confirmacaoSenha,
            }
          : {}),
      });
      if (resp?.status === "success") {
        onSubmitted?.();
      } else {
        setErrorMessage(resp?.message ?? "Não foi possível enviar a solicitação.");
      }
    } catch (error) {
      console.error("Erro ao solicitar análise de Lattes:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      <h6 className="mb-2">
        {precisaCadastro ? "Complete seu cadastro" : "Informe seu Currículo Lattes"}
      </h6>
      <p className="mb-2">
        Sua titulação de doutorado ainda não está confirmada no sistema.
        Informe o link do seu Currículo Lattes para análise do gestor.
      </p>
      <div className={styles.input}>
        <Input
          control={control}
          name="linkLattes"
          label="Link do Currículo Lattes"
          icon={RiLinksLine}
          inputType="text"
          placeholder="http://lattes.cnpq.br/9422683454020933"
          disabled={loading}
        />
      </div>
      <div className={`${styles.input} mt-2`}>
        <label>
          <p className="mb-1">Áreas de interesse em avaliar</p>
        </label>
        <Controller
          name="areaIds"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <MultiSelect
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={areaOpcoes}
                placeholder="Selecione as áreas"
                display="chip"
                filter
                disabled={loading}
                style={{ width: "100%" }}
              />
              {fieldState.error?.message && (
                <Notification className="notification-error mt-1">
                  {fieldState.error.message}
                </Notification>
              )}
            </>
          )}
        />
      </div>
      {precisaCadastro && (
        <>
          <div className={`${styles.input} mt-2`}>
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
          <div className={`${styles.input} mt-2`}>
            <Input
              control={control}
              name="celular"
              label="Celular"
              icon={RiPhoneLine}
              inputType="phone"
              placeholder="Informe seu celular"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input} mt-2`}>
            <Input
              control={control}
              name="senha"
              label="Senha"
              icon={RiLock2Line}
              inputType="password"
              placeholder="Crie uma senha"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input} mt-2`}>
            <Input
              control={control}
              name="confirmacaoSenha"
              label="Confirme sua senha"
              icon={RiLock2Line}
              inputType="password"
              placeholder="Confirme a senha"
              disabled={loading}
            />
          </div>
        </>
      )}
      {errorMessage && (
        <Notification className="notification-error">{errorMessage}</Notification>
      )}
      <Button className="btn-primary mt-2" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar para análise"}
      </Button>
    </form>
  );
};

export default SolicitacaoLattesForm;
