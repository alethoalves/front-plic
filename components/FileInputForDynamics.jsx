import { useState } from "react";
import styles from "./FileInput.module.scss";
import Link from "next/link";
import { RiEyeLine } from "@remixicon/react";

const FileInput = ({
  campo,
  register,
  errors,
  handleOnChange,
  watch,
  loading,
}) => {
  // Desestruturamos o retorno do register para poder combinar o onChange do RHF com o nosso.
  const {
    ref,
    onChange: formOnChange,
    ...restRegister
  } = register(`camposDinamicos.campo_${campo.id}`, {
    required: campo.obrigatorio ? "Campo obrigatório!" : false,
  });

  // Utiliza o watch para observar o valor do campo de arquivo
  const watchedFile = watch(`camposDinamicos.campo_${campo.id}`);
  const hasValue =
    (typeof watchedFile === "string" && watchedFile.length > 0) ||
    (watchedFile instanceof FileList && watchedFile.length > 0);

  // Função para extrair o nome do arquivo
  const extractFileName = (url) => {
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.split("_")[1] || lastPart;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    // Chama o onChange do React Hook Form para manter a integração
    formOnChange(e);
    // Se uma função extra foi passada via prop, também a executa
    if (handleOnChange) {
      handleOnChange(e);
    }
  };

  return (
    <div className={styles.fileInputContainer}>
      <label
        htmlFor={`camposDinamicos.campo_${campo.id}`}
        className={styles.label}
      >
        <p>{campo.label}</p>
        {errors?.camposDinamicos?.[`campo_${campo.id}`] && (
          <p className={styles.errorMsg}>
            {errors.camposDinamicos[`campo_${campo.id}`].message}
          </p>
        )}
        {hasValue && (
          <>
            <p className={styles.fileName}>
              {typeof watchedFile === "string" &&
              watchedFile?.startsWith("https")
                ? "Veja o arquivo anexado"
                : "Arquivo selecionado"}
              :{" "}
              {typeof watchedFile === "string"
                ? extractFileName(watchedFile)
                : watchedFile[0]?.name}
            </p>
            {typeof watchedFile === "string" &&
              watchedFile?.startsWith("https") && (
                <Link
                  prefetch={false}
                  href={watchedFile}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={styles.linkFile}>
                    <p>🔗 {extractFileName(watchedFile)}</p>
                  </div>
                </Link>
              )}
          </>
        )}
        <input
          id={`camposDinamicos.campo_${campo.id}`}
          type="file"
          ref={ref}
          {...restRegister}
          onChange={handleFileChange}
          className={styles.fileInput}
          disabled={loading}
        />
        {!loading && (
          <span className={styles.customButton}>
            <p>
              Selecione{" "}
              {typeof watchedFile === "string" &&
              watchedFile?.startsWith("https")
                ? "outro"
                : "um"}{" "}
              arquivo
            </p>
          </span>
        )}
      </label>
    </div>
  );
};

export default FileInput;
