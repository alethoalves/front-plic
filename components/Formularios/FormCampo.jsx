//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campoSchema } from "@/lib/zodSchemas/campoSchema";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiAddLine, RiDeleteBinLine, RiSave2Line } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";

//FUNÇÕES
import { createCampo, updateCampo } from "@/app/api/client/campo";

const FormCampo = ({
  tenantSlug,
  formularioId,
  initialData,
  onClose,
  onSuccess,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState("");

  const { control, handleSubmit, setValue, reset, watch } = useForm({
    resolver: zodResolver(campoSchema),
    defaultValues: {
      label: "",
      descricao: "",
      tipo: "",
      maxChar: "200",
      obrigatorio: "true",
      ordem: "1",
      tipoFile: "",
    },
  });
  const tipoValue = watch("tipo"); // Watch the value of 'tipo'
  useEffect(() => {
    console.log(initialData);
    if (initialData) {
      setValue("label", initialData.label);
      setValue("descricao", initialData.descricao);
      setValue("tipo", initialData.tipo || null);
      setValue("tipoFile", initialData.tipoFile);
      setValue("maxChar", initialData.maxChar.toString());
      setValue("obrigatorio", initialData.obrigatorio ? "true" : "false");
      const optionLabels =
        initialData.opcoes?.map((option) => option.label) || null;
      setOptions(optionLabels);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = async (data) => {
    console.log(data);
    setLoading(true);
    setError("");
    try {
      const finalData = { ...data, opcoes: options };
      if (initialData) {
        await updateCampo(tenantSlug, formularioId, initialData.id, finalData);
      } else {
        await createCampo(tenantSlug, formularioId, finalData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleAddOption = () => {
    if (newOption.trim() !== "") {
      setOptions((prevOptions) => [...prevOptions, newOption.trim()]);
      setNewOption(""); // Clear the input after adding
    }
  };

  const handleRemoveOption = (index) => {
    setOptions((prevOptions) => prevOptions.filter((_, i) => i !== index));
  };
  return (
    <form
      className={styles.formulario}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className={styles.input}>
        <Input
          className="mb-2"
          control={control}
          name="label"
          label="Título da pergunta"
          inputType="text"
          placeholder="Digite aqui o título da pergunta"
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="descricao"
          label="Descrição da pergunta, se necessário"
          inputType="text"
          placeholder="Digite aqui a descrição da pergunta"
          disabled={loading}
        />
        <Input
          control={control}
          name="obrigatorio"
          label="Obrigatório"
          inputType="checkbox"
          disabled={loading}
        />
        <Select
          className="mb-2"
          control={control}
          name="tipo"
          label="Tipo de campo"
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "Texto curto", value: "text" },
            { label: "Texto longo", value: "textLong" },
            //{ label: "Palavras-chave", value: "flag" },
            //{ label: "Seleção", value: "select" },
            { label: "Arquivo", value: "arquivo" },
            { label: "Link", value: "link" },
          ]}
          disabled={loading}
        />
        {tipoValue === "arquivo" && (
          <Select
            className="mb-2"
            control={control}
            name="tipoFile"
            label="Tipo de arquivo"
            options={[
              { label: "Selecione um tipo de arquivo", value: "" },
              { label: "pdf", value: "pdf" },
              { label: "xml", value: "xml" },
              { label: "video", value: "video" },
            ]}
            disabled={loading}
          />
        )}
        {tipoValue === "select" && (
          <div className={styles.options}>
            <div className={styles.optionInput}>
              <input
                className="mb-2"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                type="text"
                placeholder="Digite uma nova opção"
                disabled={loading}
              />
              <div className={styles.btn}>
                <Button
                  className="btn-secondary"
                  type="button"
                  onClick={handleAddOption}
                  disabled={loading}
                  icon={RiAddLine}
                />
              </div>
            </div>
            <ul className={styles.optionList}>
              {options.map((option, index) => (
                <li key={index} className={styles.optionItem}>
                  <div className={styles.label}>
                    <p>{option}</p>
                  </div>
                  <div className={styles.btn}>
                    <Button
                      type="button"
                      className="btn-error"
                      onClick={() => handleRemoveOption(index)}
                      disabled={loading}
                      icon={RiDeleteBinLine}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(tipoValue === "text" || tipoValue === "textLong") && (
          <Input
            className="mb-2"
            control={control}
            name="maxChar"
            label="Máximo de caracteres"
            inputType="number"
            placeholder="Informe o número máximo de caracteres"
            disabled={loading}
          />
        )}
      </div>
      <div className={styles.btnSubmit}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Salvar campo"}
        </Button>
      </div>
      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
    </form>
  );
};

export default FormCampo;
