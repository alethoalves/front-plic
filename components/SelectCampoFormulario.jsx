import React from "react";
import { Controller } from "react-hook-form";
import styles from "./Select.module.scss"; // Crie um arquivo de estilo

const SelectCampoFormulario = ({
  control,
  name,
  label,
  placeholder,
  disabled,
  options,
  rules,
}) => {
  return (
    <div className={styles.selectContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <>
            <select
              {...field}
              className={`${styles.select} ${fieldState.error ? styles.error : ""}`}
              disabled={disabled}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldState.error && (
              <span className={styles.errorMessage}>
                {fieldState.error.message}
              </span>
            )}
          </>
        )}
      />
    </div>
  );
};

export default SelectCampoFormulario;
